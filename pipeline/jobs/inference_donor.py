"""
Inference: donor models → predictions → operational schema (Postgres).

Loads both saved donor pipelines and writes per-supporter predictions to
donor_predictions. The app queries that table for analytics.
"""

import json
from datetime import datetime, timezone

import joblib
import pandas as pd

from config import (
    DONOR_CHURN_METADATA_PATH,
    DONOR_CHURN_MODEL_PATH,
    DONOR_TYPE_METADATA_PATH,
    DONOR_TYPE_MODEL_PATH,
    OPERATIONAL_SCHEMA,
    WAREHOUSE_SCHEMA,
)
from utils_db import ensure_donor_predictions_table, get_engine, pg_conn


def _build_features(engine) -> pd.DataFrame:
    """Reconstruct donor feature matrix from the operational schema."""
    supporters = pd.read_sql("SELECT * FROM supporters", engine)
    donations  = pd.read_sql("SELECT * FROM donations",  engine)

    donations["donation_date"]   = pd.to_datetime(donations["donation_date"], errors="coerce")
    donations["estimated_value"] = pd.to_numeric(donations["estimated_value"], errors="coerce").fillna(0)

    snapshot_date = donations["donation_date"].max()

    don_agg = (
        donations.groupby("supporter_id")
        .agg(
            total_donations=("donation_id", "count"),
            total_value=("estimated_value", "sum"),
            avg_value=("estimated_value", "mean"),
            is_recurring=("is_recurring", lambda x: int(x.astype(str).str.lower().eq("true").any())),
            days_since_last=("donation_date", lambda x: (snapshot_date - x.max()).days),
            first_donation_days_ago=("donation_date", lambda x: (snapshot_date - x.min()).days),
            num_campaigns=("campaign_name", lambda x: x.dropna().nunique()),
        )
        .reset_index()
    )

    supporters["supporter_type_encoded"] = supporters["supporter_type"].astype("category").cat.codes
    supporters["region_encoded"]         = supporters["region"].astype("category").cat.codes
    supporters["channel_encoded"]        = supporters["acquisition_channel"].astype("category").cat.codes
    supporters["relationship_encoded"]   = supporters["relationship_type"].astype("category").cat.codes

    df = (
        supporters[["supporter_id", "supporter_type_encoded", "region_encoded",
                     "channel_encoded", "relationship_encoded"]]
        .merge(don_agg, on="supporter_id", how="left")
    )

    for col in ["total_donations", "total_value", "avg_value", "is_recurring",
                "days_since_last", "first_donation_days_ago", "num_campaigns"]:
        df[col] = df[col].fillna(0)

    return df


def run_inference():
    # Load models + metadata
    churn_model = joblib.load(str(DONOR_CHURN_MODEL_PATH))
    type_model  = joblib.load(str(DONOR_TYPE_MODEL_PATH))

    with open(DONOR_CHURN_METADATA_PATH) as f:
        churn_meta = json.load(f)
    with open(DONOR_TYPE_METADATA_PATH) as f:
        type_meta = json.load(f)

    print(f"Churn model v{churn_meta['model_version']} loaded")
    print(f"Type  model v{type_meta['model_version']} loaded")

    engine = get_engine(OPERATIONAL_SCHEMA)
    df = _build_features(engine)
    print(f"Scoring {len(df)} supporters")

    churn_features = churn_meta["feature_cols"]
    type_features  = type_meta["feature_cols"]
    type_classes   = type_meta["classes"]  # e.g. ["In-Kind", "Monetary", "Skills", "Time"]

    X_churn = df[churn_features]
    X_type  = df[type_features]

    churn_probs = churn_model.predict_proba(X_churn)  # shape (n, 2): [prob_stay, prob_churn]
    churn_preds = churn_model.predict(X_churn)

    type_probs  = type_model.predict_proba(X_type)
    type_preds  = type_model.predict(X_type)

    # Map type class names to probability columns
    type_col_map = {
        "Monetary": "prob_monetary",
        "In-Kind":  "prob_in_kind",
        "Time":     "prob_time",
        "Skills":   "prob_skills",
    }
    type_prob_df = pd.DataFrame(type_probs, columns=type_classes)

    # churn_model.classes_ is [0, 1] — index 1 = churned
    churn_class_list = list(churn_model.classes_)
    churn_idx = churn_class_list.index(1) if 1 in churn_class_list else -1

    ts = datetime.now(timezone.utc).isoformat()
    rows = []
    for i, (_, row) in enumerate(df.iterrows()):
        prob_churn = float(churn_probs[i][churn_idx]) if churn_idx >= 0 else None
        predicted_churn = bool(churn_preds[i])

        predicted_type = str(type_preds[i])
        prob_monetary = float(type_prob_df.iloc[i].get("Monetary", 0))
        prob_in_kind  = float(type_prob_df.iloc[i].get("In-Kind", 0))
        prob_time     = float(type_prob_df.iloc[i].get("Time", 0))
        prob_skills   = float(type_prob_df.iloc[i].get("Skills", 0))

        rows.append((
            int(row["supporter_id"]),
            predicted_churn,
            prob_churn,
            predicted_type,
            prob_monetary,
            prob_in_kind,
            prob_time,
            prob_skills,
            ts,
        ))

    ensure_donor_predictions_table(OPERATIONAL_SCHEMA)

    with pg_conn(OPERATIONAL_SCHEMA) as conn:
        with conn.cursor() as cur:
            cur.executemany("""
                INSERT INTO operational.donor_predictions
                    (supporter_id, predicted_churn, prob_churn,
                     predicted_don_type,
                     prob_monetary, prob_in_kind, prob_time, prob_skills,
                     prediction_ts)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (supporter_id) DO UPDATE SET
                    predicted_churn    = EXCLUDED.predicted_churn,
                    prob_churn         = EXCLUDED.prob_churn,
                    predicted_don_type = EXCLUDED.predicted_don_type,
                    prob_monetary      = EXCLUDED.prob_monetary,
                    prob_in_kind       = EXCLUDED.prob_in_kind,
                    prob_time          = EXCLUDED.prob_time,
                    prob_skills        = EXCLUDED.prob_skills,
                    prediction_ts      = EXCLUDED.prediction_ts
            """, rows)

    print(f"Wrote {len(rows)} donor predictions to donor_predictions")
    print(f"Timestamp: {ts}")


if __name__ == "__main__":
    print("=== Inference: donor models ===")
    run_inference()
    print("\nInference complete.")
