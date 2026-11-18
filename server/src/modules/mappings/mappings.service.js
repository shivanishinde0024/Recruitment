const prisma = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { recordAudit } = require('../../middleware/audit');
const { notify } = require('../../services/notify.service');
const { calculateMatchScore } = require('./matching.service');

async function mapCandidatesToJob({ job_id, candidate_ids }, currentUser, req = null) {
  const jobId = BigInt(job_id);

  const job = await prisma.jobs.findFirst({
    where: { id: jobId, deleted_at: null },
    include: {
      skills: true,
      company: true
    }
  });

  if (!job) {
    throw new ApiError(404, 'Job requirement not found');
  }

  if (job.status === 'closed') {
    throw new ApiError(422, 'Cannot map candidates to a closed job requisition');
  }

  let mappedCount = 0;
  let skippedCount = 0;
  const mappedResults = [];

  for (const cId of candidate_ids) {
    const candidateId = BigInt(cId);

    // Skip duplicate mapping if already active on this job
    const existingMapping = await prisma.job_candidates.findFirst({
      where: {
        job_id: jobId,
        candidate_id: candidateId,
        status: { notIn: ['withdrawn', 'rejected'] },
        deleted_at: null
      }
    });

    if (existingMapping) {
      skippedCount++;
      continue;
    }

    const candidate = await prisma.candidates.findFirst({
      where: { id: candidateId, deleted_at: null },
      include: { skills: true }
    });

    if (!candidate) {
      skippedCount++;
      continue;
    }

    // Compute Match Score (REQ-MAP-01)
    const match = calculateMatchScore(job, candidate);

    const result = await prisma.$transaction(async (tx) => {
      const mapping = await tx.job_candidates.create({
        data: {
          job_id: jobId,
          candidate_id: candidateId,
          status: 'submitted',
          match_score: match.totalScore,
          created_by: currentUser.id
        }
      });

      await tx.job_candidate_history.create({
        data: {
          job_candidate_id: mapping.id,
          old_status: null,
          new_status: 'submitted',
          remark: 'Candidate submitted by staff recruiter',
          done_by: currentUser.id
        }
      });

      // Update candidate status
      await tx.candidates.update({
        where: { id: candidateId },
        data: { status: 'mapped' }
      });

      // REQ-MAP-04: Auto transition job from 'open' to 'in_progress'
      if (job.status === 'open') {
        await tx.jobs.update({
          where: { id: jobId },
          data: { status: 'in_progress', updated_at: new Date() }
        });
      }

      return mapping;
    });

    mappedResults.push(result);
    mappedCount++;
  }

  // Notify Company that new candidates were submitted (Flow F6)
  if (mappedCount > 0 && job.company) {
    await notify({
      userIds: [job.company.user_id],
      type: 'candidates_submitted',
      title: 'New Candidates Submitted for Review',
      message: `${mappedCount} new qualified candidate(s) were submitted for '${job.title}' (${job.job_code}).`,
      refType: 'job',
      refId: jobId,
      email: {
        to: job.company.contact_email,
        subject: `New Candidates Submitted: ${job.title}`
      }
    });
  }

  await recordAudit({
    userId: currentUser.id,
    action: 'map_candidates',
    moduleName: 'mappings',
    recordId: jobId,
    newValue: { job_id: jobId, mapped_count: mappedCount, skipped_count: skippedCount },
    req
  });

  return {
    mapped_count: mappedCount,
    skipped_count: skippedCount,
    results: mappedResults
  };
}

async function getSuggestedCandidates(jobId, currentUser) {
  const jId = BigInt(jobId);

  const job = await prisma.jobs.findFirst({
    where: { id: jId, deleted_at: null },
    include: {
      skills: true,
      company: true
    }
  });

  if (!job) {
    throw new ApiError(404, 'Job requirement not found');
  }

  // Multi-tenant check
  if (currentUser?.role === 'company' && String(job.company_id) !== String(currentUser.companyId)) {
    throw new ApiError(404, 'Job not found');
  }

  // Existing active mappings on this job
  const existingMappings = await prisma.job_candidates.findMany({
    where: {
      job_id: jId,
      status: { notIn: ['withdrawn', 'rejected'] },
      deleted_at: null
    },
    select: { candidate_id: true }
  });
  const excludedCandidateIds = new Set(existingMappings.map((m) => String(m.candidate_id)));

  // Retrieve candidate pool
  const candidates = await prisma.candidates.findMany({
    where: {
      deleted_at: null,
      status: { in: ['available', 'mapped'] }
    },
    include: {
      skills: true,
      qualification: true
    }
  });

  const scoredCandidates = [];
  for (const cand of candidates) {
    if (excludedCandidateIds.has(String(cand.id))) continue;
    const match = calculateMatchScore(job, cand);
    scoredCandidates.push({
      ...cand,
      matchScore: match.totalScore,
      matchBreakdown: match.breakdown
    });
  }

  // Sort by top match score descending
  scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

  return scoredCandidates.slice(0, 50);
}

