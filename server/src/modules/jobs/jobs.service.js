const prisma = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { recordAudit } = require('../../middleware/audit');
const { notify } = require('../../services/notify.service');
const { generateJobCode } = require('./jobCode.service');

async function createJob(data, currentUser, req = null) {
  let targetCompanyId;

  if (currentUser.role === 'company') {
    targetCompanyId = BigInt(currentUser.companyId);
    // Ruling 3.1 & Flow F1: Check company approval status
    const comp = await prisma.companies.findFirst({
      where: { id: targetCompanyId, deleted_at: null }
    });
    if (!comp || comp.status !== 'approved') {
      throw new ApiError(403, 'Your company profile is not approved. Job posting is restricted until verification is complete.');
    }
  } else {
    if (!data.company_id) {
      throw new ApiError(400, 'Company ID is required when creating a job as admin or staff');
    }
    targetCompanyId = BigInt(data.company_id);
    const comp = await prisma.companies.findFirst({
      where: { id: targetCompanyId, deleted_at: null }
    });
    if (!comp) {
      throw new ApiError(404, 'Company not found');
    }
    if (comp.status !== 'approved') {
      throw new ApiError(422, `Cannot create jobs for company with status '${comp.status}'. Company must be approved.`);
    }
  }

  // Generate Concurrency-Safe Job Code
  const jobCode = await generateJobCode();

  const { skills = [], ...jobPayload } = data;

  const job = await prisma.$transaction(async (tx) => {
    const created = await tx.jobs.create({
      data: {
        company_id: targetCompanyId,
        job_code: jobCode,
        title: jobPayload.title.trim(),
        job_category_id: jobPayload.job_category_id ? BigInt(jobPayload.job_category_id) : null,
        employment_type_id: jobPayload.employment_type_id ? BigInt(jobPayload.employment_type_id) : null,
        qualification_id: jobPayload.qualification_id ? BigInt(jobPayload.qualification_id) : null,
        experience_min: jobPayload.experience_min ?? 0,
        experience_max: jobPayload.experience_max ?? 0,
        salary_min: jobPayload.salary_min != null ? jobPayload.salary_min : null,
        salary_max: jobPayload.salary_max != null ? jobPayload.salary_max : null,
        salary_negotiable: Boolean(jobPayload.salary_negotiable),
        positions_required: parseInt(jobPayload.positions_required, 10) || 1,
        last_date: jobPayload.last_date ? new Date(jobPayload.last_date) : null,
        country_id: jobPayload.country_id ? BigInt(jobPayload.country_id) : null,
        state_id: jobPayload.state_id ? BigInt(jobPayload.state_id) : null,
        city_id: jobPayload.city_id ? BigInt(jobPayload.city_id) : null,
        description: jobPayload.description || null,
        responsibilities: jobPayload.responsibilities || null,
        benefits: jobPayload.benefits || null,
        status: 'open'
      }
    });

    if (skills && skills.length > 0) {
      for (const s of skills) {
        await tx.job_skills.create({
          data: {
            job_id: created.id,
            skill_id: BigInt(s.skill_id),
            is_mandatory: Boolean(s.is_mandatory)
          }
        });
      }
    }

    return created;
  });

  // Notify Admin and Staff of newly posted job (Flow F4)
  if (currentUser.role === 'company') {
    const staffAndAdmins = await prisma.users.findMany({
      where: { role: { in: ['admin', 'staff'] }, status: 'active', deleted_at: null },
      select: { id: true }
    });
    await notify({
      userIds: staffAndAdmins.map((u) => u.id),
      type: 'job_posted_admin',
      title: 'New Job Requirement Posted',
      message: `A new job '${job.title}' (${job.job_code}) was posted and requires staff assignment.`,
      refType: 'job',
      refId: job.id
    });
  }

  await recordAudit({
    userId: currentUser.id,
    action: 'create',
    moduleName: 'jobs',
    recordId: job.id,
    newValue: { title: job.title, job_code: job.job_code, company_id: targetCompanyId },
    req
  });

  return getJobById(job.id, currentUser);
}

