const auditService = require('./audit.service');
const { ok } = require('../../utils/response');

async function listAuditLogsHandler(req, res, next) {
  try {
    const result = await auditService.listAuditLogs(req.query);
    return ok(res, result.data, 'Audit logs retrieved successfully', 200, result.meta);
  } catch (err) {
    next(err);
  }
}

async function getAuditLogByIdHandler(req, res, next) {
  try {
    const data = await auditService.getAuditLogById(req.params.id);
    return ok(res, data, 'Audit log details retrieved successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAuditLogsHandler,
  getAuditLogByIdHandler
};

