"""
SocialGuard FastAPI Application
Serves multi-model predictions, batch scoring, model evaluations,
anomaly clustering, stream simulation, and report generation.
"""

import os
import io
import json
import asyncio
import random
import time
from collections import defaultdict
from typing import Dict, Any, List, Optional
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse, FileResponse
from starlette.middleware.base import BaseHTTPMiddleware

from backend.ml.pipeline import SocialGuardPipeline, PIPELINE_PATH, DATA_DIR
from backend.ml.dataset_generator import generate_socialguard_dataset
from backend.ml.profile_extractor import ProfileFeatureExtractor
from backend.api.schemas import (
    AccountInputSchema,
    BatchAccountInputSchema,
    RetrainRequestSchema,
    FeedbackSubmissionSchema,
    HistoryItemSchema,
    RegisterRequestSchema,
    LoginRequestSchema,
    GoogleAuthRequestSchema,
    AddAdminRequestSchema
)
from backend.ml.preprocessor import DEFAULT_VALUES
import backend.api.db as relational_db

app = FastAPI(
    title="SocialGuard API",
    description="Hybrid ML + NLP Framework for Detecting Fraudulent Social Media Accounts",
    version="1.0.0"
)

# Custom IP-based Rate Limiter Middleware
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = 60, window: int = 60):
        super().__init__(app)
        self.limit = limit
        self.window = window
        self.requests = defaultdict(list)

    async def dispatch(self, request, call_next):
        if request.url.path.startswith("/api/"):
            client_ip = request.client.host if request.client else "unknown"
            now = time.time()
            # Clean old logs
            self.requests[client_ip] = [t for t in self.requests[client_ip] if now - t < self.window]
            
            if len(self.requests[client_ip]) >= self.limit:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Rate limit exceeded (60 req/min). Please try again later."}
                )
            self.requests[client_ip].append(now)
        return await call_next(request)

# Custom HTTP Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(RateLimitMiddleware, limit=60, window=60)
app.add_middleware(SecurityHeadersMiddleware)

# Enable CORS for local development and production Firebase deployment
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://social-guard-7b275.web.app"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global pipeline instance
pipeline: SocialGuardPipeline = None

@app.on_event("startup")
def load_or_train_pipeline():
    global pipeline
    print("[API Startup] Loading SocialGuard pipeline...")
    pipeline = SocialGuardPipeline.load_pipeline(PIPELINE_PATH)
    print("[API Startup] SocialGuard pipeline ready for inference.")

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "SocialGuard API",
        "version": "1.0.0",
        "best_model": pipeline.model_suite.best_model_name if pipeline else "N/A"
    }

