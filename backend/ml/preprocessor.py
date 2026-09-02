"""
SocialGuard Data Preprocessor & Feature Extraction Pipeline
Cleans missing values, calculates composite profile & behavioural indices,
and scales numerical signals for downstream classification and anomaly detection.
"""

import math
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any
from sklearn.preprocessing import StandardScaler, RobustScaler

NUMERICAL_FEATURE_COLS = [
    "has_profile_pic",
    "is_verified",
    "account_age_days",
    "follower_count",
    "following_count",
    "posts_count",
    "follower_to_following_ratio",
    "profile_completeness_score",
    "has_url",
    "has_contact_info",
    "posting_frequency_per_day",
    "avg_engagement_rate",
    "avg_likes_per_post",
    "avg_retweets_or_shares",
    "like_to_share_ratio",
    "mention_count_avg",
    "hashtag_count_avg",
    "url_in_post_ratio",
    "active_hours_entropy",
    "spam_keyword_score",
    "sentiment_polarity",
    "lexical_diversity",
    "repeated_text_ratio",
    "uppercase_ratio",
    "username_digit_count",
    "username_length"
]

DEFAULT_VALUES = {
    "has_profile_pic": 0,
    "is_verified": 0,
    "account_age_days": 0.0,
    "follower_count": 0.0,
    "following_count": 0.0,
    "posts_count": 0.0,
    "has_url": 0,
    "has_contact_info": 0,
    "posting_frequency_per_day": 0.0,
    "avg_engagement_rate": 0.0,
    "avg_likes_per_post": 0.0,
    "avg_retweets_or_shares": 0.0,
    "like_to_share_ratio": 0.0,
    "mention_count_avg": 0.0,
    "hashtag_count_avg": 0.0,
    "url_in_post_ratio": 0.0,
    "active_hours_entropy": 0.0,
    "spam_keyword_score": 0.0,
    "sentiment_polarity": 0.0,
    "lexical_diversity": 0.0,
    "repeated_text_ratio": 0.0,
    "uppercase_ratio": 0.0,
    "username": "",
    "bio": "",
    "recent_post": ""
}

class SocialGuardPreprocessor:
    """
    Cleans, engineers profile & behavioural features, and scales input feature vectors.
    """
    def __init__(self, scaler_type: str = "robust"):
        self.scaler = RobustScaler() if scaler_type == "robust" else StandardScaler()
        self.feature_columns = NUMERICAL_FEATURE_COLS
        self.is_fitted = False

    @staticmethod
    def compute_profile_completeness(row_or_dict: Dict[str, Any]) -> float:
        """
        Computes Profile Completeness Index [0.0 to 1.0].
        Considers avatar, bio presence, external URL, verified status, contact details.
        """
        score = 0.0
        if row_or_dict.get("has_profile_pic", 0) == 1:
            score += 0.30
        bio = str(row_or_dict.get("bio", "")).strip()
        if len(bio) > 10:
            score += 0.25
        elif len(bio) > 0:
            score += 0.10
        if row_or_dict.get("has_url", 0) == 1:
            score += 0.15
        if row_or_dict.get("has_contact_info", 0) == 1:
            score += 0.15
        if row_or_dict.get("is_verified", 0) == 1:
            score += 0.15
        return round(float(min(1.0, score)), 2)

    @staticmethod
    def extract_username_features(username: str) -> Tuple[int, int]:
        """Extracts username length and digit count."""
        if not isinstance(username, str) or not username:
            return 0, 0
        u_len = len(username)
        digits = sum(1 for c in username if c.isdigit())
        return u_len, digits

    def engineer_features_df(self, df: pd.DataFrame) -> pd.DataFrame:
        """Applies feature engineering across a pandas DataFrame with safe column defaults."""
        df = df.copy()

        # Defensively ensure all necessary columns exist
        for col, default_val in DEFAULT_VALUES.items():
            if col not in df.columns:
                df[col] = default_val
            else:
                df[col] = df[col].fillna(default_val)

        # Cast specific types
        df["has_profile_pic"] = df["has_profile_pic"].astype(int)
        df["is_verified"] = df["is_verified"].astype(int)
        df["has_url"] = df["has_url"].astype(int)
        df["has_contact_info"] = df["has_contact_info"].astype(int)
        
        numeric_cols = [
            "account_age_days", "follower_count", "following_count", "posts_count",
            "posting_frequency_per_day", "avg_engagement_rate", "avg_likes_per_post",
            "avg_retweets_or_shares", "like_to_share_ratio", "mention_count_avg",
            "hashtag_count_avg", "url_in_post_ratio", "active_hours_entropy",
            "spam_keyword_score", "sentiment_polarity", "lexical_diversity",
            "repeated_text_ratio", "uppercase_ratio"
        ]
        for nc in numeric_cols:
            df[nc] = pd.to_numeric(df[nc], errors="coerce").fillna(DEFAULT_VALUES.get(nc, 0.0)).astype(float)

        # Calculate Laplace-smoothed Follower-to-Following ratio: (Followers + 1) / (Following + 1)
        df["follower_to_following_ratio"] = (df["follower_count"] + 1.0) / (df["following_count"] + 1.0)

        # Username heuristics
        u_metrics = df["username"].apply(self.extract_username_features)
        df["username_length"] = [m[0] for m in u_metrics]
        df["username_digit_count"] = [m[1] for m in u_metrics]

        # Profile completeness score
        df["profile_completeness_score"] = df.apply(self.compute_profile_completeness, axis=1)

        # Clip severe outliers in counts to protect gradient methods, and apply log-transform to highly skewed features
        df["follower_count"] = np.log1p(np.clip(df["follower_count"], 0, 500000))
        df["following_count"] = np.log1p(np.clip(df["following_count"], 1, 50000))
        df["posts_count"] = np.log1p(np.clip(df["posts_count"], 0, 50000))
        df["posting_frequency_per_day"] = np.log1p(np.clip(df["posting_frequency_per_day"], 0.0, 500.0))
        
        # Log-transform other highly skewed numerical stats
        df["avg_likes_per_post"] = np.log1p(df["avg_likes_per_post"])
        df["avg_retweets_or_shares"] = np.log1p(df["avg_retweets_or_shares"])
        df["follower_to_following_ratio"] = np.log1p(df["follower_to_following_ratio"])

        return df

    def fit(self, X: pd.DataFrame):
        """Fits the scaler on the engineered features."""
        df_eng = self.engineer_features_df(X)
        X_feat = df_eng[self.feature_columns].values
        self.scaler.fit(X_feat)
        self.is_fitted = True
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        """Transforms dataframe into scaled numerical matrix."""
        if not self.is_fitted:
            raise ValueError("Preprocessor scaler has not been fitted.")
        df_eng = self.engineer_features_df(X)
        X_feat = df_eng[self.feature_columns].values
        return self.scaler.transform(X_feat)

    def fit_transform(self, X: pd.DataFrame) -> np.ndarray:
        """Fit and transform convenience method."""
        return self.fit(X).transform(X)

    def process_single_dict(self, record: Dict[str, Any]) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Processes a single raw account dictionary for live API inference."""
        df = pd.DataFrame([record])
        df_eng = self.engineer_features_df(df)
        raw_engineered_dict = df_eng[self.feature_columns].iloc[0].to_dict()
        scaled_vector = self.scaler.transform(df_eng[self.feature_columns].values)
        return scaled_vector, raw_engineered_dict
