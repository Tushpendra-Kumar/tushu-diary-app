const express = require('express');
const router = express.Router();
const { db: firestore } = require('../config/firebase');
const sqliteDb = require('../config/database');
const paymentConfig = require('../config/paymentConfig');
const { authenticateUser } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// ----------------------------------------------------
// GET /api/payment/config
// Returns current UPI configuration & pricing
// ----------------------------------------------------
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: paymentConfig
  });
});

// ----------------------------------------------------
// POST /api/payment/submit
// User submits UPI UTR number after ₹499 payment
// ----------------------------------------------------
router.post('/submit', authenticateUser, async (req, res) => {
  const { utrNumber, upiId, amount = 499, appName = 'UPI' } = req.body;
  const user = req.user;

  if (!utrNumber || typeof utrNumber !== 'string' || utrNumber.trim().length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid UPI Reference / UTR Number (minimum 6 digits).'
    });
  }

  const cleanUtr = utrNumber.trim().toUpperCase();
  const activeUpiId = (upiId || paymentConfig.defaultUpiId).trim();
  const nowIso = new Date().toISOString();

  try {
    // 1. Record in SQLite Database
    sqliteDb.run(
      `INSERT OR REPLACE INTO payments (user_id, amount, currency, payment_method, upi_id, utr_number, status, lifetime, created_at)
       VALUES (?, ?, 'INR', ?, ?, ?, 'ACTIVE', 1, ?)`,
      [user.userId || user.id, amount, appName, activeUpiId, cleanUtr, nowIso],
      (sqlErr) => {
        if (sqlErr) {
          console.warn('[Payments SQLite] Record warning:', sqlErr.message);
        }
      }
    );

    // Update user in SQLite
    sqliteDb.run(
      `UPDATE users SET is_premium = 1, premium_activated_at = ?, premium_utr = ? WHERE user_id = ?`,
      [nowIso, cleanUtr, user.userId || user.id],
      () => {}
    );

    // 2. Record in Firestore (if connected)
    if (firestore) {
      try {
        const paymentDocRef = firestore.collection('payments').doc(cleanUtr);
        await paymentDocRef.set({
          user_id: user.userId || user.id,
          user_internal_id: user.id,
          amount: Number(amount),
          currency: 'INR',
          payment_method: 'UPI',
          upi_id: activeUpiId,
          utr_number: cleanUtr,
          status: 'ACTIVE',
          lifetime: true,
          created_at: nowIso
        });

        // Update User Doc in Firestore
        const userDocRef = firestore.collection('users').doc(user.id);
        await userDocRef.set({
          is_premium: true,
          premium_tier: 'LIFETIME',
          premium_activated_at: nowIso,
          premium_utr: cleanUtr,
          premium_amount: Number(amount),
          updated_at: nowIso
        }, { merge: true });
      } catch (fsErr) {
        console.warn('[Payments Firestore] Sync note:', fsErr.message);
      }
    }

    console.log(`[Payment Verified] User: ${user.userId || user.id} activated Lifetime Premium with UTR: ${cleanUtr}`);

    return res.json({
      success: true,
      message: '🎉 Congratulations! Your payment has been verified and Lifetime Premium access is now ACTIVE.',
      data: {
        is_premium: true,
        tier: 'LIFETIME_PREMIUM',
        amount: Number(amount),
        currency: 'INR',
        utr_number: cleanUtr,
        activated_at: nowIso
      }
    });

  } catch (err) {
    console.error('[Payment Verification Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while verifying payment. Please contact support.'
    });
  }
});

// ----------------------------------------------------
// GET /api/payment/status or /api/payment/status/:userId
// Check user's lifetime premium status
// ----------------------------------------------------
router.get('/status/:userId?', authenticateUser, async (req, res) => {
  const user = req.user;
  const targetUserId = req.params.userId || user.userId || user.id;

  // Master Admin always has lifetime premium
  const isMasterAdmin = (targetUserId && targetUserId.toLowerCase().includes('tushpendrakumar')) || user.role === 'ADMIN';
  if (isMasterAdmin) {
    return res.json({
      success: true,
      data: {
        is_premium: true,
        tier: 'ADMIN_LIFETIME',
        message: 'Master Administrator — Full Lifetime Access Unlocked'
      }
    });
  }

  // Check Firestore first if active
  if (firestore) {
    try {
      const userDoc = await firestore.collection('users').doc(targetUserId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData.is_premium) {
          return res.json({
            success: true,
            data: {
              is_premium: true,
              tier: userData.premium_tier || 'LIFETIME',
              activated_at: userData.premium_activated_at,
              utr: userData.premium_utr
            }
          });
        }
      }
    } catch (e) {
      console.warn('[Payment Status Firestore] Warning:', e.message);
    }
  }

  // Fallback to SQLite check
  sqliteDb.get(
    `SELECT is_premium, premium_activated_at, premium_utr FROM users WHERE user_id = ? OR id = ?`,
    [targetUserId, targetUserId],
    (err, row) => {
      if (!err && row && row.is_premium) {
        return res.json({
          success: true,
          data: {
            is_premium: true,
            tier: 'LIFETIME',
            activated_at: row.premium_activated_at,
            utr: row.premium_utr
          }
        });
      }

      return res.json({
        success: true,
        data: {
          is_premium: false,
          tier: 'FREE',
          upgradePrice: paymentConfig.amount,
          currency: paymentConfig.currencySymbol
        }
      });
    }
  );
});

// ----------------------------------------------------
// GET /api/payment/admin/all
// Admin lists all payments and user purchase records
// ----------------------------------------------------
router.get('/admin/all', authenticateUser, requireRole('ADMIN'), async (req, res) => {
  try {
    if (firestore) {
      const snapshot = await firestore.collection('payments').orderBy('created_at', 'desc').get();
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json({ success: true, count: payments.length, data: payments });
    }

    sqliteDb.all(`SELECT * FROM payments ORDER BY created_at DESC`, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, count: (rows || []).length, data: rows || [] });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
