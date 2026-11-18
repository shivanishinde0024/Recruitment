const express = require('express');
const router = express.Router();

const { authenticate, requireRole } = require('../../middleware/auth');
const trashController = require('./trash.controller');

// Trash management is restricted to Admin
router.use(authenticate, requireRole('admin'));

router.get('/', trashController.listTrashItemsHandler);
router.patch('/:module/:id/restore', trashController.restoreItemHandler);
router.delete('/:module/:id/permanent', trashController.permanentlyDeleteItemHandler);

module.exports = router;

