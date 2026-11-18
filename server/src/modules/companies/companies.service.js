const bcrypt = require('bcrypt');
const prisma = require('../../config/db');
const { BCRYPT_ROUNDS } = require('../../config/env');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { recordAudit } = require('../../middleware/audit');
const { notify } = require('../../services/notify.service');

async function registerCompany(data, files = {}, req = null) {
  const email = data.email.toLowerCase().trim();
  const companyName = data.company_name.trim();

  // Check unique email across non-deleted users
  const existingUser = await prisma.users.findFirst({
    where: { email, deleted_at: null }
  });
  if (existingUser) {
    throw new ApiError(409, `User with email '${email}' is already registered`);
  }

  // Check GST uniqueness if provided
  if (data.gst_no) {
    const existingGst = await prisma.companies.findFirst({
      where: { gst_no: data.gst_no.trim(), deleted_at: null }
    });
    if (existingGst) {
      throw new ApiError(409, `Company with GST number '${data.gst_no}' is already registered`);
    }
  }

  // Check PAN uniqueness if provided
  if (data.pan_no) {
    const existingPan = await prisma.companies.findFirst({
      where: { pan_no: data.pan_no.trim(), deleted_at: null }
    });
    if (existingPan) {
      throw new ApiError(409, `Company with PAN number '${data.pan_no}' is already registered`);
    }
  }

  // Check auto-approval setting
  const autoApproveSetting = await prisma.settings.findUnique({
    where: { key: 'auto_approve_company' }
  });
  const initialStatus = autoApproveSetting?.value === 'true' ? 'approved' : 'pending';

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  // Atomic Registration Transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create User
    const user = await tx.users.create({
      data: {
        name: data.name.trim(),
        email,
        mobile: data.mobile.trim(),
        password_hash: passwordHash,
        role: 'company',
        status: 'active'
      }
    });

    // 2. Create Company Profile
    const company = await tx.companies.create({
      data: {
        user_id: user.id,
        company_name: companyName,
        industry_id: data.industry_id ? parseInt(data.industry_id, 10) : null,
        company_type_id: data.company_type_id ? parseInt(data.company_type_id, 10) : null,
        gst_no: data.gst_no ? data.gst_no.trim() : null,
        pan_no: data.pan_no ? data.pan_no.trim() : null,
        cin_no: data.cin_no ? data.cin_no.trim() : null,
        registration_year: data.registration_year ? parseInt(data.registration_year, 10) : null,
        company_size: data.company_size || null,
        website: data.website || null,
        address: data.address || null,
        country_id: data.country_id ? parseInt(data.country_id, 10) : null,
        state_id: data.state_id ? parseInt(data.state_id, 10) : null,
        city_id: data.city_id ? parseInt(data.city_id, 10) : null,
        pincode: data.pincode ? data.pincode.trim() : null,
        contact_person: data.contact_person.trim(),
        contact_designation: data.contact_designation || null,
        contact_email: data.contact_email.toLowerCase().trim(),
        contact_mobile: data.contact_mobile.trim(),
        logo_path: files?.logo?.[0]?.path || null,
        status: initialStatus
      }
    });

    // 3. Save Uploaded Company Verification Documents
    const docKeys = ['gst_doc', 'pan_doc', 'incorporation_doc'];
    for (const key of docKeys) {
      if (files[key] && files[key][0]) {
        const file = files[key][0];
        const docType = key.replace('_doc', '');
        await tx.company_documents.create({
          data: {
            company_id: company.id,
            doc_type: docType,
            original_name: file.originalname,
            file_path: file.path,
            mime_type: file.mimetype,
            size_bytes: file.size
          }
        });
      }
    }

    // 4. Initial Verification Log Entry
    await tx.company_verification_logs.create({
      data: {
        company_id: company.id,
        old_status: null,
        new_status: initialStatus,
        remark: 'Initial company registration submission'
      }
    });

    return { user, company };
  });

  // Notify all Admins and Staff of new company registration (Flow F1)
  const staffAndAdmins = await prisma.users.findMany({
    where: { role: { in: ['admin', 'staff'] }, status: 'active', deleted_at: null },
    select: { id: true, email: true }
  });

  await notify({
    userIds: staffAndAdmins.map((u) => u.id),
    type: 'company_registered',
    title: 'New Company Registered',
    message: `Company '${companyName}' registered and requires compliance document review.`,
    refType: 'company',
    refId: result.company.id,
    email: {
      to: 'admin@portal.com',
      subject: `New Company Registration: ${companyName}`
    }
  });

  await recordAudit({
    userId: result.user.id,
    action: 'create',
    moduleName: 'companies',
    recordId: result.company.id,
    newValue: { company_name: companyName, status: initialStatus },
    req
  });

  const { password_hash, ...sanitizedUser } = result.user; // eslint-disable-line no-unused-vars
  return {
    user: sanitizedUser,
    company: result.company
  };
}

