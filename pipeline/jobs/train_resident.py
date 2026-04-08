"""
Training: fact_resident_outcomes_ml → three models

  1. reintegration_outcome_model.sav  — Completed / In Progress / Not Started / On Hold
  2. reintegration_type_model.sav     — Foster Care / Family Reunification / etc.
  3. education_completion_model.sav   — Completed / InProgress / NotStarted
"""

import json
from datetime import datetime, timezone

import joblib
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from config import (
    ARTIFACTS_DIR,
    EDUCATION_METADATA_PATH,
    EDUCATION_METRICS_PATH,
    EDUCATION_MODEL_PATH,
    REINTEGRATION_OUTCOME_METADATA_PATH,
    REINTEGRATION_OUTCOME_METRICS_PATH,
    REINTEGRATION_OUTCOME_MODEL_PATH,
    REINTEGRATION_TYPE_METADATA_PATH,
    REINTEGRATION_TYPE_METRICS_PATH,
    REINTEGRATION_TYPE_MODEL_PATH,
    WAREHOUSE_SCHEMA,
)
from utils_db import get_engine

MODEL_VERSION = "1.0.0"

RESIDENT_FEATURE_COLS = [
    # Demographics
    "age_upon_admission_years", "length_of_stay_days",
    "sex_encoded", "case_category_encoded",
    "initial_risk_encoded", "referral_source_encoded",
    # Risk flags
    "is_pwd", "has_special_needs",
    "sub_cat_trafficked", "sub_cat_physical_abuse",
    "sub_cat_sexual_abuse", "sub_cat_child_labor",
    "sub_cat_orphaned", "sub_cat_at_risk",
    "family_is_4ps", "family_solo_parent", "family_indigenous",
    # Health
    "avg_health_score", "avg_nutrition", "avg_sleep", "avg_bmi",
    "pct_medical_done", "pct_psych_done",
    # Education
    "avg_attendance", "avg_progress", "num_edu_records",
    # Sessions
    "total_sessions", "pct_concerns_flagged",
    "pct_referral_made", "pct_progress_noted",
    # Incidents
    "total_incidents", "high_severity_count", "pct_unresolved",
    # Visits
    "total_visits", "pct_safety_concerns", "avg_cooperation",
]


def _build_pipeline(clf):
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler()),
        ("clf",     clf),
    ])


def _cv_score(pipeline, X, y, label: str):
    min_class = y.value_counts().min()
    n_splits = min(5, int(min_class))
    if n_splits < 2:
        print(f"  [WARN] {label}: class too small for CV — skipping")
        return None
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    scores = cross_val_score(pipeline, X, y, cv=cv, scoring="f1_weighted")
    print(f"  {label} CV F1 ({n_splits}-fold): {scores.mean():.3f} ± {scores.std():.3f}")
    return float(scores.mean())


def _save(pipeline, X_train, X_test, y_train, y_test,
          model_path, metadata_path, metrics_path,
          model_name: str, label_col: str, feature_cols: list, df_full, y_full):

    y_pred = pipeline.predict(X_test)
    accuracy = float(accuracy_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    cv_f1 = _cv_score(pipeline, df_full[feature_cols], y_full, model_name)

    print(f"Test accuracy: {accuracy:.3f}  |  Weighted F1: {f1:.3f}")
    print(classification_report(y_test, y_pred, zero_division=0))

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, str(model_path))

    metadata = {
        "model_name": model_name,
        "model_version": MODEL_VERSION,
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "warehouse_table": "fact_resident_outcomes_ml",
        "num_training_rows": int(len(X_train)),
        "num_test_rows": int(len(X_test)),
        "label_col": label_col,
        "feature_cols": feature_cols,
        "classes": list(pipeline.classes_),
    }
    metrics = {
        "accuracy": accuracy,
        "weighted_f1": f1,
        "cv_f1_mean": cv_f1,
        "classification_report": report,
    }
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"Saved: {model_path}\n")


def train_reintegration_outcome(df: pd.DataFrame):
    print("\n--- Reintegration outcome model ---")
    df = df.dropna(subset=["reintegration_outcome_label"])
    available = [c for c in RESIDENT_FEATURE_COLS if c in df.columns]
    X = df[available]
    y = df["reintegration_outcome_label"]
    print(f"Label distribution:\n{y.value_counts().to_string()}\n")

    min_class = y.value_counts().min()
    stratify = y if min_class >= 2 else None
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=stratify
    )
    pipeline = _build_pipeline(
        RandomForestClassifier(n_estimators=200, random_state=42, class_weight="balanced")
    )
    pipeline.fit(X_train, y_train)
    _save(pipeline, X_train, X_test, y_train, y_test,
          REINTEGRATION_OUTCOME_MODEL_PATH,
          REINTEGRATION_OUTCOME_METADATA_PATH,
          REINTEGRATION_OUTCOME_METRICS_PATH,
          "reintegration_outcome_classifier",
          "reintegration_outcome_label", available, df, y)


def train_reintegration_type(df: pd.DataFrame):
    print("\n--- Reintegration type model ---")
    df = df.dropna(subset=["reintegration_type_label"])
    # Drop "None" types — not a real pathway
    df = df[~df["reintegration_type_label"].isin(["None", ""])]
    available = [c for c in RESIDENT_FEATURE_COLS if c in df.columns]
    X = df[available]
    y = df["reintegration_type_label"]
    print(f"Label distribution:\n{y.value_counts().to_string()}\n")

    min_class = y.value_counts().min()
    stratify = y if min_class >= 2 else None
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=stratify
    )
    pipeline = _build_pipeline(
        GradientBoostingClassifier(n_estimators=100, random_state=42)
    )
    pipeline.fit(X_train, y_train)
    _save(pipeline, X_train, X_test, y_train, y_test,
          REINTEGRATION_TYPE_MODEL_PATH,
          REINTEGRATION_TYPE_METADATA_PATH,
          REINTEGRATION_TYPE_METRICS_PATH,
          "reintegration_type_classifier",
          "reintegration_type_label", available, df, y)


def train_education_completion(df: pd.DataFrame):
    print("\n--- Education completion model ---")
    df = df.dropna(subset=["edu_completion_label"])
    # Normalize label values (strip "Progress: " prefix if present)
    df["edu_completion_label"] = df["edu_completion_label"].str.replace(
        r"^Progress:\s*", "", regex=True
    )
    available = [c for c in RESIDENT_FEATURE_COLS if c in df.columns]
    X = df[available]
    y = df["edu_completion_label"]
    print(f"Label distribution:\n{y.value_counts().to_string()}\n")

    min_class = y.value_counts().min()
    stratify = y if min_class >= 2 else None
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=stratify
    )
    pipeline = _build_pipeline(
        RandomForestClassifier(n_estimators=200, random_state=42, class_weight="balanced")
    )
    pipeline.fit(X_train, y_train)
    _save(pipeline, X_train, X_test, y_train, y_test,
          EDUCATION_MODEL_PATH,
          EDUCATION_METADATA_PATH,
          EDUCATION_METRICS_PATH,
          "education_completion_classifier",
          "edu_completion_label", available, df, y)


def train_and_save():
    engine = get_engine(WAREHOUSE_SCHEMA)
    df = pd.read_sql("SELECT * FROM fact_resident_outcomes_ml", engine)
    print(f"Loaded {len(df)} rows from fact_resident_outcomes_ml")

    train_reintegration_outcome(df.copy())
    train_reintegration_type(df.copy())
    train_education_completion(df.copy())


if __name__ == "__main__":
    print("=== Training: resident outcome models ===")
    train_and_save()
    print("\nTraining complete.")
