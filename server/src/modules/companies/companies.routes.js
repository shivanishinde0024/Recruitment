const express = require('express');
const { authenticate, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { createUploader } = require('../../middleware/upload');
const {
  companyRegisterSchema,
  companyVerifySchema,
  companyUpdateSchema
} = require('./companies.schema');
const companiesController = require('./companies.controller');

const router = express.Router();
const docUploader = createUploader('doc');

const registerUpload = docUploader.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'gst_doc', maxCount: 1 },
  { name: 'pan_doc', maxCount: 1 },
  { name: 'incorporation_doc', maxCount: 1 }
]);

// Public company registration endpoint
router.post('/register', registerUpload, validate(companyRegisterSchema), companiesController.register);

// Admin & Staff directory listing
router.get('/', authenticate, requireRole('admin', 'staff'), companiesController.list);

// Profile detail view (Admin, Staff, or company owner)
router.get('/:id', authenticate, companiesController.getById);

// Update company profile details
router.put('/:id', authenticate, validate(companyUpdateSchema), companiesController.update);

// Verification workflow (Admin & Staff) - Strictly checks remark on reject/need_info/suspend
router.patch('/:id/verify', authenticate, requireRole('admin', 'staff'), validate(companyVerifySchema), companiesController.verify);

// Upload document attachment
router.post('/:id/documents', authenticate, docUploader.single('file'), companiesController.addDocument);

// Download document attachment
router.get('/:id/documents/:docId/download', authenticate, companiesController.downloadDocument);

// Soft delete company (Admin only)
router.delete('/:id', authenticate, requireRole('admin'), companiesController.remove);

module.exports = router;
