"""
Inference: risk_model.sav → predictions → operational schema (Postgres).

Loads the saved pipeline, recomputes features using the same logic as ETL,
and writes predictions + per-class probabilities into resident_risk_predictions.
The app queries that table — it never loads the model itself.
"""

import json
from datetime import datetime, timezone

import joblib
import pandas as pd

from config import OPERATIONAL_SCHEMA, RISK_METADATA_PATH, RISK_MODEL_PATH
from utils_db import ensure_risk_predictions_table, get_engine, pg_conn

COOPERATION_MAP = {"Poor": 0, "Neutral": 1, "Good": 2, "Excellent": 3}
SEX_MAP = {"M": 0, "F": 1}
CASE_CATEGORY_MAP = {
    "Neglected": 0, "Abandoned": 1, "Surrendered": 2, "Orphaned": 3,
    "Trafficked": 4, "Child Labor": 5, "CICL": 6, "At Risk": 7,
    "Street Child": 8, "Physical Abuse": 9, "Sexual Abuse": 10,
    "OSAEC": 11, "Child with HIV": 12,
}


def _parse_length_of_stay(series: pd.Series) -> pd.Series:
    def to_days(s):
        if pd.isna(s):
            return None
        years = months = 0
        parts = str(s).lower().split()
        for i, p in enumerate(parts):
            if "year" in p and i > 0:
                try:
                    years = int(parts[i - 1])
                except ValueError:
                    pass
            if "month" in p and i > 0:
                try:
                    months = int(parts[i - 1])
                except ValueError:
                    pass
        return years * 365 + months * 30
    return series.apply(to_days)


def _parse_age(series: pd.Series) -> pd.Series:
    return series.str.extract(r"^(\d+)").astype(float)[0]


def _build_features(engine) -> pd.DataFrame:
    """Reconstruct the feature matrix from the operational schema — identical to ETL logic."""
    residents  = pd.read_sql("SELECT * FROM residents", engine)
    health     = pd.read_sql("SELECT * FROM health_wellbeing_records", engine)
    education  = pd.read_sql("SELECT * FROM education_records", engine)
    recordings = pd.read_sql("SELECT * FROM process_recordings", engine)
    incidents  = pd.read_sql("SELECT * FROM incident_reports", engine)
    visits     = pd.read_sql("SELECT * FROM home_visitations", engine)

    # Health — Postgres stores native booleans, cast to int for .mean()
    for col in ["medical_checkup_done", "dental_checkup_done", "psychological_checkup_done"]:
        health[col] = health[col].astype(int)
    health_agg = (
        health.groupby("resident_id")
        .agg(
            avg_health_score=("general_health_score", "mean"),
            avg_nutrition=("nutrition_score", "mean"),
            avg_sleep=("sleep_quality_score", "mean"),
            avg_bmi=("bmi", "mean"),
            pct_medical_done=("medical_checkup_done", "mean"),
            pct_psych_done=("psychological_checkup_done", "mean"),
        )
        .reset_index()
    )

    # Education
    edu_agg = (
        education.groupby("resident_id")
        .agg(
            avg_attendance=("attendance_rate", "mean"),
            avg_progress=("progress_percent", "mean"),
        )
        .reset_index()
    )

    # Sessions
    for col in ["concerns_flagged", "referral_made"]:
        recordings[col] = recordings[col].astype(int)
    sessions_agg = (
        recordings.groupby("resident_id")
        .agg(
            total_sessions=("recording_id", "count"),
            pct_concerns_flagged=("concerns_flagged", "mean"),
            pct_referral_made=("referral_made", "mean"),
        )
        .reset_index()
    )

    # Incidents
    incidents["resolved"] = incidents["resolved"].astype(int)
    incidents["is_high_severity"] = (incidents["severity"] == "High").astype(int)
    incidents_agg = (
        incidents.groupby("resident_id")
        .agg(
            total_incidents=("incident_id", "count"),
            high_severity_count=("is_high_severity", "sum"),
            pct_unresolved=("resolved", lambda x: 1 - x.mean()),
        )
        .reset_index()
    )

    # Visits
    for col in ["safety_concerns_noted", "follow_up_needed"]:
        visits[col] = visits[col].astype(int)
    visits["cooperation_encoded"] = visits["family_cooperation_level"].map(COOPERATION_MAP).fillna(1)
    visits_agg = (
        visits.groupby("resident_id")
        .agg(
            total_visits=("visitation_id", "count"),
            pct_safety_concerns=("safety_concerns_noted", "mean"),
            avg_cooperation=("cooperation_encoded", "mean"),
        )
        .reset_index()
    )

    # Resident features
    bool_cols = [
        "is_pwd", "has_special_needs",
        "sub_cat_trafficked", "sub_cat_physical_abuse",
        "sub_cat_sexual_abuse", "sub_cat_child_labor",
        "family_is_4ps", "family_solo_parent",
    ]
    for col in bool_cols:
        if col in residents.columns:
            residents[col] = residents[col].astype(int)

    residents["length_of_stay_days"]     = _parse_length_of_stay(residents["length_of_stay"])
    residents["age_upon_admission_years"] = _parse_age(residents["age_upon_admission"])
    residents["sex_encoded"]              = residents["sex"].map(SEX_MAP).fillna(0)
    residents["case_category_encoded"]    = residents["case_category"].map(CASE_CATEGORY_MAP).fillna(-1)

    df = (
        residents[["resident_id", "length_of_stay_days", "age_upon_admission_years",
                    "sex_encoded", "case_category_encoded"] + bool_cols]
        .merge(health_agg,    on="resident_id", how="left")
        .merge(edu_agg,       on="resident_id", how="left")
        .merge(sessions_agg,  on="resident_id", how="left")
        .merge(incidents_agg, on="resident_id", how="left")
        .merge(visits_agg,    on="resident_id", how="left")
    )
    return df


