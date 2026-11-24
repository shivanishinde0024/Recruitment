const express = require('express');
const router = express.Router();

const mastersController = require('./masters.controller');
const { authenticate, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { masterCreateSchema, masterUpdateSchema } = require('./masters.schema');

// Master types permitted for public registration and cascading location forms
const PUBLIC_MASTER_TYPES = new Set([
  'industries',
  'company-types',
  'countries',
  'states',
  'cities'
]);

const authenticateDropdownRead = (req, res, next) => {
  if (PUBLIC_MASTER_TYPES.has(req.params.type)) {
    const token = req.cookies?.access_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null);
    if (!token) {
      return next();
    }
    return authenticate(req, res, () => {
      // For public dropdowns, ignore invalid/expired tokens and proceed unauthenticated
      next();
    });
  }
  return authenticate(req, res, next);
};

// Query master lists (public for registration types, authenticated for others)
router.get('/:type', authenticateDropdownRead, asyncHandler(mastersController.list));

// Admin-only management endpoints
router.get('/:type/:id', authenticate, requireRole('admin'), asyncHandler(mastersController.getById));
router.post('/:type', authenticate, requireRole('admin'), validate(masterCreateSchema), asyncHandler(mastersController.create));
router.put('/:type/:id', authenticate, requireRole('admin'), validate(masterUpdateSchema), asyncHandler(mastersController.update));
router.patch('/:type/:id/toggle', authenticate, requireRole('admin'), asyncHandler(mastersController.toggle));
router.delete('/:type/:id', authenticate, requireRole('admin'), asyncHandler(mastersController.remove));

module.exports = router;

