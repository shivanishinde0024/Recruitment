const express = require('express');
const router = express.Router();

const mastersController = require('./masters.controller');
const { authenticate, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { masterCreateSchema, masterUpdateSchema } = require('./masters.schema');

// Any authenticated user can query master lists (for dropdowns and forms)
router.get('/:type', authenticate, asyncHandler(mastersController.list));

// Admin-only management endpoints
router.get('/:type/:id', authenticate, requireRole('admin'), asyncHandler(mastersController.getById));
router.post('/:type', authenticate, requireRole('admin'), validate(masterCreateSchema), asyncHandler(mastersController.create));
router.put('/:type/:id', authenticate, requireRole('admin'), validate(masterUpdateSchema), asyncHandler(mastersController.update));
router.patch('/:type/:id/toggle', authenticate, requireRole('admin'), asyncHandler(mastersController.toggle));
router.delete('/:type/:id', authenticate, requireRole('admin'), asyncHandler(mastersController.remove));

module.exports = router;
