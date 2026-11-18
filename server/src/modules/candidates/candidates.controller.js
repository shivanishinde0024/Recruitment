const fs = require('fs');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');
const candidatesService = require('./candidates.service');
const candidateBulkService = require('./candidateBulk.service');

const create = asyncHandler(async (req, res) => {
  const candidate = await candidatesService.createCandidate(req.body, req.file, req.user, req);
  return created(res, candidate, 'Candidate profile created successfully');
});

const list = asyncHandler(async (req, res) => {
  const result = await candidatesService.listCandidates(req.query, req.user);
  return ok(res, result.items, 'Candidates retrieved successfully', result.meta);
});

const getById = asyncHandler(async (req, res) => {
  const candidate = await candidatesService.getCandidateById(req.params.id, req.user);
  return ok(res, candidate, 'Candidate profile details retrieved successfully');
});

const update = asyncHandler(async (req, res) => {
  const candidate = await candidatesService.updateCandidate(req.params.id, req.body, req.file, req.user, req);
  return ok(res, candidate, 'Candidate profile updated successfully');
});

const remove = asyncHandler(async (req, res) => {
  const result = await candidatesService.deleteCandidate(req.params.id, req.user, req);
  return ok(res, result, result.message);
});

const downloadResume = asyncHandler(async (req, res) => {
  const { filePath, filename, mimeType } = await candidatesService.streamResume(req.params.id, req.user);

  if (filePath && fs.existsSync(filePath)) {
    return res.download(filePath, filename);
  }

  // Mock / In-memory test binary stream
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', mimeType || 'application/pdf');
  return res.send(Buffer.from('%PDF-1.4 Mock Candidate Resume Data'));
});

const bulkUpload = asyncHandler(async (req, res) => {
  const excelFile = req.files?.file?.[0] || req.file;
  if (!excelFile) {
    return res.status(400).json({ success: false, message: 'Excel (.xlsx) file is required for bulk upload' });
  }

  const zipFile = req.files?.resumes_zip?.[0] || null;
  const result = await candidateBulkService.processBulkCandidateUpload(
    excelFile.buffer,
    zipFile ? zipFile.buffer : null,
    req.user
  );

  return ok(res, result, `Bulk upload finished. Imported ${result.imported_count} of ${result.total_rows} candidates.`);
});

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  downloadResume,
  bulkUpload
};

