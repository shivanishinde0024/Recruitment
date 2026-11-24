const prisma = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { generateSafeCsv, sanitizeFormulaCell } = require('../../utils/csvExport');
const ExcelJS = require('exceljs');

function resolveJobTitle(j) {
  if (j.custom_title) return j.custom_title;
  if (typeof j.title === 'string') return j.title;
  if (j.title?.name) return j.title.name;
  return 'Untitled';
}

function resolveCandidateName(c) {
  if (!c) return 'Unknown';
  if (c.name) return c.name;
  const fullName = `${c.first_name || ''} ${c.last_name || ''}`.trim();
  return fullName || 'Unknown';
}

function resolveIndustry(ind) {
  if (typeof ind === 'string') return ind;
  if (ind?.name) return ind.name;
  return 'General';
}

/**
 * Admin Company-Wise Dashboard (Master §9.1 / REQ-DSH-01)
 * Uses decoupled queries to guarantee high performance and avoid huge multi-table Cartesian joins.
 */
async function getAdminCompanyWise() {
  // Query 1: Fetch all approved / non-deleted companies
  const companies = await prisma.companies.findMany({
    where: { deleted_at: null },
    select: {
      id: true,
      company_name: true,
      industry: {
        select: {
          name: true
        }
      },
      status: true,
      created_at: true
    }
  });

  // Query 2: Fetch all non-deleted jobs
  const jobs = await prisma.jobs.findMany({
    where: { deleted_at: null },
    select: {
      id: true,
      company_id: true,
      custom_title: true,
      title: true,
      job_code: true,
      status: true,
      positions_required: true,
      last_date: true,
      assigned_staff_id: true
    }
  });

  // Query 3: Fetch active candidate mappings (job_candidates has no deleted_at)
  const mappings = await prisma.job_candidates.findMany({
    select: {
      id: true,
      job_id: true,
      status: true,
      created_at: true
    }
  });

  // Organize by company
  const jobsByCompany = new Map();
  jobs.forEach(j => {
    const cId = String(j.company_id);
    if (!jobsByCompany.has(cId)) jobsByCompany.set(cId, []);
    jobsByCompany.get(cId).push(j);
  });

  // Organize mappings by job
  const mappingsByJob = new Map();
  mappings.forEach(m => {
    const jId = String(m.job_id);
    if (!mappingsByJob.has(jId)) mappingsByJob.set(jId, []);
    mappingsByJob.get(jId).push(m);
  });

  let totalPositions = 0;
  let totalConfirmed = 0;
  let activeJobsCount = 0;

  const companyRows = companies.map(c => {
    const cId = String(c.id);
    const cJobs = jobsByCompany.get(cId) || [];

    const jobsCount = cJobs.length;
    const openJobs = cJobs.filter(j => ['open', 'in_progress'].includes(j.status));
    const openJobsCount = openJobs.length;

    let positionsTotal = 0;
    let candidatesSubmitted = 0;
    let candidatesConfirmed = 0;

    cJobs.forEach(j => {
      const jPositions = j.positions_required || 0;
      positionsTotal += jPositions;

      const jMappings = mappingsByJob.get(String(j.id)) || [];
      candidatesSubmitted += jMappings.length;
      candidatesConfirmed += jMappings.filter(m => m.status === 'confirmed').length;

      if (['open', 'in_progress'].includes(j.status)) {
        activeJobsCount++;
        totalPositions += jPositions;
      }
    });

    totalConfirmed += candidatesConfirmed;

    const fulfillmentRate = positionsTotal > 0
      ? Math.min(100, Math.round((candidatesConfirmed / positionsTotal) * 100))
      : 0;

    return {
      company_id: cId,
      company_name: c.company_name,
      industry: resolveIndustry(c.industry),
      verification_status: c.status || c.verification_status || 'pending',
      jobs_count: jobsCount,
      open_jobs_count: openJobsCount,
      positions_total: positionsTotal,
      candidates_submitted: candidatesSubmitted,
      candidates_confirmed: candidatesConfirmed,
      fulfillment_rate: fulfillmentRate
    };
  });

  // Summary Metrics
  const overallFulfillmentRate = totalPositions > 0
    ? Math.min(100, Math.round((totalConfirmed / totalPositions) * 100))
    : 0;

  // Urgent requisitions (active jobs with last_date approaching within 7 days or overdue)
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const urgentRequisitions = jobs
    .filter(j => ['open', 'in_progress'].includes(j.status) && j.last_date)
    .filter(j => new Date(j.last_date) <= sevenDaysFromNow)
    .map(j => {
      const comp = companies.find(c => String(c.id) === String(j.company_id));
      const jMappings = mappingsByJob.get(String(j.id)) || [];
      const confirmed = jMappings.filter(m => m.status === 'confirmed').length;

      return {
        id: String(j.id),
        job_code: j.job_code,
        title: resolveJobTitle(j),
        company_name: comp?.company_name || 'Unknown',
        positions_required: j.positions_required,
        confirmed_count: confirmed,
        remaining_count: Math.max(0, j.positions_required - confirmed),
        last_date: j.last_date,
        status: j.status
      };
    })
    .sort((a, b) => new Date(a.last_date) - new Date(b.last_date));

  return {
    summary: {
      total_companies: companies.length,
      active_jobs: activeJobsCount,
      total_positions: totalPositions,
      total_confirmed: totalConfirmed,
      overall_fulfillment_rate: overallFulfillmentRate
    },
    companies: companyRows,
    urgent_requisitions: urgentRequisitions
  };
}

