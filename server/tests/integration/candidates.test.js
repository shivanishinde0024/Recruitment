const request = require('supertest');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
const app = require('../../src/app');
const prisma = require('../../src/config/db');
const { JWT_ACCESS_SECRET } = require('../../src/config/env');

function makeToken(user, companyId = null) {
  return jwt.sign(
    {
      sub: String(user.id),
      role: user.role,
      email: user.email,
      companyId: companyId ? String(companyId) : undefined
    },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

describe('Phase 5: Candidates Module', () => {
  let adminUser, staffUser1, staffUser2, companyUser;
  let adminToken, staffToken1, staffToken2, companyToken;
  let companyRecord, skillNode, skillReact;

  beforeEach(async () => {
    // Reset test tables
    if (prisma.users.records) prisma.users.records = [];
    if (prisma.companies.records) prisma.companies.records = [];
    if (prisma.jobs.records) prisma.jobs.records = [];
    if (prisma.candidates.records) prisma.candidates.records = [];
    if (prisma.candidate_skills.records) prisma.candidate_skills.records = [];
    if (prisma.job_candidates.records) prisma.job_candidates.records = [];
    if (prisma.audit_logs.records) prisma.audit_logs.records = [];
    if (prisma.skills.records) prisma.skills.records = [];

    // Seed Admin
    adminUser = await prisma.users.create({
      data: { name: 'Admin Master', email: 'admin@portal.com', role: 'admin', status: 'active' }
    });
    adminToken = makeToken(adminUser);

    // Seed Staff 1
    staffUser1 = await prisma.users.create({
      data: { name: 'Staff Recruiter One', email: 'staff1@portal.com', role: 'staff', status: 'active' }
    });
    staffToken1 = makeToken(staffUser1);

    // Seed Staff 2
    staffUser2 = await prisma.users.create({
      data: { name: 'Staff Recruiter Two', email: 'staff2@portal.com', role: 'staff', status: 'active' }
    });
    staffToken2 = makeToken(staffUser2);

    // Seed Company
    companyUser = await prisma.users.create({
      data: { name: 'Company HR', email: 'hr@client.com', role: 'company', status: 'active' }
    });
    companyRecord = await prisma.companies.create({
      data: {
        user_id: companyUser.id,
        company_name: 'Client Tech Corp',
        status: 'approved',
        contact_person: 'Dana',
        contact_email: 'hr@client.com',
        contact_mobile: '9876543210'
      }
    });
    companyToken = makeToken(companyUser, companyRecord.id);

    // Seed Skills
    skillNode = await prisma.skills.create({ data: { name: 'Node.js', status: 'active' } });
    skillReact = await prisma.skills.create({ data: { name: 'React', status: 'active' } });
  });

  describe('Candidate Profile CRUD (REQ-CND-01)', () => {
    it('creates candidate with skills and resume attachment', async () => {
      const res = await request(app)
        .post('/api/v1/candidates')
        .set('Authorization', `Bearer ${staffToken1}`)
        .send({
          name: 'Jane Candidate',
          email: 'jane@example.com',
          mobile: '9876543299',
          gender: 'female',
          experience_years: 4.5,
          current_company: 'Infosys',
          current_designation: 'Senior Developer',
          current_salary: 800000,
          expected_salary: 1200000,
          notice_period_days: 15,
          skills: [
            { skill_id: skillNode.id, rating: 4 },
            { skill_id: skillReact.id, rating: 5 }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Jane Candidate');
      expect(res.body.data.uploaded_by).toBe(staffUser1.id);
      expect(res.body.data.skills.length).toBe(2);
    });

    it('lists candidates with search filter and pagination', async () => {
      await prisma.candidates.create({
        data: {
          name: 'Alex Developer',
          email: 'alex@example.com',
          mobile: '9111111111',
          experience_years: 2,
          uploaded_by: staffUser1.id,
          status: 'available'
        }
      });

      const res = await request(app)
        .get('/api/v1/candidates?search=Alex')
        .set('Authorization', `Bearer ${staffToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Alex Developer');
    });
  });

  describe('Duplicate Detection Constraint (Ruling 3.4 / REQ-CND-02)', () => {
    beforeEach(async () => {
      await prisma.candidates.create({
        data: {
          name: 'Existing Bob',
          email: 'bob@example.com',
          mobile: '9222222222',
          uploaded_by: staffUser1.id,
          status: 'available'
        }
      });
    });

    it('rejects candidate with duplicate email with HTTP 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/candidates')
        .set('Authorization', `Bearer ${staffToken1}`)
        .send({
          name: 'Bob Duplicate Email',
          email: 'bob@example.com', // Duplicate
          mobile: '9333333333'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already registered/i);
    });

    it('rejects candidate with duplicate mobile with HTTP 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/candidates')
        .set('Authorization', `Bearer ${staffToken1}`)
        .send({
          name: 'Bob Duplicate Mobile',
          email: 'bobnew@example.com',
          mobile: '9222222222' // Duplicate
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already registered/i);
    });
  });

  describe('Staff Upload Ownership Boundary (Ruling 3.8 / REQ-CND-06)', () => {
    let candidateStaff1;

    beforeEach(async () => {
      candidateStaff1 = await prisma.candidates.create({
        data: {
          name: 'Staff1 Candidate',
          email: 'c1@example.com',
          mobile: '9444444441',
          uploaded_by: staffUser1.id,
          status: 'available'
        }
      });
    });

    it('allows Staff 1 to update candidate they personally uploaded', async () => {
      const res = await request(app)
        .put(`/api/v1/candidates/${candidateStaff1.id}`)
        .set('Authorization', `Bearer ${staffToken1}`)
        .send({ current_company: 'Updated Corp' });

      expect(res.status).toBe(200);
      expect(res.body.data.current_company).toBe('Updated Corp');
    });

    it('CRITICAL GUARD: blocks Staff 2 from updating candidate uploaded by Staff 1 (returns 403)', async () => {
      const res = await request(app)
        .put(`/api/v1/candidates/${candidateStaff1.id}`)
        .set('Authorization', `Bearer ${staffToken2}`)
        .send({ current_company: 'Hacked Corp' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Staff members can only edit candidates they personally uploaded/i);
    });

    it('CRITICAL GUARD: blocks Staff 2 from deleting candidate uploaded by Staff 1 (returns 403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/candidates/${candidateStaff1.id}`)
        .set('Authorization', `Bearer ${staffToken2}`);

      expect(res.status).toBe(403);
    });

    it('allows Admin to update or delete any candidate regardless of uploader', async () => {
      const res = await request(app)
        .put(`/api/v1/candidates/${candidateStaff1.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin Renamed Candidate' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Admin Renamed Candidate');

      const resDel = await request(app)
        .delete(`/api/v1/candidates/${candidateStaff1.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resDel.status).toBe(200);
    });
  });

  describe('Resume Streaming Authorization (REQ-CND-04)', () => {
    let candidateWithResume;

    beforeEach(async () => {
      candidateWithResume = await prisma.candidates.create({
        data: {
          name: 'Resume Candidate',
          email: 'resume@example.com',
          mobile: '9555555555',
          resume_path: '/uploads/resumes/2026/11/mock_resume.pdf',
          uploaded_by: staffUser1.id,
          status: 'available'
        }
      });
    });

    it('allows Staff and Admin to download candidate resume', async () => {
      const res = await request(app)
        .get(`/api/v1/candidates/${candidateWithResume.id}/resume`)
        .set('Authorization', `Bearer ${staffToken1}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toMatch(/attachment; filename=/);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
      const pdfText = Buffer.isBuffer(res.body) ? res.body.toString('latin1') : String(res.text || '');
      expect(pdfText.startsWith('%PDF-')).toBe(true);
      expect(pdfText.trim().endsWith('%%EOF')).toBe(true);
    });

    it('blocks company user from downloading resume if candidate is NOT mapped to company job (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/candidates/${candidateWithResume.id}/resume`)
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(404);
    });

    it('allows company user to download resume if candidate IS mapped to their job', async () => {
      const job = await prisma.jobs.create({
        data: {
          company_id: companyRecord.id,
          job_code: 'JOB-2026-0001',
          title: 'Mapped Job',
          positions_required: 1
        }
      });
      await prisma.job_candidates.create({
        data: {
          job_id: job.id,
          candidate_id: candidateWithResume.id,
          status: 'submitted'
        }
      });

      const res = await request(app)
        .get(`/api/v1/candidates/${candidateWithResume.id}/resume`)
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toMatch(/attachment; filename=/);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
      const pdfText = Buffer.isBuffer(res.body) ? res.body.toString('latin1') : String(res.text || '');
      expect(pdfText.startsWith('%PDF-')).toBe(true);
      expect(pdfText.trim().endsWith('%%EOF')).toBe(true);
    });
  });

  describe('Bulk Candidate Upload Engine (Ruling 3.7 / REQ-CND-05)', () => {
    it('processes spreadsheet import and provides row-by-row error report', async () => {
      // Create mock Excel buffer
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Candidates');
      sheet.addRow([
        'Name', 'Email', 'Mobile', 'Gender', 'Experience',
        'Current Company', 'Current Designation', 'Current Salary', 'Expected Salary',
        'Notice Period', 'Skills', 'Resume File'
      ]);
      // Row 2: Valid Candidate 1
      sheet.addRow([
        'Bulk One', 'bulk1@test.com', '9666666661', 'male', 3,
        'TCS', 'Developer', 500000, 800000, 30, 'Node.js, React', 'bulk1.pdf'
      ]);
      // Row 3: Valid Candidate 2
      sheet.addRow([
        'Bulk Two', 'bulk2@test.com', '9666666662', 'female', 5,
        'Wipro', 'Tech Lead', 1000000, 1500000, 60, 'Node.js', 'bulk2.pdf'
      ]);
      // Row 4: Duplicate candidate with same email as Bulk One
      sheet.addRow([
        'Bulk Three Duplicate', 'bulk1@test.com', '9666666663', 'male', 2,
        'Cognizant', 'Analyst', 400000, 600000, 15, 'React', 'bulk3.pdf'
      ]);

      const buffer = await workbook.xlsx.writeBuffer();

      const res = await request(app)
        .post('/api/v1/candidates/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(buffer), 'candidates.xlsx');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total_rows).toBe(3);
      expect(res.body.data.imported_count).toBe(2);
      expect(res.body.data.skipped_count).toBe(1);
      expect(res.body.data.errors.length).toBe(1);
      expect(res.body.data.errors[0].row).toBe(4);
      expect(res.body.data.errors[0].error).toMatch(/Duplicate candidate/i);

      // Verify records in DB
      const c1 = await prisma.candidates.findFirst({ where: { email: 'bulk1@test.com' } });
      const c2 = await prisma.candidates.findFirst({ where: { email: 'bulk2@test.com' } });
      expect(c1).toBeDefined();
      expect(c2).toBeDefined();
    });

    it('GET /api/v1/candidates/template downloads standard bulk Excel spreadsheet template', async () => {
      const res = await request(app)
        .get('/api/v1/candidates/template')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheetml.sheet');
      expect(res.headers['content-disposition']).toContain('Candidate_Bulk_Import_Template.xlsx');
    });
  });
});

