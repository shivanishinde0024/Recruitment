const prisma = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { recordAudit } = require('../../middleware/audit');
const { parsePagination, buildMeta } = require('../../utils/pagination');

async function listTrashItems(query) {
  const { module = 'all' } = query;
  const items = [];

  // 1. Companies in trash
  if (module === 'all' || module === 'companies') {
    const deletedCompanies = await prisma.companies.findMany({
      where: { deleted_at: { not: null } }
    });
    deletedCompanies.forEach(c => {
      items.push({
        id: String(c.id),
        module: 'companies',
        name: c.company_name,
        identifier: c.email || c.phone,
        deleted_at: c.deleted_at
      });
    });
  }

  // 2. Jobs in trash
  if (module === 'all' || module === 'jobs') {
    const deletedJobs = await prisma.jobs.findMany({
      where: { deleted_at: { not: null } },
      include: { company: true }
    });
    deletedJobs.forEach(j => {
      items.push({
        id: String(j.id),
        module: 'jobs',
        name: j.title,
        identifier: j.job_code,
        parent_name: j.company?.company_name || 'Unknown',
        deleted_at: j.deleted_at
      });
    });
  }

  // 3. Candidates in trash
  if (module === 'all' || module === 'candidates') {
    const deletedCandidates = await prisma.candidates.findMany({
      where: { deleted_at: { not: null } }
    });
    deletedCandidates.forEach(cand => {
      items.push({
        id: String(cand.id),
        module: 'candidates',
        name: `${cand.first_name} ${cand.last_name}`,
        identifier: cand.email,
        deleted_at: cand.deleted_at
      });
    });
  }

  // Sort by deletion timestamp descending
  items.sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const paginated = items.slice(skip, skip + limit);

  return {
    data: paginated,
    meta: buildMeta(items.length, page, limit)
  };
}

async function restoreItem({ module, id, currentUser, req = null }) {
  const recordId = BigInt(id);

  if (module === 'companies') {
    const company = await prisma.companies.findFirst({
      where: { id: recordId, deleted_at: { not: null } }
    });
    if (!company) {
      throw new ApiError(404, 'Deleted company not found in trash');
    }

    const restored = await prisma.companies.update({
      where: { id: recordId },
      data: { deleted_at: null }
    });

    // Also reactivate company user if linked
    if (company.user_id) {
      await prisma.users.updateMany({
        where: { id: company.user_id },
        data: { status: 'active', deleted_at: null }
      });
    }

    await recordAudit({
      userId: currentUser.id,
      action: 'restore',
      moduleName: 'companies',
      recordId: company.id,
      oldValue: { deleted_at: company.deleted_at },
      newValue: { deleted_at: null },
      req
    });

    return { id: String(restored.id), module, name: restored.company_name, restored: true };
  }

  if (module === 'jobs') {
    const job = await prisma.jobs.findFirst({
      where: { id: recordId, deleted_at: { not: null } }
    });
    if (!job) {
      throw new ApiError(404, 'Deleted job not found in trash');
    }

    // Dependency check: Ensure parent company is active
    if (job.company_id) {
      const parentCompany = await prisma.companies.findFirst({
        where: { id: job.company_id, deleted_at: null }
      });
      if (!parentCompany) {
        throw new ApiError(422, 'Cannot restore job whose client company is in trash. Please restore the company first.');
      }
    }

    const restored = await prisma.jobs.update({
      where: { id: recordId },
      data: { deleted_at: null }
    });

    await recordAudit({
      userId: currentUser.id,
      action: 'restore',
      moduleName: 'jobs',
      recordId: job.id,
      oldValue: { deleted_at: job.deleted_at },
      newValue: { deleted_at: null },
      req
    });

    return { id: String(restored.id), module, name: restored.title, restored: true };
  }

  if (module === 'candidates') {
    const candidate = await prisma.candidates.findFirst({
      where: { id: recordId, deleted_at: { not: null } }
    });
    if (!candidate) {
      throw new ApiError(404, 'Deleted candidate not found in trash');
    }

    const restored = await prisma.candidates.update({
      where: { id: recordId },
      data: { deleted_at: null }
    });

    await recordAudit({
      userId: currentUser.id,
      action: 'restore',
      moduleName: 'candidates',
      recordId: candidate.id,
      oldValue: { deleted_at: candidate.deleted_at },
      newValue: { deleted_at: null },
      req
    });

    return { id: String(restored.id), module, name: `${restored.first_name} ${restored.last_name}`, restored: true };
  }

  throw new ApiError(400, `Unsupported trash module: ${module}`);
}

async function permanentlyDeleteItem({ module, id, currentUser, req = null }) {
  const recordId = BigInt(id);

  if (module === 'companies') {
    const company = await prisma.companies.findFirst({
      where: { id: recordId, deleted_at: { not: null } }
    });
    if (!company) {
      throw new ApiError(404, 'Deleted company not found in trash');
    }
    await prisma.companies.delete({ where: { id: recordId } });
    await recordAudit({
      userId: currentUser.id,
      action: 'permanent_delete',
      moduleName: 'companies',
      recordId,
      oldValue: company,
      newValue: null,
      req
    });
    return { id: String(recordId), module, permanently_deleted: true };
  }

  if (module === 'jobs') {
    const job = await prisma.jobs.findFirst({
      where: { id: recordId, deleted_at: { not: null } }
    });
    if (!job) {
      throw new ApiError(404, 'Deleted job not found in trash');
    }
    await prisma.jobs.delete({ where: { id: recordId } });
    await recordAudit({
      userId: currentUser.id,
      action: 'permanent_delete',
      moduleName: 'jobs',
      recordId,
      oldValue: job,
      newValue: null,
      req
    });
    return { id: String(recordId), module, permanently_deleted: true };
  }

  if (module === 'candidates') {
    const candidate = await prisma.candidates.findFirst({
      where: { id: recordId, deleted_at: { not: null } }
    });
    if (!candidate) {
      throw new ApiError(404, 'Deleted candidate not found in trash');
    }
    await prisma.candidates.delete({ where: { id: recordId } });
    await recordAudit({
      userId: currentUser.id,
      action: 'permanent_delete',
      moduleName: 'candidates',
      recordId,
      oldValue: candidate,
      newValue: null,
      req
    });
    return { id: String(recordId), module, permanently_deleted: true };
  }

  throw new ApiError(400, `Unsupported trash module: ${module}`);
}

module.exports = {
  listTrashItems,
  restoreItem,
  permanentlyDeleteItem
};

