const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET /api/user/profile
router.get('/profile', async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.user.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const data = doc.data();
    const isSuperAdmin = (data.email && data.email.toLowerCase().trim() === 'tushpendrakumar@gmail.com') ||
                         (data.user_id && data.user_id.toLowerCase().trim() === 'tushpendrakumar');
    data.role = isSuperAdmin ? 'ADMIN' : 'USER';
    const isPremium = isSuperAdmin ? true : (data.is_premium === true || data.is_premium === 1);
    res.json({ 
      success: true, 
      data: { 
        id: doc.id, 
        full_name: data.full_name, 
        user_id: data.user_id, 
        email: data.email,
        status: data.status, 
        role: data.role, 
        is_premium: isPremium,
        premium_tier: isPremium ? 'LIFETIME' : 'FREE',
        premium_activated_at: data.premium_activated_at || null,
        premium_utr: data.premium_utr || null,
        created_at: data.created_at, 
        privacy_show_profile: data.privacy_show_profile !== false, 
        privacy_show_activity: data.privacy_show_activity === true, 
        privacy_allow_tags: data.privacy_allow_tags !== false 
      } 
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// GET /api/user/family
router.get('/family', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, message: 'User not found' });
    
    const userData = userDoc.data();
    
    if (userData.role === 'ADMIN') {
      const snapshot = await db.collection('users').orderBy('created_at', 'desc').get();
      const allUsers = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.full_name,
          userId: d.user_id,
          gender: d.gender || 'unknown',
          role: d.role,
          status: d.status,
          relation: 'Registered User'
        };
      });
      return res.json({ success: true, isAdmin: true, data: allUsers });
    }

    // Role-based / Relationship-based visibility map
    // For a public app, users do not see each other unless they are friends.
    // For now, return an empty array for public users.
    res.json({ success: true, isAdmin: false, data: [] });
  } catch (error) {
    console.error('Error fetching family:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// GET /api/user/records
router.get('/records', async (req, res) => {
  try {
    const snapshot = await db.collection('records').where('user_id', '==', req.user.id).get();
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    records.sort((a, b) => {
      const dateA = new Date(a.record_date).getTime();
      const dateB = new Date(b.record_date).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// GET /api/user/records/total
router.get('/records/total', async (req, res) => {
  try {
    const snapshot = await db.collection('records').where('user_id', '==', req.user.id).get();
    let total = 0;
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.amount && !isNaN(data.amount)) {
        total += parseFloat(data.amount);
      }
    });
    res.json({ success: true, data: { total } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


// POST /api/user/update-privacy
router.post('/update-privacy', async (req, res) => {
  try {
    const userId = req.user.id;
    const { privacy_show_profile, privacy_show_activity, privacy_allow_tags } = req.body;
    
    const updates = {};
    if (privacy_show_profile !== undefined) updates.privacy_show_profile = privacy_show_profile;
    if (privacy_show_activity !== undefined) updates.privacy_show_activity = privacy_show_activity;
    if (privacy_allow_tags !== undefined) updates.privacy_allow_tags = privacy_allow_tags;

    if (Object.keys(updates).length > 0) {
      await db.collection('users').doc(userId).update(updates);
    }

    res.json({ success: true, message: 'Privacy settings updated' });
  } catch (error) {
    console.error('Error updating privacy:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
