
const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  sendMessage,
  getUserMessages,
  getAllMessages,
  replyMessage
} = require('../controllers/messageController');

// User routes
router.post('/user', authenticateUser, sendMessage);
router.get('/user', authenticateUser, getUserMessages);

// Admin routes
router.get('/admin', authenticateUser, requireRole('ADMIN'), getAllMessages);
router.post('/admin/:id/reply', authenticateUser, requireRole('ADMIN'), replyMessage);

module.exports = router;
