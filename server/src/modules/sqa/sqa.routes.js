const express = require('express');
const validate = require('../../middleware/validate');
const {
  createLeadSchema,
  updateLeadStatusSchema,
  createApplicationSchema
} = require('./sqa.schema');
const sqaController = require('./sqa.controller');

const router = express.Router();

// Public Admissions & Consultation Inquiries (supports both /leads and root when mounted under /sqa or /leads)
router.post('/', validate(createLeadSchema), sqaController.createLead);
router.post('/submit', validate(createLeadSchema), sqaController.createLead);
router.post('/leads', validate(createLeadSchema), sqaController.createLead);
router.post('/leads/submit', validate(createLeadSchema), sqaController.createLead);

router.get('/', sqaController.listLeads);
router.get('/leads', sqaController.listLeads);
router.get('/export', sqaController.exportLeadsCsv);
router.get('/leads/export', sqaController.exportLeadsCsv);

router.patch('/:id/status', validate(updateLeadStatusSchema), sqaController.updateLeadStatus);
router.patch('/leads/:id/status', validate(updateLeadStatusSchema), sqaController.updateLeadStatus);

router.delete('/:id', sqaController.deleteLead);
router.delete('/leads/:id', sqaController.deleteLead);

// Candidate & Placement Applications
router.post('/apply', validate(createApplicationSchema), sqaController.createApplication);
router.post('/applications', validate(createApplicationSchema), sqaController.createApplication);
router.post('/applications/apply', validate(createApplicationSchema), sqaController.createApplication);

// Certificate Ledger Verification
router.get('/certificates/verify/:code', sqaController.verifyCertificate);
router.get('/certificates/verify', sqaController.verifyCertificate);

module.exports = router;
