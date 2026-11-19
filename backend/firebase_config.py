"""
firebase_config.py — Firebase Firestore integration for storing analysis history.

Setup instructions:
1. Go to https://console.firebase.google.com/
2. Create a new project (or use existing)
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key" → download JSON file
5. Save the JSON file as 'firebase_key.json' in the backend/ directory
6. Enable Firestore Database in your Firebase console (test mode is fine)

The app will work without Firebase — it just won't persist analysis history.
"""

import os
import json
from datetime import datetime
from typing import Dict, List, Optional


def _load_env_file(path: str) -> None:
    """Load KEY=VALUE pairs from a .env file without external dependencies."""
    if not os.path.exists(path):
        return
    try:
        with open(path, "r", encoding="utf-8") as f:
            for raw_line in f:
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key:
                    os.environ.setdefault(key, value)
    except Exception:
        pass

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_load_env_file(os.path.join(PROJECT_ROOT, ".env"))

# Firebase availability flag
FIREBASE_AVAILABLE = False
db = None

try:
    import firebase_admin
    from firebase_admin import credentials, firestore

    # Look for key path from env first; fallback to backend/firebase_key.json
    env_key_path = os.getenv("FIREBASE_KEY_PATH", "").strip()
    if env_key_path:
        KEY_PATH = env_key_path if os.path.isabs(env_key_path) else os.path.join(PROJECT_ROOT, env_key_path)
    else:
        KEY_PATH = os.path.join(os.path.dirname(__file__), "firebase_key.json")

    if os.path.exists(KEY_PATH):
        cred = credentials.Certificate(KEY_PATH)
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        db = firestore.client()
        FIREBASE_AVAILABLE = True
        print("✅ Firebase connected successfully!")
    else:
        print("⚠️  firebase_key.json not found. Running without database persistence.")
        print(f"   Expected location: {KEY_PATH}")

except ImportError:
    print("⚠️  firebase-admin not installed. Running without database persistence.")
except Exception as e:
    print(f"⚠️  Firebase initialization error: {e}")


# ---------------------------------------------------------------------------
# Firestore CRUD operations
# ---------------------------------------------------------------------------
COLLECTION_NAME = "analysis_history"


def save_analysis(analysis_type: str, input_data: Dict, result_data: Dict) -> Optional[str]:
    """Save an analysis result to Firestore. Returns document ID or None."""
    if not FIREBASE_AVAILABLE or db is None:
        return None

    try:
        doc_ref = db.collection(COLLECTION_NAME).add({
            "type": analysis_type,
            "input": input_data,
            "result": result_data,
            "timestamp": datetime.utcnow().isoformat(),
            "created_at": firestore.SERVER_TIMESTAMP,
        })
        return doc_ref[1].id
    except Exception as e:
        print(f"Firebase save error: {e}")
        return None


def get_analysis_history(limit: int = 20) -> List[Dict]:
    """Fetch recent analysis history from Firestore."""
    if not FIREBASE_AVAILABLE or db is None:
        return []

    try:
        docs = (
            db.collection(COLLECTION_NAME)
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
            .limit(limit)
            .stream()
        )
        return [{"id": doc.id, **doc.to_dict()} for doc in docs]
    except Exception as e:
        print(f"Firebase fetch error: {e}")
        return []


def delete_analysis(doc_id: str) -> bool:
    """Delete an analysis record by ID."""
    if not FIREBASE_AVAILABLE or db is None:
        return False

    try:
        db.collection(COLLECTION_NAME).document(doc_id).delete()
        return True
    except Exception as e:
        print(f"Firebase delete error: {e}")
        return False
