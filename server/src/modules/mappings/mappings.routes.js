const express = require('express');
const { authenticate, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const {
  createMappingSchema,
  companyReviewSchema,
  withdrawMappingSchema
} = require('./mappings.schema');
const mappingsController = require('./mappings.controller');

const router = express.Router();

// Map one or more candidates to a job (Staff & Admin)
router.post(
  '/',
  authenticate,
  requireRole('admin', 'staff'),
  validate(createMappingSchema),
  mappingsController.create
);

// List candidates mapped to a job via query parameter (e.g. ?job_id=123)
router.get(
  '/',
  authenticate,
  (req, res, next) => {
    if (req.query.job_id) {
      req.params.jobId = req.query.job_id;
      return mappingsController.list(req, res, next);
    }
    return res.status(400).json({ success: false, message: 'job_id query parameter is required' });
  }
);

// Get suggested ranked candidates for a job
router.get(
  '/jobs/:jobId/suggested',
  authenticate,
  requireRole('admin', 'staff'),
  mappingsController.getSuggested
);

// List candidates mapped to a job
router.get(
  '/jobs/:jobId',
  authenticate,
  mappingsController.list
);

// Company review actions (viewed, shortlisted, confirmed, rejected, hold)
router.patch(
  '/:id/review',
  authenticate,
  validate(companyReviewSchema),
  mappingsController.review
);

// Staff withdrawal of submitted candidate
router.patch(
  '/:id/withdraw',
  authenticate,
  requireRole('admin', 'staff'),
  validate(withdrawMappingSchema),
  mappingsController.withdraw
);

module.exports = router;
