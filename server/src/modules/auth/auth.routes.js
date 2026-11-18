const express = require('express');
const router = express.Router();

const authController = require('./auth.controller');
const { authenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema
} = require('./auth.schema');
const { createUploader } = require('../../middleware/upload');
const { companyRegisterSchema } = require('../companies/companies.schema');
const companiesController = require('../companies/companies.controller');

const docUploader = createUploader('doc');
const registerUpload = docUploader.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'gst_doc', maxCount: 1 },
  { name: 'pan_doc', maxCount: 1 },
  { name: 'incorporation_doc', maxCount: 1 }
]);

// Public endpoints
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/register-company', registerUpload, validate(companyRegisterSchema), companiesController.register);
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/logout', asyncHandler(authController.logout));
router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(authController.forgotPassword));
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(authController.resetPassword));

// Authenticated endpoints
router.get('/me', authenticate, asyncHandler(authController.getMe));
router.put('/me', authenticate, validate(updateProfileSchema), asyncHandler(authController.updateMe));
router.post('/change-password', authenticate, validate(changePasswordSchema), asyncHandler(authController.changePassword));

module.exports = router;
