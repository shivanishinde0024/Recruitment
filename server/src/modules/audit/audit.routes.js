const express = require('express');
const router = express.Router();

const { authenticate, requireRole } = require('../../middleware/auth');
const auditController = require('./audit.controller');

// Audit logs are strictly restricted to Admin role
router.use(authenticate, requireRole('admin'));

router.get('/', auditController.listAuditLogsHandler);
router.get('/:id', auditController.getAuditLogByIdHandler);

module.exports = router;