async function listJobs(query = {}, currentUser) {
  const { page, limit, skip, take } = parsePagination(query, 10, 100);

  const where = {
    deleted_at: null
  };

  // Multi-tenant boundary
  if (currentUser?.role === 'company') {
    where.company_id = BigInt(currentUser.companyId);
  } else if (query.companyId) {
    where.company_id = BigInt(query.companyId);
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.assignedTo) {
    where.assigned_to = BigInt(query.assignedTo);
  }

  if (query.search) {
    where.OR = [
      { title: { startsWith: query.search } },
      { job_code: { startsWith: query.search } }
    ];
  }

  const [items, total] = await Promise.all([
    prisma.jobs.findMany({
      where,
      skip,
      take,
      include: {
        company: true,
        job_category: true,
        employment_type: true,
        assigned_user: { select: { id: true, name: true, email: true } },
        skills: { include: { skill: true } }
      },
      orderBy: { created_at: 'desc' }
    }),
    prisma.jobs.count({ where })
  ]);

  // Attach computed counts (submitted, confirmed, remaining)
  const enrichedItems = await Promise.all(
    items.map(async (job) => {
      const counts = await computeJobMetrics(job.id, job.positions_required);
      const titleStr = job.custom_title || (typeof job.title === 'string' ? job.title : job.title?.name) || 'Untitled Job';
      return {
        ...job,
        title: titleStr,
        ...counts
      };
    })
  );

  return {
    items: enrichedItems,
    meta: buildMeta(page, limit, total)
  };
}

async function getJobById(id, currentUser) {
  const jobId = BigInt(id);

  const job = await prisma.jobs.findFirst({
    where: { id: jobId, deleted_at: null },
    include: {
      company: true,
      job_category: true,
      employment_type: true,
      qualification: true,
      assigned_user: { select: { id: true, name: true, email: true } },
      skills: { include: { skill: true } }
    }
  });

  if (!job) {
    throw new ApiError(404, 'Job requirement not found');
  }

  // IDOR multi-tenant check
  if (currentUser?.role === 'company' && String(job.company_id) !== String(currentUser.companyId)) {
    throw new ApiError(404, 'Job requirement not found');
  }

  const counts = await computeJobMetrics(jobId, job.positions_required);
  const titleStr = job.custom_title || (typeof job.title === 'string' ? job.title : job.title?.name) || 'Untitled Job';

  return {
    ...job,
    title: titleStr,
    ...counts
  };
}

async function computeJobMetrics(jobId, positionsRequired = 1) {
  const candidateMappings = await prisma.job_candidates.findMany({
    where: { job_id: jobId, deleted_at: null }
  });

  const submitted_count = candidateMappings.length;
  const confirmed_count = candidateMappings.filter((m) => m.status === 'confirmed').length;
  const remaining_count = Math.max(0, positionsRequired - confirmed_count);

  return {
    submitted_count,
    confirmed_count,
    remaining_count
  };
}

async function updateJob(id, data, currentUser, req = null) {
  const jobId = BigInt(id);
  const existing = await prisma.jobs.findFirst({
    where: { id: jobId, deleted_at: null }
  });

  if (!existing) {
    throw new ApiError(404, 'Job not found');
  }

  if (currentUser?.role === 'company' && String(existing.company_id) !== String(currentUser.companyId)) {
    throw new ApiError(404, 'Job not found');
  }

  // Position reduction guard (REQ-JOB-06 / Ruling 3.1)
  if (data.positions_required != null) {
    const { confirmed_count } = await computeJobMetrics(jobId, existing.positions_required);
    if (data.positions_required < confirmed_count) {
      throw new ApiError(
        422,
        `Cannot reduce positions required (${data.positions_required}) below already confirmed candidates count (${confirmed_count})`
      );
    }
  }

  const { skills, ...payload } = data;

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.jobs.update({
      where: { id: jobId },
      data: {
        ...payload,
        updated_at: new Date()
      }
    });

    if (skills) {
      await tx.job_skills.deleteMany({ where: { job_id: jobId } });
      for (const s of skills) {
        await tx.job_skills.create({
          data: {
            job_id: jobId,
            skill_id: BigInt(s.skill_id),
            is_mandatory: Boolean(s.is_mandatory)
          }
        });
      }
    }

    return res;
  });

  await recordAudit({
    userId: currentUser.id,
    action: 'update',
    moduleName: 'jobs',
    recordId: jobId,
    oldValue: existing,
    newValue: updated,
    req
  });

  return getJobById(jobId, currentUser);
}