async function listCompanies(query = {}, currentUser) {
  const { page, limit, skip, take } = parsePagination(query, 10, 100);

  const where = {
    deleted_at: null
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.industryId) {
    where.industry_id = parseInt(query.industryId, 10);
  }

  if (query.cityId) {
    where.city_id = parseInt(query.cityId, 10);
  }

  if (query.search) {
    where.OR = [
      { company_name: { startsWith: query.search } },
      { contact_person: { startsWith: query.search } },
      { contact_email: { startsWith: query.search } }
    ];
  }

  const [items, total] = await Promise.all([
    prisma.companies.findMany({
      where,
      skip,
      take,
      include: {
        industry: true,
        company_type: true
      },
      orderBy: { created_at: 'desc' }
    }),
    prisma.companies.count({ where })
  ]);

  return {
    items,
    meta: buildMeta(page, limit, total)
  };
}

async function getCompanyById(id, currentUser) {
  const companyId = BigInt(id);

  // Multi-tenant isolation: company users can only inspect their own profile (Return 404 per Master §8.2)
  if (currentUser?.role === 'company' && String(currentUser.companyId) !== String(companyId)) {
    throw new ApiError(404, 'Company not found');
  }

  const company = await prisma.companies.findFirst({
    where: { id: companyId, deleted_at: null },
    include: {
      industry: true,
      company_type: true,
      documents: { where: { deleted_at: null } },
      verification_logs: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { created_at: 'desc' }
      }
    }
  });

  if (!company) {
    throw new ApiError(404, 'Company profile not found');
  }

  return company;
}

/**
 * Executes company verification workflow actions:
 * approve, reject, need_info, suspend, reactivate.
 * Strictly enforces mandatory remarks for reject/need_info/suspend (REQ-CMP-03 / Exit Gate).
 */
async function verifyCompany(id, { action, remark }, currentUser, req = null) {
  const companyId = BigInt(id);
  const company = await prisma.companies.findFirst({
    where: { id: companyId, deleted_at: null }
  });

  if (!company) {
    throw new ApiError(404, 'Company not found');
  }

  const trimmedRemark = remark ? remark.trim() : '';

  // CRITICAL RULE (Exit Gate): Reject, need_info, and suspend require mandatory non-empty remark
  if (['reject', 'need_info', 'suspend'].includes(action)) {
    if (!trimmedRemark) {
      throw new ApiError(422, `A descriptive remark is mandatory when setting company status to '${action}'`);
    }
  }

  let nextStatus;
  switch (action) {
    case 'approve':
      nextStatus = 'approved';
      break;
    case 'reject':
      nextStatus = 'rejected';
      break;
    case 'need_info':
      nextStatus = 'need_info';
      break;
    case 'suspend':
      nextStatus = 'suspended';
      break;
    case 'reactivate':
      nextStatus = 'approved';
      break;
    default:
      throw new ApiError(400, `Unknown verification action '${action}'`);
  }

  // Update status and append to verification log
  const updated = await prisma.$transaction(async (tx) => {
    const comp = await tx.companies.update({
      where: { id: companyId },
      data: {
        status: nextStatus,
        needs_reverification: false,
        verified_by: currentUser.id,
        verified_at: new Date(),
        remark: trimmedRemark || null
      }
    });

    await tx.company_verification_logs.create({
      data: {
        company_id: companyId,
        old_status: company.status,
        new_status: nextStatus,
        remark: trimmedRemark || null,
        done_by: currentUser.id
      }
    });

    return comp;
  });

  // Notify company user of verification outcome (Flow F2, F3)
  await notify({
    userIds: [company.user_id],
    type: `company_${action}`,
    title: `Company Status Updated: ${nextStatus.toUpperCase()}`,
    message: trimmedRemark
      ? `Your company profile was marked as '${nextStatus}'. Remark: ${trimmedRemark}`
      : `Your company profile was successfully verified and marked as '${nextStatus}'.`,
    refType: 'company',
    refId: companyId,
    email: {
      to: company.contact_email,
      subject: `Company Verification Status: ${nextStatus.toUpperCase()}`
    }
  });

  await recordAudit({
    userId: currentUser.id,
    action: 'status_change',
    moduleName: 'companies',
    recordId: companyId,
    oldValue: { status: company.status },
    newValue: { status: nextStatus, remark: trimmedRemark },
    req
  });

  return updated;
}

