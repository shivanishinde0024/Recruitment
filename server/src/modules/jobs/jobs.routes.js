const express = require('express');
const { authenticate, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const {
  createJobSchema,
  updateJobSchema,
  updateJobStatusSchema,
  assignStaffSchema
} = require('./jobs.schema');
const jobsController = require('./jobs.controller');

const router = express.Router();

// Create new job requirement (Company or Admin/Staff)
router.post('/', authenticate, validate(createJobSchema), jobsController.create);

// List job requirements with search, filters, pagination
router.get('/', authenticate, jobsController.list);

// Retrieve detailed job requirement with metrics
router.get('/:id', authenticate, jobsController.getById);

// Update job details (subject to position reduction guard)
router.put('/:id', authenticate, validate(updateJobSchema), jobsController.update);

// Status transition (open, on_hold, closed)
router.patch('/:id/status', authenticate, validate(updateJobStatusSchema), jobsController.updateStatus);

// Assign staff member to job (Admin only)
router.patch('/:id/assign-staff', authenticate, requireRole('admin'), validate(assignStaffSchema), jobsController.assignStaff);

// Soft delete job
router.delete('/:id', authenticate, jobsController.remove);

module.exports = router;
