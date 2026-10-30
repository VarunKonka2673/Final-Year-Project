"""
SocialGuard Relational Database Manager (SQLite)
Manages persistent relational tables for Users, Admins, Scan Search History, and Model Feedback.
Automatically seeds the default Admin (varunkonka2673@gmail.com / Admin@123).
"""

import os
import sqlite3
import hashlib
import json
import time
from typing import Dict, Any, List, Optional

DB_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
DB_PATH = os.path.join(DB_DIR, "socialguard.db")
DEFAULT_ADMIN_EMAIL = "varunkonka2673@gmail.com"
DEFAULT_ADMIN_PASSWORD = "Admin@123"

def hash_password(password: str) -> str:
    """Hash password using SHA-256 with salt."""
    salt = "socialguard_rbac_salt_2026"
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()

def get_db_connection():
    """Returns a connection with dictionary row access."""
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes tables and ensures default admin exists."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        display_name TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT NOT NULL
    )
    """)

    # 2. Admins table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS admins (
        email TEXT PRIMARY KEY,
        added_by TEXT NOT NULL,
        added_at TEXT NOT NULL
    )
    """)

    # 3. Search History table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS search_history (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        user_email TEXT,
        user_display_name TEXT,
        target TEXT,
        scan_mode TEXT,
        platform TEXT,
        timestamp TEXT,
        verdict TEXT,
        risk_score REAL,
        risk_level TEXT,
        is_fake INTEGER,
        confidence_pct REAL,
        predicted_archetype TEXT,
        profile_url TEXT,
        feedback_json TEXT,
        extracted_features_json TEXT,
        raw_result_json TEXT
    )
    """)

    # 4. Verified Feedback table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS feedback_records (
        id TEXT PRIMARY KEY,
        history_id TEXT,
        username TEXT,
        profile_url TEXT,
        platform TEXT,
        model_predicted_fake INTEGER,
        user_verified_fake INTEGER,
        is_correct INTEGER,
        feedback_notes TEXT,
        user_email TEXT,
        created_at TEXT
    )
    """)

    # Seed Default Admin if not already present
    admin_hash = hash_password(DEFAULT_ADMIN_PASSWORD)
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    cursor.execute("SELECT email FROM admins WHERE email = ?", (DEFAULT_ADMIN_EMAIL.lower(),))
    if not cursor.fetchone():
        cursor.execute("INSERT INTO admins (email, added_by, added_at) VALUES (?, ?, ?)",
                       (DEFAULT_ADMIN_EMAIL.lower(), "system_default", now))

    cursor.execute("SELECT id FROM users WHERE email = ?", (DEFAULT_ADMIN_EMAIL.lower(),))
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO users (id, email, password_hash, display_name, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            "admin_default_varun",
            DEFAULT_ADMIN_EMAIL.lower(),
            admin_hash,
            "Varun Konka (Admin)",
            "admin",
            now
        ))
    else:
        # Ensure role is admin
        cursor.execute("UPDATE users SET role = 'admin', password_hash = ? WHERE email = ?",
                       (admin_hash, DEFAULT_ADMIN_EMAIL.lower()))

    conn.commit()
    conn.close()
    print(f"[Database] Relational SQLite database initialized at {DB_PATH}. Default admin active: {DEFAULT_ADMIN_EMAIL}")

# Run init on module load
init_db()

# ---------------------------------------------------------------------------
# Helper Query Methods
# ---------------------------------------------------------------------------

def is_email_admin(email: str) -> bool:
    if not email:
        return False
    email_clean = email.strip().lower()
    if email_clean == DEFAULT_ADMIN_EMAIL.lower():
        return True
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT email FROM admins WHERE LOWER(email) = ?", (email_clean,))
    row = cursor.fetchone()
    conn.close()
    return bool(row)

def get_all_admins() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT email, added_by, added_at FROM admins ORDER BY added_at ASC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def add_new_admin(new_admin_email: str, added_by_email: str) -> bool:
    new_clean = new_admin_email.strip().lower()
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO admins (email, added_by, added_at) VALUES (?, ?, ?)",
                   (new_clean, added_by_email.lower(), now))
    # Update user role if user already exists
    cursor.execute("UPDATE users SET role = 'admin' WHERE LOWER(email) = ?", (new_clean,))
    conn.commit()
    conn.close()
    return True

def remove_admin(admin_email: str) -> bool:
    clean = admin_email.strip().lower()
    if clean == DEFAULT_ADMIN_EMAIL.lower():
        return False  # Protected primary admin
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM admins WHERE LOWER(email) = ?", (clean,))
    cursor.execute("UPDATE users SET role = 'user' WHERE LOWER(email) = ?", (clean,))
    conn.commit()
    conn.close()
    return True

