/**
 * Ownership Authorization Middleware
 * Ensures that a USER can only access their own records.
 * 
 * If the user is an ADMIN, they can access any records.
 * If the user is a USER, we verify that the requested userId matches their own ID.
 */
const requireOwnership = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Authentication required.' });
  }

  // Admins can access records across the system
  if (req.user.role === 'ADMIN') {
    return next();
  }

  // Target user ID from params or query
  const targetUserId = req.params.userId || req.query.userId;
  
  if (!targetUserId) {
    return res.status(400).json({ success: false, message: 'User ID is required for this operation.' });
  }

  // Strict string comparison against both Firestore document ID (req.user.id) and account userId (req.user.userId)
  const isOwner = String(targetUserId) === String(req.user.id) || String(targetUserId) === String(req.user.userId);

  if (!isOwner) {
    return res.status(403).json({ 
      success: false, 
      message: 'Forbidden. You do not have ownership permission for this user data.' 
    });
  }

  next();
};

module.exports = {
  requireOwnership
};
