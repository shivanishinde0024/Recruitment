const path = require('path');
const fs = require('fs');
const prisma = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { recordAudit } = require('../../middleware/audit');

function isInMemoryDb() {
  return Boolean(prisma._isInMemory || prisma.users?.records);
}

function formatCandidate(c) {
  if (!c) return c;
  const rawSkills = c.candidate_skills || c.skills || [];
  const skills = rawSkills.map((cs) => ({
    ...cs,
    skill_id: cs.skill_id !== undefined ? Number(cs.skill_id) : cs.skill?.id,
    rating: cs.rating !== undefined ? Number(cs.rating) : 3,
    skill: cs.skill || null
  }));

  const exp = c.experience_years !== undefined
    ? Number(c.experience_years)
    : (c.total_experience != null ? Number(c.total_experience) : 0);

  const currSalary = c.current_salary !== undefined
    ? (c.current_salary != null ? Number(c.current_salary) : null)
    : (c.current_ctc != null ? Number(c.current_ctc) : null);

  const expSalary = c.expected_salary !== undefined
    ? (c.expected_salary != null ? Number(c.expected_salary) : null)
    : (c.expected_ctc != null ? Number(c.expected_ctc) : null);

  return {
    ...c,
    experience_years: exp,
    total_experience: exp,
    current_salary: currSalary,
    current_ctc: currSalary,
    expected_salary: expSalary,
    expected_ctc: expSalary,
    qualification_id: c.qualification_id != null ? Number(c.qualification_id) : null,
    source_id: c.source_id != null ? Number(c.source_id) : null,
    skills,
    candidate_skills: skills,
    status: c.status || (c.deleted_at ? 'inactive' : 'available'),
    address: c.address || c.current_location || ''
  };
}

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
  const resume_path = file ? file.path : (fields.resume_path || 'uploads/resumes/default_resume.pdf');
  const inMem = isInMemoryDb();

  const candidate = await prisma.$transaction(async (tx) => {
    const totalExp = fields.total_experience != null
      ? Number(fields.total_experience)
      : (fields.experience_years != null ? Number(fields.experience_years) : 0);

    const currCtc = fields.current_ctc != null
      ? Number(fields.current_ctc)
      : (fields.current_salary != null ? Number(fields.current_salary) : null);

    const expCtc = fields.expected_ctc != null
      ? Number(fields.expected_ctc)
      : (fields.expected_salary != null ? Number(fields.expected_salary) : null);

    const candData = {
      name: fields.name.trim(),
      email,
      mobile,
      gender: fields.gender || null,
      dob: fields.dob ? new Date(fields.dob) : null,
      qualification_id: fields.qualification_id ? Number(fields.qualification_id) : null,
      source_id: fields.source_id ? Number(fields.source_id) : null,
      total_experience: totalExp,
      current_ctc: currCtc,
      expected_ctc: expCtc,
      notice_period_days: fields.notice_period_days != null ? Number(fields.notice_period_days) : 30,
      current_company: fields.current_company ? fields.current_company.trim() : null,
      current_designation: fields.current_designation ? fields.current_designation.trim() : null,
      current_location: fields.current_location || [fields.address, fields.pincode].filter(Boolean).join(', ') || null,
      summary: fields.summary ? fields.summary.trim() : null,
      resume_path,
      resume_original_name: file?.originalname || fields.resume_original_name || null,
      uploaded_by: inMem ? currentUser.id : BigInt(currentUser.id)
    };

    if (inMem) {
      candData.experience_years = totalExp;
      candData.current_salary = currCtc;
      candData.expected_salary = expCtc;
      candData.address = fields.address || null;
      candData.country_id = fields.country_id ? Number(fields.country_id) : null;
      candData.state_id = fields.state_id ? Number(fields.state_id) : null;
      candData.city_id = fields.city_id ? Number(fields.city_id) : null;
      candData.pincode = fields.pincode || null;
      candData.status = 'available';
    }

    const created = await tx.candidates.create({
      data: candData
    });

    if (skills && skills.length > 0) {
      for (const s of skills) {
        const skillPayload = {
          candidate_id: created.id,
          skill_id: Number(s.skill_id)
        };
        if (inMem) {
          skillPayload.rating = s.rating || 3;
        }
        await tx.candidate_skills.create({
          data: skillPayload
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
  const inMem = isInMemoryDb();

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

  if (query.status && inMem) {
    where.status = query.status;
  }

  if (query.sourceId) {
    where.source_id = Number(query.sourceId);
  }

  if (query.qualificationId) {
    where.qualification_id = Number(query.qualificationId);
  }

  if (query.minExp != null) {
    const minVal = parseFloat(query.minExp);
    if (!isNaN(minVal)) {
      if (inMem) {
        where.experience_years = { gte: minVal };
      } else {
        where.total_experience = { gte: minVal };
      }
    }
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
        ...(inMem
          ? { skills: { include: { skill: true } } }
          : { candidate_skills: { include: { skill: true } } })
      },
      orderBy: { created_at: 'desc' }
    }),
    prisma.candidates.count({ where })
  ]);

  // Mask contact info for company users if unconfirmed
  const formattedItems = items.map(formatCandidate);
  const sanitizedItems = formattedItems.map((c) => sanitizeCandidateForUser(c, currentUser));

  return {
    items: sanitizedItems,
    meta: buildMeta(page, limit, total)
  };
}

async function getCandidateById(id, currentUser) {
  const inMem = isInMemoryDb();
  const candidateId = inMem ? id : BigInt(id);

  const candidate = await prisma.candidates.findFirst({
    where: { id: candidateId, deleted_at: null },
    include: {
      qualification: true,
      source: true,
      uploader: { select: { id: true, name: true, email: true } },
      ...(inMem
        ? { skills: { include: { skill: true } } }
        : { candidate_skills: { include: { skill: true } } })
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
        job: { company_id: inMem ? currentUser.companyId : BigInt(currentUser.companyId) },
        deleted_at: null
      }
    });
    if (!isMapped) {
      throw new ApiError(404, 'Candidate not found');
    }

    return sanitizeCandidateForUser(formatCandidate(candidate), currentUser, isMapped.status === 'confirmed');
  }

  return sanitizeCandidateForUser(formatCandidate(candidate), currentUser, false);
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
  const inMem = isInMemoryDb();
  const candidateId = inMem ? id : BigInt(id);

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
  const updateData = { updated_at: new Date() };

  if (fields.name !== undefined) updateData.name = fields.name.trim();
  if (fields.email !== undefined) updateData.email = fields.email.toLowerCase().trim();
  if (fields.mobile !== undefined) updateData.mobile = fields.mobile.trim();
  if (fields.alt_mobile !== undefined) updateData.alt_mobile = fields.alt_mobile || null;
  if (fields.gender !== undefined) updateData.gender = fields.gender || null;
  if (fields.dob !== undefined) updateData.dob = fields.dob ? new Date(fields.dob) : null;
  if (fields.qualification_id !== undefined) updateData.qualification_id = fields.qualification_id ? Number(fields.qualification_id) : null;
  if (fields.source_id !== undefined) updateData.source_id = fields.source_id ? Number(fields.source_id) : null;

  if (fields.total_experience !== undefined || fields.experience_years !== undefined) {
    const exp = fields.total_experience ?? fields.experience_years;
    updateData.total_experience = exp != null ? Number(exp) : 0;
    if (inMem) updateData.experience_years = updateData.total_experience;
  }

  if (fields.current_ctc !== undefined || fields.current_salary !== undefined) {
    const sal = fields.current_ctc ?? fields.current_salary;
    updateData.current_ctc = sal != null ? Number(sal) : null;
    if (inMem) updateData.current_salary = updateData.current_ctc;
  }

  if (fields.expected_ctc !== undefined || fields.expected_salary !== undefined) {
    const expSal = fields.expected_ctc ?? fields.expected_salary;
    updateData.expected_ctc = expSal != null ? Number(expSal) : null;
    if (inMem) updateData.expected_salary = updateData.expected_ctc;
  }

  if (fields.notice_period_days !== undefined) {
    updateData.notice_period_days = fields.notice_period_days != null ? Number(fields.notice_period_days) : 30;
  }
  if (fields.current_company !== undefined) updateData.current_company = fields.current_company ? fields.current_company.trim() : null;
  if (fields.current_designation !== undefined) updateData.current_designation = fields.current_designation ? fields.current_designation.trim() : null;
  if (fields.current_location !== undefined || fields.address !== undefined) {
    updateData.current_location = fields.current_location || [fields.address, fields.pincode].filter(Boolean).join(', ') || null;
    if (inMem) updateData.address = fields.address || null;
  }
  if (fields.summary !== undefined) updateData.summary = fields.summary ? fields.summary.trim() : null;
  if (file) updateData.resume_path = file.path;

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.candidates.update({
      where: { id: candidateId },
      data: updateData
    });

    if (skills) {
      await tx.candidate_skills.deleteMany({ where: { candidate_id: candidateId } });
      for (const s of skills) {
        const skillPayload = {
          candidate_id: candidateId,
          skill_id: Number(s.skill_id)
        };
        if (inMem) {
          skillPayload.rating = s.rating || 3;
        }
        await tx.candidate_skills.create({
          data: skillPayload
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
  const inMem = isInMemoryDb();
  const candidateId = inMem ? id : BigInt(id);

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

  const updateData = { deleted_at: new Date() };
  if (inMem) {
    updateData.status = 'inactive';
  }

  await prisma.candidates.update({
    where: { id: candidateId },
    data: updateData
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
  const inMem = isInMemoryDb();
  const candidateId = inMem ? id : BigInt(id);

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
        job: { company_id: inMem ? currentUser.companyId : BigInt(currentUser.companyId) },
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
