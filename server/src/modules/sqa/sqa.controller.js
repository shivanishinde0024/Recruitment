const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');
const sqaService = require('./sqa.service');

const createLead = asyncHandler(async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
  const lead = await sqaService.createLead(req.body, ip);
  return created(res, lead, 'Inquiry successfully logged in SQA CRM');
});

const listLeads = asyncHandler(async (req, res) => {
  const result = await sqaService.listLeads(req.query);
  return ok(res, result.items, 'Leads retrieved successfully', {
    ...result.meta,
    stats: result.stats
  });
});

const updateLeadStatus = asyncHandler(async (req, res) => {
  const updated = await sqaService.updateLeadStatus(req.params.id, req.body.status);
  return ok(res, updated, 'Lead status updated successfully');
});

const deleteLead = asyncHandler(async (req, res) => {
  const result = await sqaService.deleteLead(req.params.id);
  return ok(res, result, 'Lead removed from CRM');
});

const createApplication = asyncHandler(async (req, res) => {
  const app = await sqaService.createApplication(req.body);
  return created(res, app, 'Candidate registered with Placement Cell');
});

const verifyCertificate = asyncHandler(async (req, res) => {
  const code = req.params.code || req.query.code;
  const cert = await sqaService.verifyCertificate(code);
  return ok(res, cert, cert.valid ? 'Certificate verified in ledger' : 'Certificate unverified');
});

const exportLeadsCsv = asyncHandler(async (req, res) => {
  const csv = await sqaService.exportLeadsCsv();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="SQA_Leads_${new Date().toISOString().slice(0, 10)}.csv"`);
  return res.status(200).send(csv);
});

module.exports = {
  createLead,
  listLeads,
  updateLeadStatus,
  deleteLead,
  createApplication,
  verifyCertificate,
  exportLeadsCsv
};

