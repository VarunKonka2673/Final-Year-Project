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
from typing import Dict, Any, List
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from starlette.middleware.base import BaseHTTPMiddleware

from backend.ml.pipeline import SocialGuardPipeline, PIPELINE_PATH, DATA_DIR
from backend.ml.dataset_generator import generate_socialguard_dataset
from backend.ml.profile_extractor import ProfileFeatureExtractor
from backend.api.schemas import AccountInputSchema, BatchAccountInputSchema, RetrainRequestSchema

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
    "https://social-guard-7b275.web.app",
    "https://social-guard-7b275.firebaseapp.com"
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
    parses columns, performs batch prediction, and returns enriched records.
    """
    if pipeline is None or not pipeline.is_trained:
        raise HTTPException(status_code=503, detail="SocialGuard pipeline is still initializing.")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Normalize column names
        df.columns = [c.strip().lower() for c in df.columns]
        
        records = df.to_dict(orient="records")
        # Predict first 200 records max for fast interactive browser response
        records_to_process = records[:200]
        
        results = []
        fake_count = 0
        total_risk = 0.0

        for r in records_to_process:
            res = pipeline.predict_account(r)
            if res["is_fake"] == 1:
                fake_count += 1
            total_risk += res["risk_score"]
            results.append(res)

        n = len(results)
        return {
            "filename": file.filename,
            "total_records_processed": n,
            "fraudulent_count": fake_count,
            "genuine_count": n - fake_count,
            "fraud_rate_pct": round((fake_count / n) * 100, 2) if n > 0 else 0.0,
            "average_risk_score": round(total_risk / n, 2) if n > 0 else 0.0,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process CSV file: {str(e)}")

@app.get("/api/models/evaluation")
def get_models_evaluation():
    """
    Returns comparative evaluation metrics across all 6 models:
    Accuracy, Precision, Recall, F1-Score, ROC-AUC, Confusion Matrices, and Feature Importances.
    """
    if pipeline is None or not pipeline.is_trained:
        raise HTTPException(status_code=503, detail="Pipeline not ready.")
    
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
