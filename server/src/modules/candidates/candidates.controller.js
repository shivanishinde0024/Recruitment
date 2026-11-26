const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');
const { UPLOAD_DIR } = require('../../config/env');
const candidatesService = require('./candidates.service');
const candidateBulkService = require('./candidateBulk.service');

/**
 * Resolves a stored resume path against cwd, server root, and UPLOAD_DIR.
 */
function resolveExistingFilePath(filePath) {
  if (!filePath) return null;

  const trimmed = filePath.replace(/^[/\\]+/, '');
  const serverRoot = path.resolve(__dirname, '../../..');
  const uploadRoot = path.isAbsolute(UPLOAD_DIR) ? UPLOAD_DIR : path.resolve(serverRoot, UPLOAD_DIR);

  const candidates = [
    filePath,
    path.resolve(serverRoot, trimmed),
    path.resolve(uploadRoot, trimmed.replace(/^uploads[/\\]?/i, ''))
  ];

  for (const candidatePath of candidates) {
    try {
      if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
        return candidatePath;
      }
    } catch {
      // Ignore invalid paths and try the next candidate
    }
  }

  return null;
}

/**
 * Generates a valid PDF resume buffer from candidate profile data when no physical file exists on disk.
 */
function generateCandidateResumePdf(candidate) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const name = candidate?.name || 'Candidate';
    const designation = candidate?.current_designation || 'Candidate Profile';
    const company = candidate?.current_company ? ` at ${candidate.current_company}` : '';

    doc.fontSize(20).font('Helvetica-Bold').text(name);
    doc.moveDown(0.25);
    doc.fontSize(12).font('Helvetica').fillColor('#444444').text(`${designation}${company}`);
    doc.moveDown(0.75);

    doc.fillColor('#000000').fontSize(10);
    const contactParts = [
      candidate?.email ? `Email: ${candidate.email}` : null,
      candidate?.mobile ? `Mobile: ${candidate.mobile}` : null,
      candidate?.current_location || candidate?.address ? `Location: ${candidate.current_location || candidate.address}` : null
    ].filter(Boolean);

    if (contactParts.length > 0) {
      doc.text(contactParts.join('  |  '));
      doc.moveDown(0.75);
    }

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(0.75);

    if (candidate?.summary) {
      doc.fontSize(12).font('Helvetica-Bold').text('Professional Summary');
      doc.moveDown(0.25);
      doc.fontSize(10).font('Helvetica').text(candidate.summary);
      doc.moveDown(0.75);
    }

    doc.fontSize(12).font('Helvetica-Bold').text('Profile Details');
    doc.moveDown(0.25);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Experience: ${candidate?.experience_years ?? candidate?.total_experience ?? 0} Years`);
    doc.text(`Notice Period: ${candidate?.notice_period_days ?? 0} Days`);
    if (candidate?.current_salary != null) {
      doc.text(`Current Salary: INR ${Number(candidate.current_salary).toLocaleString('en-IN')} / yr`);
    }
    if (candidate?.expected_salary != null) {
      doc.text(`Expected Salary: INR ${Number(candidate.expected_salary).toLocaleString('en-IN')} / yr`);
    }

    const skillNames = (candidate?.skills || [])
      .map((s) => s.skill?.name || s.name)
      .filter(Boolean);
    if (skillNames.length > 0) {
      doc.moveDown(0.75);
      doc.fontSize(12).font('Helvetica-Bold').text('Key Skills');
      doc.moveDown(0.25);
      doc.fontSize(10).font('Helvetica').text(skillNames.join(', '));
    }

    doc.end();
  });
}

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
  const { filePath, filename, candidate } = await candidatesService.streamResume(req.params.id, req.user);

  const resolvedPath = resolveExistingFilePath(filePath);
  if (resolvedPath) {
    return res.download(resolvedPath, filename);
  }

  // Generate a valid PDF resume from candidate profile data when physical file is absent (e.g. seeded/in-memory records)
  const pdfFilename = filename.replace(/\.[^.]+$/, '.pdf');
  const pdfBuffer = await generateCandidateResumePdf(candidate);
  res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename}"`);
  res.setHeader('Content-Type', 'application/pdf');
  return res.send(pdfBuffer);
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

