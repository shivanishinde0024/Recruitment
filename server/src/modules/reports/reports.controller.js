const reportsService = require('./reports.service');
const { checkApproachingDeadlines } = require('../../cron/deadlineReminder');
const { ok } = require('../../utils/response');
const ApiError = require('../../utils/ApiError');

async function getAdminCompanyWiseHandler(req, res, next) {
  try {
    const data = await reportsService.getAdminCompanyWise();
    return ok(res, data, 'Company-wise dashboard analytics retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function getCompanyDrillDownHandler(req, res, next) {
  try {
    const companyId = req.params.id;
    const userCompanyId = req.user.companyId || req.user.company_id;

    // IDOR check: If company user, can only view own company
    if (req.user.role === 'company' && String(userCompanyId) !== String(companyId)) {
      throw new ApiError(404, 'Company not found');
    }

    const data = await reportsService.getCompanyDrillDown(companyId);
    return ok(res, data, 'Company drill-down report retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function getStaffDashboardHandler(req, res, next) {
  try {
    const staffId = req.user.role === 'staff' ? req.user.id : (req.query.staff_id || req.user.id);
    const data = await reportsService.getStaffDashboard(staffId);
    return ok(res, data, 'Staff dashboard data retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function getCompanyDashboardHandler(req, res, next) {
  try {
    let companyId = req.user.companyId || req.user.company_id;
    if (req.user.role === 'admin' && req.query.company_id) {
      companyId = req.query.company_id;
    }

    if (!companyId) {
      throw new ApiError(400, 'Company ID not associated with current account');
    }

    const data = await reportsService.getCompanyDashboard(companyId);
    return ok(res, data, 'Company dashboard data retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function exportReportHandler(req, res, next) {
  try {
    const { type = 'company-wise', format = 'csv' } = req.query;
    const report = await reportsService.exportReport({ type, format, user: req.user, query: req.query });

    res.setHeader('Content-Type', report.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);

    if (Buffer.isBuffer(report.data)) {
      return res.end(report.data);
    }
    return res.send(report.data);
  } catch (err) {
    next(err);
  }
}

async function triggerDeadlineCheckHandler(req, res, next) {
  try {
    const result = await checkApproachingDeadlines();
    return ok(res, result, 'Deadline checks processed successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminCompanyWiseHandler,
  getCompanyDrillDownHandler,
  getStaffDashboardHandler,
  getCompanyDashboardHandler,
  exportReportHandler,
  triggerDeadlineCheckHandler
};
