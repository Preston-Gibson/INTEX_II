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
# Phase C — Build social media warehouse table
# ---------------------------------------------------------------------------

PLATFORM_MAP = {
    "Facebook": 0, "Instagram": 1, "LinkedIn": 2,
    "TikTok": 3, "Twitter": 4, "WhatsApp": 5, "YouTube": 6,
}
POST_TYPE_MAP = {
    "Campaign": 0, "EducationalContent": 1, "EventPromotion": 2,
    "FundraisingAppeal": 3, "ImpactStory": 4, "ThankYou": 5,
}
MEDIA_TYPE_MAP = {"Carousel": 0, "Photo": 1, "Reel": 2, "Text": 3, "Video": 4}
DAY_OF_WEEK_MAP = {
    "Friday": 0, "Monday": 1, "Saturday": 2, "Sunday": 3,
    "Thursday": 4, "Tuesday": 5, "Wednesday": 6,
}
CTA_TYPE_MAP = {"DonateNow": 0, "LearnMore": 1, "None": 2, "ShareStory": 3, "SignUp": 4}
CONTENT_TOPIC_MAP = {
    "AwarenessRaising": 0, "CampaignLaunch": 1, "DonorImpact": 2,
    "Education": 3, "EventRecap": 4, "Gratitude": 5,
    "Health": 6, "Reintegration": 7, "SafehouseLife": 8,
}
SENTIMENT_TONE_MAP = {
    "Celebratory": 0, "Emotional": 1, "Grateful": 2,
    "Hopeful": 3, "Informative": 4, "Urgent": 5,
}


