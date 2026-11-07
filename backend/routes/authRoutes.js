const express = require('express');
const router = express.Router();
const { db, auth } = require('../config/firebase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateUser } = require('../middleware/authMiddleware');

// Secret for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'tushu_super_secure_secret_key_2026';

// ----------------------------------------------------
// GET /api/auth/providers
// Provider configuration inspection
// ----------------------------------------------------
router.get('/providers', (req, res) => {
  res.json({
    success: true,
    data: {
      email_password: {
        configured: true,
        firebaseAuthService: !!auth,
        details: 'Active in backend. Firebase Console Email/Password provider required for cloud sync.'
      },
      google: {
        configured: false,
        details: 'Requires Firebase Console Google Provider activation and OAuth Client IDs.'
      },
      apple: {
        configured: false,
        details: 'Requires Apple Developer account, Service ID, Key ID, and .p8 private key.'
      },
      facebook: {
        configured: false,
        details: 'Requires Meta Developer App ID, App Secret, and Firebase OAuth redirect URI.'
      },
      github: {
        configured: false,
        details: 'Requires GitHub OAuth App Client ID, Client Secret, and Firebase redirect URI.'
      }
    }
  });
});

// ----------------------------------------------------
// POST /api/auth/register
// Clean Email + Password account creation
// ----------------------------------------------------
router.post('/register', async (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  try {
    // 1. Check if user already exists in Firestore
    const existingSnap = await db.collection('users')
      .where('user_id', '==', cleanEmail)
      .get();

    if (!existingSnap.empty) {
      return res.status(400).json({ 
        success: false, 
        message: 'An account with this email already exists. Please login instead.' 
      });
    }

    // 2. Attempt creation in Firebase Authentication if service is enabled
    let firebaseUid = null;
    if (auth) {
      try {
        const fbUser = await auth.createUser({
          email: cleanEmail,
          password: password,
          displayName: fullName ? fullName.trim() : cleanEmail.split('@')[0],
        });
        firebaseUid = fbUser.uid;
      } catch (authErr) {
        // If user already exists in Firebase Auth
        if (authErr.code === 'auth/email-already-exists') {
          return res.status(400).json({ 
            success: false, 
            message: 'An account with this email already exists in Firebase. Please login.' 
          });
        }
        // If Firebase Auth service has not been initialized in console (auth/configuration-not-found)
        console.warn('[Firebase Auth] Notice during registration:', authErr.code, authErr.message);
      }
    }

    // 3. Hash password using bcrypt (passwords NEVER stored in plain text!)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Save user document in Firestore isolated by unique identifier
    const userDocRef = firebaseUid 
      ? db.collection('users').doc(firebaseUid) 
      : db.collection('users').doc();

    const userData = {
      id: userDocRef.id,
      firebase_uid: firebaseUid || userDocRef.id,
      email: cleanEmail,
      user_id: cleanEmail,
      full_name: (fullName && fullName.trim()) || cleanEmail.split('@')[0],
      password: hashedPassword,
      role: 'USER',
      status: 'ACTIVE',
      has_khata: true,
      auth_provider: 'email_password',
      created_at: new Date().toISOString()
    };

    await userDocRef.set(userData);

    // 5. Generate secure JWT token
    const payload = {
      id: userDocRef.id,
      userId: cleanEmail,
      role: userData.role
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

    return res.json({
      success: true,
      message: 'Account created successfully.',
      data: {
        token,
        user: {
          id: userDocRef.id,
          firebase_uid: userData.firebase_uid,
          email: userData.email,
          user_id: userData.user_id,
          full_name: userData.full_name,
          role: userData.role,
          has_khata: userData.has_khata
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error during registration.' });
  }
});

// ----------------------------------------------------
// POST /api/auth/login
// Clean Email + Password Authentication
// ----------------------------------------------------
router.post('/login', async (req, res) => {
  const { userId, email, password } = req.body;
  const identifier = (email || userId || '').trim().toLowerCase();

  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: 'Email ID and Password are required.' });
  }

  try {
    // 1. Search for user by email / user_id
    let querySnapshot = await db.collection('users').where('user_id', '==', identifier).get();
    
    // Fallback search by email if user_id was different (e.g. legacy admin)
    if (querySnapshot.empty) {
      querySnapshot = await db.collection('users').where('email', '==', identifier).get();
    }

    if (querySnapshot.empty) {
      return res.status(401).json({ success: false, message: 'Invalid Email ID or Password' });
    }

    const userDoc = querySnapshot.docs[0];
    const user = userDoc.data();

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Account is inactive. Please contact Admin.' });
    }

    // 2. Cryptographic password comparison with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Email ID or Password' });
    }

    // 3. Enforce strict role: ONLY tushpendrakumar@gmail.com has ADMIN access
    const isSuperAdmin = (user.email && user.email.toLowerCase().trim() === 'tushpendrakumar@gmail.com') ||
                         (user.user_id && user.user_id.toLowerCase().trim() === 'tushpendrakumar');
    const effectiveRole = isSuperAdmin ? 'ADMIN' : 'USER';
    const hasLifetimePremium = isSuperAdmin ? true : (user.is_premium === true || user.is_premium === 1);

    // 4. Issue secure JWT token
    const payload = {
      id: userDoc.id,
      userId: user.user_id,
      role: effectiveRole,
      is_premium: hasLifetimePremium
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: userDoc.id,
          firebase_uid: user.firebase_uid || userDoc.id,
          full_name: user.full_name,
          user_id: user.user_id,
          email: user.email || user.user_id,
          role: effectiveRole,
          has_khata: user.has_khata !== false,
          is_premium: hasLifetimePremium,
          premium_tier: hasLifetimePremium ? 'LIFETIME' : 'FREE',
          premium_activated_at: user.premium_activated_at || null,
          premium_utr: user.premium_utr || null
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error during login.' });
  }
});

// ----------------------------------------------------
// POST /api/auth/social-login
// Secure Firebase ID Token verification for Google, Apple, Facebook, GitHub
// ----------------------------------------------------
router.post('/social-login', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: 'Firebase ID token is required.' });
  }

  if (!auth) {
    return res.status(503).json({ success: false, message: 'Firebase Authentication service is currently unavailable on server.' });
  }

  try {
    // 1. Verify Firebase ID Token cryptographically using Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email, name, picture, firebase } = decodedToken;
    const provider = firebase?.sign_in_provider || 'social';

    const cleanProvider = (provider || 'social').replace('.com', '');
    const userEmail = (email || `${uid}@${cleanProvider}.auth`).toLowerCase();

    // 2. Check if user already exists in Firestore by UID or Email
    let userDocRef = db.collection('users').doc(uid);
    let userDoc = await userDocRef.get();

    if (!userDoc.exists && email) {
      const emailSnap = await db.collection('users').where('email', '==', userEmail).get();
      if (!emailSnap.empty) {
        userDocRef = emailSnap.docs[0].ref;
        userDoc = emailSnap.docs[0];
      }
    }

    // Generate clean username handle (e.g. "tushpendrakumar")
    const cleanName = (name && name.trim()) || (email ? email.split('@')[0] : 'User');
    let candidateUsername = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (candidateUsername.length < 3) {
      candidateUsername = (email ? email.split('@')[0] : `user_${uid.slice(0, 6)}`).toLowerCase().replace(/[^a-z0-9]/g, '');
    }
    if (!candidateUsername) {
      candidateUsername = `user_${uid.slice(0, 6)}`.toLowerCase();
    }

    const isSuperAdminUser = (email && email.toLowerCase() === 'tushpendrakumar@gmail.com') ||
                             (userEmail && userEmail.toLowerCase() === 'tushpendrakumar@gmail.com') ||
                             candidateUsername === 'tushpendra' || candidateUsername === 'tushpendrakumar';

    let userData;
    if (userDoc.exists) {
      userData = userDoc.data();
      // Upgrade existing user_id if it contains ugly email or relay format
      let updatedUserId = userData.user_id;
      if (!updatedUserId || updatedUserId.includes('privaterelay') || updatedUserId.includes('@')) {
        updatedUserId = candidateUsername;
        userData.user_id = updatedUserId;
      }
      if (email && (!userData.email || userData.email.includes('privaterelay'))) {
        userData.email = email;
      }
      if (name && (!userData.full_name || userData.full_name === 'User')) {
        userData.full_name = name;
      }
      if (isSuperAdminUser || (userData.email && userData.email.toLowerCase() === 'tushpendrakumar@gmail.com')) {
        userData.role = 'ADMIN';
      }

      await userDocRef.update({
        role: userData.role || 'USER',
        user_id: userData.user_id,
        email: userData.email,
        full_name: userData.full_name,
        firebase_uid: uid,
        auth_provider: provider,
        last_login_at: new Date().toISOString()
      });
    } else {
      // Check if candidate username is already taken by another user
      const existingUserWithId = await db.collection('users').where('user_id', '==', candidateUsername).get();
      let finalUserId = candidateUsername;
      if (!existingUserWithId.empty) {
        finalUserId = `${candidateUsername}_${Math.floor(100 + Math.random() * 900)}`;
      }

      const assignedRole = isSuperAdminUser ? 'ADMIN' : 'USER';

      // Create new user in Firestore from verified OAuth profile
      userData = {
        id: userDocRef.id,
        firebase_uid: uid,
        email: userEmail,
        user_id: finalUserId,
        full_name: name || candidateUsername,
        role: assignedRole,
        status: 'ACTIVE',
        has_khata: true,
        auth_provider: provider,
        avatar_url: picture || null,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString()
      };
      await userDocRef.set(userData);
    }

    const isSuperSocialAdmin = isSuperAdminUser || (userData.email && userData.email.toLowerCase() === 'tushpendrakumar@gmail.com');
    const hasSocialPremium = isSuperSocialAdmin ? true : (userData.is_premium === true || userData.is_premium === 1);

    // 3. Issue secure JWT token for session
    const payload = {
      id: userDocRef.id,
      userId: userData.user_id,
      role: userData.role,
      is_premium: hasSocialPremium
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

    return res.json({
      success: true,
      message: 'Social authentication verified successfully.',
      data: {
        token,
        user: {
          id: userDocRef.id,
          firebase_uid: uid,
          email: userData.email,
          user_id: userData.user_id,
          full_name: userData.full_name,
          role: userData.role,
          has_khata: userData.has_khata !== false,
          is_premium: hasSocialPremium,
          premium_tier: hasSocialPremium ? 'LIFETIME' : 'FREE',
          premium_activated_at: userData.premium_activated_at || null,
          premium_utr: userData.premium_utr || null
        }
      }
    });

  } catch (error) {
    console.error('[Social Auth Error]:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired Firebase authentication token.',
      error: error.message
    });
  }
});

