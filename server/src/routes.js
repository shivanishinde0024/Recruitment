const express = require('express');
const router = express.Router();

const authRoutes = require('./modules/auth/auth.routes');
const mastersRoutes = require('./modules/masters/masters.routes');
const usersRoutes = require('./modules/users/users.routes');
const companiesRoutes = require('./modules/companies/companies.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const jobsRoutes = require('./modules/jobs/jobs.routes');
const candidatesRoutes = require('./modules/candidates/candidates.routes');
const mappingsRoutes = require('./modules/mappings/mappings.routes');
const reportsRoutes = require('./modules/reports/reports.routes');
const auditRoutes = require('./modules/audit/audit.routes');
const trashRoutes = require('./modules/trash/trash.routes');
const settingsRoutes = require('./modules/settings/settings.routes');

const { authenticate, requireRole } = require('./middleware/auth');
const validate = require('./middleware/validate');
const reportsController = require('./modules/reports/reports.controller');
const mappingsController = require('./modules/mappings/mappings.controller');
const { companyReviewSchema, withdrawMappingSchema } = require('./modules/mappings/mappings.schema');

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
router.use('/mappings', mappingsRoutes);
router.use('/reports', reportsRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/trash', trashRoutes);
router.use('/settings', settingsRoutes);

// Dashboard routes per PDF §7 & Guide §10.8 (/dashboard/admin, /dashboard/staff, /dashboard/company)
const dashboardRouter = express.Router();
dashboardRouter.use(authenticate);
dashboardRouter.get('/admin', requireRole('admin', 'staff'), reportsController.getAdminCompanyWiseHandler);
dashboardRouter.get('/staff', requireRole('admin', 'staff'), reportsController.getStaffDashboardHandler);
dashboardRouter.get('/company', requireRole('company', 'admin'), reportsController.getCompanyDashboardHandler);
router.use('/dashboard', dashboardRouter);

// Job-candidates alias routes per PDF §7 (/job-candidates/:id/status, /job-candidates/:id)
const jobCandidatesRouter = express.Router();
jobCandidatesRouter.use(authenticate);
jobCandidatesRouter.patch('/:id/status', validate(companyReviewSchema), mappingsController.review);
jobCandidatesRouter.delete('/:id', requireRole('admin', 'staff'), validate(withdrawMappingSchema), mappingsController.withdraw);
router.use('/job-candidates', jobCandidatesRouter);

module.exports = router;
