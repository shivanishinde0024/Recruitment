const prisma = require('../../config/db');
const MASTERS_CONFIG = require('./masters.config');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { recordAudit } = require('../../middleware/audit');

function getConfig(type) {
  const config = MASTERS_CONFIG[type];
  if (!config) {
    throw new ApiError(404, `Master entity '${type}' is not recognized`);
  }
  return config;
}

async function listMasters(type, query = {}) {
  const config = getConfig(type);
  const model = prisma[config.model];

  const { page, limit, skip, take } = parsePagination(query, 50, 500);

  const where = {
    deleted_at: null
  };

  if (query.isActive !== undefined) {
    where.is_active = query.isActive === 'true' || query.isActive === true;
  }

  if (query.search) {
    where.name = { startsWith: query.search };
  }

  if (config.parentKey && query.parentId) {
    where[config.parentKey] = parseInt(query.parentId, 10);
  }

  const [items, total] = await Promise.all([
    model.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' }
    }),
    model.count({ where })
  ]);

  return {
    items,
    meta: buildMeta(page, limit, total)
  };
}

async function getMasterById(type, id) {
  const config = getConfig(type);
  const parsedId = parseInt(id, 10);

  const record = await prisma[config.model].findFirst({
    where: { id: parsedId, deleted_at: null }
  });

  if (!record) {
    throw new ApiError(404, `${type} record with ID ${id} not found`);
  }

  return record;
}

async function createMaster(type, data, req = null) {
  const config = getConfig(type);
  const model = prisma[config.model];

  const payload = {
    name: data.name.trim(),
    is_active: data.isActive !== undefined ? data.isActive : true
  };

  if (config.parentKey && data.parentId) {
    payload[config.parentKey] = data.parentId;
  }
  if (config.hasYears) {
    if (data.minYears !== undefined) payload.min_years = data.minYears;
    if (data.maxYears !== undefined) payload.max_years = data.maxYears;
  }
  if (data.isoCode) {
    payload.iso_code = data.isoCode.toUpperCase();
  }

  const created = await model.create({
    data: payload
  });

  await recordAudit({
    userId: req?.user?.id,
    action: 'create',
    moduleName: `masters:${type}`,
    recordId: created.id,
    newValue: created,
    req
  });

  return created;
}

async function updateMaster(type, id, data, req = null) {
  const config = getConfig(type);
  const parsedId = parseInt(id, 10);
  const model = prisma[config.model];

  const existing = await getMasterById(type, parsedId);

  const payload = {};
  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.isActive !== undefined) payload.is_active = data.isActive;
  if (config.parentKey && data.parentId !== undefined) payload[config.parentKey] = data.parentId;
  if (data.isoCode !== undefined) payload.iso_code = data.isoCode.toUpperCase();

  const updated = await model.update({
    where: { id: parsedId },
    data: payload
  });

  await recordAudit({
    userId: req?.user?.id,
    action: 'update',
    moduleName: `masters:${type}`,
    recordId: parsedId,
    oldValue: existing,
    newValue: updated,
    req
  });

  return updated;
}

async function toggleMaster(type, id, req = null) {
  const config = getConfig(type);
  const parsedId = parseInt(id, 10);
  const existing = await getMasterById(type, parsedId);

  const updated = await prisma[config.model].update({
    where: { id: parsedId },
    data: { is_active: !existing.is_active }
  });

  await recordAudit({
    userId: req?.user?.id,
    action: 'status_change',
    moduleName: `masters:${type}`,
    recordId: parsedId,
    oldValue: { is_active: existing.is_active },
    newValue: { is_active: updated.is_active },
    req
  });

  return updated;
}

async function deleteMaster(type, id, req = null) {
  const config = getConfig(type);
  const parsedId = parseInt(id, 10);
  const existing = await getMasterById(type, parsedId);

  // CRITICAL GUARD: Check if in use before deleting (REQ-MST-02 / Exit Gate)
  if (config.checkInUse) {
    const inUseMessage = await config.checkInUse(prisma, parsedId);
    if (inUseMessage) {
      throw new ApiError(422, `Cannot delete ${type}: ${inUseMessage}`);
    }
  }

  // Soft delete
  await prisma[config.model].update({
    where: { id: parsedId },
    data: { deleted_at: new Date() }
  });

  await recordAudit({
    userId: req?.user?.id,
    action: 'delete',
    moduleName: `masters:${type}`,
    recordId: parsedId,
    oldValue: existing,
    req
  });

  return { success: true, message: `${type} item deleted successfully` };
}

module.exports = {
  listMasters,
  getMasterById,
  createMaster,
  updateMaster,
  toggleMaster,
  deleteMaster
};