/**
 * Company Drill-Down Report (REQ-DSH-02)
 */
async function getCompanyDrillDown(companyId) {
  const cId = BigInt(companyId);

  const company = await prisma.companies.findFirst({
    where: { id: cId, deleted_at: null },
    include: {
      industry: true
    }
  });

  if (!company) {
    throw new ApiError(404, 'Company not found');
  }

  const jobs = await prisma.jobs.findMany({
    where: { company_id: cId, deleted_at: null },
    include: {
      title: true
    }
  });

  const jobIds = jobs.map(j => j.id);
  const mappings = await prisma.job_candidates.findMany({
    where: {
      job_id: { in: jobIds }
    },
    include: {
      candidate: true
    }
  });

  const mappingsByJob = new Map();
  mappings.forEach(m => {
    const jId = String(m.job_id);
    if (!mappingsByJob.has(jId)) mappingsByJob.set(jId, []);
    mappingsByJob.get(jId).push(m);
  });

  let totalPositions = 0;
  let totalConfirmed = 0;

  const jobDetails = jobs.map(j => {
    const jMappings = mappingsByJob.get(String(j.id)) || [];
    const submittedCount = jMappings.length;
    const confirmedCount = jMappings.filter(m => m.status === 'confirmed').length;

    totalPositions += j.positions_required || 0;
    totalConfirmed += confirmedCount;

    return {
      id: String(j.id),
      job_code: j.job_code,
      title: resolveJobTitle(j),
      status: j.status,
      positions_required: j.positions_required,
      submitted_count: submittedCount,
      confirmed_count: confirmedCount,
      last_date: j.last_date,
      candidates: jMappings.map(m => ({
        mapping_id: String(m.id),
        candidate_name: resolveCandidateName(m.candidate),
        match_score: m.match_score,
        status: m.status,
        mapped_at: m.created_at
      }))
    };
  });

  const fulfillmentRate = totalPositions > 0
    ? Math.min(100, Math.round((totalConfirmed / totalPositions) * 100))
    : 0;

  return {
    company: {
      id: String(company.id),
      company_name: company.company_name,
      email: company.contact_email || company.email,
      phone: company.contact_mobile || company.phone,
      industry: resolveIndustry(company.industry),
      verification_status: company.status || company.verification_status || 'pending'
    },
    metrics: {
      total_jobs: jobs.length,
      total_positions: totalPositions,
      total_confirmed: totalConfirmed,
      fulfillment_rate: fulfillmentRate
    },
    jobs: jobDetails
  };
}

