const express = require('express');
const { authenticate, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { createUploader, memoryUploader } = require('../../middleware/upload');
const {
  createCandidateSchema,
  updateCandidateSchema
} = require('./candidates.schema');
const candidatesController = require('./candidates.controller');

const router = express.Router();
const resumeUploader = createUploader('resume');

// Create single candidate (Admin & Staff)
router.post(
  '/',
  authenticate,
  requireRole('admin', 'staff'),
  resumeUploader.single('resume'),
  validate(createCandidateSchema),
  candidatesController.create
);

// List candidates with search, filters, pagination
router.get('/', authenticate, candidatesController.list);

// Bulk candidate spreadsheet + zip import (Admin & Staff)
router.post(
  '/bulk',
  authenticate,
  requireRole('admin', 'staff'),
  memoryUploader.fields([
    { name: 'file', maxCount: 1 },
    { name: 'resumes_zip', maxCount: 1 }
  ]),
  candidatesController.bulkUpload
);

// Detail candidate profile view
router.get('/:id', authenticate, candidatesController.getById);

// Update candidate (Subject to staff ownership rule)
router.put(
  '/:id',
  authenticate,
  requireRole('admin', 'staff'),
  resumeUploader.single('resume'),
  validate(updateCandidateSchema),
  candidatesController.update
);

// Soft delete candidate (Subject to staff ownership rule)
router.delete('/:id', authenticate, requireRole('admin', 'staff'), candidatesController.remove);

// Authenticated private resume download stream
router.get('/:id/resume', authenticate, candidatesController.downloadResume);

module.exports = router;
