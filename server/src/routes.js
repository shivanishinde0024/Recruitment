const express = require('express');
const router = express.Router();

const authRoutes = require('./modules/auth/auth.routes');
const mastersRoutes = require('./modules/masters/masters.routes');
const usersRoutes = require('./modules/users/users.routes');

// System Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount Modules
router.use('/auth', authRoutes);
router.use('/masters', mastersRoutes);
router.use('/users', usersRoutes);

module.exports = router;
