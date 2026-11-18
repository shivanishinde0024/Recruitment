const path = require('path');
const fs = require('fs');
const prisma = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { recordAudit } = require('../../middleware/audit');

async function createCandidate(data, file = null, currentUser, req = null) {
  const email = data.email.toLowerCase().trim();
  const mobile = data.mobile.trim();

  // Duplicate Check on Email OR Mobile (Ruling 3.4 / REQ-CND-02)
  const existing = await prisma.candidates.findFirst({
    where: {
      OR: [{ email }, { mobile }],
      deleted_at: null
    }
  });

  if (existing) {
    const field = existing.email === email ? `email '${email}'` : `mobile '${mobile}'`;
    throw new ApiError(409, `A candidate with ${field} is already registered in the system`);
  }

  const { skills = [], ...fields } = data;
  const resume_path = file ? file.path : null;

  const candidate = await prisma.$transaction(async (tx) => {
    const created = await tx.candidates.create({
      data: {
        name: fields.name.trim(),
        email,
        mobile,
        gender: fields.gender || null,
        dob: fields.dob ? new Date(fields.dob) : null,
        qualification_id: fields.qualification_id ? BigInt(fields.qualification_id) : null,
        experience_years: fields.experience_years ?? 0,
        current_company: fields.current_company ? fields.current_company.trim() : null,
        current_designation: fields.current_designation ? fields.current_designation.trim() : null,
        current_salary: fields.current_salary != null ? fields.current_salary : null,
        expected_salary: fields.expected_salary != null ? fields.expected_salary : null,
        notice_period_days: fields.notice_period_days ?? 30,
        resume_path,
        address: fields.address || null,
        country_id: fields.country_id ? BigInt(fields.country_id) : null,
        state_id: fields.state_id ? BigInt(fields.state_id) : null,
        city_id: fields.city_id ? BigInt(fields.city_id) : null,
        pincode: fields.pincode ? fields.pincode.trim() : null,
        source_id: fields.source_id ? BigInt(fields.source_id) : null,
        uploaded_by: currentUser.id,
        status: 'available'
      }
    });

    if (skills && skills.length > 0) {
      for (const s of skills) {
        await tx.candidate_skills.create({
          data: {
            candidate_id: created.id,
            skill_id: BigInt(s.skill_id),
            rating: s.rating || 3
          }
        });
      }
    }

    return created;
  });

  await recordAudit({
    userId: currentUser.id,
    action: 'create',
    moduleName: 'candidates',
    recordId: candidate.id,
    newValue: { name: candidate.name, email: candidate.email, mobile: candidate.mobile },
    req
  });

  return getCandidateById(candidate.id, currentUser);
}

async function listCandidates(query = {}, currentUser) {
  const { page, limit, skip, take } = parsePagination(query, 10, 100);

  const where = {
    deleted_at: null
  };

  // Multi-tenant company restriction
  if (currentUser?.role === 'company') {
    const mappedCandidates = await prisma.job_candidates.findMany({
      where: {
        job: { company_id: BigInt(currentUser.companyId) },
        deleted_at: null
      },
      select: { candidate_id: true }
    });
    const candidateIds = mappedCandidates.map((m) => m.candidate_id);
    where.id = { in: candidateIds };
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.sourceId) {
    where.source_id = BigInt(query.sourceId);
  }

  if (query.qualificationId) {
    where.qualification_id = BigInt(query.qualificationId);
  }

  if (query.minExp != null) {
    where.experience_years = { gte: parseFloat(query.minExp) };
  }

  // Parameterized search with fallback (Ruling 3.6 / REQ-CND-03)
  if (query.search) {
    const s = query.search.trim();
    where.OR = [
      { name: { startsWith: s } },
      { email: { startsWith: s } },
      { mobile: { startsWith: s } },
      { current_company: { startsWith: s } }
    ];
  }

  const [items, total] = await Promise.all([
    prisma.candidates.findMany({
      where,
      skip,
      take,
      include: {
        qualification: true,
        source: true,
        uploader: { select: { id: true, name: true, email: true } },
        skills: { include: { skill: true } }
      },
      orderBy: { created_at: 'desc' }
    }),
    prisma.candidates.count({ where })
  ]);

  // Mask contact info for company users if unconfirmed
  const sanitizedItems = items.map((c) => sanitizeCandidateForUser(c, currentUser));

  return {
    items: sanitizedItems,
    meta: buildMeta(page, limit, total)
  };
}

async function getCandidateById(id, currentUser) {
  const candidateId = BigInt(id);

  const candidate = await prisma.candidates.findFirst({
    where: { id: candidateId, deleted_at: null },
    include: {
      qualification: true,
      source: true,
      uploader: { select: { id: true, name: true, email: true } },
      skills: { include: { skill: true } }
    }
  });

  if (!candidate) {
    throw new ApiError(404, 'Candidate not found');
  }

  // Company authorization check: Must be mapped to at least one of their jobs
  if (currentUser?.role === 'company') {
    const isMapped = await prisma.job_candidates.findFirst({
      where: {
        candidate_id: candidateId,
        job: { company_id: BigInt(currentUser.companyId) },
        deleted_at: null
      }
    });
    if (!isMapped) {
      throw new ApiError(404, 'Candidate not found');
    }

    return sanitizeCandidateForUser(candidate, currentUser, isMapped.status === 'confirmed');
  }

  return candidate;
}