/**
 * Staff Dashboard (REQ-DSH-03)
 */
async function getStaffDashboard(staffUserId) {
  const uId = BigInt(staffUserId);

  // Assigned jobs (supports assigned_staff_id and assigned_to in mock)
  const assignedJobs = await prisma.jobs.findMany({
    where: {
      OR: [
        { assigned_staff_id: uId },
        { assigned_to: uId }
      ],
      deleted_at: null
    },
    include: {
      company: true,
      title: true
    }
  });

  const assignedJobIds = assignedJobs.map(j => j.id);

  // Mappings on assigned jobs
  const mappings = await prisma.job_candidates.findMany({
    where: {
      job_id: { in: assignedJobIds }
    }
  });

  // Candidates uploaded by this staff member (supports uploaded_by and created_by)
  const candidatesUploaded = await prisma.candidates.count({
    where: {
      OR: [
        { uploaded_by: uId },
        { created_by: uId }
      ],
      deleted_at: null
    }
  });

  const activeJobs = assignedJobs.filter(j => ['open', 'in_progress'].includes(j.status));
  const confirmedMappings = mappings.filter(m => m.status === 'confirmed');
  const pendingReviews = mappings.filter(m => m.status === 'submitted');

  let totalAssignedPositions = 0;
  assignedJobs.forEach(j => {
    totalAssignedPositions += j.positions_required || 0;
  });

  const placementRate = mappings.length > 0
    ? Math.min(100, Math.round((confirmedMappings.length / mappings.length) * 100))
    : 0;

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const urgentJobs = activeJobs
    .filter(j => j.last_date && new Date(j.last_date) <= sevenDaysFromNow)
    .map(j => ({
      id: String(j.id),
      job_code: j.job_code,
      title: resolveJobTitle(j),
      company_name: j.company?.company_name || 'Unknown',
      positions_required: j.positions_required,
      last_date: j.last_date,
      status: j.status
    }));

  return {
    metrics: {
      assigned_jobs_count: assignedJobs.length,
      active_jobs_count: activeJobs.length,
      candidates_uploaded_count: candidatesUploaded,
      candidates_submitted_count: mappings.length,
      candidates_confirmed_count: confirmedMappings.length,
      pending_company_reviews: pendingReviews.length,
      placement_conversion_rate: placementRate
    },
    assigned_jobs: activeJobs.map(j => ({
      id: String(j.id),
      job_code: j.job_code,
      title: resolveJobTitle(j),
      company_name: j.company?.company_name || 'Unknown',
      positions_required: j.positions_required,
      status: j.status,
      last_date: j.last_date
    })),
    urgent_jobs: urgentJobs
  };
}

/**
 * Company Dashboard (REQ-DSH-04)
 */
