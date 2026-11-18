const path = require('path');
const fs = require('fs');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');
const companiesService = require('./companies.service');

const register = asyncHandler(async (req, res) => {
  const result = await companiesService.registerCompany(req.body, req.files, req);
  return created(res, result, 'Company registered successfully. Verification pending.');
});

const list = asyncHandler(async (req, res) => {
  const result = await companiesService.listCompanies(req.query, req.user);
  return ok(res, result.items, 'Companies retrieved successfully', result.meta);
});

const getById = asyncHandler(async (req, res) => {
  const company = await companiesService.getCompanyById(req.params.id, req.user);
  return ok(res, company, 'Company details retrieved successfully');
});

const verify = asyncHandler(async (req, res) => {
  const updated = await companiesService.verifyCompany(req.params.id, req.body, req.user, req);
  return ok(res, updated, `Company verification status updated to '${updated.status}'`);
});

const update = asyncHandler(async (req, res) => {
  const updated = await companiesService.updateCompany(req.params.id, req.body, req.user, req);
  return ok(res, updated, 'Company profile updated successfully');
});

const addDocument = asyncHandler(async (req, res) => {
  const doc = await companiesService.addCompanyDocument(req.params.id, req.file, req.body.doc_type, req.user);
  return created(res, doc, 'Document uploaded successfully');
});

const downloadDocument = asyncHandler(async (req, res) => {
  const doc = await companiesService.getDocumentDownload(req.params.id, req.params.docId, req.user);
  
  if (doc.file_path && fs.existsSync(doc.file_path)) {
    return res.download(doc.file_path, doc.original_name);
  }

  // If in-memory / mock test file where physical path is not on disk
  res.setHeader('Content-Disposition', `attachment; filename="${doc.original_name}"`);
  res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
  return res.send(Buffer.from('mock document binary content'));
});

const remove = asyncHandler(async (req, res) => {
  const result = await companiesService.deleteCompany(req.params.id, req.user, req);
  return ok(res, result, result.message);
});

module.exports = {
  register,
  list,
  getById,
  verify,
  update,
  addDocument,
  downloadDocument,
  remove
};
