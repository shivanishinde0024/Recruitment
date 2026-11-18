const express = require('express');
const router = express.Router();

const { authenticate, requireRole } = require('../../middleware/auth');
const reportsController = require('./reports.controller');

// All reports routes require authentication
router.use(authenticate);

// Admin Company-Wise Dashboard (Admin & Staff)
router.get(
  '/company-wise',
  requireRole('admin', 'staff'),
  reportsController.getAdminCompanyWiseHandler
);

// Staff Dashboard
router.get(
  '/staff-dashboard',
  requireRole('admin', 'staff'),
  reportsController.getStaffDashboardHandler
);

// Company Dashboard
router.get(
  '/company-dashboard',
  requireRole('company', 'admin'),
  reportsController.getCompanyDashboardHandler
);

// Export Report (CSV / XLSX with anti-formula injection)
router.get(
  '/export',
  requireRole('admin', 'staff'),
  reportsController.exportReportHandler
);

// Trigger Deadline Reminder Checks (Admin)
router.post(
  '/trigger-deadline-check',
  requireRole('admin'),
  reportsController.triggerDeadlineCheckHandler
);

// Company Drill-Down (Admin, Staff, or Company owner)
router.get(
  '/company/:id',
  requireRole('admin', 'staff', 'company'),
  reportsController.getCompanyDrillDownHandler
);

module.exports = router;