async function getCompanyDashboard(companyId) {
  const cId = BigInt(companyId);

  const jobs = await prisma.jobs.findMany({
    where: { company_id: cId, deleted_at: null },
    include: {
      title: true
    }
  });

  const jobIds = jobs.map(j => j.id);

  const mappings = await prisma.job_candidates.findMany({
    where: {
      job_id: { in: jobIds }
    },
    include: {
      candidate: true
    }
  });

  let totalPositions = 0;
  let confirmedPositions = 0;
  let openCount = 0;
  let inProgressCount = 0;
  let fulfilledCount = 0;
  let closedCount = 0;

  jobs.forEach(j => {
    totalPositions += j.positions_required || 0;
    if (j.status === 'open') openCount++;
    else if (j.status === 'in_progress') inProgressCount++;
    else if (j.status === 'fulfilled') fulfilledCount++;
    else if (j.status === 'closed') closedCount++;
  });

  const submittedCount = mappings.filter(m => m.status === 'submitted').length;
  const shortlistedCount = mappings.filter(m => m.status === 'shortlisted').length;
  confirmedPositions = mappings.filter(m => m.status === 'confirmed').length;

  const fulfillmentRate = totalPositions > 0
    ? Math.min(100, Math.round((confirmedPositions / totalPositions) * 100))
    : 0;

  return {
    metrics: {
      total_jobs: jobs.length,
      open_jobs: openCount,
      in_progress_jobs: inProgressCount,
      fulfilled_jobs: fulfilledCount,
      closed_jobs: closedCount,
      total_positions: totalPositions,
      confirmed_positions: confirmedPositions,
      fulfillment_rate: fulfillmentRate,
      pending_review_candidates: submittedCount,
      shortlisted_candidates: shortlistedCount
    },
    active_jobs: jobs
      .filter(j => ['open', 'in_progress'].includes(j.status))
      .map(j => {
        const jMappings = mappings.filter(m => String(m.job_id) === String(j.id));
        const conf = jMappings.filter(m => m.status === 'confirmed').length;
        return {
          id: String(j.id),
          job_code: j.job_code,
          title: resolveJobTitle(j),
          status: j.status,
          positions_required: j.positions_required,
          confirmed_count: conf,
          remaining_count: Math.max(0, j.positions_required - conf),
          submitted_count: jMappings.length
        };
      })
  };
}

/**
 * Report Export Service with Anti-Formula-Injection Sanitization (REQ-DSH-05, REQ-DSH-06)
 */
async function exportReport({ type = 'company-wise', format = 'csv' }) {
  let rows = [];
  let columns = [];

  if (type === 'company-wise') {
    const data = await getAdminCompanyWise();
    columns = [
      { key: 'company_name', label: 'Company Name' },
      { key: 'industry', label: 'Industry' },
      { key: 'verification_status', label: 'Status' },
      { key: 'jobs_count', label: 'Total Jobs' },
      { key: 'open_jobs_count', label: 'Open Jobs' },
      { key: 'positions_total', label: 'Total Positions' },
      { key: 'candidates_submitted', label: 'Candidates Submitted' },
      { key: 'candidates_confirmed', label: 'Confirmed Hires' },
      { key: 'fulfillment_rate', label: 'Fulfillment Rate (%)' }
    ];
    rows = data.companies;
  } else if (type === 'candidate-pipeline') {
    const mappings = await prisma.job_candidates.findMany({
      include: {
        candidate: true,
        job: {
          include: {
            title: true
          }
        }
      }
    });

    columns = [
      { key: 'candidate_name', label: 'Candidate Name' },
      { key: 'candidate_email', label: 'Candidate Email' },
      { key: 'candidate_mobile', label: 'Candidate Mobile' },
      { key: 'job_code', label: 'Job Code' },
      { key: 'job_title', label: 'Job Title' },
      { key: 'match_score', label: 'Match Score (%)' },
      { key: 'status', label: 'Mapping Status' },
      { key: 'mapped_at', label: 'Mapped Date' }
    ];

    rows = mappings.map(m => ({
      candidate_name: resolveCandidateName(m.candidate),
      candidate_email: m.candidate?.email || '',
      candidate_mobile: m.candidate?.mobile || '',
      job_code: m.job?.job_code || '',
      job_title: resolveJobTitle(m.job || {}),
      match_score: m.match_score || 0,
      status: m.status,
      mapped_at: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : ''
    }));
  } else if (type === 'staff-performance') {
    const data = await getStaffPerformance();
    columns = [
      { key: 'name', label: 'Staff Name' },
      { key: 'email', label: 'Email' },
      { key: 'mobile', label: 'Mobile' },
      { key: 'status', label: 'Status' },
      { key: 'assigned_jobs_count', label: 'Assigned Jobs' },
      { key: 'candidates_uploaded_count', label: 'Candidates Uploaded' },
      { key: 'candidates_submitted_count', label: 'Candidates Submitted' },
      { key: 'candidates_confirmed_count', label: 'Confirmed Hires' },
      { key: 'conversion_rate', label: 'Conversion Rate (%)' }
    ];
    rows = data;
  } else if (type === 'job-requisitions') {
    const jobs = await prisma.jobs.findMany({
      where: { deleted_at: null },
      include: {
        company: true,
        title: true,
        city: true
      }
    });

    columns = [
      { key: 'job_code', label: 'Job Code' },
      { key: 'title', label: 'Job Title' },
      { key: 'company_name', label: 'Company Name' },
      { key: 'positions_required', label: 'Positions Required' },
      { key: 'status', label: 'Status' },
      { key: 'last_date', label: 'Deadline' },
      { key: 'location', label: 'Location' }
    ];

    rows = jobs.map(j => ({
      job_code: j.job_code,
      title: resolveJobTitle(j),
      company_name: j.company?.company_name || '',
      positions_required: j.positions_required,
      status: j.status,
      last_date: j.last_date ? new Date(j.last_date).toISOString().split('T')[0] : '',
      location: j.city?.name || j.work_mode || 'Onsite'
    }));
  } else {
    throw new ApiError(400, `Unsupported report type: ${type}`);
  }

  if (format === 'csv') {
    const csvContent = generateSafeCsv(rows, columns);
    return {
      contentType: 'text/csv; charset=utf-8',
      fileName: `${type}-report-${Date.now()}.csv`,
      data: csvContent
    };
  } else if (format === 'xlsx') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    worksheet.columns = columns.map(c => ({
      header: c.label,
      key: c.key,
      width: 20
    }));

    // Add rows with strict anti-formula injection sanitization
    rows.forEach(r => {
      const sanitizedRow = {};
      columns.forEach(col => {
        sanitizedRow[col.key] = sanitizeFormulaCell(r[col.key]);
      });
      worksheet.addRow(sanitizedRow);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileName: `${type}-report-${Date.now()}.xlsx`,
      data: buffer
    };
  } else {
    throw new ApiError(400, `Unsupported format: ${format}. Use 'csv' or 'xlsx'.`);
  }
}

