const express = require('express');
const { authenticate, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { createUploader, memoryUploader } = require('../../middleware/upload');
const {
  createCandidateSchema,
  updateCandidateSchema
} = require('./candidates.schema');
const candidatesController = require('./candidates.controller');

const router = express.Router();
const resumeUploader = createUploader('resume');

// Create single candidate (Admin & Staff)
router.post(
  '/',
  authenticate,
  requireRole('admin', 'staff'),
  resumeUploader.single('resume'),
  validate(createCandidateSchema),
  candidatesController.create
);

// List candidates with search, filters, pagination
router.get('/', authenticate, candidatesController.list);

// Bulk candidate spreadsheet + zip import (Admin & Staff) - supports both /bulk and /bulk-upload
router.post(
  '/bulk',
  authenticate,
  requireRole('admin', 'staff'),
  memoryUploader.fields([
    { name: 'file', maxCount: 1 },
    { name: 'resumes_zip', maxCount: 1 }
  ]),
  candidatesController.bulkUpload
);

router.post(
  '/bulk-upload',
  authenticate,
  requireRole('admin', 'staff'),
  memoryUploader.fields([
    { name: 'file', maxCount: 1 },
    { name: 'resumes_zip', maxCount: 1 }
  ]),
  candidatesController.bulkUpload
);

// Download standard candidate bulk upload Excel template
router.get('/template', authenticate, requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Candidates');

    worksheet.columns = [
      { header: 'first_name', key: 'first_name', width: 15 },
      { header: 'last_name', key: 'last_name', width: 15 },
      { header: 'email', key: 'email', width: 25 },
      { header: 'mobile', key: 'mobile', width: 18 },
      { header: 'alt_mobile', key: 'alt_mobile', width: 18 },
      { header: 'current_location', key: 'current_location', width: 15 },
      { header: 'total_experience', key: 'total_experience', width: 15 },
      { header: 'current_ctc', key: 'current_ctc', width: 15 },
      { header: 'expected_ctc', key: 'expected_ctc', width: 15 },
      { header: 'notice_period_days', key: 'notice_period_days', width: 18 },
      { header: 'qualification', key: 'qualification', width: 20 },
      { header: 'skills', key: 'skills', width: 30 },
      { header: 'resume_filename', key: 'resume_filename', width: 25 }
    ];

    worksheet.addRow({
      first_name: 'Rahul',
      last_name: 'Sharma',
      email: 'rahul.sharma@example.com',
      mobile: '+91-9876543210',
      alt_mobile: '',
      current_location: 'Pune',
      total_experience: 5.5,
      current_ctc: 850000,
      expected_ctc: 1200000,
      notice_period_days: 30,
      qualification: 'B.Tech / B.E.',
      skills: 'Node.js, React.js, MySQL',
      resume_filename: 'rahul_sharma.pdf'
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Candidate_Bulk_Import_Template.xlsx"');
    const buffer = await workbook.xlsx.writeBuffer();
    return res.end(buffer);
  } catch (err) {
    next(err);
  }
});

// Detail candidate profile view
router.get('/:id', authenticate, candidatesController.getById);

// Update candidate (Subject to staff ownership rule)
router.put(
  '/:id',
  authenticate,
  requireRole('admin', 'staff'),
  resumeUploader.single('resume'),
  validate(updateCandidateSchema),
  candidatesController.update
);

// Soft delete candidate (Subject to staff ownership rule)
router.delete('/:id', authenticate, requireRole('admin', 'staff'), candidatesController.remove);

// Authenticated private resume download stream
router.get('/:id/resume', authenticate, candidatesController.downloadResume);

module.exports = router;

