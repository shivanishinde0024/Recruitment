const prisma = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildMeta } = require('../../utils/pagination');

async function listAuditLogs(query) {
  const { page, limit, skip } = parsePagination(query);

  const where = {};
  if (query.module) {
    where.module = query.module;
  }
  if (query.action) {
    where.action = query.action;
  }
  if (query.user_id) {
    where.user_id = BigInt(query.user_id);
  }

  const [logs, total] = await Promise.all([
    prisma.audit_logs.findMany({
      where,
      include: {
        user: true
      },
      orderBy: { id: 'desc' },
      skip,
      take: limit
    }),
    prisma.audit_logs.count({ where })
  ]);

  const formatted = logs.map((l) => ({
    id: String(l.id),
    user_id: l.user_id ? String(l.user_id) : null,
    user: l.user
      ? {
          id: String(l.user.id),
          name: l.user.name,
          email: l.user.email,
          role: l.user.role
        }
      : null,
    action: l.action,
    module: l.module,
    record_id: l.record_id ? String(l.record_id) : null,
    old_value: l.old_value,
    new_value: l.new_value,
    ip: l.ip,
    user_agent: l.user_agent,
    created_at: l.created_at
  }));

  return {
    data: formatted,
    meta: buildMeta(total, page, limit)
  };
}

async function getAuditLogById(id) {
  const logId = BigInt(id);
  const log = await prisma.audit_logs.findFirst({
    where: { id: logId },
    include: {
      user: true
    }
  });

  if (!log) {
    throw new ApiError(404, 'Audit log entry not found');
  }

  return {
    id: String(log.id),
    user_id: log.user_id ? String(log.user_id) : null,
    user: log.user
      ? {
          id: String(log.user.id),
          name: log.user.name,
          email: log.user.email,
          role: log.user.role
        }
      : null,
    action: log.action,
    module: log.module,
    record_id: log.record_id ? String(log.record_id) : null,
    old_value: log.old_value,
    new_value: log.new_value,
    ip: log.ip,
    user_agent: log.user_agent,
    created_at: log.created_at
  };
}

module.exports = {
  listAuditLogs,
  getAuditLogById
};
