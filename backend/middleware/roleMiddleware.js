/**
 * Role Authorization Middleware
 * Enforces that the authenticated user has the required role.
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({ success: false, message: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
};

module.exports = {
  requireRole
};
