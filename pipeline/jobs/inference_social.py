"""
Inference: engagement_model.sav + donation_model.sav
           → predictions → operational.social_media_predictions

Loads both saved pipelines, rebuilds the feature matrix from
operational.social_media_posts (no joins needed — single table),
and writes predictions + probability scores into social_media_predictions.
The app queries that table; it never loads the models itself.
"""

import json
from datetime import datetime, timezone

import joblib
import pandas as pd

from config import (
    DONATION_METADATA_PATH,
    DONATION_MODEL_PATH,
    ENGAGEMENT_METADATA_PATH,
    ENGAGEMENT_MODEL_PATH,
    OPERATIONAL_SCHEMA,
)
from utils_db import ensure_social_predictions_table, get_engine, pg_conn

# Encoding maps must exactly match etl.py Phase C
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


def _build_features(engine) -> pd.DataFrame:
    """
    Rebuild the feature matrix from operational.social_media_posts.
    Applies identical null-fills and coercions as ETL Phase C.
    Returns a DataFrame with post_id + 16 encoded feature columns.
    """
    posts = pd.read_sql("SELECT * FROM social_media_posts", engine)

    # Null fills
    posts["call_to_action_type"] = posts["call_to_action_type"].fillna("None")
    posts["boost_budget_php"]    = posts["boost_budget_php"].fillna(0.0)

    # Boolean → int (psycopg2 may return object dtype from Postgres boolean)
    for col in ["has_call_to_action", "features_resident_story", "is_boosted"]:
        posts[col] = posts[col].astype(int)

    # Categorical encoding
    posts["platform_encoded"]            = posts["platform"].map(PLATFORM_MAP).fillna(-1).astype(int)
    posts["post_type_encoded"]           = posts["post_type"].map(POST_TYPE_MAP).fillna(-1).astype(int)
    posts["media_type_encoded"]          = posts["media_type"].map(MEDIA_TYPE_MAP).fillna(-1).astype(int)
    posts["day_of_week_encoded"]         = posts["day_of_week"].map(DAY_OF_WEEK_MAP).fillna(-1).astype(int)
    posts["call_to_action_type_encoded"] = posts["call_to_action_type"].map(CTA_TYPE_MAP).fillna(-1).astype(int)
    posts["content_topic_encoded"]       = posts["content_topic"].map(CONTENT_TOPIC_MAP).fillna(-1).astype(int)
    posts["sentiment_tone_encoded"]      = posts["sentiment_tone"].map(SENTIMENT_TONE_MAP).fillna(-1).astype(int)

    feature_cols = [
        "platform_encoded", "post_type_encoded", "media_type_encoded",
        "day_of_week_encoded", "call_to_action_type_encoded",
        "content_topic_encoded", "sentiment_tone_encoded",
        "has_call_to_action", "features_resident_story", "is_boosted",
        "post_hour", "num_hashtags", "mentions_count", "caption_length",
        "boost_budget_php", "follower_count_at_post",
    ]

    return posts[["post_id"] + feature_cols].copy()


def run_inference():
    # Load models and metadata
    engagement_model = joblib.load(str(ENGAGEMENT_MODEL_PATH))
    donation_model   = joblib.load(str(DONATION_MODEL_PATH))

    with open(ENGAGEMENT_METADATA_PATH, encoding="utf-8") as f:
        eng_meta = json.load(f)
    with open(DONATION_METADATA_PATH, encoding="utf-8") as f:
        don_meta = json.load(f)

    eng_classes = eng_meta["classes"]   # e.g. ["High", "Low", "Medium"]
    don_classes = don_meta["classes"]   # [0, 1]

    print(f"Engagement model v{eng_meta['model_version']} | classes: {eng_classes}")
    print(f"Donation model   v{don_meta['model_version']} | classes: {don_classes}")

    engine = get_engine(OPERATIONAL_SCHEMA)
    df = _build_features(engine)
    print(f"Scoring {len(df)} posts")

    feature_cols = eng_meta["feature_cols"]
    X = df[feature_cols]

    # Engagement predictions
    eng_probs  = engagement_model.predict_proba(X)   # (n, 3)
    eng_preds  = engagement_model.predict(X)
    eng_prob_df = pd.DataFrame(eng_probs, columns=eng_classes)

    # Donation predictions — classes_ is [0, 1]; prob column 1 = P(has_donations=True)
    don_probs  = donation_model.predict_proba(X)     # (n, 2)
    don_preds  = donation_model.predict(X)
    don_class_idx = list(don_classes).index(1) if 1 in don_classes else 1
    prob_has_donations_arr = don_probs[:, don_class_idx]

    ts = datetime.now(timezone.utc).isoformat()

    # Build rows for upsert
    rows = []
    for i, (_, row) in enumerate(df.iterrows()):
        prob_low    = float(eng_prob_df.iloc[i]["Low"])    if "Low"    in eng_prob_df.columns else None
        prob_medium = float(eng_prob_df.iloc[i]["Medium"]) if "Medium" in eng_prob_df.columns else None
        prob_high   = float(eng_prob_df.iloc[i]["High"])   if "High"   in eng_prob_df.columns else None

        rows.append((
            int(row["post_id"]),
            str(eng_preds[i]),
            prob_low,
            prob_medium,
            prob_high,
            int(don_preds[i]),
            float(prob_has_donations_arr[i]),
            ts,
        ))

    ensure_social_predictions_table(OPERATIONAL_SCHEMA)

    with pg_conn(OPERATIONAL_SCHEMA) as conn:
        with conn.cursor() as cur:
            cur.executemany("""
                INSERT INTO operational.social_media_predictions
                    (post_id, predicted_engagement_tier,
                     prob_engagement_low, prob_engagement_medium, prob_engagement_high,
                     predicted_has_donations, prob_has_donations, prediction_ts)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (post_id) DO UPDATE SET
                    predicted_engagement_tier = EXCLUDED.predicted_engagement_tier,
                    prob_engagement_low       = EXCLUDED.prob_engagement_low,
                    prob_engagement_medium    = EXCLUDED.prob_engagement_medium,
                    prob_engagement_high      = EXCLUDED.prob_engagement_high,
                    predicted_has_donations   = EXCLUDED.predicted_has_donations,
                    prob_has_donations        = EXCLUDED.prob_has_donations,
                    prediction_ts             = EXCLUDED.prediction_ts
            """, rows)

    print(f"Wrote {len(rows)} predictions to social_media_predictions")
    print(f"Timestamp: {ts}")


if __name__ == "__main__":
    print("=== Inference: social media engagement + donation classifiers ===")
    run_inference()
    print("\nInference complete.")