def register_user(email: str, password: str, display_name: str = "") -> Dict[str, Any]:
    email_clean = email.strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email_clean,))
    if cursor.fetchone():
        conn.close()
        raise ValueError("An account with this email already exists. Please sign in.")

    # Rule: Normal registration ALWAYS creates role 'user'
    # Even if they try to enter varunkonka2673@gmail.com, default admin is already registered!
    role = 'admin' if is_email_admin(email_clean) else 'user'
    user_id = f"usr_{int(time.time())}_{hashlib.md5(email_clean.encode()).hexdigest()[:6]}"
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    pwd_hash = hash_password(password)

    cursor.execute("""
    INSERT INTO users (id, email, password_hash, display_name, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, email_clean, pwd_hash, display_name or email_clean.split('@')[0], role, now))
    conn.commit()
    conn.close()

    return {
        "uid": user_id,
        "email": email_clean,
        "displayName": display_name or email_clean.split('@')[0],
        "role": role
    }

def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    email_clean = email.strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check Default Admin first
    if email_clean == DEFAULT_ADMIN_EMAIL.lower() and password == DEFAULT_ADMIN_PASSWORD:
        conn.close()
        return {
            "uid": "admin_default_varun",
            "email": DEFAULT_ADMIN_EMAIL,
            "displayName": "Varun Konka (Admin)",
            "role": "admin"
        }

    pwd_hash = hash_password(password)
    cursor.execute("SELECT id, email, display_name, role, password_hash FROM users WHERE LOWER(email) = ?", (email_clean,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return None

    if user["password_hash"] == pwd_hash:
        current_role = 'admin' if is_email_admin(email_clean) else user["role"]
        return {
            "uid": user["id"],
            "email": user["email"],
            "displayName": user["display_name"],
            "role": current_role
        }
    return None

def authenticate_or_create_google_user(email: str, display_name: str, uid: str) -> Dict[str, Any]:
    email_clean = email.strip().lower()
    role = 'admin' if is_email_admin(email_clean) else 'user'
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, display_name, role FROM users WHERE LOWER(email) = ?", (email_clean,))
    existing = cursor.fetchone()

    if existing:
        current_role = 'admin' if is_email_admin(email_clean) else existing["role"]
        conn.close()
        return {
            "uid": existing["id"],
            "email": existing["email"],
            "displayName": existing["display_name"] or display_name,
            "role": current_role
        }

    # Register new Google user
    user_id = uid or f"usr_g_{int(time.time())}"
    cursor.execute("""
    INSERT INTO users (id, email, password_hash, display_name, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, email_clean, "GOOGLE_AUTH", display_name or email_clean.split('@')[0], role, now))
    conn.commit()
    conn.close()

    return {
        "uid": user_id,
        "email": email_clean,
        "displayName": display_name or email_clean.split('@')[0],
        "role": role
    }

def db_save_search_history(item: Dict[str, Any]) -> str:
    conn = get_db_connection()
    cursor = conn.cursor()
    item_id = item.get("id") or f"HIST_{int(time.time())}_{int(time.time()*1000)%1000}"

    feedback_json = json.dumps(item.get("feedback")) if item.get("feedback") else None
    features_json = json.dumps(item.get("extracted_features")) if item.get("extracted_features") else None
    result_json = json.dumps(item.get("result")) if item.get("result") else None

    cursor.execute("""
    INSERT OR REPLACE INTO search_history (
        id, user_id, user_email, user_display_name, target, scan_mode,
        platform, timestamp, verdict, risk_score, risk_level, is_fake,
        confidence_pct, predicted_archetype, profile_url, feedback_json,
        extracted_features_json, raw_result_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        item_id,
        item.get("user_id"),
        item.get("user_email"),
        item.get("user_display_name"),
        item.get("target"),
        item.get("scan_mode"),
        item.get("platform", "Generic"),
        item.get("timestamp"),
        item.get("verdict"),
        float(item.get("risk_score", 0)),
        item.get("risk_level", "LOW"),
        int(item.get("is_fake", 0)),
        float(item.get("confidence_pct", 0)),
        item.get("predicted_archetype"),
        item.get("profile_url"),
        feedback_json,
        features_json,
        result_json
    ))
    conn.commit()
    conn.close()
    return item_id

def db_get_search_history(user_email: Optional[str] = None, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    is_admin = is_email_admin(user_email)

    if is_admin:
        cursor.execute("SELECT * FROM search_history ORDER BY timestamp DESC LIMIT 500")
    else:
        cursor.execute("""
        SELECT * FROM search_history 
        WHERE LOWER(user_email) = ? OR user_id = ?
        ORDER BY timestamp DESC LIMIT 200
        """, (user_email.lower() if user_email else "", user_id or ""))

    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        d["feedback"] = json.loads(d["feedback_json"]) if d.get("feedback_json") else None
        d["extracted_features"] = json.loads(d["extracted_features_json"]) if d.get("extracted_features_json") else None
        d["result"] = json.loads(d["raw_result_json"]) if d.get("raw_result_json") else None
        result.append(d)
    return result

def db_update_feedback(history_id: str, feedback_data: Dict[str, Any]):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE search_history SET feedback_json = ? WHERE id = ?
    """, (json.dumps(feedback_data), history_id))
    conn.commit()
    conn.close()

def db_delete_history_item(item_id: str, user_email: Optional[str] = None) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    is_admin = is_email_admin(user_email)
    if is_admin:
        cursor.execute("DELETE FROM search_history WHERE id = ?", (item_id,))
    else:
        cursor.execute("DELETE FROM search_history WHERE id = ? AND LOWER(user_email) = ?", (item_id, user_email.lower() if user_email else ""))
    affected = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return affected

def db_clear_history(user_email: Optional[str] = None) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    is_admin = is_email_admin(user_email)
    if is_admin:
        cursor.execute("DELETE FROM search_history")
    else:
        cursor.execute("DELETE FROM search_history WHERE LOWER(user_email) = ?", (user_email.lower() if user_email else "",))
    conn.commit()
    conn.close()
    return True