def run_inference():
    # Load model and feature list from saved metadata
    model = joblib.load(str(RISK_MODEL_PATH))
    with open(RISK_METADATA_PATH, encoding="utf-8") as f:
        metadata = json.load(f)

    feature_cols = metadata["feature_cols"]
    classes = metadata["classes"]  # e.g. ["Critical", "High", "Low", "Medium"]

    print(f"Loaded model v{metadata['model_version']} | classes: {classes}")

    engine = get_engine(OPERATIONAL_SCHEMA)
    df = _build_features(engine)
    print(f"Scoring {len(df)} residents")

    X = df[feature_cols]
    probs = model.predict_proba(X)   # shape (n, n_classes)
    preds = model.predict(X)
    ts = datetime.now(timezone.utc).isoformat()

    # Build probability columns by class name
    class_to_col = {
        "Low": "prob_low",
        "Medium": "prob_medium",
        "High": "prob_high",
        "Critical": "prob_critical",
    }
    prob_df = pd.DataFrame(probs, columns=classes)

    rows = []
    for i, row in df.iterrows():
        idx = list(df.index).index(i)
        row_probs = {col: float(prob_df.loc[i, cls]) for cls, col in class_to_col.items() if cls in prob_df.columns}
        rows.append((
            int(row["resident_id"]),
            str(preds[idx]),
            row_probs.get("prob_low", None),
            row_probs.get("prob_medium", None),
            row_probs.get("prob_high", None),
            row_probs.get("prob_critical", None),
            ts,
        ))

    ensure_risk_predictions_table(OPERATIONAL_SCHEMA)

    with pg_conn(OPERATIONAL_SCHEMA) as conn:
        with conn.cursor() as cur:
            cur.executemany("""
                INSERT INTO operational.resident_risk_predictions
                    (resident_id, predicted_risk, prob_low, prob_medium,
                     prob_high, prob_critical, prediction_ts)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (resident_id) DO UPDATE SET
                    predicted_risk = EXCLUDED.predicted_risk,
                    prob_low       = EXCLUDED.prob_low,
                    prob_medium    = EXCLUDED.prob_medium,
                    prob_high      = EXCLUDED.prob_high,
                    prob_critical  = EXCLUDED.prob_critical,
                    prediction_ts  = EXCLUDED.prediction_ts
            """, rows)

    print(f"Wrote {len(rows)} predictions to resident_risk_predictions")
    print(f"Timestamp: {ts}")


if __name__ == "__main__":
    print("=== Inference: resident risk classifier ===")
    run_inference()
    print("\nInference complete.")
