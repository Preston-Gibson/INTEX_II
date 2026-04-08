"""
Training: fact_donors_ml → two models

  1. donor_churn_model.sav     — binary classifier: will the donor churn?
  2. donor_type_model.sav      — multiclass classifier: what type will they donate?
                                  (Monetary / In-Kind / Time / Skills)

Small dataset (~60 rows), so we use cross-validated RandomForest with
class_weight='balanced' and report leave-one-out CV accuracy alongside
a held-out test split.
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
    DONOR_CHURN_METADATA_PATH,
    DONOR_CHURN_METRICS_PATH,
    DONOR_CHURN_MODEL_PATH,
    DONOR_TYPE_METADATA_PATH,
    DONOR_TYPE_METRICS_PATH,
    DONOR_TYPE_MODEL_PATH,
    WAREHOUSE_SCHEMA,
)
from utils_db import get_engine

MODEL_VERSION = "1.0.0"

FEATURE_COLS = [
    "supporter_type_encoded",
    "region_encoded",
    "channel_encoded",
    "relationship_encoded",
    "total_donations",
    "total_value",
    "avg_value",
    "is_recurring",
    "days_since_last",
    "first_donation_days_ago",
    "num_campaigns",
]


def _build_pipeline(clf):
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler()),
        ("clf",     clf),
    ])


def _cv_score(pipeline, X, y, label: str):
    """Cross-validated accuracy — more reliable on small datasets."""
    n_splits = min(5, y.value_counts().min())  # never more splits than smallest class
    if n_splits < 2:
        print(f"  [WARN] {label}: too few samples in a class for CV — skipping CV")
        return None
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    scores = cross_val_score(pipeline, X, y, cv=cv, scoring="f1_weighted")
    print(f"  {label} CV F1 ({n_splits}-fold): {scores.mean():.3f} ± {scores.std():.3f}")
    return float(scores.mean())


def train_churn(df: pd.DataFrame):
    print("\n--- Churn model ---")
    available = [c for c in FEATURE_COLS if c in df.columns]
    X = df[available]
    y = df["churned"].astype(int)

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

    y_pred = pipeline.predict(X_test)
    accuracy = float(accuracy_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    cv_f1 = _cv_score(pipeline, X, y, "churn")

    print(f"Test accuracy: {accuracy:.3f}  |  Weighted F1: {f1:.3f}")
    print(classification_report(y_test, y_pred, zero_division=0))

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, str(DONOR_CHURN_MODEL_PATH))

    metadata = {
        "model_name": "donor_churn_classifier",
        "model_version": MODEL_VERSION,
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "warehouse_table": "fact_donors_ml",
        "num_training_rows": int(len(X_train)),
        "num_test_rows": int(len(X_test)),
        "label_col": "churned",
        "feature_cols": available,
        "classes": [int(c) for c in pipeline.classes_],
    }
    metrics = {
        "accuracy": accuracy,
        "weighted_f1": f1,
        "cv_f1_mean": cv_f1,
        "classification_report": report,
    }

    with open(DONOR_CHURN_METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
    with open(DONOR_CHURN_METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"Saved: {DONOR_CHURN_MODEL_PATH}")
    return accuracy, f1


def train_donation_type(df: pd.DataFrame):
    print("\n--- Donation type model ---")

    # Drop rows with no donation history (no label)
    df = df.dropna(subset=["last_donation_type"])

    available = [c for c in FEATURE_COLS if c in df.columns]
    X = df[available]
    y = df["last_donation_type"]

    print(f"Label distribution:\n{y.value_counts().to_string()}\n")

    min_class = y.value_counts().min()
    stratify = y if min_class >= 2 else None
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=stratify
    )

    # GradientBoosting handles multiclass well on small datasets
    pipeline = _build_pipeline(
        GradientBoostingClassifier(n_estimators=100, random_state=42)
    )
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    accuracy = float(accuracy_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    cv_f1 = _cv_score(pipeline, X, y, "donation_type")

    print(f"Test accuracy: {accuracy:.3f}  |  Weighted F1: {f1:.3f}")
    print(classification_report(y_test, y_pred, zero_division=0))

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, str(DONOR_TYPE_MODEL_PATH))

    metadata = {
        "model_name": "donor_type_classifier",
        "model_version": MODEL_VERSION,
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "warehouse_table": "fact_donors_ml",
        "num_training_rows": int(len(X_train)),
        "num_test_rows": int(len(X_test)),
        "label_col": "last_donation_type",
        "feature_cols": available,
        "classes": list(pipeline.classes_),
    }
    metrics = {
        "accuracy": accuracy,
        "weighted_f1": f1,
        "cv_f1_mean": cv_f1,
        "classification_report": report,
    }

    with open(DONOR_TYPE_METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
    with open(DONOR_TYPE_METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"Saved: {DONOR_TYPE_MODEL_PATH}")
    return accuracy, f1


def train_and_save():
    engine = get_engine(WAREHOUSE_SCHEMA)
    df = pd.read_sql("SELECT * FROM fact_donors_ml", engine)
    print(f"Loaded {len(df)} rows from fact_donors_ml")

    train_churn(df)
    train_donation_type(df)


if __name__ == "__main__":
    print("=== Training: donor models ===")
    train_and_save()
    print("\nTraining complete.")
