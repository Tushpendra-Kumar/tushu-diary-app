const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' }); // Load from root if exists

const { authenticateUser } = require('./middleware/authMiddleware');
const { requireRole } = require('./middleware/roleMiddleware');
const messageRoutes = require('./routes/messageRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS - restrict in production (currently allowing all for dev)
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Mock-User-Id', 'X-Mock-Role']
}));
app.use(express.json());

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: "TushuDiary API is running"
  });
});

// ----------------------------------------------------
// ROUTES
// ----------------------------------------------------

// Auth Routes (Public)
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Admin Routes (Requires Authentication + ADMIN Role)
const adminUserRoutes = require('./routes/adminUserRoutes');
const adminRecordRoutes = require('./routes/adminRecordRoutes');
const adminDocsRoutes = require('./routes/adminDocsRoutes');

app.use('/api/admin/users', authenticateUser, requireRole('ADMIN'), adminUserRoutes);
// We map adminRecordRoutes to /api/admin so it handles /api/admin/users/:userId/records and /api/admin/records/:id
app.use('/api/admin', authenticateUser, requireRole('ADMIN'), adminRecordRoutes);
app.use('/api/admin/docs', authenticateUser, requireRole('ADMIN'), adminDocsRoutes);

// User Routes (Requires Authentication)
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/user', authenticateUser, userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/messages', messageRoutes);



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