/**
 * Updates company profile details.
 * If company is approved and edits name/GST/PAN, flags needs_reverification (Ruling 3.9).
 */
async function updateCompany(id, data, currentUser, req = null) {
  const companyId = BigInt(id);

  if (currentUser?.role === 'company' && String(currentUser.companyId) !== String(companyId)) {
    throw new ApiError(404, 'Company not found');
  }

  const existing = await prisma.companies.findFirst({
    where: { id: companyId, deleted_at: null }
  });

  if (!existing) {
    throw new ApiError(404, 'Company not found');
  }

  const payload = { ...data };

  // Ruling 3.9: If approved and key legal identifiers are altered, flag for re-verification
  if (existing.status === 'approved') {
    const isNameChanged = data.company_name && data.company_name.trim() !== existing.company_name;
    const isGstChanged = data.gst_no && data.gst_no.trim() !== existing.gst_no;
    const isPanChanged = data.pan_no && data.pan_no.trim() !== existing.pan_no;

    if (isNameChanged || isGstChanged || isPanChanged) {
      payload.needs_reverification = true;

      // Notify compliance staff
      const staffList = await prisma.users.findMany({
        where: { role: { in: ['admin', 'staff'] }, status: 'active', deleted_at: null },
        select: { id: true }
      });
      await notify({
        userIds: staffList.map((s) => s.id),
        type: 'company_reverification_needed',
        title: 'Company Modified Core Legal Data',
        message: `Approved company '${existing.company_name}' updated its legal name/GST/PAN and requires re-verification review.`,
        refType: 'company',
        refId: companyId
      });
    }
  }

  const updated = await prisma.companies.update({
    where: { id: companyId },
    data: payload
  });

  await recordAudit({
    userId: currentUser?.id,
    action: 'update',
    moduleName: 'companies',
    recordId: companyId,
    oldValue: existing,
    newValue: updated,
    req
  });

  return updated;
}

async function addCompanyDocument(companyId, file, docType, currentUser) {
  const cId = BigInt(companyId);

  if (currentUser?.role === 'company' && String(currentUser.companyId) !== String(cId)) {
    throw new ApiError(404, 'Company not found');
  }

  if (!file) {
    throw new ApiError(400, 'Document file upload required');
  }

  const doc = await prisma.company_documents.create({
    data: {
      company_id: cId,
      doc_type: docType || 'other',
      original_name: file.originalname,
      file_path: file.path,
      mime_type: file.mimetype,
      size_bytes: file.size
    }
  });

  return doc;
}

async function getDocumentDownload(companyId, docId, currentUser) {
  const cId = BigInt(companyId);
  const dId = BigInt(docId);

  if (currentUser?.role === 'company' && String(currentUser.companyId) !== String(cId)) {
    throw new ApiError(404, 'Document not found');
  }

  const doc = await prisma.company_documents.findFirst({
    where: { id: dId, company_id: cId, deleted_at: null }
  });

  if (!doc) {
    throw new ApiError(404, 'Document not found');
  }

  return doc;
}

async function deleteCompany(id, currentUser, req = null) {
  const companyId = BigInt(id);
  const company = await prisma.companies.findFirst({
    where: { id: companyId, deleted_at: null }
  });

  if (!company) {
    throw new ApiError(404, 'Company not found');
  }

  // Soft delete company and disable corresponding user account
  await prisma.$transaction([
    prisma.companies.update({
      where: { id: companyId },
      data: { deleted_at: new Date(), status: 'suspended' }
    }),
    prisma.users.update({
      where: { id: company.user_id },
      data: { status: 'inactive' }
    })
  ]);

  await recordAudit({
    userId: currentUser.id,
    action: 'delete',
    moduleName: 'companies',
    recordId: companyId,
    oldValue: company,
    req
  });

  return { success: true, message: `Company '${company.company_name}' deleted successfully` };
}

module.exports = {
  registerCompany,
  listCompanies,
  getCompanyById,
  verifyCompany,
  updateCompany,
  addCompanyDocument,
  getDocumentDownload,
  deleteCompany
};
