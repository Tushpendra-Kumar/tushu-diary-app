const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tushu_super_secure_secret_key_2026';

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, userId, role }
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({ success: false, message: 'Unauthorized. Invalid or expired token.' });
  }
};

module.exports = {
  authenticateUser
};
