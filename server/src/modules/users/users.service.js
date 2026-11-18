const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../../config/db');
const { BCRYPT_ROUNDS } = require('../../config/env');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { recordAudit } = require('../../middleware/audit');

async function listUsers(query = {}) {
  const { page, limit, skip, take } = parsePagination(query, 10, 100);

  const where = {
    deleted_at: null
  };

  if (query.role) {
    where.role = query.role;
  } else {
    // By default list admin and staff in user management
    where.role = { in: ['admin', 'staff'] };
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.OR = [
      { name: { startsWith: query.search } },
      { email: { startsWith: query.search } }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.users.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: 'desc' }
    }),
    prisma.users.count({ where })
  ]);

  // Strip password hashes from response
  const sanitized = users.map((u) => {
    const { password_hash, ...rest } = u; // eslint-disable-line no-unused-vars
    return rest;
  });

  return {
    items: sanitized,
    meta: buildMeta(page, limit, total)
  };
}

async function getUserById(id) {
  const userId = BigInt(id);
  const user = await prisma.users.findFirst({
    where: { id: userId, deleted_at: null }
  });

  if (!user) {
    throw new ApiError(404, `User with ID ${id} not found`);
  }

  const { password_hash, ...rest } = user; // eslint-disable-line no-unused-vars
  return rest;
}

async function createUser(data, req = null) {
  const email = data.email.toLowerCase().trim();

  const existing = await prisma.users.findFirst({
    where: { email, deleted_at: null }
  });

  if (existing) {
    throw new ApiError(409, `User with email ${email} already exists`);
  }

  const rawPassword = data.password || crypto.randomBytes(8).toString('hex') + 'A1!';
  const passwordHash = await bcrypt.hash(rawPassword, BCRYPT_ROUNDS);

  const user = await prisma.users.create({
    data: {
      name: data.name.trim(),
      email,
      mobile: data.mobile || null,
      password_hash: passwordHash,
      role: data.role,
      status: 'active'
    }
  });

  await recordAudit({
    userId: req?.user?.id,
    action: 'create',
    moduleName: 'users',
    recordId: user.id,
    newValue: { email: user.email, role: user.role, name: user.name },
    req
  });

  const { password_hash, ...rest } = user; // eslint-disable-line no-unused-vars
  return {
    ...rest,
    temporaryPassword: !data.password ? rawPassword : undefined
  };
}

async function updateUser(id, data, req = null) {
  const userId = BigInt(id);
  const existing = await getUserById(userId);

  const payload = {};
  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.mobile !== undefined) payload.mobile = data.mobile;
  if (data.role !== undefined) payload.role = data.role;

  if (data.email) {
    const email = data.email.toLowerCase().trim();
    if (email !== existing.email) {
      const conflict = await prisma.users.findFirst({
        where: { email, deleted_at: null, id: { not: userId } }
      });
      if (conflict) throw new ApiError(409, `Email ${email} is already taken`);
      payload.email = email;
    }
  }

  const updated = await prisma.users.update({
    where: { id: userId },
    data: payload
  });

  await recordAudit({
    userId: req?.user?.id,
    action: 'update',
    moduleName: 'users',
    recordId: userId,
    oldValue: existing,
    newValue: updated,
    req
  });

  const { password_hash, ...rest } = updated; // eslint-disable-line no-unused-vars
  return rest;
}

async function updateUserStatus(id, newStatus, currentAdminId, req = null) {
  const targetId = BigInt(id);
  const adminId = BigInt(currentAdminId);

  // Guard 1: Cannot change status of yourself
  if (targetId === adminId) {
    throw new ApiError(422, 'Cannot alter status or deactivate your own administrator account');
  }

  const user = await prisma.users.findFirst({
    where: { id: targetId, deleted_at: null }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Guard 2: Last Active Admin Protection (Rule 18 / Master §8.2)
  if (user.role === 'admin' && newStatus !== 'active') {
    const activeAdminCount = await prisma.users.count({
      where: { role: 'admin', status: 'active', deleted_at: null }
    });
    if (activeAdminCount <= 1) {
      throw new ApiError(422, 'Action blocked: System must maintain at least one active administrator account');
    }
  }

  const updated = await prisma.users.update({
    where: { id: targetId },
    data: { status: newStatus }
  });

  // If deactivated or blocked, immediately invalidate all refresh sessions
  if (newStatus !== 'active') {
    await prisma.refresh_tokens.updateMany({
      where: { user_id: targetId, revoked_at: null },
      data: { revoked_at: new Date() }
    });
  }

  await recordAudit({
    userId: adminId,
    action: 'status_change',
    moduleName: 'users',
    recordId: targetId,
    oldValue: { status: user.status },
    newValue: { status: newStatus },
    req
  });

  const { password_hash, ...rest } = updated; // eslint-disable-line no-unused-vars
  return rest;
}

async function deleteUser(id, currentAdminId, req = null) {
  const targetId = BigInt(id);
  const adminId = BigInt(currentAdminId);

  // Guard 1: Cannot delete self
  if (targetId === adminId) {
    throw new ApiError(422, 'Cannot delete your own administrator account');
  }

  const user = await prisma.users.findFirst({
    where: { id: targetId, deleted_at: null }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Guard 2: Last Active Admin Protection
  if (user.role === 'admin') {
    const activeAdminCount = await prisma.users.count({
      where: { role: 'admin', status: 'active', deleted_at: null }
    });
    if (activeAdminCount <= 1) {
      throw new ApiError(422, 'Action blocked: Cannot delete the last active administrator');
    }
  }

  // Guard 3: Reassign open jobs if staff (Rule 18 / Section 10.7)
  const openJobsAssigned = await prisma.jobs.count({
    where: {
      assigned_staff_id: targetId,
      status: { in: ['open', 'in_progress'] },
      deleted_at: null
    }
  });

  if (openJobsAssigned > 0) {
    // Auto-unassign or block
    await prisma.jobs.updateMany({
      where: { assigned_staff_id: targetId, deleted_at: null },
      data: { assigned_staff_id: null }
    });
  }

  // Soft delete and revoke sessions
  await prisma.$transaction([
    prisma.users.update({
      where: { id: targetId },
      data: { deleted_at: new Date(), status: 'inactive' }
    }),
    prisma.refresh_tokens.updateMany({
      where: { user_id: targetId, revoked_at: null },
      data: { revoked_at: new Date() }
    })
  ]);

  await recordAudit({
    userId: adminId,
    action: 'delete',
    moduleName: 'users',
    recordId: targetId,
    oldValue: { name: user.name, email: user.email, role: user.role },
    req
  });

  return { success: true, message: `User ${user.name} deleted successfully` };
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser
};

