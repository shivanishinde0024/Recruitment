const express = require('express');
const router = express.Router();

const authRoutes = require('./modules/auth/auth.routes');

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

module.exports = router;
