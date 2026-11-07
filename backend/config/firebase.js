const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');
const path = require('path');

let db = null;
let auth = null;

try {
  let credential = null;

  // 1. Check environment variable for raw JSON string
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      credential = cert(parsed);
    } catch (e) {
      console.error('[Security] Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:', e.message);
    }
  }

  // 2. Check environment variable for file path or standard local paths
  if (!credential) {
    const candidatePaths = [
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
      path.resolve(__dirname, 'firebase-service-account.json'),
      path.resolve(__dirname, 'firebase-service-account.json.json'),
    ].filter(Boolean);

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, 'utf8');
          credential = cert(JSON.parse(raw));
          break;
        } catch (e) {
          console.warn(`[Security] Could not load credentials from ${p}:`, e.message);
        }
      }
    }
  }

  if (credential) {
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp({ credential });
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('[Firebase] Admin SDK initialized successfully with secure credentials.');
  } else {
    console.warn('[Firebase] Warning: No service account credentials found. Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH.');
  }
} catch (err) {
  console.error('[Firebase] Initialization error:', err.message);
}

module.exports = { db, auth };

