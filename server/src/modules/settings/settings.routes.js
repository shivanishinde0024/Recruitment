const express = require('express');
const router = express.Router();

const { authenticate, requireRole } = require('../../middleware/auth');
const settingsController = require('./settings.controller');

// System settings are restricted to Admin
router.use(authenticate, requireRole('admin'));

router.get('/', settingsController.getAllSettingsHandler);
router.put('/', settingsController.updateSettingsHandler);
router.post('/test-email', settingsController.sendTestEmailHandler);

module.exports = router;

