"""
SocialGuard End-to-End Pipeline Orchestrator
Coordinates data generation, preprocessing, NLP feature extraction, SMOTE balancing,
multi-model training, anomaly fitting, model serialization, and explainable inference.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.model_selection import train_test_split

from backend.ml.dataset_generator import generate_socialguard_dataset, save_default_dataset
from backend.ml.nlp_engine import SocialGuardNLPEngine
from backend.ml.preprocessor import SocialGuardPreprocessor, NUMERICAL_FEATURE_COLS
from backend.ml.imbalance_handler import SocialGuardImbalanceHandler
from backend.ml.models import SocialGuardModelSuite
from backend.ml.anomaly_engine import SocialGuardAnomalyEngine

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
PIPELINE_PATH = os.path.join(MODEL_DIR, "socialguard_pipeline.joblib")

class SocialGuardPipeline:
    """
    Main orchestrator for the SocialGuard machine learning framework.
    """
    def __init__(self):
        self.preprocessor = SocialGuardPreprocessor(scaler_type="robust")
        self.nlp_engine = SocialGuardNLPEngine(max_features=40)
        self.imbalance_handler = SocialGuardImbalanceHandler(sampling_strategy=0.85)
        self.model_suite = SocialGuardModelSuite()
        self.anomaly_engine = SocialGuardAnomalyEngine(contamination=0.25)
        
        self.is_trained = False
        self.evaluation_metadata: Dict[str, Any] = {}
        self.cluster_visualization_data: Dict[str, Any] = {}
        self.dataset_sample: List[Dict[str, Any]] = []

    def train_pipeline(self, df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        """
        Executes full end-to-end training pipeline.
        """
        if df is None:
            csv_path = os.path.join(DATA_DIR, "socialguard_dataset.csv")
            if os.path.exists(csv_path):
                df = pd.read_csv(csv_path)
            else:
                csv_path = save_default_dataset(DATA_DIR)
                df = pd.read_csv(csv_path)

        print(f"[Pipeline] Loaded dataset with {len(df)} samples.")
        
        # 1. Feature Preprocessing
        print("[Pipeline] Preprocessing and engineering features...")
        self.preprocessor.fit(df)
        X_num = self.preprocessor.transform(df)
        
        # 2. NLP Engine Fitting
        print("[Pipeline] Fitting NLP text vectorizer...")
        combined_texts = (df["bio"].fillna("") + " " + df["recent_post"].fillna("")).tolist()
        self.nlp_engine.fit_tfidf(combined_texts)
        X_text = self.nlp_engine.transform_tfidf(combined_texts)

        # Concatenate numerical + TF-IDF features
        X_all = np.hstack([X_num, X_text])
        y_all = df["is_fake"].values
        archetypes = df["bot_archetype"].tolist()

        # Build feature names
        tfidf_feature_names = [f"tfidf_{w}" for w in self.nlp_engine.vectorizer.get_feature_names_out()]
        feature_names = NUMERICAL_FEATURE_COLS + tfidf_feature_names

        # 3. Stratified Train/Test Split (80/20)
        print("[Pipeline] Performing Stratified Train/Test split (80/20)...")
        X_train, X_test, y_train, y_test = train_test_split(
            X_all, y_all, test_size=0.20, random_state=42, stratify=y_all
        )

        # 4. Handle Class Imbalance with SMOTE on Training Split Only
        print("[Pipeline] Applying SMOTE oversampling to training set...")
        X_train_res, y_train_res, imbalance_stats = self.imbalance_handler.balance_training_split(X_train, y_train)

        # 5. Train & Benchmark All 6 Classification Models
        print("[Pipeline] Training and evaluating multi-model suite...")
        benchmarks = self.model_suite.train_and_evaluate_all(
            X_train_res, y_train_res, X_test, y_test, feature_names
        )

        # 6. Fit Anomaly Engine (Isolation Forest + DBSCAN + PCA)
        print("[Pipeline] Fitting Isolation Forest and DBSCAN anomaly engines...")
        self.anomaly_engine.fit(X_all)
        self.cluster_visualization_data = self.anomaly_engine.generate_cluster_visualization_data(
            X_all, y_all, archetypes, max_points=500
        )

        # Save dataset sample for frontend explorer
        sample_df = df.sample(min(150, len(df)), random_state=42)
        self.dataset_sample = sample_df.to_dict(orient="records")

        self.evaluation_metadata = {
            "dataset_total_samples": len(df),
            "genuine_count": int((y_all == 0).sum()),
            "fraudulent_count": int((y_all == 1).sum()),
            "imbalance_handling": imbalance_stats,
            "benchmarks": benchmarks,
            "feature_names": feature_names
        }

        self.is_trained = True
        self.save_pipeline()
        print("[Pipeline] Training and serialization complete!")
        return self.evaluation_metadata

    def save_pipeline(self, output_path: str = PIPELINE_PATH):
        """Serializes pipeline state to disk."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        joblib.dump(self, output_path)
        print(f"[Pipeline] Saved trained artifact to {output_path}")

    @classmethod
    def load_pipeline(cls, file_path: str = PIPELINE_PATH) -> "SocialGuardPipeline":
        """Loads serialized pipeline or trains fresh instance."""
        if os.path.exists(file_path):
            print(f"[Pipeline] Loading existing pipeline from {file_path}")
            return joblib.load(file_path)
        else:
            print("[Pipeline] No serialized pipeline found. Initializing and training new pipeline...")
            pipeline = cls()
            pipeline.train_pipeline()
            return pipeline

    def predict_account(self, account_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Full inference method for single account prediction.
        Returns:
        - Ensemble Verdict & Probability
        - Risk Level (Low, Medium, High, Critical)
        - Individual Model Predictions (all 6 models)
        - Unsupervised Anomaly Score & Flag (Isolation Forest)
        - Predicted Bot Archetype
        - Key Contributing Risk Factors & Explanations
        - Radar Feature Analysis Metrics
        """
        if not self.is_trained:
            raise ValueError("SocialGuard Pipeline must be trained before inference.")

        # Extract NLP textual features from bio + recent post
        bio = str(account_data.get("bio", ""))
        recent_post = str(account_data.get("recent_post", ""))
        text_nlp_feats = self.nlp_engine.extract_text_features(bio, recent_post)

        # Merge with input record
        merged_record = {**account_data, **text_nlp_feats}

        # Preprocess numerical vector
        X_num_single, engineered_dict = self.preprocessor.process_single_dict(merged_record)

        # Transform TF-IDF
        combined_text = f"{bio} {recent_post}".strip()
        X_text_single = self.nlp_engine.transform_tfidf([combined_text])

        # Combined feature vector
        X_vector = np.hstack([X_num_single, X_text_single])

        # 1. Multi-Model Ensemble Prediction
        ensemble_res = self.model_suite.predict_ensemble(X_vector)

        # 2. Anomaly Engine Scoring
        anomaly_res = self.anomaly_engine.score_anomaly_single(X_vector)

        # 3. Archetype Heuristic Classifier
        predicted_archetype = self._determine_archetype(engineered_dict, ensemble_res["risk_score"])

        # 4. Risk Level Categorization
        risk_score = ensemble_res["risk_score"]
        if risk_score >= 80.0:
            risk_level = "CRITICAL"
            risk_badge = "High Confidence Fake / Malicious Bot"
        elif risk_score >= 55.0:
            risk_level = "HIGH"
            risk_badge = "Likely Automated / Suspicious"
        elif risk_score >= 35.0:
            risk_level = "MEDIUM"
            risk_badge = "Borderline / Needs Verification"
        else:
            risk_level = "LOW"
            risk_badge = "Authentic / Genuine User"

        # 5. Explainable Risk Factors
        risk_factors = self._generate_explainability_factors(engineered_dict, anomaly_res, ensemble_res)

        # 6. Radar Chart Metrics (Normalized 0 - 100 for visual comparison)
        radar_metrics = {
            "Follower Ratio": min(100.0, round(float(engineered_dict.get("follower_to_following_ratio", 0) * 20), 1)),
            "Spam Lexicon": min(100.0, round(float(engineered_dict.get("spam_keyword_score", 0) * 100), 1)),
            "Posting Volume": min(100.0, round(float(engineered_dict.get("posting_frequency_per_day", 0) * 5), 1)),
            "Circadian Entropy": min(100.0, round(float(engineered_dict.get("active_hours_entropy", 0) * 25), 1)),
            "Profile Completeness": min(100.0, round(float(engineered_dict.get("profile_completeness_score", 0) * 100), 1)),
            "Anomaly Index": min(100.0, round(float(anomaly_res.get("anomaly_score", 0)), 1))
        }

        return {
            "account_username": account_data.get("username", "unknown_user"),
            "verdict": ensemble_res["ensemble_verdict"],
            "is_fake": ensemble_res["is_fake"],
            "risk_score": ensemble_res["risk_score"],
            "risk_level": risk_level,
            "risk_badge": risk_badge,
            "confidence_pct": ensemble_res["confidence_pct"],
            "predicted_archetype": predicted_archetype,
            "anomaly_analysis": anomaly_res,
            "model_breakdown": ensemble_res["model_breakdown"],
            "risk_factors": risk_factors,
            "radar_metrics": radar_metrics,
            "extracted_features": engineered_dict
        }

    def _determine_archetype(self, feat: Dict[str, Any], risk_score: float) -> str:
        """Determines most probable bot or genuine user persona archetype."""
        if risk_score < 45.0:
            if feat.get("follower_count", 0) > 10000 or feat.get("is_verified", 0) == 1:
                return "Genuine-Creator-Influencer"
            elif feat.get("posting_frequency_per_day", 0) > 0.6:
                return "Genuine-Active-User"
            else:
                return "Genuine-Casual-User"
        else:
            if feat.get("spam_keyword_score", 0) > 0.4:
                return "Crypto-Phishing-Bot"
            elif feat.get("posting_frequency_per_day", 0) > 15.0:
                return "Spam-Promoter-Bot"
            elif feat.get("following_count", 0) > 3000 and feat.get("follower_count", 0) < 150:
                return "Follower-Farm-Bot"
            elif feat.get("username_digit_count", 0) >= 4 or feat.get("repeated_text_ratio", 0) > 0.4:
                return "Automated-Content-Scraper"
            else:
                return "Impersonator-Scammer"

    def _generate_explainability_factors(self, feat: Dict[str, Any], anomaly: Dict[str, Any], ensemble: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generates human-readable explanations of why the account was flagged or cleared."""
        factors = []

        # Account age
        age = feat.get("account_age_days", 0)
        if age < 30:
            factors.append({
                "factor": "Extremely Fresh Account",
                "severity": "HIGH",
                "detail": f"Account was created only {int(age)} days ago. Bot rings frequently use newly provisioned accounts."
            })
        elif age > 700:
            factors.append({
                "factor": "Established Account History",
                "severity": "SAFE",
                "detail": f"Account age is {int(age)} days (~{int(age/365)} years), showing sustained genuine presence."
            })

        # Follower/Following ratio
        ratio = feat.get("follower_to_following_ratio", 0)
        following = feat.get("following_count", 0)
        followers = feat.get("follower_count", 0)
        if following > 2000 and followers < 100:
            factors.append({
                "factor": "Asymmetric Follow-Farm Pattern",
                "severity": "CRITICAL",
                "detail": f"Account follows {int(following)} users but only has {int(followers)} followers (Ratio: {ratio:.3f})."
            })

        # Posting frequency
        freq = feat.get("posting_frequency_per_day", 0)
        if freq > 20:
            factors.append({
                "factor": "Superhuman Posting Velocity",
                "severity": "CRITICAL",
                "detail": f"Posting {freq:.1f} posts/day exceeds typical human physiological limits, indicating script automation."
            })

        # NLP Spam keywords
        spam_score = feat.get("spam_keyword_score", 0)
        if spam_score > 0.3:
            factors.append({
                "factor": "High Spam/Phishing Lexicon Density",
                "severity": "HIGH",
                "detail": f"Text contains high concentration of known scam keywords (Airdrop/Giveaway/DM triggers)."
            })

        # Circadian entropy
        entropy = feat.get("active_hours_entropy", 0)
        if entropy < 1.5:
            factors.append({
                "factor": "Robotic Activity Uniformity",
                "severity": "MEDIUM",
                "detail": "Active hours entropy is unnaturally low, indicating automated 24/7 cron schedules without human sleep cycles."
            })

        # Isolation anomaly
        if anomaly.get("is_anomaly", False):
            factors.append({
                "factor": "Outlier Behavioral Vector (Isolation Forest)",
                "severity": "HIGH",
                "detail": f"Account feature vector deviates significantly from the normative user distribution (Score: {anomaly.get('anomaly_score', 0)})."
            })

        if not factors:
            factors.append({
                "factor": "Consistent User Behavior",
                "severity": "SAFE",
                "detail": "Profile parameters, follower ratios, and content diversity align with verified organic users."
            })

        return factors
