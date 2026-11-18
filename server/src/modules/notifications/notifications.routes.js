const express = require('express');
const router = express.Router();

const notificationsController = require('./notifications.controller');
const { authenticate } = require('../../middleware/auth');
const asyncHandler = require('../../utils/asyncHandler');

router.use(authenticate);

router.get('/', asyncHandler(notificationsController.list));
router.get('/unread-count', asyncHandler(notificationsController.getUnreadCount));
router.patch('/:id/read', asyncHandler(notificationsController.markRead));
router.patch('/read-all', asyncHandler(notificationsController.markAllRead));

module.exports = router;
