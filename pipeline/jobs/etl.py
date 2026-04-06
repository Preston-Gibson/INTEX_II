"""
ETL: CSVs → operational schema (normalized) → warehouse schema (one row per resident).

Phase A: Load all CSVs into the 'operational' Postgres schema as-is.
Phase B: Aggregate child tables and join onto residents → fact_residents_ml
         in the 'warehouse' schema.
"""

import pandas as pd

from config import (
    ARTIFACTS_DIR,
    DATA_DIR,
    OPERATIONAL_SCHEMA,
    WAREHOUSE_SCHEMA,
)
from utils_db import ensure_schemas, get_engine

CSV_FILES = [
    "residents",
    "safehouses",
    "partners",
    "supporters",
    "donations",
    "donation_allocations",
    "in_kind_donation_items",
    "partners_assignments",
    "education_records",
    "health_wellbeing_records",
    "intervention_plans",
    "process_recordings",
    "incident_reports",
    "home_visitations",
    "safehouse_monthly_metrics",
    "social_media_posts",
    "public_impact_snapshots",
]

COOPERATION_MAP = {"Poor": 0, "Neutral": 1, "Good": 2, "Excellent": 3}
SEX_MAP = {"M": 0, "F": 1}
CASE_CATEGORY_MAP = {
    "Neglected": 0, "Abandoned": 1, "Surrendered": 2, "Orphaned": 3,
    "Trafficked": 4, "Child Labor": 5, "CICL": 6, "At Risk": 7,
    "Street Child": 8, "Physical Abuse": 9, "Sexual Abuse": 10,
    "OSAEC": 11, "Child with HIV": 12,
}


# ---------------------------------------------------------------------------
# Phase A — Load CSVs into the 'operational' schema
# ---------------------------------------------------------------------------

def load_csvs_to_operational():
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    # pandas to_sql needs a SQLAlchemy engine
    engine = get_engine(OPERATIONAL_SCHEMA)

    for name in CSV_FILES:
        path = DATA_DIR / f"{name}.csv"
        if not path.exists():
            print(f"  [SKIP] {name}.csv not found")
            continue
        df = pd.read_csv(path)
        df.to_sql(
            name,
            engine,
            schema=OPERATIONAL_SCHEMA,
            if_exists="replace",
            index=False,
        )
        print(f"  [OK] {name}: {len(df)} rows")

    print(f"Loaded CSVs into schema '{OPERATIONAL_SCHEMA}'")


# ---------------------------------------------------------------------------
# Phase B — Build warehouse modeling table
# ---------------------------------------------------------------------------

def _parse_length_of_stay(series: pd.Series) -> pd.Series:
    """Convert '2 Years 4 months' strings to total days (approx)."""
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
    """Extract the leading integer from '15 Years 9 months'."""
    return series.str.extract(r"^(\d+)").astype(float)[0]


def build_warehouse():
    op_engine = get_engine(OPERATIONAL_SCHEMA)

    residents  = pd.read_sql("SELECT * FROM residents", op_engine)
    health     = pd.read_sql("SELECT * FROM health_wellbeing_records", op_engine)
    education  = pd.read_sql("SELECT * FROM education_records", op_engine)
    recordings = pd.read_sql("SELECT * FROM process_recordings", op_engine)
    incidents  = pd.read_sql("SELECT * FROM incident_reports", op_engine)
    visits     = pd.read_sql("SELECT * FROM home_visitations", op_engine)

    # ---- Health aggregation ------------------------------------------------
    # Postgres stores booleans natively so no string coercion needed,
    # but cast to int so .mean() gives a clean float ratio.
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

    # ---- Education aggregation ---------------------------------------------
    edu_agg = (
        education.groupby("resident_id")
        .agg(
            avg_attendance=("attendance_rate", "mean"),
            avg_progress=("progress_percent", "mean"),
        )
        .reset_index()
    )

    # ---- Session aggregation -----------------------------------------------
    for col in ["concerns_flagged", "referral_made", "progress_noted"]:
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

    # ---- Incident aggregation ----------------------------------------------
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

    # ---- Visitation aggregation --------------------------------------------
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

    # ---- Resident-level features -------------------------------------------
    bool_cols = [
        "is_pwd", "has_special_needs",
        "sub_cat_orphaned", "sub_cat_trafficked", "sub_cat_child_labor",
        "sub_cat_physical_abuse", "sub_cat_sexual_abuse", "sub_cat_osaec",
        "sub_cat_cicl", "sub_cat_at_risk", "sub_cat_street_child",
        "sub_cat_child_with_hiv",
        "family_is_4ps", "family_solo_parent", "family_indigenous",
        "family_parent_pwd", "family_informal_settler",
    ]
    for col in bool_cols:
        if col in residents.columns:
            residents[col] = residents[col].astype(int)

    residents["length_of_stay_days"]     = _parse_length_of_stay(residents["length_of_stay"])
    residents["age_upon_admission_years"] = _parse_age(residents["age_upon_admission"])
    residents["sex_encoded"]              = residents["sex"].map(SEX_MAP).fillna(0)
    residents["case_category_encoded"]    = residents["case_category"].map(CASE_CATEGORY_MAP).fillna(-1)

    # ---- Join everything ---------------------------------------------------
    df = (
        residents
        .merge(health_agg,    on="resident_id", how="left")
        .merge(edu_agg,       on="resident_id", how="left")
        .merge(sessions_agg,  on="resident_id", how="left")
        .merge(incidents_agg, on="resident_id", how="left")
        .merge(visits_agg,    on="resident_id", how="left")
    )

    df = df.dropna(subset=["current_risk_level"])

    # ---- Select modeling columns -------------------------------------------
    id_cols = ["resident_id"]
    feature_cols = [
        "avg_health_score", "avg_nutrition", "avg_sleep", "avg_bmi",
        "pct_medical_done", "pct_psych_done",
        "avg_attendance", "avg_progress",
        "total_sessions", "pct_concerns_flagged", "pct_referral_made",
        "total_incidents", "high_severity_count", "pct_unresolved",
        "total_visits", "pct_safety_concerns", "avg_cooperation",
        "age_upon_admission_years", "length_of_stay_days",
        "is_pwd", "has_special_needs",
        "sub_cat_trafficked", "sub_cat_physical_abuse",
        "sub_cat_sexual_abuse", "sub_cat_child_labor",
        "family_is_4ps", "family_solo_parent",
        "sex_encoded", "case_category_encoded",
    ]
    label_col = ["current_risk_level"]

    keep = id_cols + [c for c in feature_cols if c in df.columns] + label_col
    df_model = df[keep].copy()

    wh_engine = get_engine(WAREHOUSE_SCHEMA)
    df_model.to_sql(
        "fact_residents_ml",
        wh_engine,
        schema=WAREHOUSE_SCHEMA,
        if_exists="replace",
        index=False,
    )

    print(f"fact_residents_ml written to schema '{WAREHOUSE_SCHEMA}'")
    print(f"  {len(df_model)} rows, {len(df_model.columns)} columns")
    print(f"  Label distribution:\n{df_model['current_risk_level'].value_counts().to_string()}")
    return len(df_model)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=== Creating schemas ===")
    ensure_schemas([OPERATIONAL_SCHEMA, WAREHOUSE_SCHEMA])

    print("\n=== Phase A: Loading CSVs into operational schema ===")
    load_csvs_to_operational()

    print("\n=== Phase B: Building warehouse modeling table ===")
    build_warehouse()

    print("\nETL complete.")
