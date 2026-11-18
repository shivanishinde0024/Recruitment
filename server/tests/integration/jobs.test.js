const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const prisma = require('../../src/config/db');
const { JWT_ACCESS_SECRET } = require('../../src/config/env');
const { generateJobCode } = require('../../src/modules/jobs/jobCode.service');

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

describe('Phase 4: Job Requirements Module', () => {
  let adminUser, staffUser, approvedCompanyUser, pendingCompanyUser;
  let adminToken, staffToken, approvedCompanyToken, pendingCompanyToken;
  let approvedCompany, pendingCompany, testSkill1, testSkill2;

  beforeEach(async () => {
    // Reset test tables
    if (prisma.users.records) prisma.users.records = [];
    if (prisma.companies.records) prisma.companies.records = [];
    if (prisma.jobs.records) prisma.jobs.records = [];
    if (prisma.job_skills.records) prisma.job_skills.records = [];
    if (prisma.job_sequences.records) prisma.job_sequences.records = [];
    if (prisma.job_candidates.records) prisma.job_candidates.records = [];
    if (prisma.notifications.records) prisma.notifications.records = [];
    if (prisma.audit_logs.records) prisma.audit_logs.records = [];
    if (prisma.skills.records) prisma.skills.records = [];

    // Seed Admin
    adminUser = await prisma.users.create({
      data: {
        name: 'Super Admin',
        email: 'admin@portal.com',
        role: 'admin',
        status: 'active'
      }
    });
    adminToken = makeToken(adminUser);

    // Seed Staff
    staffUser = await prisma.users.create({
      data: {
        name: 'Staff Scribe',
        email: 'staff@portal.com',
        role: 'staff',
        status: 'active'
      }
    });
    staffToken = makeToken(staffUser);

    // Seed Approved Company
    approvedCompanyUser = await prisma.users.create({
      data: {
        name: 'Approved HR',
        email: 'hr@approved.com',
        role: 'company',
        status: 'active'
      }
    });
    approvedCompany = await prisma.companies.create({
      data: {
        user_id: approvedCompanyUser.id,
        company_name: 'Approved Tech Ltd',
        status: 'approved',
        contact_person: 'Alice',
        contact_email: 'hr@approved.com',
        contact_mobile: '9876543210'
      }
    });
    approvedCompanyToken = makeToken(approvedCompanyUser, approvedCompany.id);

    // Seed Pending Company
    pendingCompanyUser = await prisma.users.create({
      data: {
        name: 'Pending HR',
        email: 'hr@pending.com',
        role: 'company',
        status: 'active'
      }
    });
    pendingCompany = await prisma.companies.create({
      data: {
        user_id: pendingCompanyUser.id,
        company_name: 'Pending Newco',
        status: 'pending',
        contact_person: 'Bob',
        contact_email: 'hr@pending.com',
        contact_mobile: '9876543211'
      }
    });
    pendingCompanyToken = makeToken(pendingCompanyUser, pendingCompany.id);

    // Seed Skills
    testSkill1 = await prisma.skills.create({ data: { name: 'Node.js', status: 'active' } });
    testSkill2 = await prisma.skills.create({ data: { name: 'React', status: 'active' } });
  });

  describe('Concurrency-Safe Job Code Generator (Ruling 3.2 / REQ-JOB-02)', () => {
    it('generates sequential job codes with format JOB-<YYYY>-XXXX', async () => {
      const year = new Date().getFullYear();
      const code1 = await generateJobCode(year);
      const code2 = await generateJobCode(year);

      expect(code1).toBe(`JOB-${year}-0001`);
      expect(code2).toBe(`JOB-${year}-0002`);
    });

    it('handles parallel concurrent code requests without generating duplicates', async () => {
      const year = 2026;
      const parallelRequests = 10;
      const promises = Array.from({ length: parallelRequests }, () => generateJobCode(year));
      const results = await Promise.all(promises);

      const uniqueCodes = new Set(results);
      expect(uniqueCodes.size).toBe(parallelRequests);
      results.forEach((code) => {
        expect(code).toMatch(/^JOB-2026-\d{4}$/);
      });
    });
  });

  describe('Company Authorization Guard & Approval Enforcement (Ruling 3.1 / Flow F1 / REQ-JOB-01)', () => {
    it('BLOCKS company with pending verification status from creating a job with HTTP 403', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${pendingCompanyToken}`)
        .send({
          title: 'Senior Backend Engineer',
          positions_required: 2,
          experience_min: 3,
          experience_max: 6
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not approved|restricted/i);
    });

    it('allows approved company to post a job and notifies admin & staff', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${approvedCompanyToken}`)
        .send({
          title: 'Full Stack Node Developer',
          positions_required: 3,
          experience_min: 2,
          experience_max: 5,
          salary_min: 600000,
          salary_max: 1200000,
          description: '<p>Exciting fullstack role</p>',
          skills: [
            { skill_id: testSkill1.id, is_mandatory: true },
            { skill_id: testSkill2.id, is_mandatory: false }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Full Stack Node Developer');
      expect(res.body.data.status).toBe('open');
      expect(res.body.data.job_code).toMatch(/^JOB-\d{4}-\d{4}$/);
      expect(res.body.data.remaining_count).toBe(3);

      // Verify notification sent to staff and admin
      const notifications = await prisma.notifications.findMany({
        where: { type: 'job_posted_admin' }
      });
      expect(notifications.length).toBeGreaterThanOrEqual(1);
    });

    it('allows Admin to create job on behalf of approved company', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          company_id: approvedCompany.id,
          title: 'DevOps Architect',
          positions_required: 1,
          experience_min: 5,
          experience_max: 8
        });

      expect(res.status).toBe(201);
      expect(res.body.data.company_id).toBe(approvedCompany.id);
    });
  });

  describe('Validation & XSS Sanitization Rules (REQ-JOB-03, REQ-JOB-04)', () => {
    it('rejects job when experience_max is less than experience_min with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${approvedCompanyToken}`)
        .send({
          title: 'QA Engineer',
          positions_required: 1,
          experience_min: 5,
          experience_max: 2 // Invalid: max < min
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'experience_max')).toBe(true);
    });

    it('rejects job when salary_max is less than salary_min with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${approvedCompanyToken}`)
        .send({
          title: 'Product Manager',
          positions_required: 1,
          salary_min: 1500000,
          salary_max: 800000 // Invalid: max < min
        });

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'salary_max')).toBe(true);
    });

    it('rejects positions_required less than 1 with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${approvedCompanyToken}`)
        .send({
          title: 'Frontend Lead',
          positions_required: 0
        });

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'positions_required')).toBe(true);
    });

    it('sanitizes dangerous XSS payloads in rich text description and responsibilities', async () => {
      const maliciousHtml = '<p>Normal</p><script>alert("xss")</script><img src="x" onerror="stealCookie()">';

      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${approvedCompanyToken}`)
        .send({
          title: 'Security Analyst',
          positions_required: 1,
          description: maliciousHtml,
          responsibilities: '<p>Valid</p><iframe src="javascript:alert(1)"></iframe>'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.description).not.toContain('<script>');
      expect(res.body.data.description).not.toContain('onerror');
      expect(res.body.data.responsibilities).not.toContain('<iframe>');
      expect(res.body.data.description).toContain('<p>Normal</p>');
    });
  });

  describe('Staff Assignment Workflow (Flow F5 / REQ-JOB-05)', () => {
    let testJob;

    beforeEach(async () => {
      testJob = await prisma.jobs.create({
        data: {
          company_id: approvedCompany.id,
          job_code: 'JOB-2026-0099',
          title: 'Cloud Engineer',
          positions_required: 2,
          status: 'open'
        }
      });
    });

    it('allows Admin to assign a staff member and notifies staff with job_assigned_staff', async () => {
      const res = await request(app)
        .patch(`/api/v1/jobs/${testJob.id}/assign-staff`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assigned_to: staffUser.id });

      expect(res.status).toBe(200);
      expect(res.body.data.assigned_to).toBe(staffUser.id);

      // Verify notification sent
      const notification = await prisma.notifications.findFirst({
        where: { user_id: staffUser.id, type: 'job_assigned_staff' }
      });
      expect(notification).toBeDefined();
      expect(notification.message).toMatch(/Cloud Engineer/);
    });

    it('blocks company from assigning staff to job with HTTP 403', async () => {
      const res = await request(app)
        .patch(`/api/v1/jobs/${testJob.id}/assign-staff`)
        .set('Authorization', `Bearer ${approvedCompanyToken}`)
        .send({ assigned_to: staffUser.id });

      expect(res.status).toBe(403);
    });

    it('rejects assigning non-existent or non-staff user with HTTP 422', async () => {
      const res = await request(app)
        .patch(`/api/v1/jobs/${testJob.id}/assign-staff`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assigned_to: 999999 });

      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/must be an active staff member/i);
    });
  });

  describe('Position Reduction Guard & Status Lifecycle (REQ-JOB-06, REQ-JOB-07)', () => {
    let testJob;

    beforeEach(async () => {
      testJob = await prisma.jobs.create({
        data: {
          company_id: approvedCompany.id,
          job_code: 'JOB-2026-0044',
          title: 'Data Scientist',
          positions_required: 3,
          status: 'open'
        }
      });

      // Map 2 confirmed candidates
      await prisma.job_candidates.create({
        data: { job_id: testJob.id, candidate_id: 101n, status: 'confirmed' }
      });
      await prisma.job_candidates.create({
        data: { job_id: testJob.id, candidate_id: 102n, status: 'confirmed' }
      });
    });

    it('CRITICAL GUARD: blocks reducing positions_required below confirmed candidate count (returns 422)', async () => {
      const res = await request(app)
        .put(`/api/v1/jobs/${testJob.id}`)
        .set('Authorization', `Bearer ${approvedCompanyToken}`)
        .send({ positions_required: 1 }); // Invalid: 1 < 2 confirmed

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Cannot reduce positions required.*below already confirmed/i);
    });

    it('allows reducing positions_required when equal or greater than confirmed count', async () => {
      const res = await request(app)
        .put(`/api/v1/jobs/${testJob.id}`)
        .set('Authorization', `Bearer ${approvedCompanyToken}`)
        .send({ positions_required: 2 }); // Valid: 2 >= 2

      expect(res.status).toBe(200);
      expect(res.body.data.positions_required).toBe(2);
      expect(res.body.data.remaining_count).toBe(0);
    });

    it('updates status to on_hold and closed', async () => {
      const resHold = await request(app)
        .patch(`/api/v1/jobs/${testJob.id}/status`)
        .set('Authorization', `Bearer ${approvedCompanyToken}`)
        .send({ status: 'on_hold' });

      expect(resHold.status).toBe(200);
      expect(resHold.body.data.status).toBe('on_hold');

      const resClose = await request(app)
        .patch(`/api/v1/jobs/${testJob.id}/status`)
        .set('Authorization', `Bearer ${approvedCompanyToken}`)
        .send({ status: 'closed' });

      expect(resClose.status).toBe(200);
      expect(resClose.body.data.status).toBe('closed');
    });
  });

  describe('Multi-Tenant Access Control & IDOR Boundary (§8.2)', () => {
    let companyAJob;

    beforeEach(async () => {
      companyAJob = await prisma.jobs.create({
        data: {
          company_id: approvedCompany.id,
          job_code: 'JOB-2026-0005',
          title: 'Proprietary Research Lead',
          positions_required: 1,
          status: 'open'
        }
      });
    });

    it('returns HTTP 404 when another company attempts to view or update Company A job', async () => {
      // Create user and company for Company C
      const companyCUser = await prisma.users.create({
        data: {
          name: 'Charlie HR',
          email: 'c@comp.com',
          role: 'company',
          status: 'active'
        }
      });
      const companyC = await prisma.companies.create({
        data: {
          user_id: companyCUser.id,
          company_name: 'Company C',
          status: 'approved',
          contact_person: 'Charlie',
          contact_email: 'c@comp.com',
          contact_mobile: '9876543212'
        }
      });
      const companyCToken = makeToken(companyCUser, companyC.id);

      // GET attempt
      const resGet = await request(app)
        .get(`/api/v1/jobs/${companyAJob.id}`)
        .set('Authorization', `Bearer ${companyCToken}`);
      expect(resGet.status).toBe(404);

      // PUT attempt
      const resPut = await request(app)
        .put(`/api/v1/jobs/${companyAJob.id}`)
        .set('Authorization', `Bearer ${companyCToken}`)
        .send({ title: 'Hacked Title' });
      expect(resPut.status).toBe(404);
    });

    it('allows Staff and Admin to view any company job', async () => {
      const res = await request(app)
        .get(`/api/v1/jobs/${companyAJob.id}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Proprietary Research Lead');
    });
  });
});