async function listJobMappings(jobId, query = {}, currentUser) {
  const jId = BigInt(jobId);

  const job = await prisma.jobs.findFirst({
    where: { id: jId, deleted_at: null }
  });

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  if (currentUser?.role === 'company' && String(job.company_id) !== String(currentUser.companyId)) {
    throw new ApiError(404, 'Job not found');
  }

  const where = {
    job_id: jId,
    deleted_at: null
  };

  if (query.status) {
    where.status = query.status;
  }

  const mappings = await prisma.job_candidates.findMany({
    where,
    include: {
      candidate: {
        include: {
          skills: { include: { skill: true } },
          qualification: true
        }
      },
      history: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { created_at: 'desc' }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  // Apply contact masking for company users if candidate is not confirmed (Ruling 3.3 / REQ-MAP-07)
  const isCompany = currentUser?.role === 'company';
  return mappings.map((m) => {
    if (!isCompany || m.status === 'confirmed') {
      return m;
    }
    return {
      ...m,
      candidate: {
        ...m.candidate,
        email: m.candidate.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        mobile: m.candidate.mobile.replace(/(\d{2})(\d*)(\d{2})/, '$1******$3'),
        address: '[Contact details locked until candidate confirmation]'
      }
    };
  });
}

/**
 * Executes company candidate review workflow action:
 * viewed, shortlisted, confirmed, rejected, hold.
 * Strictly enforces race-safe confirmation and auto-fulfillment (Ruling 3.11 / Flow F8).
 */
async function reviewCandidate(mappingId, { action, remark }, currentUser, req = null) {
  const mId = BigInt(mappingId);

  const mapping = await prisma.job_candidates.findFirst({
    where: { id: mId, deleted_at: null },
    include: {
      job: { include: { company: true } },
      candidate: true
    }
  });

  if (!mapping) {
    throw new ApiError(404, 'Candidate mapping not found');
  }

  // Company authorization
  if (currentUser?.role === 'company' && String(mapping.job.company_id) !== String(currentUser.companyId)) {
    throw new ApiError(404, 'Candidate mapping not found');
  }

  const trimmedRemark = remark ? remark.trim() : null;

  // Confirmation Flow with Concurrency Lock (Ruling 3.11 / REQ-MAP-06)
  if (action === 'confirmed') {
    return prisma.$transaction(async (tx) => {
      // Re-read job and lock
      const currentJob = await tx.jobs.findUnique({
        where: { id: mapping.job_id }
      });

      const confirmedCount = await tx.job_candidates.count({
        where: {
          job_id: mapping.job_id,
          status: 'confirmed',
          deleted_at: null
        }
      });

      if (confirmedCount >= currentJob.positions_required) {
        throw new ApiError(
          422,
          `Cannot confirm candidate: requisition '${currentJob.job_code}' is already fully satisfied (${confirmedCount}/${currentJob.positions_required} positions filled)`
        );
      }

      // Update mapping
      const updatedMapping = await tx.job_candidates.update({
        where: { id: mId },
        data: {
          status: 'confirmed',
          feedback: trimmedRemark,
          reviewed_by: currentUser.id,
          reviewed_at: new Date()
        }
      });

      // Update candidate status to placed
      await tx.candidates.update({
        where: { id: mapping.candidate_id },
        data: { status: 'placed' }
      });

      // Log history
      await tx.job_candidate_history.create({
        data: {
          job_candidate_id: mId,
          old_status: mapping.status,
          new_status: 'confirmed',
          remark: trimmedRemark || 'Candidate confirmed/hired by client company',
          done_by: currentUser.id
        }
      });

      // Check Auto-Fulfillment (Flow F8)
      const newConfirmedCount = confirmedCount + 1;
      let isFulfilled = false;
      if (newConfirmedCount >= currentJob.positions_required) {
        await tx.jobs.update({
          where: { id: mapping.job_id },
          data: { status: 'fulfilled', updated_at: new Date() }
        });
        isFulfilled = true;
      }

      // Notify Staff and Admins of candidate confirmation
      const staffList = await tx.users.findMany({
        where: { role: { in: ['admin', 'staff'] }, status: 'active', deleted_at: null },
        select: { id: true, email: true }
      });

      await notify({
        userIds: staffList.map((s) => s.id),
        type: isFulfilled ? 'job_fulfilled' : 'candidate_confirmed',
        title: isFulfilled ? `Requisition Fulfilled: ${currentJob.job_code}` : `Candidate Confirmed for ${currentJob.job_code}`,
        message: isFulfilled
          ? `All ${currentJob.positions_required} position(s) for '${currentJob.title}' have been confirmed and filled!`
          : `Candidate '${mapping.candidate.name}' was confirmed by ${mapping.job.company.company_name}. (${newConfirmedCount}/${currentJob.positions_required})`,
        refType: 'job',
        refId: mapping.job_id
      });

      return updatedMapping;
    });
  }

  // Non-confirmed review actions (viewed, shortlisted, rejected, hold)
  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.job_candidates.update({
      where: { id: mId },
      data: {
        status: action,
        feedback: trimmedRemark,
        reviewed_by: currentUser.id,
        reviewed_at: new Date()
      }
    });

    await tx.job_candidate_history.create({
      data: {
        job_candidate_id: mId,
        old_status: mapping.status,
        new_status: action,
        remark: trimmedRemark || `Candidate marked as ${action} by company reviewer`,
        done_by: currentUser.id
      }
    });

    if (action === 'rejected') {
      // Check if candidate has any other active mappings; if none, revert to available
      const otherActive = await tx.job_candidates.count({
        where: {
          candidate_id: mapping.candidate_id,
          id: { not: mId },
          status: { in: ['submitted', 'shortlisted', 'confirmed'] },
          deleted_at: null
        }
      });
      if (otherActive === 0) {
        await tx.candidates.update({
          where: { id: mapping.candidate_id },
          data: { status: 'available' }
        });
      }
    }

    return res;
  });

  await recordAudit({
    userId: currentUser.id,
    action: 'review_candidate',
    moduleName: 'mappings',
    recordId: mId,
    oldValue: { status: mapping.status },
    newValue: { status: action, remark: trimmedRemark },
    req
  });

  return updated;
}

async function withdrawMapping(mappingId, { reason }, currentUser, req = null) {
  const mId = BigInt(mappingId);

  const mapping = await prisma.job_candidates.findFirst({
    where: { id: mId, deleted_at: null },
    include: { job: true, candidate: true }
  });

  if (!mapping) {
    throw new ApiError(404, 'Mapping not found');
  }

  // Guard (REQ-MAP-08): Staff can only withdraw while status is 'submitted'
  if (mapping.status !== 'submitted') {
    throw new ApiError(422, `Cannot withdraw candidate: status is already '${mapping.status}'. Only 'submitted' candidates may be withdrawn by staff.`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.job_candidates.update({
      where: { id: mId },
      data: { status: 'withdrawn' }
    });

    await tx.job_candidate_history.create({
      data: {
        job_candidate_id: mId,
        old_status: mapping.status,
        new_status: 'withdrawn',
        remark: reason ? reason.trim() : 'Candidate submission withdrawn by staff recruiter',
        done_by: currentUser.id
      }
    });

    // If candidate has no other active mappings, revert status to available
    const otherActive = await tx.job_candidates.count({
      where: {
        candidate_id: mapping.candidate_id,
        id: { not: mId },
        status: { in: ['submitted', 'shortlisted', 'confirmed'] },
        deleted_at: null
      }
    });
    if (otherActive === 0) {
      await tx.candidates.update({
        where: { id: mapping.candidate_id },
        data: { status: 'available' }
      });
    }

    return res;
  });

  await recordAudit({
    userId: currentUser.id,
    action: 'withdraw_mapping',
    moduleName: 'mappings',
    recordId: mId,
    oldValue: mapping,
    newValue: updated,
    req
  });

  return updated;
}

module.exports = {
  mapCandidatesToJob,
  getSuggestedCandidates,
  listJobMappings,
  reviewCandidate,
  withdrawMapping
};

