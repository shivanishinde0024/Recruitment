const express = require('express');
const router = express.Router();

const authRoutes = require('./modules/auth/auth.routes');
const mastersRoutes = require('./modules/masters/masters.routes');
const usersRoutes = require('./modules/users/users.routes');
const companiesRoutes = require('./modules/companies/companies.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const jobsRoutes = require('./modules/jobs/jobs.routes');
const candidatesRoutes = require('./modules/candidates/candidates.routes');

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
router.use('/companies', companiesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/jobs', jobsRoutes);
router.use('/candidates', candidatesRoutes);

module.exports = router;
