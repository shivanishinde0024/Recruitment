const express = require('express');
const router = express.Router();

const usersController = require('./users.controller');
const { authenticate, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { userCreateSchema, userUpdateSchema, userStatusSchema } = require('./users.schema');

// All user management routes are restricted strictly to Administrator role
router.use(authenticate, requireRole('admin'));

router.get('/', asyncHandler(usersController.list));
router.get('/:id', asyncHandler(usersController.getById));
router.post('/', validate(userCreateSchema), asyncHandler(usersController.create));
router.put('/:id', validate(userUpdateSchema), asyncHandler(usersController.update));
router.patch('/:id/status', validate(userStatusSchema), asyncHandler(usersController.updateStatus));
router.delete('/:id', asyncHandler(usersController.remove));

module.exports = router;