def build_social_warehouse():
    op_engine = get_engine(OPERATIONAL_SCHEMA)
    posts = pd.read_sql("SELECT * FROM social_media_posts", op_engine)

    # ---- Null fills --------------------------------------------------------
    posts["call_to_action_type"] = posts["call_to_action_type"].fillna("None")
    posts["boost_budget_php"]    = posts["boost_budget_php"].fillna(0.0)

    # ---- Boolean → int -----------------------------------------------------
    for col in ["has_call_to_action", "features_resident_story", "is_boosted"]:
        posts[col] = posts[col].astype(int)

    # ---- Categorical encoding ----------------------------------------------
    posts["platform_encoded"]          = posts["platform"].map(PLATFORM_MAP).fillna(-1).astype(int)
    posts["post_type_encoded"]         = posts["post_type"].map(POST_TYPE_MAP).fillna(-1).astype(int)
    posts["media_type_encoded"]        = posts["media_type"].map(MEDIA_TYPE_MAP).fillna(-1).astype(int)
    posts["day_of_week_encoded"]       = posts["day_of_week"].map(DAY_OF_WEEK_MAP).fillna(-1).astype(int)
    posts["call_to_action_type_encoded"] = posts["call_to_action_type"].map(CTA_TYPE_MAP).fillna(-1).astype(int)
    posts["content_topic_encoded"]     = posts["content_topic"].map(CONTENT_TOPIC_MAP).fillna(-1).astype(int)
    posts["sentiment_tone_encoded"]    = posts["sentiment_tone"].map(SENTIMENT_TONE_MAP).fillna(-1).astype(int)

    # ---- Target labels -----------------------------------------------------
    q33 = posts["engagement_rate"].quantile(1 / 3)
    q67 = posts["engagement_rate"].quantile(2 / 3)

    def _engagement_tier(rate):
        if rate <= q33:
            return "Low"
        elif rate <= q67:
            return "Medium"
        return "High"

    posts["engagement_tier"] = posts["engagement_rate"].apply(_engagement_tier)
    posts["has_donations"]   = (posts["donation_referrals"] > 0).astype(int)

    # ---- Select modeling columns -------------------------------------------
    keep = [
        "post_id",
        # encoded categoricals
        "platform_encoded", "post_type_encoded", "media_type_encoded",
        "day_of_week_encoded", "call_to_action_type_encoded",
        "content_topic_encoded", "sentiment_tone_encoded",
        # boolean features
        "has_call_to_action", "features_resident_story", "is_boosted",
        # numeric features
        "post_hour", "num_hashtags", "mentions_count", "caption_length",
        "boost_budget_php", "follower_count_at_post",
        # targets
        "engagement_tier", "has_donations",
    ]
    df_model = posts[[c for c in keep if c in posts.columns]].copy()

    wh_engine = get_engine(WAREHOUSE_SCHEMA)
    df_model.to_sql(
        "fact_social_media_ml",
# Phase C — Build donor warehouse modeling table
# ---------------------------------------------------------------------------

def build_donor_warehouse():
    """
    One row per supporter with:
      - supporter profile features (type, region, channel, recency, frequency, value)
      - churn label: churned = status == 'Inactive'
      - last donation type label (for donation type classifier)
    """
    op_engine = get_engine(OPERATIONAL_SCHEMA)

    supporters = pd.read_sql("SELECT * FROM supporters", op_engine)
    donations  = pd.read_sql("SELECT * FROM donations",  op_engine)

    donations["donation_date"] = pd.to_datetime(donations["donation_date"], errors="coerce")
    donations["estimated_value"] = pd.to_numeric(donations["estimated_value"], errors="coerce").fillna(0)

    snapshot_date = donations["donation_date"].max()

    # --- Per-donor donation aggregates (RFM-style) ---
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

    # Last donation type per supporter (label for type classifier)
    last_type = (
        donations.sort_values("donation_date")
        .groupby("supporter_id")["donation_type"]
        .last()
        .reset_index()
        .rename(columns={"donation_type": "last_donation_type"})
    )

    # --- Encode supporter profile ---
    supporters["supporter_type_encoded"] = supporters["supporter_type"].astype("category").cat.codes
    supporters["region_encoded"]         = supporters["region"].astype("category").cat.codes
    supporters["channel_encoded"]        = supporters["acquisition_channel"].astype("category").cat.codes
    supporters["relationship_encoded"]   = supporters["relationship_type"].astype("category").cat.codes

    # Churn label: Inactive = churned
    supporters["churned"] = (supporters["status"] == "Inactive").astype(int)

    df = (
        supporters[[
            "supporter_id", "supporter_type_encoded", "region_encoded",
            "channel_encoded", "relationship_encoded", "churned",
        ]]
        .merge(don_agg,   on="supporter_id", how="left")
        .merge(last_type, on="supporter_id", how="left")
    )

    # Fill supporters with no donations
    for col in ["total_donations", "total_value", "avg_value", "is_recurring",
                "days_since_last", "first_donation_days_ago", "num_campaigns"]:
        df[col] = df[col].fillna(0)

    wh_engine = get_engine(WAREHOUSE_SCHEMA)
    df.to_sql(
        "fact_donors_ml",
        wh_engine,
        schema=WAREHOUSE_SCHEMA,
        if_exists="replace",
        index=False,
    )

    print(f"fact_donors_ml written to schema '{WAREHOUSE_SCHEMA}'")
    print(f"  {len(df)} rows, {len(df.columns)} columns")
    print(f"  Churn distribution:\n{df['churned'].value_counts().to_string()}")
    print(f"  Donation type distribution:\n{df['last_donation_type'].value_counts().to_string()}")
    return len(df)


# ---------------------------------------------------------------------------
# Phase D — Build resident outcome warehouse modeling table
# ---------------------------------------------------------------------------

def build_resident_outcome_warehouse():
    """
    One row per resident with:
      - same aggregated features as fact_residents_ml
      - reintegration_outcome label: Completed / In Progress / Not Started / On Hold
      - reintegration_type label: Foster Care / Family Reunification / etc.
      - education_completion label: last completion_status per resident
    """
    op_engine = get_engine(OPERATIONAL_SCHEMA)

    residents  = pd.read_sql("SELECT * FROM residents",               op_engine)
    health     = pd.read_sql("SELECT * FROM health_wellbeing_records", op_engine)
    education  = pd.read_sql("SELECT * FROM education_records",       op_engine)
    recordings = pd.read_sql("SELECT * FROM process_recordings",      op_engine)
    incidents  = pd.read_sql("SELECT * FROM incident_reports",        op_engine)
    visits     = pd.read_sql("SELECT * FROM home_visitations",        op_engine)

    # ---- Health aggregation ------------------------------------------------
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
    education["record_date"] = pd.to_datetime(education["record_date"], errors="coerce")
    education["edu_level_encoded"] = education["education_level"].astype("category").cat.codes

    edu_agg = (
        education.groupby("resident_id")
        .agg(
            avg_attendance=("attendance_rate", "mean"),
            avg_progress=("progress_percent", "mean"),
            num_edu_records=("education_record_id", "count"),
        )
        .reset_index()
    )

    # Last education completion status per resident (label)
    edu_completion = (
        education.sort_values("record_date")
        .groupby("resident_id")["completion_status"]
        .last()
        .reset_index()
        .rename(columns={"completion_status": "edu_completion_label"})
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
            pct_progress_noted=("progress_noted", "mean"),
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

    # ---- Resident features + labels ----------------------------------------
    bool_cols = [
        "is_pwd", "has_special_needs",
        "sub_cat_orphaned", "sub_cat_trafficked", "sub_cat_child_labor",
        "sub_cat_physical_abuse", "sub_cat_sexual_abuse", "sub_cat_osaec",
        "sub_cat_cicl", "sub_cat_at_risk", "sub_cat_street_child",
        "sub_cat_child_with_hiv", "family_is_4ps", "family_solo_parent",
        "family_indigenous", "family_parent_pwd", "family_informal_settler",
    ]
    for col in bool_cols:
        if col in residents.columns:
            residents[col] = residents[col].astype(int)

    residents["length_of_stay_days"]      = _parse_length_of_stay(residents["length_of_stay"])
    residents["age_upon_admission_years"]  = _parse_age(residents["age_upon_admission"])
    residents["sex_encoded"]               = residents["sex"].map(SEX_MAP).fillna(0)
    residents["case_category_encoded"]     = residents["case_category"].map(CASE_CATEGORY_MAP).fillna(-1)
    residents["initial_risk_encoded"]      = residents["initial_risk_level"].map(
        {"Low": 0, "Medium": 1, "High": 2, "Critical": 3}
    ).fillna(-1)
    residents["referral_source_encoded"]   = residents["referral_source"].astype("category").cat.codes

    # Labels
    reint_outcome = residents[["resident_id", "reintegration_status"]].rename(
        columns={"reintegration_status": "reintegration_outcome_label"}
    )
    reint_type = residents[["resident_id", "reintegration_type"]].rename(
        columns={"reintegration_type": "reintegration_type_label"}
    )

    feature_cols = (
        ["resident_id"]
        + [c for c in bool_cols if c in residents.columns]
        + ["length_of_stay_days", "age_upon_admission_years", "sex_encoded",
           "case_category_encoded", "initial_risk_encoded", "referral_source_encoded"]
    )

    df = (
        residents[feature_cols]
        .merge(health_agg,       on="resident_id", how="left")
        .merge(edu_agg,          on="resident_id", how="left")
        .merge(sessions_agg,     on="resident_id", how="left")
        .merge(incidents_agg,    on="resident_id", how="left")
        .merge(visits_agg,       on="resident_id", how="left")
        .merge(reint_outcome,    on="resident_id", how="left")
        .merge(reint_type,       on="resident_id", how="left")
        .merge(edu_completion,   on="resident_id", how="left")
    )

    wh_engine = get_engine(WAREHOUSE_SCHEMA)
    df.to_sql(
        "fact_resident_outcomes_ml",
        wh_engine,
        schema=WAREHOUSE_SCHEMA,
        if_exists="replace",
        index=False,
    )

    print(f"fact_social_media_ml written to schema '{WAREHOUSE_SCHEMA}'")
    print(f"  {len(df_model)} rows, {len(df_model.columns)} columns")
    print(f"  Engagement tier distribution:\n{df_model['engagement_tier'].value_counts().to_string()}")
    print(f"  Has donations distribution:\n{df_model['has_donations'].value_counts().to_string()}")
    print(f"  Tertile thresholds — q33: {q33:.6f}, q67: {q67:.6f}")
    return len(df_model), q33, q67
    print(f"fact_resident_outcomes_ml written to schema '{WAREHOUSE_SCHEMA}'")
    print(f"  {len(df)} rows, {len(df.columns)} columns")
    print(f"  Reintegration outcome:\n{df['reintegration_outcome_label'].value_counts().to_string()}")
    print(f"  Reintegration type:\n{df['reintegration_type_label'].value_counts().to_string()}")
    print(f"  Education completion:\n{df['edu_completion_label'].value_counts().to_string()}")
    return len(df)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=== Creating schemas ===")
    ensure_schemas([OPERATIONAL_SCHEMA, WAREHOUSE_SCHEMA])

    print("\n=== Phase A: Loading CSVs into operational schema ===")
    load_csvs_to_operational()

    print("\n=== Phase B: Building warehouse modeling table (residents) ===")
    build_warehouse()

    print("\n=== Phase C: Building warehouse modeling table (social media) ===")
    build_social_warehouse()
    print("\n=== Phase B: Building resident warehouse modeling table ===")
    build_warehouse()

    print("\n=== Phase C: Building donor warehouse modeling table ===")
    build_donor_warehouse()

    print("\n=== Phase D: Building resident outcome modeling table ===")
    build_resident_outcome_warehouse()

    print("\nETL complete.")