// ----------------------------------------------------
// POST /api/auth/forgot-password
// Password reset via Email
// ----------------------------------------------------
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Verify if user exists in database
    const snap = await db.collection('users').where('user_id', '==', cleanEmail).get();
    const snapEmail = snap.empty 
      ? await db.collection('users').where('email', '==', cleanEmail).get()
      : snap;

    if (snapEmail.empty) {
      // Return success response to prevent email enumeration attacks
      return res.json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been dispatched.'
      });
    }

    // 2. Generate Firebase Auth Password Reset Link if Firebase Auth is active
    let resetLinkGenerated = false;
    if (auth) {
      try {
        const link = await auth.generatePasswordResetLink(cleanEmail);
        console.log(`[Firebase Auth] Password reset link generated for ${cleanEmail}:`, link);
        resetLinkGenerated = true;
      } catch (authErr) {
        console.warn('[Firebase Auth] Password reset link notice:', authErr.code, authErr.message);
      }
    }

    return res.json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been dispatched to your email address.',
      resetLinkGenerated
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error processing password reset.' });
  }
});

// ----------------------------------------------------
// POST /api/auth/change-password
// Change Password for Authenticated User
// ----------------------------------------------------
router.post('/change-password', authenticateUser, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // Document ID from JWT payload

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Both passwords are required.' });
  }
  
  if (currentPassword === newPassword) {
    return res.status(400).json({ success: false, message: 'New password must be different from current password.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = userDoc.data();
    
    // 1. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    // 2. Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // 3. Update in Firestore
    await userRef.update({ 
      password: hashedPassword,
      updated_at: new Date().toISOString()
    });

    // 4. Update in Firebase Auth if account is linked
    if (auth && user.firebase_uid) {
      try {
        await auth.updateUser(user.firebase_uid, { password: newPassword });
      } catch (authErr) {
        console.warn('[Firebase Auth] Password sync notice:', authErr.code, authErr.message);
      }
    }

    res.json({ success: true, message: 'Password updated successfully.' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
});

module.exports = router;
