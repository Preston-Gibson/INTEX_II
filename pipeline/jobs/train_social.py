"""
Training: warehouse.fact_social_media_ml → engagement_model.sav + donation_model.sav
          + 4 JSON files (metadata + metrics for each model).

Model 1 — Engagement Tier Classifier
  Target: engagement_tier (Low / Medium / High — pre-computed tertile bins)

Model 2 — Donation Conversion Classifier
  Target: has_donations (0 / 1 — 1 if any donation referrals traced to post)
"""

import json
from datetime import datetime, timezone

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OrdinalEncoder, StandardScaler

from config import (
    ARTIFACTS_DIR,
    DONATION_METADATA_PATH,
    DONATION_METRICS_PATH,
    DONATION_MODEL_PATH,
    ENGAGEMENT_METADATA_PATH,
    ENGAGEMENT_METRICS_PATH,
    ENGAGEMENT_MODEL_PATH,
    WAREHOUSE_SCHEMA,
)
from utils_db import get_engine

MODEL_VERSION = "1.0.0"

# ---------------------------------------------------------------------------
# Feature column definitions
# ---------------------------------------------------------------------------

CAT_COLS = [
    "platform_encoded",
    "post_type_encoded",
    "media_type_encoded",
    "day_of_week_encoded",
    "call_to_action_type_encoded",
    "content_topic_encoded",
    "sentiment_tone_encoded",
]

NUM_COLS = [
    "has_call_to_action",
    "features_resident_story",
    "is_boosted",
    "post_hour",
    "num_hashtags",
    "mentions_count",
    "caption_length",
    "boost_budget_php",
    "follower_count_at_post",
    # text-derived features
    "word_count",
    "sentence_count",
    "question_count",
    "exclamation_count",
    "has_url",
    "emoji_count",
    "starts_strong",
]

FEATURE_COLS = CAT_COLS + NUM_COLS   # 16 total

# Explicit category lists for OrdinalEncoder — ensures consistent integer mapping
# and prevents unknown-value errors on unseen categories at inference time.
CAT_CATEGORIES = [
    [0, 1, 2, 3, 4, 5, 6],      # platform_encoded (7 platforms)
    [0, 1, 2, 3, 4, 5],         # post_type_encoded (6 types)
    [0, 1, 2, 3, 4],            # media_type_encoded (5 types)
    [0, 1, 2, 3, 4, 5, 6],      # day_of_week_encoded (7 days)
    [0, 1, 2, 3, 4],            # call_to_action_type_encoded (5 values incl. None)
    [0, 1, 2, 3, 4, 5, 6, 7, 8],  # content_topic_encoded (9 topics)
    [0, 1, 2, 3, 4, 5],         # sentiment_tone_encoded (6 tones)
]


def _make_pipeline() -> Pipeline:
    """Return a fresh sklearn Pipeline with ColumnTransformer preprocessing."""
    cat_transformer = Pipeline([
        ("encoder", OrdinalEncoder(
            categories=CAT_CATEGORIES,
            handle_unknown="use_encoded_value",
            unknown_value=-1,
        )),
    ])

    num_transformer = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    preprocessor = ColumnTransformer([
        ("cat", cat_transformer, CAT_COLS),
        ("num", num_transformer, NUM_COLS),
    ])

    return Pipeline([
        ("preprocessor", preprocessor),
        ("clf", RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            class_weight="balanced",
        )),
    ])


def _split(X, y):
    """Train/test split with stratify guard for rare classes."""
    min_class_count = y.value_counts().min()
    stratify_arg = y if min_class_count >= 2 else None
    if stratify_arg is None:
        print("  [WARN] Rare class (<2 members) — using non-stratified split")
    return train_test_split(X, y, test_size=0.25, random_state=42, stratify=stratify_arg)