async function updateJobStatus(id, { status }, currentUser, req = null) {
  const jobId = BigInt(id);
  const existing = await prisma.jobs.findFirst({
    where: { id: jobId, deleted_at: null }
  });

  if (!existing) {
    throw new ApiError(404, 'Job not found');
  }

  if (currentUser?.role === 'company' && String(existing.company_id) !== String(currentUser.companyId)) {
    throw new ApiError(404, 'Job not found');
  }

  const updated = await prisma.jobs.update({
    where: { id: jobId },
    data: { status, updated_at: new Date() }
  });

  await recordAudit({
    userId: currentUser.id,
    action: 'status_change',
    moduleName: 'jobs',
    recordId: jobId,
    oldValue: { status: existing.status },
    newValue: { status },
    req
  });

  return getJobById(jobId, currentUser);
}

async function assignStaff(id, { assigned_to }, currentUser, req = null) {
  const jobId = BigInt(id);
  const staffUserId = BigInt(assigned_to);

  const [job, staffUser] = await Promise.all([
    prisma.jobs.findFirst({ where: { id: jobId, deleted_at: null } }),
    prisma.users.findFirst({ where: { id: staffUserId, deleted_at: null } })
  ]);

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  if (!staffUser || !['admin', 'staff'].includes(staffUser.role) || staffUser.status !== 'active') {
    throw new ApiError(422, 'Assigned user must be an active staff member or administrator');
  }

  const updated = await prisma.jobs.update({
    where: { id: jobId },
    data: { assigned_to: staffUserId, updated_at: new Date() }
  });

  // Notify assigned staff member (Flow F5)
  await notify({
    userIds: [staffUserId],
    type: 'job_assigned_staff',
    title: 'New Job Requirement Assigned',
    message: `You have been assigned to source and map candidates for job '${job.title}' (${job.job_code}).`,
    refType: 'job',
    refId: jobId,
    email: {
      to: staffUser.email,
      subject: `Assigned to Job: ${job.title} (${job.job_code})`
    }
  });

  await recordAudit({
    userId: currentUser.id,
    action: 'assign',
    moduleName: 'jobs',
    recordId: jobId,
    oldValue: { assigned_to: job.assigned_to },
    newValue: { assigned_to: staffUserId },
    req
  });

  return getJobById(jobId, currentUser);
}

async function deleteJob(id, currentUser, req = null) {
  const jobId = BigInt(id);
  const job = await prisma.jobs.findFirst({
    where: { id: jobId, deleted_at: null }
  });

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  if (currentUser?.role === 'company' && String(job.company_id) !== String(currentUser.companyId)) {
    throw new ApiError(404, 'Job not found');
  }

  await prisma.jobs.update({
    where: { id: jobId },
    data: { deleted_at: new Date(), status: 'closed' }
  });

  await recordAudit({
    userId: currentUser.id,
    action: 'delete',
    moduleName: 'jobs',
    recordId: jobId,
    oldValue: job,
    req
  });

  return { success: true, message: `Job requirement '${job.job_code}' closed and removed successfully` };
}

module.exports = {
  createJob,
  listJobs,
  getJobById,
  updateJob,
  updateJobStatus,
  assignStaff,
  deleteJob
};

