const prisma = require('../config/db');

function sanitizeAuditData(data) {
  if (!data || typeof data !== 'object') return data;
  const clone = Array.isArray(data) ? [...data] : { ...data };
  const sensitiveKeys = ['password', 'password_hash', 'token', 'token_hash', 'refresh_token', 'accessToken'];

  for (const key of Object.keys(clone)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      clone[key] = '[REDACTED]';
    } else if (typeof clone[key] === 'object' && clone[key] !== null) {
      clone[key] = sanitizeAuditData(clone[key]);
    }
  }
  return clone;
}

/**
 * Audit logger helper for recording system modifications.
 */
async function recordAudit({ userId, action, moduleName, recordId, oldValue, newValue, req }) {
  try {
    const ip = req?.ip || req?.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req?.headers?.['user-agent'] || 'System';

    await prisma.audit_logs.create({
      data: {
        user_id: userId ? BigInt(userId) : null,
        action,
        module: moduleName,
        record_id: recordId ? BigInt(recordId) : null,
        old_value: oldValue ? sanitizeAuditData(oldValue) : null,
        new_value: newValue ? sanitizeAuditData(newValue) : null,
        ip: ip.substring(0, 45),
        user_agent: userAgent.substring(0, 255)
      }
    });
  } catch (err) {
    // Non-blocking logger error: log to console without crashing user request
    console.error('Audit log write error:', err.message);
  }
}

module.exports = {
  recordAudit,
  sanitizeAuditData
};