def _evaluate(model, X_test, y_test):
    y_pred = model.predict(X_test)
    accuracy = float(accuracy_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred, average="weighted"))
    report = classification_report(y_test, y_pred, output_dict=True)
    print(f"  Accuracy : {accuracy:.3f}")
    print(f"  Weighted F1: {f1:.3f}")
    print(classification_report(y_test, y_pred))
    return accuracy, f1, report


# ---------------------------------------------------------------------------
# Train engagement tier model
# ---------------------------------------------------------------------------

def train_engagement(df: pd.DataFrame):
    print(f"=== Training: engagement tier classifier ===")
    print(f"Loaded {len(df)} rows from fact_social_media_ml")

    X = df[FEATURE_COLS]
    y = df["engagement_tier"]
    print(f"Label distribution:\n{y.value_counts().to_string()}\n")

    X_train, X_test, y_train, y_test = _split(X, y)
    print(f"Train: {len(X_train)} rows | Test: {len(X_test)} rows")

    model = _make_pipeline()
    model.fit(X_train, y_train)

    accuracy, f1, report = _evaluate(model, X_test, y_test)

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, str(ENGAGEMENT_MODEL_PATH))

    metadata = {
        "model_name": "social_media_engagement_classifier",
        "model_version": MODEL_VERSION,
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "warehouse_table": "fact_social_media_ml",
        "num_training_rows": int(len(X_train)),
        "num_test_rows": int(len(X_test)),
        "label_col": "engagement_tier",
        "feature_cols": FEATURE_COLS,
        "cat_cols": CAT_COLS,
        "num_cols": NUM_COLS,
        "classes": list(model.classes_),
    }

    metrics = {
        "accuracy": accuracy,
        "weighted_f1": f1,
        "classification_report": report,
    }

    with open(ENGAGEMENT_METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    with open(ENGAGEMENT_METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"Saved: {ENGAGEMENT_MODEL_PATH}")
    print(f"Saved: {ENGAGEMENT_METADATA_PATH}")
    print(f"Saved: {ENGAGEMENT_METRICS_PATH}")
    return accuracy, f1


# ---------------------------------------------------------------------------
# Train donation conversion model
# ---------------------------------------------------------------------------

def train_donation(df: pd.DataFrame):
    print(f"\n=== Training: donation conversion classifier ===")
    print(f"Loaded {len(df)} rows from fact_social_media_ml")

    X = df[FEATURE_COLS]
    y = df["has_donations"].astype(int)
    print(f"Label distribution:\n{y.value_counts().to_string()}\n")

    X_train, X_test, y_train, y_test = _split(X, y)
    print(f"Train: {len(X_train)} rows | Test: {len(X_test)} rows")

    model = _make_pipeline()
    model.fit(X_train, y_train)

    accuracy, f1, report = _evaluate(model, X_test, y_test)

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, str(DONATION_MODEL_PATH))

    metadata = {
        "model_name": "social_media_donation_classifier",
        "model_version": MODEL_VERSION,
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "warehouse_table": "fact_social_media_ml",
        "num_training_rows": int(len(X_train)),
        "num_test_rows": int(len(X_test)),
        "label_col": "has_donations",
        "feature_cols": FEATURE_COLS,
        "cat_cols": CAT_COLS,
        "num_cols": NUM_COLS,
        "classes": [int(c) for c in model.classes_],
    }

    metrics = {
        "accuracy": accuracy,
        "weighted_f1": f1,
        "classification_report": report,
    }

    with open(DONATION_METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    with open(DONATION_METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"Saved: {DONATION_MODEL_PATH}")
    print(f"Saved: {DONATION_METADATA_PATH}")
    print(f"Saved: {DONATION_METRICS_PATH}")
    return accuracy, f1


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    engine = get_engine(WAREHOUSE_SCHEMA)
    df = pd.read_sql("SELECT * FROM warehouse.fact_social_media_ml", engine)

    train_engagement(df)
    train_donation(df)

    print("\nSocial media training complete.")