/**
 * Staff Performance Summary Report (PDF §6, §7)
 */
async function getStaffPerformance() {
  const staffUsers = await prisma.users.findMany({
    where: { role: 'staff', deleted_at: null }
  });

  const staffPerformance = [];

  for (const s of staffUsers) {
    const assignedJobs = await prisma.jobs.count({
      where: {
        OR: [
          { assigned_staff_id: s.id },
          { assigned_to: s.id }
        ],
        deleted_at: null
      }
    });

    const candidatesUploaded = await prisma.candidates.count({
      where: {
        OR: [
          { uploaded_by: s.id },
          { created_by: s.id }
        ],
        deleted_at: null
      }
    });

    const mappings = await prisma.job_candidates.findMany({
      where: {
        OR: [
          { submitted_by: s.id },
          { created_by: s.id }
        ]
      }
    });

    const confirmedCount = mappings.filter(m => m.status === 'confirmed').length;
    const submittedCount = mappings.length;
    const conversionRate = submittedCount > 0 ? Number(((confirmedCount / submittedCount) * 100).toFixed(1)) : 0;

    staffPerformance.push({
      id: String(s.id),
      name: s.name,
      email: s.email,
      mobile: s.mobile || '',
      status: s.status,
      assigned_jobs_count: assignedJobs,
      candidates_uploaded_count: candidatesUploaded,
      candidates_submitted_count: submittedCount,
      candidates_confirmed_count: confirmedCount,
      conversion_rate: conversionRate
    });
  }

  return staffPerformance;
}

module.exports = {
  getAdminCompanyWise,
  getCompanyDrillDown,
  getStaffDashboard,
  getCompanyDashboard,
  getStaffPerformance,
  exportReport
};
