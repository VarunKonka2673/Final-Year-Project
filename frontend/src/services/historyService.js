import { API_BASE } from '../config';
import { db, collection, addDoc, getDocs, query, where, orderBy, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from '../firebase';

const LOCAL_STORAGE_HISTORY_KEY = 'sg_user_history_cache';

// Load cached local history
const getLocalHistory = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// Save to local cache
const saveLocalHistory = (records) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(records.slice(0, 200)));
  } catch (e) {
    console.warn("Local history storage failed", e);
  }
};

/**
 * Save a new scan record to Firestore, Backend API, and Local Storage.
 */
export async function saveScanHistory(scanData, user) {
  const historyItem = {
    id: `HIST_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    user_id: user?.uid || 'anonymous',
    user_email: user?.email || 'guest@socialguard.local',
    user_display_name: user?.displayName || (user?.email ? user.email.split('@')[0] : 'Guest User'),
    target: scanData.target || scanData.username || scanData.profile_url || 'Unknown Target',
    scan_mode: scanData.scan_mode || 'attributes',
    platform: scanData.platform || scanData.result?.platform || 'Generic',
    timestamp: new Date().toISOString(),
    verdict: scanData.result?.verdict || (scanData.result?.is_fake === 1 ? 'FRAUDULENT' : 'GENUINE'),
    risk_score: scanData.result?.risk_score ?? 0,
    risk_level: scanData.result?.risk_level || 'LOW',
    is_fake: scanData.result?.is_fake ?? 0,
    confidence_pct: scanData.result?.confidence_pct ?? 0,
    predicted_archetype: scanData.result?.predicted_archetype || 'N/A',
    profile_url: scanData.profile_url || null,
    feedback: null,
    extracted_features: scanData.result?.extracted_features || scanData.raw_extracted_features || null,
    result: scanData.result
  };

  // 1. Update Local Cache immediately for instantaneous UI response
  const local = getLocalHistory();
  local.unshift(historyItem);
  saveLocalHistory(local);

  // 2. Persist to Backend API
  try {
    fetch(`${API_BASE}/api/history/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(historyItem)
    }).catch(err => console.warn('Backend history save error:', err));
  } catch (e) {
    console.warn('Backend history save trigger error:', e);
  }

  // 3. Persist to Firestore (Non-blocking fire-and-forget)
  try {
    if (db) {
      const historyCollection = collection(db, 'scan_history');
      addDoc(historyCollection, {
        ...historyItem,
        createdAt: serverTimestamp()
      }).catch(err => console.warn('Firestore history save fallback:', err));
    }
  } catch (err) {
    console.warn('Firestore history save trigger error:', err);
  }

  return historyItem;
}

/**
 * Fetch scan history filtered by RBAC.
 * Admin (varunkonka2673@gmail.com) gets all history.
 * Normal user gets ONLY their own search history.
 */
