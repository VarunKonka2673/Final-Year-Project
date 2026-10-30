"""
SocialGuard Extractor Data Collector & Adaptive Retraining Engine
Captures live scraped and extracted social profile telemetry, archives normalized
records into a persistent training dataset, and orchestrates model retraining
incorporating real-world profile distributions.
"""

import os
import time
import argparse
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional

from backend.ml.preprocessor import NUMERICAL_FEATURE_COLS, DEFAULT_VALUES

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
COLLECTED_CSV_PATH = os.path.join(DATA_DIR, "collected_profiles.csv")
MAIN_DATASET_PATH = os.path.join(DATA_DIR, "socialguard_dataset.csv")
PIPELINE_PATH = os.path.join(MODEL_DIR, "socialguard_pipeline.joblib")

DATASET_COLUMNS = [
    "account_id", "username", "full_name", "bio", "recent_post",
    "has_profile_pic", "is_verified", "account_age_days",
    "follower_count", "following_count", "posts_count",
    "follower_to_following_ratio", "has_url", "has_contact_info",
    "posting_frequency_per_day", "avg_engagement_rate",
    "avg_likes_per_post", "avg_retweets_or_shares",
    "like_to_share_ratio", "mention_count_avg", "hashtag_count_avg",
    "url_in_post_ratio", "active_hours_entropy", "spam_keyword_score",
    "sentiment_polarity", "lexical_diversity", "repeated_text_ratio",
    "uppercase_ratio", "bot_archetype", "is_fake"
]


def format_extracted_profile(
    extracted_data: Dict[str, Any],
    is_fake: Optional[int] = None,
    bot_archetype: Optional[str] = None
) -> Dict[str, Any]:
    """
    Transforms and aligns raw extracted profile features into the exact
    canonical 30-column format required by the SocialGuard ML training pipeline.
    """
    username = str(extracted_data.get("username", "extracted_user")).strip().lstrip("@")
    full_name = str(extracted_data.get("full_name") or extracted_data.get("display_name") or username).strip()
    bio = str(extracted_data.get("bio", "")).strip()
    recent_post = str(extracted_data.get("recent_post", "")).strip()
    if not recent_post and bio:
        recent_post = bio

    # Follower & Following normalization
    fol = float(extracted_data.get("follower_count") if extracted_data.get("follower_count") is not None
                else (extracted_data.get("followers") or 0.0))
    folg = float(extracted_data.get("following_count") if extracted_data.get("following_count") is not None
                 else (extracted_data.get("following") or 0.0))
    posts = float(extracted_data.get("posts_count") if extracted_data.get("posts_count") is not None
                  else (extracted_data.get("media_count") or 0.0))

    ratio = round((fol + 1.0) / (folg + 1.0), 3)

    # Determine ground-truth / predicted label
    if is_fake is None:
        is_fake = int(extracted_data.get("is_fake", 0))
    else:
        is_fake = int(is_fake)

    # Determine archetype
    if not bot_archetype:
        bot_archetype = extracted_data.get("predicted_archetype")
    if not bot_archetype:
        if is_fake == 1:
            bot_archetype = "Spam-Promoter-Bot" if folg > 2000 else "Crypto-Phishing-Bot"
        else:
            if fol > 100000:
                bot_archetype = "Genuine-Celebrity"
            elif fol > 10000:
                bot_archetype = "Genuine-Creator-Influencer"
            else:
                bot_archetype = "Genuine-Casual-User"

    record: Dict[str, Any] = {
        "account_id": f"EXT_{username}_{int(time.time())}",
        "username": username,
        "full_name": full_name,
        "bio": bio,
        "recent_post": recent_post,
        "has_profile_pic": int(extracted_data.get("has_profile_pic", 1)),
        "is_verified": int(extracted_data.get("is_verified", 0)),
        "account_age_days": float(extracted_data.get("account_age_days", 450.0)),
        "follower_count": fol,
        "following_count": folg,
        "posts_count": posts,
        "follower_to_following_ratio": ratio,
        "has_url": int(extracted_data.get("has_url", 0)),
        "has_contact_info": int(extracted_data.get("has_contact_info", 0)),
        "posting_frequency_per_day": float(extracted_data.get("posting_frequency_per_day", 0.05)),
        "avg_engagement_rate": float(extracted_data.get("avg_engagement_rate", 5.0)),
        "avg_likes_per_post": float(extracted_data.get("avg_likes_per_post", round(fol * 0.05, 1))),
        "avg_retweets_or_shares": float(extracted_data.get("avg_retweets_or_shares", round(fol * 0.005, 1))),
        "like_to_share_ratio": float(extracted_data.get("like_to_share_ratio", 8.0)),
        "mention_count_avg": float(extracted_data.get("mention_count_avg", 0.2)),
        "hashtag_count_avg": float(extracted_data.get("hashtag_count_avg", 1.0)),
        "url_in_post_ratio": float(extracted_data.get("url_in_post_ratio", 0.05)),
        "active_hours_entropy": float(extracted_data.get("active_hours_entropy", 3.2)),
        "spam_keyword_score": float(extracted_data.get("spam_keyword_score", 0.0)),
        "sentiment_polarity": float(extracted_data.get("sentiment_polarity", 0.1)),
        "lexical_diversity": float(extracted_data.get("lexical_diversity", 0.75)),
        "repeated_text_ratio": float(extracted_data.get("repeated_text_ratio", 0.05)),
        "uppercase_ratio": float(extracted_data.get("uppercase_ratio", 0.04)),
        "bot_archetype": bot_archetype,
        "is_fake": is_fake
    }

    return record


