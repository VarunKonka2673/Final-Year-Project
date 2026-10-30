"""
Sync script to push local SQLite database and project metadata directly into
Firebase Realtime Database and Firebase Authentication.
"""
import sqlite3
import json
import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "backend", "data", "socialguard.db")
SCRATCH_DIR = os.path.join(BASE_DIR, "scratch")
os.makedirs(SCRATCH_DIR, exist_ok=True)

def export_db_to_firebase_format():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Users map (keyed by sanitized email or id)
    c.execute("SELECT id, email, display_name, role, created_at FROM users")
    users_raw = [dict(r) for r in c.fetchall()]
    users_data = {}
    for u in users_raw:
        # Key by id
        users_data[u["id"]] = {
            "id": u["id"],
            "email": u["email"],
            "displayName": u["display_name"] or u["email"].split("@")[0],
            "role": u["role"],
            "createdAt": u["created_at"]
        }

    # Admins map
    c.execute("SELECT email, added_by, added_at FROM admins")
    admins_raw = [dict(r) for r in c.fetchall()]
    admins_data = {}
    for a in admins_raw:
        safe_key = a["email"].replace(".", "_dot_").replace("@", "_at_")
        admins_data[safe_key] = {
            "email": a["email"],
            "addedBy": a["added_by"],
            "addedAt": a["added_at"]
        }

    # Search History map
    c.execute("SELECT * FROM search_history")
    history_raw = [dict(r) for r in c.fetchall()]
    history_data = {}
    for h in history_raw:
        history_data[h["id"]] = {
            "id": h["id"],
            "userId": h["user_id"],
            "userEmail": h["user_email"],
            "target": h["target"],
            "scanMode": h["scan_mode"],
            "platform": h["platform"],
            "timestamp": h["timestamp"],
            "verdict": h["verdict"],
            "riskScore": h["risk_score"],
            "riskLevel": h["risk_level"],
            "isFake": bool(h["is_fake"]),
            "confidencePct": h["confidence_pct"],
            "predictedArchetype": h["predicted_archetype"]
        }

    # Feedback Records map
    c.execute("SELECT * FROM feedback_records")
    feedback_raw = [dict(r) for r in c.fetchall()]
    feedback_data = {}
    for f in feedback_raw:
        feedback_data[f["id"]] = dict(f)

    # Master structure
    payload = {
        "project_info": {
            "name": "SocialGuard AI",
            "version": "2.4.0",
            "description": "Multi-Model AI Fake Account & Fraud Detection Platform",
            "firebaseProject": "social-guard-7b275",
            "lastSynced": "2026-10-09T15:48:00Z"
        },
        "users": users_data,
        "admins": admins_data,
        "search_history": history_data,
        "feedback_records": feedback_data
    }

    conn.close()
    return payload

def main():
    print("1. Extracting relational data from local SQLite database...")
    data = export_db_to_firebase_format()
    json_path = os.path.join(SCRATCH_DIR, "firebase_sync_payload.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"   Payload generated at: {json_path}")
    print(f"   Users: {len(data['users'])}, Admins: {len(data['admins'])}, History: {len(data['search_history'])}")

    print("\n2. Pushing database tree to Firebase Realtime Database (/)...")
    res = subprocess.run(
        ["firebase.cmd", "database:set", "/", json_path, "-f", "--project", "social-guard-7b275"],
        capture_output=True,
        text=True,
        cwd=BASE_DIR
    )
    print("STDOUT:", res.stdout)
    if res.stderr:
        print("STDERR:", res.stderr)

    if res.returncode == 0:
        print("\n3. Verifying Firebase database contents via 'database:get'...")
        get_res = subprocess.run(
            ["firebase.cmd", "database:get", "/project_info", "--project", "social-guard-7b275"],
            capture_output=True,
            text=True,
            cwd=BASE_DIR
        )
        print("Realtime Database Project Info:")
        print(get_res.stdout)

if __name__ == "__main__":
    main()
