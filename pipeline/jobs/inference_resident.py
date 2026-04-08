"""
Inference: resident outcome models → predictions → operational schema (Postgres).

Loads all three saved resident outcome pipelines and writes per-resident
predictions to resident_outcome_predictions. The app queries that table.
"""

import json
from datetime import datetime, timezone

import joblib
import pandas as pd

from config import (
    EDUCATION_METADATA_PATH,
    EDUCATION_MODEL_PATH,
    OPERATIONAL_SCHEMA,
    REINTEGRATION_OUTCOME_METADATA_PATH,
    REINTEGRATION_OUTCOME_MODEL_PATH,
    REINTEGRATION_TYPE_METADATA_PATH,
    REINTEGRATION_TYPE_MODEL_PATH,
    WAREHOUSE_SCHEMA,
)
from utils_db import ensure_resident_outcome_predictions_table, get_engine, pg_conn


def run_inference():
    # Load models + metadata
    outcome_model = joblib.load(str(REINTEGRATION_OUTCOME_MODEL_PATH))
    type_model    = joblib.load(str(REINTEGRATION_TYPE_MODEL_PATH))
    edu_model     = joblib.load(str(EDUCATION_MODEL_PATH))

    with open(REINTEGRATION_OUTCOME_METADATA_PATH) as f:
        outcome_meta = json.load(f)
    with open(REINTEGRATION_TYPE_METADATA_PATH) as f:
        type_meta = json.load(f)
    with open(EDUCATION_METADATA_PATH) as f:
        edu_meta = json.load(f)

    print(f"Reintegration outcome model v{outcome_meta['model_version']} loaded")
    print(f"Reintegration type   model v{type_meta['model_version']} loaded")
    print(f"Education completion model v{edu_meta['model_version']} loaded")

    engine = get_engine(WAREHOUSE_SCHEMA)
    df = pd.read_sql("SELECT * FROM fact_resident_outcomes_ml", engine)
    print(f"Scoring {len(df)} residents")

    outcome_features = outcome_meta["feature_cols"]
    type_features    = type_meta["feature_cols"]
    edu_features     = edu_meta["feature_cols"]

    outcome_classes = outcome_meta["classes"]
    type_classes    = type_meta["classes"]
    edu_classes     = edu_meta["classes"]

    X_outcome = df[outcome_features]
    X_type    = df[type_features]
    X_edu     = df[edu_features]

    outcome_probs = outcome_model.predict_proba(X_outcome)
    outcome_preds = outcome_model.predict(X_outcome)

    type_preds    = type_model.predict(X_type)

    edu_probs     = edu_model.predict_proba(X_edu)
    edu_preds     = edu_model.predict(X_edu)

    # Build prob DataFrames indexed by class name
    outcome_prob_df = pd.DataFrame(outcome_probs, columns=outcome_classes)
    edu_prob_df     = pd.DataFrame(edu_probs,     columns=edu_classes)

    ts = datetime.now(timezone.utc).isoformat()
    rows = []
    for i, (_, row) in enumerate(df.iterrows()):
        def oprob(cls):
            return float(outcome_prob_df.iloc[i].get(cls, 0.0))
        def eprob(cls):
            return float(edu_prob_df.iloc[i].get(cls, 0.0))

        rows.append((
            int(row["resident_id"]),
            str(outcome_preds[i]),
            oprob("Completed"),
            oprob("In Progress"),
            oprob("Not Started"),
            oprob("On Hold"),
            str(type_preds[i]),
            str(edu_preds[i]),
            eprob("Completed"),
            eprob("InProgress"),
            eprob("NotStarted"),
            ts,
        ))

    ensure_resident_outcome_predictions_table(OPERATIONAL_SCHEMA)

    with pg_conn(OPERATIONAL_SCHEMA) as conn:
        with conn.cursor() as cur:
            cur.executemany("""
                INSERT INTO operational.resident_outcome_predictions (
                    resident_id,
                    predicted_reintegration_outcome,
                    prob_completed, prob_in_progress,
                    prob_not_started, prob_on_hold,
                    predicted_reintegration_type,
                    predicted_edu_completion,
                    prob_edu_completed, prob_edu_in_progress,
                    prob_edu_not_started,
                    prediction_ts
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (resident_id) DO UPDATE SET
                    predicted_reintegration_outcome = EXCLUDED.predicted_reintegration_outcome,
                    prob_completed                  = EXCLUDED.prob_completed,
                    prob_in_progress                = EXCLUDED.prob_in_progress,
                    prob_not_started                = EXCLUDED.prob_not_started,
                    prob_on_hold                    = EXCLUDED.prob_on_hold,
                    predicted_reintegration_type    = EXCLUDED.predicted_reintegration_type,
                    predicted_edu_completion        = EXCLUDED.predicted_edu_completion,
                    prob_edu_completed              = EXCLUDED.prob_edu_completed,
                    prob_edu_in_progress            = EXCLUDED.prob_edu_in_progress,
                    prob_edu_not_started            = EXCLUDED.prob_edu_not_started,
                    prediction_ts                   = EXCLUDED.prediction_ts
            """, rows)

    print(f"Wrote {len(rows)} resident outcome predictions to resident_outcome_predictions")
    print(f"Timestamp: {ts}")


if __name__ == "__main__":
    print("=== Inference: resident outcome models ===")
    run_inference()
    print("\nInference complete.")