def save_collected_profile(
    extracted_data: Dict[str, Any],
    is_fake: Optional[int] = None,
    bot_archetype: Optional[str] = None
) -> Dict[str, Any]:
    """
    Archives a single extracted profile into `collected_profiles.csv` and
    synchronizes it with `socialguard_dataset.csv`.
    Deduplicates by username so repeated scans update with the freshest telemetry.
    """
    os.makedirs(DATA_DIR, exist_ok=True)
    formatted = format_extracted_profile(extracted_data, is_fake, bot_archetype)
    username = formatted["username"]

    # 1. Update collected_profiles.csv
    if os.path.exists(COLLECTED_CSV_PATH):
        try:
            df_col = pd.read_csv(COLLECTED_CSV_PATH)
            # Remove previous version of this user if exists
            df_col = df_col[df_col["username"].astype(str).str.lower() != username.lower()]
            df_new = pd.DataFrame([formatted])
            df_col = pd.concat([df_col, df_new], ignore_index=True)
        except Exception:
            df_col = pd.DataFrame([formatted])
    else:
        df_col = pd.DataFrame([formatted])

    df_col.to_csv(COLLECTED_CSV_PATH, index=False)
    print(f"[DataCollector] Saved profile @{username} to {COLLECTED_CSV_PATH} (Total collected: {len(df_col)})")

    # 2. Also append/update in main dataset socialguard_dataset.csv
    if os.path.exists(MAIN_DATASET_PATH):
        try:
            df_main = pd.read_csv(MAIN_DATASET_PATH)
            # Remove previous version of this user from main dataset if exists
            df_main = df_main[df_main["username"].astype(str).str.lower() != username.lower()]
            df_main = pd.concat([df_main, pd.DataFrame([formatted])], ignore_index=True)
            df_main.to_csv(MAIN_DATASET_PATH, index=False)
            print(f"[DataCollector] Synced profile @{username} into main training dataset {MAIN_DATASET_PATH}")
        except Exception as e:
            print(f"[DataCollector] Main dataset sync note: {e}")

    return {
        "status": "COLLECTED",
        "username": username,
        "total_collected": len(df_col),
        "record": formatted
    }


def get_all_collected_profiles() -> List[Dict[str, Any]]:
    """Retrieves all archived extractor profiles."""
    if not os.path.exists(COLLECTED_CSV_PATH):
        return []
    try:
        df = pd.read_csv(COLLECTED_CSV_PATH)
        return df.to_dict(orient="records")
    except Exception:
        return []


def retrain_pipeline_with_collected_data(
    custom_dataset_df: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    """
    Retrains the entire SocialGuard hybrid multi-model suite and anomaly engines
    using the combined dataset of synthetic samples and collected extractor profiles.
    Replicates collected real-world profiles so their features guide decision tree
    splits and boundary calibrations.
    """
    from backend.ml.pipeline import SocialGuardPipeline

    # 1. Base dataset
    if custom_dataset_df is not None:
        df = custom_dataset_df.copy()
    elif os.path.exists(MAIN_DATASET_PATH):
        df = pd.read_csv(MAIN_DATASET_PATH)
    else:
        from backend.ml.dataset_generator import save_default_dataset
        save_default_dataset(DATA_DIR)
        df = pd.read_csv(MAIN_DATASET_PATH)

    # 2. Merge collected profiles with balanced sample weighting
    if os.path.exists(COLLECTED_CSV_PATH):
        try:
            df_collected = pd.read_csv(COLLECTED_CSV_PATH)
            if len(df_collected) > 0:
                print(f"[DataCollector] Incorporating {len(df_collected)} collected real profiles into training set.")
                # Give real extracted profiles meaningful statistical weight in training split
                # by replicating them up to ~100 rows total
                rep = max(1, min(30, int(120 / max(1, len(df_collected)))))
                df_replicated = pd.concat([df_collected] * rep, ignore_index=True)
                df = pd.concat([df, df_replicated], ignore_index=True)
                print(f"[DataCollector] Total training samples after merging collected data: {len(df)}")
        except Exception as e:
            print(f"[DataCollector] Warning merging collected profiles: {e}")

    # 3. Execute training
    print("[DataCollector] Initializing fresh SocialGuardPipeline...")
    new_pipeline = SocialGuardPipeline()
    eval_meta = new_pipeline.train_pipeline(df)

    # 4. Save serialized pipeline
    os.makedirs(MODEL_DIR, exist_ok=True)
    new_pipeline.save_pipeline(PIPELINE_PATH)
    print(f"[DataCollector] Retrained model serialized successfully to {PIPELINE_PATH}")

    return {
        "status": "SUCCESS",
        "total_training_samples": len(df),
        "best_model": new_pipeline.model_suite.best_model_name,
        "evaluation": eval_meta,
        "models_summary": eval_meta.get("models_comparison", [])
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SocialGuard Profile Collector & Retrainer")
    parser.add_argument("--list", action="store_true", help="List all collected profiles")
    parser.add_argument("--retrain", action="store_true", help="Retrain models with collected data")
    args = parser.parse_args()

    if args.list:
        profiles = get_all_collected_profiles()
        print(f"Total collected profiles: {len(profiles)}")
        for p in profiles:
            print(f" - @{p.get('username')}: {p.get('full_name')} ({p.get('follower_count')} followers, {p.get('posts_count')} posts) => Fake: {p.get('is_fake')}")
    elif args.retrain:
        res = retrain_pipeline_with_collected_data()
        print(f"Retraining Complete! Best Model: {res['best_model']}")
    else:
        parser.print_help()