export async function fetchScanHistory(user, isAdmin) {
  let records = [];

  // 1. Try fetching from Backend API
  try {
    const params = new URLSearchParams();
    if (user?.email) params.append('user_email', user.email);
    if (user?.uid) params.append('user_id', user.uid);

    const res = await fetch(`${API_BASE}/api/history/list?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      records = data.records || [];
    }
  } catch (err) {
    console.warn('Backend history fetch fallback:', err);
  }

  // 2. If Backend has records, return and sync local cache
  if (records && records.length > 0) {
    // If not admin, ensure strictly filtered
    if (!isAdmin && user?.email) {
      records = records.filter(r => 
        (r.user_email && r.user_email.toLowerCase() === user.email.toLowerCase()) ||
        (r.user_id && r.user_id === user.uid)
      );
    }
    saveLocalHistory(records);
    return records;
  }

  // 3. Fallback to Firestore
  try {
    if (db) {
      const historyCollection = collection(db, 'scan_history');
      let q;
      if (isAdmin) {
        q = query(historyCollection, orderBy('timestamp', 'desc'));
      } else if (user?.uid) {
        q = query(historyCollection, where('user_id', '==', user.uid));
      }

      if (q) {
        const querySnapshot = await getDocs(q);
        const firestoreRecords = [];
        querySnapshot.forEach((docSnap) => {
          firestoreRecords.push({ firestoreId: docSnap.id, ...docSnap.data() });
        });
        if (firestoreRecords.length > 0) {
          saveLocalHistory(firestoreRecords);
          return firestoreRecords;
        }
      }
    }
  } catch (firestoreErr) {
    console.warn('Firestore fetch query warning:', firestoreErr);
  }

  // 4. Fallback to Local Storage cache
  const local = getLocalHistory();
  if (!isAdmin && user?.email) {
    return local.filter(r => 
      (r.user_email && r.user_email.toLowerCase() === user.email.toLowerCase()) ||
      (r.user_id && r.user_id === user.uid)
    );
  }
  return local;
}

/**
 * Submit user feedback on whether a prediction was correct or not for malicious IDs.
 * Appends the profile link & features to the ML dataset and optionally retrains models!
 */
export async function submitPredictionFeedback({
  historyId,
  username,
  profileUrl = null,
  platform = 'Generic',
  features = {},
  modelPredictedFake,
  userVerifiedFake,
  isCorrect,
  feedbackNotes = '',
  user = null,
  autoRetrain = true
}) {
  const payload = {
    account_id: historyId || null,
    profile_url: profileUrl,
    username: username || 'scanned_user',
    platform: platform,
    features: features,
    model_predicted_fake: modelPredictedFake,
    user_verified_fake: userVerifiedFake,
    is_correct: isCorrect,
    feedback_notes: feedbackNotes,
    user_email: user?.email || null,
    user_id: user?.uid || null,
    auto_retrain: autoRetrain
  };

  // 1. Send feedback and trigger link-based retraining on backend
  const res = await fetch(`${API_BASE}/api/feedback/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Failed to submit feedback (${res.statusText})`);
  }

  const resultData = await res.json();

  // 2. Update local history feedback status
  if (historyId) {
    const local = getLocalHistory();
    const updated = local.map(item => {
      if (item.id === historyId) {
        return {
          ...item,
          feedback: {
            is_correct: isCorrect,
            user_verified_fake: userVerifiedFake,
            notes: feedbackNotes,
            submitted_at: new Date().toISOString()
          }
        };
      }
      return item;
    });
    saveLocalHistory(updated);
  }

  return resultData;
}

/**
 * Delete single history entry
 */
export async function deleteHistoryRecord(historyId, user) {
  try {
    const params = new URLSearchParams();
    if (user?.email) params.append('user_email', user.email);

    await fetch(`${API_BASE}/api/history/item/${historyId}?${params.toString()}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.warn('Backend history delete failed:', err);
  }

  const local = getLocalHistory();
  const updated = local.filter(item => item.id !== historyId);
  saveLocalHistory(updated);
  return updated;
}

/**
 * Clear search history (user only or all for admin)
 */
export async function clearAllHistory(user, isAdmin) {
  try {
    const params = new URLSearchParams();
    if (user?.email) params.append('user_email', user.email);

    await fetch(`${API_BASE}/api/history/clear?${params.toString()}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.warn('Backend history clear failed:', err);
  }

  if (isAdmin) {
    saveLocalHistory([]);
    return [];
  } else if (user?.email) {
    const local = getLocalHistory();
    const updated = local.filter(item => item.user_email?.toLowerCase() !== user.email.toLowerCase());
    saveLocalHistory(updated);
    return updated;
  }
  return [];
}

/**
 * Synchronizes a newly collected profile to Firebase Firestore (collection: 'collected_profiles').
 * Uses a deterministic unique docId `profile_${clean_username}` with setDoc(..., { merge: true })
 * so the account is saved/updated without creating duplicate documents or duplicate IDs.
 */
export async function syncCollectedProfileToFirestore(extractedData, user = null) {
  if (!db || !extractedData) return null;
  const username = extractedData.username || extractedData.extracted_username || extractedData.account_username;
  if (!username) return null;

  try {
    const cleanKey = String(username).toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    const docId = `profile_${cleanKey}`;
    const docRef = doc(db, 'collected_profiles', docId);

    const fol = Number(extractedData.follower_count ?? extractedData.followers ?? 0);
    const folg = Number(extractedData.following_count ?? extractedData.following ?? 0);
    const posts = Number(extractedData.posts_count ?? extractedData.media_count ?? 0);
    const ratio = folg > 0 ? Number(((fol + 1.0) / (folg + 1.0)).toFixed(3)) : fol;

    const payload = {
      account_id: `EXT_${cleanKey}`,
      username: username,
      full_name: extractedData.full_name || extractedData.display_name || username,
      bio: extractedData.bio || '',
      recent_post: extractedData.recent_post || '',
      has_profile_pic: Number(extractedData.has_profile_pic ?? 1),
      is_verified: Number(extractedData.is_verified ?? 0),
      account_age_days: Number(extractedData.account_age_days || 450),
      follower_count: fol,
      following_count: folg,
      posts_count: posts,
      follower_to_following_ratio: ratio,
      platform: extractedData.platform || 'Instagram',
      profile_url: extractedData.profile_url || '',
      profile_pic: extractedData.profile_pic || '',
      is_fake: Number(extractedData.is_fake ?? 0),
      bot_archetype: extractedData.bot_archetype || extractedData.predicted_archetype || 'Genuine-Casual-User',
      risk_score: Number(extractedData.risk_score ?? 0),
      collected_by: user?.email || 'system_collector',
      last_updated: serverTimestamp()
    };

    await setDoc(docRef, payload, { merge: true });
    console.log(`[Firebase Cloud] Stored profile @${username} into Firestore 'collected_profiles' without duplicate IDs (Doc: ${docId}).`);
    return { docId, ...payload };
  } catch (err) {
    console.warn('[Firebase Cloud] Collected profile sync note:', err);
    return null;
  }
}

/**
 * Syncs all collected profiles from the backend collector into Cloud Firestore.
 * Prevents any duplicate documents by using deterministic doc IDs.
 */
export async function syncAllCollectedProfilesToFirestore(user = null) {
  try {
    const res = await fetch(`${API_BASE}/api/collector/profiles`);
    if (!res.ok) return 0;
    const data = await res.json();
    const profiles = data.profiles || [];
    let synced = 0;
    for (const p of profiles) {
      const result = await syncCollectedProfileToFirestore(p, user);
      if (result) synced++;
    }
    console.log(`[Firebase Cloud] Finished syncing ${synced} collected profiles to Firestore.`);
    return synced;
  } catch (e) {
    console.warn('[Firebase Cloud] Bulk sync notice:', e);
    return 0;
  }
}