function sanitizeCandidateForUser(candidate, currentUser, isConfirmed = false) {
  if (currentUser?.role !== 'company' || isConfirmed) {
    return candidate;
  }
  // Ruling 3.3 / Master §9.7: Mask contact details before confirmation
  return {
    ...candidate,
    email: candidate.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    mobile: candidate.mobile.replace(/(\d{2})(\d*)(\d{2})/, '$1******$3'),
    address: '[Protected until candidate confirmation]'
  };
}

async function updateCandidate(id, data, file = null, currentUser, req = null) {
  const candidateId = BigInt(id);
  const existing = await prisma.candidates.findFirst({
    where: { id: candidateId, deleted_at: null }
  });

  if (!existing) {
    throw new ApiError(404, 'Candidate not found');
  }

  // Staff ownership boundary (Ruling 3.8 / REQ-CND-06)
  if (currentUser?.role === 'staff' && String(existing.uploaded_by) !== String(currentUser.id)) {
    throw new ApiError(403, 'Staff members can only edit candidates they personally uploaded');
  }

  if (currentUser?.role === 'company') {
    throw new ApiError(403, 'Company accounts cannot edit candidate profiles');
  }

  // Check duplicate if email or mobile modified
  if (data.email || data.mobile) {
    const nextEmail = (data.email || existing.email).toLowerCase().trim();
    const nextMobile = (data.mobile || existing.mobile).trim();

    if (nextEmail !== existing.email || nextMobile !== existing.mobile) {
      const collision = await prisma.candidates.findFirst({
        where: {
          id: { not: candidateId },
          OR: [{ email: nextEmail }, { mobile: nextMobile }],
          deleted_at: null
        }
      });
      if (collision) {
        throw new ApiError(409, 'Another candidate with this email or mobile already exists');
      }
    }
  }

  const { skills, ...fields } = data;
  const updateData = { ...fields, updated_at: new Date() };

  if (file) {
    updateData.resume_path = file.path;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.candidates.update({
      where: { id: candidateId },
      data: updateData
    });

    if (skills) {
      await tx.candidate_skills.deleteMany({ where: { candidate_id: candidateId } });
      for (const s of skills) {
        await tx.candidate_skills.create({
          data: {
            candidate_id: candidateId,
            skill_id: BigInt(s.skill_id),
            rating: s.rating || 3
          }
        });
      }
    }

    return res;
  });

  await recordAudit({
    userId: currentUser.id,
    action: 'update',
    moduleName: 'candidates',
    recordId: candidateId,
    oldValue: existing,
    newValue: updated,
    req
  });

  return getCandidateById(candidateId, currentUser);
}

async function deleteCandidate(id, currentUser, req = null) {
  const candidateId = BigInt(id);
  const existing = await prisma.candidates.findFirst({
    where: { id: candidateId, deleted_at: null }
  });

  if (!existing) {
    throw new ApiError(404, 'Candidate not found');
  }

  // Staff ownership boundary (Ruling 3.8 / REQ-CND-06)
  if (currentUser?.role === 'staff' && String(existing.uploaded_by) !== String(currentUser.id)) {
    throw new ApiError(403, 'Staff members can only delete candidates they personally uploaded');
  }

  await prisma.candidates.update({
    where: { id: candidateId },
    data: { deleted_at: new Date(), status: 'inactive' }
  });

  await recordAudit({
    userId: currentUser.id,
    action: 'delete',
    moduleName: 'candidates',
    recordId: candidateId,
    oldValue: existing,
    req
  });

  return { success: true, message: `Candidate '${existing.name}' removed successfully` };
}

async function streamResume(id, currentUser) {
  const candidateId = BigInt(id);
  const candidate = await prisma.candidates.findFirst({
    where: { id: candidateId, deleted_at: null }
  });

  if (!candidate || !candidate.resume_path) {
    throw new ApiError(404, 'Resume file not found for candidate');
  }

  // Multi-tenant authorization
  if (currentUser?.role === 'company') {
    const isMapped = await prisma.job_candidates.findFirst({
      where: {
        candidate_id: candidateId,
        job: { company_id: BigInt(currentUser.companyId) },
        deleted_at: null
      }
    });
    if (!isMapped) {
      throw new ApiError(404, 'Resume file not found');
    }
  }

  const filename = `${candidate.name.replace(/[^a-zA-Z0-9]/g, '_')}_Resume${path.extname(candidate.resume_path) || '.pdf'}`;
  return {
    filePath: candidate.resume_path,
    filename,
    mimeType: 'application/pdf'
  };
}

module.exports = {
  createCandidate,
  listCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
  streamResume
};