@app.post("/api/predict")
def predict_single_account(account: AccountInputSchema):
    """
    Classifies a single social media account profile.
    Returns real/fake verdict, ensemble confidence, risk score (0-100),
    individual model predictions, anomaly flags, and contributing risk factors.
    """
    if pipeline is None or not pipeline.is_trained:
        raise HTTPException(status_code=503, detail="SocialGuard pipeline is still initializing.")
    
    try:
        input_dict = account.model_dump()
        result = pipeline.predict_account(input_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/api/predict/profile-link")
async def predict_profile_link(payload: Dict[str, str]):
    """
    Parses a social media profile link, extracts/generates features using ML
    heuristics/scraping, and evaluates it through the SocialGuard pipeline.
    """
    url = payload.get("profile_url", "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="Profile URL is required.")
    
    if pipeline is None or not pipeline.is_trained:
        raise HTTPException(status_code=503, detail="SocialGuard pipeline is still initializing.")
    
    try:
        extractor = ProfileFeatureExtractor()
        extracted_data = await extractor.extract_features_from_url(url)
        
        result = pipeline.predict_account(extracted_data)
        result["platform"] = extracted_data["platform"]
        result["profile_url"] = url
        result["extracted_username"] = extracted_data["username"]
        result["raw_extracted_features"] = extracted_data

        # Automatically archive extracted profile details for model retraining
        try:
            from backend.ml.data_collector import save_collected_profile
            save_collected_profile(
                extracted_data=extracted_data,
                is_fake=result.get("is_fake", 0),
                bot_archetype=result.get("predicted_archetype")
            )
        except Exception as col_err:
            print(f"[API] Data collector note: {col_err}")

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze profile link: {str(e)}")

@app.post("/api/predict/batch")
def predict_batch_accounts(batch: BatchAccountInputSchema):
    """
    Classifies a batch list of social media accounts.
    Returns per-account predictions and aggregate risk distribution metrics.
    """
    if pipeline is None or not pipeline.is_trained:
        raise HTTPException(status_code=503, detail="SocialGuard pipeline is still initializing.")
    
    results = []
    fake_count = 0
    total_risk = 0.0

    for acc in batch.accounts:
        res = pipeline.predict_account(acc.model_dump())
        if res["is_fake"] == 1:
            fake_count += 1
        total_risk += res["risk_score"]
        results.append(res)

    n = len(results)
    avg_risk = round(total_risk / n, 2) if n > 0 else 0.0
    fraud_rate = round((fake_count / n) * 100, 2) if n > 0 else 0.0

    return {
        "total_analyzed": n,
        "fraudulent_detected": fake_count,
        "genuine_detected": n - fake_count,
        "fraud_rate_pct": fraud_rate,
        "average_risk_score": avg_risk,
        "predictions": results
    }

@app.post("/api/predict/upload-csv")
async def upload_csv_and_predict(file: UploadFile = File(...)):
    """
    Uploads a CSV dataset file (e.g. from Kaggle/Twitter/Instagram),
    parses columns, performs batch prediction, appends new rows to dataset.csv,
    and automatically retrains the SocialGuard models.
    """
    global pipeline
    if pipeline is None or not pipeline.is_trained:
        raise HTTPException(status_code=503, detail="SocialGuard pipeline is still initializing.")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Normalize column names
        df.columns = [c.strip().lower() for c in df.columns]
        
        records = df.to_dict(orient="records")
        
        results = []
        fake_count = 0
        total_risk = 0.0

        aligned_rows = []
        for index, r in enumerate(records):
            # 1. Predict record to get is_fake label if not already present
            res = pipeline.predict_account(r)
            
            # Keep predictions for the frontend response (limit to 200)
            if index < 200:
                if res["is_fake"] == 1:
                    fake_count += 1
                total_risk += res["risk_score"]
                results.append(res)
            
            # 2. Align record to dataset.csv schema for retraining
            aligned_row = {}
            is_fake = int(r.get("is_fake", res["is_fake"]))
            aligned_row["is_fake"] = is_fake
            aligned_row["account_id"] = r.get("account_id", f"UPLOAD_{int(time.time())}_{index}")
            aligned_row["full_name"] = r.get("full_name", r.get("username", f"User {index}"))
            aligned_row["bot_archetype"] = r.get("bot_archetype", "Uploaded-Bot" if is_fake == 1 else "Uploaded-Genuine")
            
            # Fill default values for all standard preprocessed features
            for col, def_val in DEFAULT_VALUES.items():
                aligned_row[col] = r.get(col, def_val)
                
            # Calculated ratios
            fol = float(aligned_row.get("follower_count", 0))
            folg = float(aligned_row.get("following_count", 1))
            aligned_row["follower_to_following_ratio"] = round((fol + 1.0) / (folg + 1.0), 3)
            
            aligned_rows.append(aligned_row)

        n = len(results)
        df_uploaded = pd.DataFrame(aligned_rows)
        
        # Load existing dataset and append
        csv_path = os.path.join(DATA_DIR, "socialguard_dataset.csv")
        if os.path.exists(csv_path):
            df_existing = pd.read_csv(csv_path)
            df_merged = pd.concat([df_existing, df_uploaded], ignore_index=True)
        else:
            df_merged = df_uploaded
            
        # Save updated dataset
        df_merged.to_csv(csv_path, index=False)
        
        # Trigger dynamic auto-retraining on the updated dataset
        print(f"[API] Auto-retraining SocialGuard pipeline with {len(df_merged)} total records...")
        new_pipeline = SocialGuardPipeline()
        new_pipeline.train_pipeline(df_merged)
        pipeline = new_pipeline
        
        return {
            "filename": file.filename,
            "total_records_processed": n,
            "fraudulent_count": fake_count,
            "genuine_count": n - fake_count,
            "fraud_rate_pct": round((fake_count / n) * 100, 2) if n > 0 else 0.0,
            "average_risk_score": round(total_risk / n, 2) if n > 0 else 0.0,
            "results": results,
            "stored_and_retrained": True,
            "new_dataset_size": len(df_merged),
            "updated_best_model": pipeline.model_suite.best_model_name
        }
    except Exception as e:
        print(f"Failed to process and retrain: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to process CSV file and retrain: {str(e)}")

@app.get("/api/models/evaluation")
def get_models_evaluation(retrain: bool = False):
    """
    Returns comparative evaluation metrics across all 6 models.
    If `retrain` is true (or the pipeline is not yet trained), a fresh pipeline
    is trained on a synthetic dataset and the latest evaluation metadata is
    returned. This ensures the live service reflects actual computed values
    rather than a static artifact.
    """
    global pipeline
    # Retrain on demand or if no trained pipeline exists.
    if pipeline is None or not pipeline.is_trained or retrain:
        # Generate a modest synthetic dataset (500 samples, 5% fraud).
        df_new = generate_socialguard_dataset(num_samples=500, fake_ratio=0.05)
        pipeline = SocialGuardPipeline()
        # Use the same SMOTE ratio that the retrain endpoint expects.
        pipeline.imbalance_handler.sampling_strategy = 0.5
        pipeline.train_pipeline(df_new)
    return pipeline.evaluation_metadata

@app.get("/api/anomalies/clusters")
def get_anomaly_clusters():
    """
    Returns 2D PCA cluster coordinates, Isolation Forest anomaly boundaries,
    and DBSCAN coordinated bot ring groups for interactive graph rendering.
    """
    if pipeline is None or not pipeline.is_trained:
        raise HTTPException(status_code=503, detail="Pipeline not ready.")
    
    return pipeline.cluster_visualization_data

@app.get("/api/dataset/sample")
def get_dataset_sample():
    """
    Returns sample dataset rows and feature statistics for the Dataset Explorer.
    """
    if pipeline is None or not pipeline.is_trained:
        raise HTTPException(status_code=503, detail="Pipeline not ready.")
    
    return {
        "sample_count": len(pipeline.dataset_sample),
        "total_dataset_size": pipeline.evaluation_metadata.get("dataset_total_samples", 6000),
        "records": pipeline.dataset_sample
    }

@app.post("/api/retrain")
def retrain_pipeline(req: RetrainRequestSchema):
    """
    Triggers dynamic retraining with new synthetic dataset generation and SMOTE settings.
    """
    global pipeline
    try:
        df_new = generate_socialguard_dataset(
            num_samples=req.num_samples,
            fake_ratio=req.fake_ratio
        )
        pipeline = SocialGuardPipeline()
        pipeline.imbalance_handler.sampling_strategy = req.smote_ratio
        eval_meta = pipeline.train_pipeline(df_new)
        return {
            "status": "success",
            "message": "SocialGuard pipeline successfully retrained and updated.",
            "evaluation": eval_meta
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")

@app.get("/api/stream/simulate-tick")
def simulate_stream_tick():
    """
    Returns a single randomly generated social media account stream event with instant classification.
    Used by polling or live monitor widgets.
    """
    is_fake_target = random.random() < 0.32
    df_sample = generate_socialguard_dataset(num_samples=4, fake_ratio=1.0 if is_fake_target else 0.0)
    raw_acc = df_sample.iloc[0].to_dict()
    
    result = pipeline.predict_account(raw_acc)
    return {
        "timestamp": pd.Timestamp.now().isoformat(),
        "stream_id": f"STREAM_{random.randint(100000, 999999)}",
        "account_data": raw_acc,
        "prediction": result
    }

@app.get("/api/collector/profiles")
def get_collected_extractor_profiles():
    """
    Returns all archived profile telemetry collected via extractor and live links.
    """
    from backend.ml.data_collector import get_all_collected_profiles
    profiles = get_all_collected_profiles()
    return {
        "status": "online",
        "total_collected": len(profiles),
        "profiles": profiles
    }

@app.get("/api/collector/download")
def download_collected_profiles_csv():
    """
    Downloads the collected_profiles.csv dataset containing all archived
    social profile extractions.
    """
    from backend.ml.data_collector import COLLECTED_CSV_PATH
    if not os.path.exists(COLLECTED_CSV_PATH):
        raise HTTPException(status_code=404, detail="No collected profiles file found yet.")
    return FileResponse(
        path=COLLECTED_CSV_PATH,
        filename="collected_profiles.csv",
        media_type="text/csv"
    )

@app.post("/api/collector/collect")
def collect_profile_manually(payload: Dict[str, Any]):
    """
    Explicitly archives an extracted profile dictionary with optional user-supervised ground-truth label.
    """
    from backend.ml.data_collector import save_collected_profile
    profile_data = payload.get("profile_data", payload)
    is_fake = payload.get("is_fake")
    archetype = payload.get("bot_archetype")
    res = save_collected_profile(profile_data, is_fake=is_fake, bot_archetype=archetype)
    return res

@app.post("/api/collector/retrain")
def retrain_with_collected_profiles():
    """
    Retrains the SocialGuard pipeline incorporating all collected extractor profiles.
    Serializes the updated models and updates the live inference pipeline.
    """
    global pipeline
    from backend.ml.data_collector import retrain_pipeline_with_collected_data
    try:
        res = retrain_pipeline_with_collected_data()
        pipeline = SocialGuardPipeline.load_pipeline(PIPELINE_PATH)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")

@app.websocket("/ws/live-stream")
async def websocket_live_stream(websocket: WebSocket):
    """
    WebSocket endpoint broadcasting real-time incoming accounts and live fraud alerts.
    """
    await websocket.accept()
    print("[WebSocket] Client connected to live monitoring stream.")
    try:
        while True:
            is_fake_target = random.random() < 0.35
            df_sample = generate_socialguard_dataset(num_samples=2, fake_ratio=1.0 if is_fake_target else 0.0)
            raw_acc = df_sample.iloc[0].to_dict()
            result = pipeline.predict_account(raw_acc)
            
            payload = {
                "timestamp": pd.Timestamp.now().isoformat(),
                "stream_id": f"STREAM_{random.randint(10000, 99999)}",
                "account": raw_acc,
                "prediction": result
            }
            await websocket.send_json(payload)
            await asyncio.sleep(2.0) # Send tick every 2 seconds
    except WebSocketDisconnect:
        print("[WebSocket] Client disconnected from live stream.")
    except Exception as e:
        print(f"[WebSocket Error] {e}")

@app.get("/api/report/export")
def export_project_report(format: str = "markdown"):
    """
    Generates downloadable IEEE-structured final evaluation and summary report.
    Reads and serves the comprehensive IEEE_SocialGuard_Paper.md from the docs directory.
    """
    try:
        # Resolve absolute path to docs/IEEE_SocialGuard_Paper.md
        base_dir = os.path.dirname(os.path.abspath(__file__))
        paper_path = os.path.normpath(os.path.join(base_dir, "..", "..", "docs", "IEEE_SocialGuard_Paper.md"))
        
        if os.path.exists(paper_path):
            with open(paper_path, "r", encoding="utf-8") as f:
                content = f.read()
            return PlainTextResponse(content=content, media_type="text/markdown")
        else:
            raise FileNotFoundError()
    except Exception:
        # Fallback dynamic basic report if file not found
        benchmarks = pipeline.evaluation_metadata.get("benchmarks", {}) if pipeline else {}
        models_comp = benchmarks.get("models_comparison", [])
        
        markdown_report = f"# SocialGuard Project Summary Report\n"
        markdown_report += "**Hybrid ML + NLP Framework for Detecting Fraudulent Social Media Accounts**\n\n"
        markdown_report += "## 1. Executive Summary\n"
        markdown_report += f"- **Total Dataset Size**: {pipeline.evaluation_metadata.get('dataset_total_samples', 6000) if pipeline else 6000} samples\n"
        markdown_report += "## 2. Model Performance Benchmarks\n"
        for m in models_comp:
            markdown_report += f"- {m['model_name']}: Accuracy {m['accuracy']}%, F1-Score {m['f1_score']}%\n"
            
        return PlainTextResponse(content=markdown_report, media_type="text/markdown")

# ---------------------------------------------------------------------------
# Feedback, User History & Link-Based Retraining Subsystem
# ---------------------------------------------------------------------------
HISTORY_FILE = os.path.join(DATA_DIR, "user_history.json")
FEEDBACK_FILE = os.path.join(DATA_DIR, "user_feedback.json")
ADMIN_EMAILS = ["varunkonka2673@gmail.com"]

def load_json_records(filepath: str) -> List[Dict[str, Any]]:
    if not os.path.exists(filepath):
        return []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[Storage] Error reading {filepath}: {e}")
        return []

def save_json_records(filepath: str, records: List[Dict[str, Any]]):
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2)
    except Exception as e:
        print(f"[Storage] Error writing {filepath}: {e}")

def align_and_append_to_dataset(record: Dict[str, Any], is_fake_label: int, archetype_label: str) -> int:
    """
    Appends a verified profile or link feature vector to socialguard_dataset.csv
    and enables live retraining with ground-truth user feedback and links.
    """
    csv_path = os.path.join(DATA_DIR, "socialguard_dataset.csv")
    aligned_row = {}
    aligned_row["account_id"] = record.get("account_id") or f"FEEDBACK_{int(time.time())}_{random.randint(100, 999)}"
    aligned_row["username"] = record.get("username", "verified_user")
    aligned_row["full_name"] = record.get("full_name") or record.get("display_name") or aligned_row["username"]
    aligned_row["bio"] = record.get("bio", "")
    aligned_row["recent_post"] = record.get("recent_post") or record.get("headline", "")
    aligned_row["has_profile_pic"] = int(record.get("has_profile_pic", 1))
    aligned_row["is_verified"] = int(record.get("is_verified", 0))
    aligned_row["account_age_days"] = float(record.get("account_age_days", 365.0))
    
    fol = float(record.get("follower_count") or record.get("followers", 100.0))
    folg = float(record.get("following_count") or record.get("following", 100.0))
    aligned_row["follower_count"] = fol
    aligned_row["following_count"] = folg
    aligned_row["posts_count"] = float(record.get("posts_count") or record.get("media_count", 50.0))
    aligned_row["follower_to_following_ratio"] = round((fol + 1.0) / (folg + 1.0), 3)
    aligned_row["has_url"] = int(record.get("has_url", 1 if record.get("profile_url") else 0))
    aligned_row["has_contact_info"] = int(record.get("has_contact_info", 0))
    aligned_row["posting_frequency_per_day"] = float(record.get("posting_frequency_per_day", 1.0))
    aligned_row["avg_engagement_rate"] = float(record.get("avg_engagement_rate", 2.5))
    aligned_row["avg_likes_per_post"] = float(record.get("avg_likes_per_post", 10.0))
    aligned_row["avg_retweets_or_shares"] = float(record.get("avg_retweets_or_shares", 2.0))
    aligned_row["like_to_share_ratio"] = float(record.get("like_to_share_ratio", 5.0))
    aligned_row["mention_count_avg"] = float(record.get("mention_count_avg", 0.5))
    aligned_row["hashtag_count_avg"] = float(record.get("hashtag_count_avg", 1.0))
    aligned_row["url_in_post_ratio"] = float(record.get("url_in_post_ratio", 0.1))
    aligned_row["active_hours_entropy"] = float(record.get("active_hours_entropy", 2.5))
    aligned_row["spam_keyword_score"] = float(record.get("spam_keyword_score", 0.8 if is_fake_label == 1 else 0.05))
    aligned_row["sentiment_polarity"] = float(record.get("sentiment_polarity", 0.1))
    aligned_row["lexical_diversity"] = float(record.get("lexical_diversity", 0.6))
    aligned_row["repeated_text_ratio"] = float(record.get("repeated_text_ratio", 0.1))
    aligned_row["uppercase_ratio"] = float(record.get("uppercase_ratio", 0.05))
    aligned_row["bot_archetype"] = archetype_label
    aligned_row["is_fake"] = int(is_fake_label)

    # Fill default values for any missing features
    for col, def_val in DEFAULT_VALUES.items():
        if col not in aligned_row:
            aligned_row[col] = record.get(col, def_val)

    df_new_row = pd.DataFrame([aligned_row])
    if os.path.exists(csv_path):
        df_curr = pd.read_csv(csv_path)
        df_merged = pd.concat([df_curr, df_new_row], ignore_index=True)
    else:
        df_merged = df_new_row
        
    df_merged.to_csv(csv_path, index=False)
    return len(df_merged)


@app.post("/api/feedback/submit")
def submit_prediction_feedback(feedback: FeedbackSubmissionSchema):
    """
    Stores user feedback on whether a prediction was correct or not for malicious/genuine IDs.
    Appends the verified account/link features into the dataset and optionally retrains models.
    """
    global pipeline
    try:
        feedback_dict = feedback.model_dump()
        feedback_dict["id"] = f"FB_{int(time.time())}_{random.randint(1000, 9999)}"
        feedback_dict["created_at"] = pd.Timestamp.now().isoformat()

        # 1. Save to user feedback audit list
        all_feedback = load_json_records(FEEDBACK_FILE)
        all_feedback.insert(0, feedback_dict)
        save_json_records(FEEDBACK_FILE, all_feedback)

        # 2. Extract profile attributes & append to dataset with ground truth label
        features = feedback.features or {}
        features["username"] = feedback.username
        if feedback.profile_url:
            features["profile_url"] = feedback.profile_url
        if feedback.platform:
            features["platform"] = feedback.platform

        verified_label = feedback.user_verified_fake
        archetype = (
            "User-Verified-Malicious" if verified_label == 1 else "User-Verified-Genuine"
        )
        if feedback.feedback_notes:
            features["bio"] = features.get("bio", "") + f" [{feedback.feedback_notes}]"

        new_dataset_size = align_and_append_to_dataset(features, verified_label, archetype)

        retrained = False
        retrain_meta = None

        # 3. Dynamic Retraining on new link / verified feedback
        if feedback.auto_retrain:
            print(f"[API Retrain] Retraining SocialGuard pipeline with {new_dataset_size} records including user feedback...")
            csv_path = os.path.join(DATA_DIR, "socialguard_dataset.csv")
            df_updated = pd.read_csv(csv_path)
            new_pipeline = SocialGuardPipeline()
            retrain_meta = new_pipeline.train_pipeline(df_updated)
            pipeline = new_pipeline
            retrained = True

        return {
            "status": "success",
            "message": "Feedback registered and training dataset updated successfully.",
            "feedback_id": feedback_dict["id"],
            "dataset_size": new_dataset_size,
            "retrained": retrained,
            "best_model": pipeline.model_suite.best_model_name if pipeline else "N/A",
            "evaluation": retrain_meta
        }
    except Exception as e:
        print(f"[API Feedback Error] {e}")
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {str(e)}")


@app.get("/api/feedback/list")
def list_feedback(user_email: Optional[str] = None):
    """
    Returns verified feedback entries. Admins get all records; normal users get their submissions.
    """
    all_feedback = load_json_records(FEEDBACK_FILE)
    if user_email and user_email.lower() not in [e.lower() for e in ADMIN_EMAILS]:
        filtered = [f for f in all_feedback if f.get("user_email", "").lower() == user_email.lower()]
        return {"total": len(filtered), "feedback": filtered}
    
    total = len(all_feedback)
    correct_count = sum(1 for f in all_feedback if f.get("is_correct") is True)
    return {
        "total": total,
        "correct_predictions": correct_count,
        "accuracy_rate": round((correct_count / total) * 100, 2) if total > 0 else 100.0,
        "feedback": all_feedback
    }


@app.post("/api/feedback/retrain")
def retrain_from_feedback():
    """
    Triggers a full pipeline retraining incorporating all verified feedback links & dataset records.
    """
    global pipeline
    try:
        csv_path = os.path.join(DATA_DIR, "socialguard_dataset.csv")
        if not os.path.exists(csv_path):
            raise HTTPException(status_code=404, detail="Dataset CSV not found.")
        
        df_updated = pd.read_csv(csv_path)
        print(f"[API] Retraining SocialGuard with {len(df_updated)} records...")
        new_pipeline = SocialGuardPipeline()
        eval_meta = new_pipeline.train_pipeline(df_updated)
        pipeline = new_pipeline
        return {
            "status": "success",
            "message": "SocialGuard pipeline successfully retrained on updated dataset!",
            "dataset_size": len(df_updated),
            "best_model": pipeline.model_suite.best_model_name,
            "evaluation": eval_meta
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")


@app.post("/api/history/save")
def save_search_history(item: HistoryItemSchema):
    """
    Saves a user search / prediction record in persistent relational database and JSON fallback.
    """
    try:
        data = item.model_dump()
        if not data.get("id"):
            data["id"] = f"HIST_{int(time.time())}_{random.randint(1000, 9999)}"
        
        # 1. Save to Relational SQLite DB
        relational_db.db_save_search_history(data)

        # 2. Save to JSON backup file
        records = load_json_records(HISTORY_FILE)
        records.insert(0, data)
        if len(records) > 500:
            records = records[:500]
        save_json_records(HISTORY_FILE, records)

        return {"status": "success", "id": data["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save history: {str(e)}")


@app.get("/api/history/list")
def get_user_search_history(user_email: Optional[str] = None, user_id: Optional[str] = None):
    """
    RBAC Protected: Normal user can ONLY see history of what he has searched.
    Admin (varunkonka2673@gmail.com and added admins) can see all search history.
    """
    is_admin = relational_db.is_email_admin(user_email)

    try:
        # Fetch from relational database
        db_records = relational_db.db_get_search_history(user_email, user_id)
        if db_records:
            return {
                "role": "admin" if is_admin else "user",
                "total": len(db_records),
                "records": db_records
            }
    except Exception as e:
        print(f"[History DB Fallback] {e}")

    # Fallback to JSON records
    records = load_json_records(HISTORY_FILE)
    if is_admin:
        return {
            "role": "admin",
            "total": len(records),
            "records": records
        }
    
    filtered = [
        r for r in records
        if (user_email and r.get("user_email", "").lower() == user_email.lower()) or
           (user_id and r.get("user_id") == user_id)
    ]
    return {
        "role": "user",
        "total": len(filtered),
        "records": filtered
    }


@app.delete("/api/history/item/{item_id}")
def delete_history_item(item_id: str, user_email: Optional[str] = None):
    """
    Deletes a single history record (admin or owner).
    """
    is_admin = relational_db.is_email_admin(user_email)
    relational_db.db_delete_history_item(item_id, user_email)

    records = load_json_records(HISTORY_FILE)
    new_records = []
    deleted = False
    for r in records:
        if r.get("id") == item_id:
            if is_admin or (user_email and r.get("user_email", "").lower() == user_email.lower()):
                deleted = True
                continue
        new_records.append(r)
        
    save_json_records(HISTORY_FILE, new_records)
    return {"status": "success", "deleted": True}


@app.delete("/api/history/clear")
def clear_search_history(user_email: Optional[str] = None):
    """
    Clears history for the requesting user (or all if admin).
    """
    is_admin = relational_db.is_email_admin(user_email)
    relational_db.db_clear_history(user_email)

    if is_admin:
        save_json_records(HISTORY_FILE, [])
        return {"status": "success", "message": "All history cleared by admin."}
    
    if user_email:
        records = load_json_records(HISTORY_FILE)
        new_records = [r for r in records if r.get("user_email", "").lower() != user_email.lower()]
        save_json_records(HISTORY_FILE, new_records)
        return {"status": "success", "message": "User history cleared."}
        
    return {"status": "error", "message": "User email required."}


# ---------------------------------------------------------------------------
# RBAC & User Management Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/auth/register")
def api_register(req: RegisterRequestSchema):
    """
    Registers a normal user. Only creates role 'user'. Nobody can register as admin.
    """
    try:
        user = relational_db.register_user(req.email, req.password, req.display_name)
        return {"status": "success", "user": user}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@app.post("/api/auth/login")
def api_login(req: LoginRequestSchema):
    """
    Authenticates user or admin with email and password.
    Default Admin: varunkonka2673@gmail.com / Admin@123
    """
    user = relational_db.authenticate_user(req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return {"status": "success", "user": user}


@app.post("/api/auth/google")
def api_google_auth(req: GoogleAuthRequestSchema):
    """
    Authenticates or creates Google OAuth user. Admin status assigned if in admins table.
    """
    try:
        user = relational_db.authenticate_or_create_google_user(req.email, req.displayName, req.uid)
        return {"status": "success", "user": user}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google authentication failed: {str(e)}")


@app.get("/api/auth/admins")
def api_get_admins(user_email: str):
    """
    Returns list of authorized admins. Restricted to admins only.
    """
    if not relational_db.is_email_admin(user_email):
        raise HTTPException(status_code=403, detail="Admin privileges required to view admin list.")
    admins = relational_db.get_all_admins()
    return {"admins": admins, "default_admin": relational_db.DEFAULT_ADMIN_EMAIL}


@app.post("/api/auth/admins/add")
def api_add_admin(req: AddAdminRequestSchema):
    """
    Allows an existing admin to grant admin privileges to another email.
    """
    if not relational_db.is_email_admin(req.requestor_email):
        raise HTTPException(status_code=403, detail="Only an existing admin can grant admin access.")
    if not req.admin_email or "@" not in req.admin_email:
        raise HTTPException(status_code=400, detail="Invalid email address.")

    relational_db.add_new_admin(req.admin_email, req.requestor_email)
    admins = relational_db.get_all_admins()
    return {
        "status": "success",
        "message": f"Admin clearance granted to {req.admin_email}",
        "admins": admins
    }


@app.delete("/api/auth/admins/remove")
def api_remove_admin(admin_email: str, requestor_email: str):
    """
    Allows an admin to revoke admin clearance (protects default admin).
    """
    if not relational_db.is_email_admin(requestor_email):
        raise HTTPException(status_code=403, detail="Only an existing admin can revoke admin access.")
    if admin_email.strip().lower() == relational_db.DEFAULT_ADMIN_EMAIL.lower():
        raise HTTPException(status_code=400, detail="The default master admin cannot be removed.")

    success = relational_db.remove_admin(admin_email)
    admins = relational_db.get_all_admins()
    return {
        "status": "success",
        "message": f"Admin clearance revoked for {admin_email}",
        "admins": admins
    }


