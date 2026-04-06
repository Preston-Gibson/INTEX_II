"""
Training: warehouse schema → risk_model.sav + metadata + metrics.

Reads fact_residents_ml, trains a RandomForest classifier to predict
current_risk_level (Low / Medium / High / Critical), saves artifacts.
"""

import json
from datetime import datetime, timezone

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from config import (
    ARTIFACTS_DIR,
    RISK_METADATA_PATH,
    RISK_METRICS_PATH,
    RISK_MODEL_PATH,
    WAREHOUSE_SCHEMA,
)
from utils_db import get_engine

MODEL_VERSION = "1.0.0"
LABEL_COL = "current_risk_level"

FEATURE_COLS = [
    # Health
    "avg_health_score", "avg_nutrition", "avg_sleep", "avg_bmi",
    "pct_medical_done", "pct_psych_done",
    # Education
    "avg_attendance", "avg_progress",
    # Sessions
    "total_sessions", "pct_concerns_flagged", "pct_referral_made",
    # Incidents
    "total_incidents", "high_severity_count", "pct_unresolved",
    # Visits
    "total_visits", "pct_safety_concerns", "avg_cooperation",
    # Resident demographics
    "age_upon_admission_years", "length_of_stay_days",
    "is_pwd", "has_special_needs",
    "sub_cat_trafficked", "sub_cat_physical_abuse",
    "sub_cat_sexual_abuse", "sub_cat_child_labor",
    "family_is_4ps", "family_solo_parent",
    "sex_encoded", "case_category_encoded",
]


def train_and_save():
    # ---- Load data ---------------------------------------------------------
    engine = get_engine(WAREHOUSE_SCHEMA)
    df = pd.read_sql("SELECT * FROM fact_residents_ml", engine)

    print(f"Loaded {len(df)} rows from fact_residents_ml")

    # Only keep feature columns that actually exist in the table
    available = [c for c in FEATURE_COLS if c in df.columns]
    missing = [c for c in FEATURE_COLS if c not in df.columns]
    if missing:
        print(f"  [WARN] Missing feature columns (will be ignored): {missing}")

    X = df[available]
    y = df[LABEL_COL]

    print(f"Label distribution:\n{y.value_counts().to_string()}\n")

    # ---- Train / test split ------------------------------------------------
    # Stratify only when every class has at least 2 members (small dataset guard)
    min_class_count = y.value_counts().min()
    stratify_arg = y if min_class_count >= 2 else None
    if stratify_arg is None:
        print("  [WARN] Rare class (<2 members) — using non-stratified split")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.25,
        random_state=42,
        stratify=stratify_arg,
    )
    print(f"Train: {len(X_train)} rows | Test: {len(X_test)} rows")

    # ---- Build pipeline ----------------------------------------------------
    model_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            class_weight="balanced",   # handles class imbalance
        )),
    ])

    model_pipeline.fit(X_train, y_train)

    # ---- Evaluate ----------------------------------------------------------
    y_pred = model_pipeline.predict(X_test)
    accuracy = float(accuracy_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred, average="weighted"))
    report = classification_report(y_test, y_pred, output_dict=True)

    print(f"Accuracy : {accuracy:.3f}")
    print(f"Weighted F1: {f1:.3f}")
    print(classification_report(y_test, y_pred))

    # ---- Save artifacts ----------------------------------------------------
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    joblib.dump(model_pipeline, str(RISK_MODEL_PATH))

    metadata = {
        "model_name": "resident_risk_classifier",
        "model_version": MODEL_VERSION,
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "warehouse_table": "fact_residents_ml",
        "num_training_rows": int(len(X_train)),
        "num_test_rows": int(len(X_test)),
        "label_col": LABEL_COL,
        "feature_cols": available,
        "classes": list(model_pipeline.classes_),
    }

    metrics = {
        "accuracy": accuracy,
        "weighted_f1": f1,
        "classification_report": report,
    }

    with open(RISK_METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    with open(RISK_METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nSaved: {RISK_MODEL_PATH}")
    print(f"Saved: {RISK_METADATA_PATH}")
    print(f"Saved: {RISK_METRICS_PATH}")
    return accuracy, f1


if __name__ == "__main__":
    print("=== Training: resident risk classifier ===")
    train_and_save()
    print("\nTraining complete.")
