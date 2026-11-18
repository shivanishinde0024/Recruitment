const prisma = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { generateSafeCsv, sanitizeFormulaCell } = require('../../utils/csvExport');
const ExcelJS = require('exceljs');

/**
 * Admin Company-Wise Dashboard (Master §9.1 / REQ-DSH-01)
 * Uses decoupled queries to guarantee high performance and avoid huge multi-table Cartesian joins.
 */
async function getAdminCompanyWise() {
  // Query 1: Fetch all approved companies
  const companies = await prisma.companies.findMany({
    where: { deleted_at: null },
    select: {
      id: true,
      company_name: true,
      industry: true,
      verification_status: true,
      created_at: true
    }
  });

  // Query 2: Fetch all non-deleted jobs
  const jobs = await prisma.jobs.findMany({
    where: { deleted_at: null },
    select: {
      id: true,
      company_id: true,
      title: true,
      job_code: true,
      status: true,
      positions_required: true,
      last_date: true,
      assigned_to: true
    }
  });

  // Query 3: Fetch active candidate mappings
  const mappings = await prisma.job_candidates.findMany({
    where: { deleted_at: null },
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
      industry: c.industry || 'General',
      verification_status: c.verification_status,
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
        title: j.title,
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
    where: { id: cId, deleted_at: null }
  });

  if (!company) {
    throw new ApiError(404, 'Company not found');
  }

  const jobs = await prisma.jobs.findMany({
    where: { company_id: cId, deleted_at: null }
  });

  const jobIds = jobs.map(j => j.id);
  const mappings = await prisma.job_candidates.findMany({
    where: {
      job_id: { in: jobIds },
      deleted_at: null
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
      title: j.title,
      status: j.status,
      positions_required: j.positions_required,
      submitted_count: submittedCount,
      confirmed_count: confirmedCount,
      last_date: j.last_date,
      candidates: jMappings.map(m => ({
        mapping_id: String(m.id),
        candidate_name: m.candidate ? `${m.candidate.first_name} ${m.candidate.last_name}` : 'Unknown',
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
      email: company.email,
      phone: company.phone,
      industry: company.industry,
      verification_status: company.verification_status
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

  // Assigned jobs
  const assignedJobs = await prisma.jobs.findMany({
    where: { assigned_to: uId, deleted_at: null },
    include: {
      company: true
    }
  });

  const assignedJobIds = assignedJobs.map(j => j.id);

  // Mappings on assigned jobs
  const mappings = await prisma.job_candidates.findMany({
    where: {
      job_id: { in: assignedJobIds },
      deleted_at: null
    }
  });

  // Candidates uploaded by this staff member
  const candidatesUploaded = await prisma.candidates.count({
    where: { created_by: uId, deleted_at: null }
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
      title: j.title,
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
      title: j.title,
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
    where: { company_id: cId, deleted_at: null }
  });

  const jobIds = jobs.map(j => j.id);

  const mappings = await prisma.job_candidates.findMany({
    where: {
      job_id: { in: jobIds },
      deleted_at: null
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
          title: j.title,
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
      where: { deleted_at: null },
      include: {
        candidate: true,
        job: true
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
      candidate_name: m.candidate ? `${m.candidate.first_name} ${m.candidate.last_name}` : 'Unknown',
      candidate_email: m.candidate?.email || '',
      candidate_mobile: m.candidate?.mobile || '',
      job_code: m.job?.job_code || '',
      job_title: m.job?.title || '',
      match_score: m.match_score || 0,
      status: m.status,
      mapped_at: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : ''
    }));
  } else if (type === 'job-requisitions') {
    const jobs = await prisma.jobs.findMany({
      where: { deleted_at: null },
      include: {
        company: true
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
      title: j.title,
      company_name: j.company?.company_name || '',
      positions_required: j.positions_required,
      status: j.status,
      last_date: j.last_date ? new Date(j.last_date).toISOString().split('T')[0] : '',
      location: j.location || ''
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

module.exports = {
  getAdminCompanyWise,
  getCompanyDrillDown,
  getStaffDashboard,
  getCompanyDashboard,
  exportReport
};
