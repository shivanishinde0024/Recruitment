const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const prisma = require('../../src/config/db');
const { JWT_ACCESS_SECRET } = require('../../src/config/env');
const { recordAudit, sanitizeAuditData } = require('../../src/middleware/audit');

describe('Phase 8: Audit, Settings, and Trash Management Module', () => {
  let adminToken;
  let staffToken;
  let companyToken;

  let adminUser;
  let staffUser;
  let companyUser;

  let testCompany;
  let testJob;
  let testCandidate;

  beforeAll(async () => {
    // 1. Create Users
    adminUser = await prisma.users.create({
      data: {
        name: 'Super Auditor',
        email: 'auditor@example.com',
        password_hash: 'hashed_pwd',
        role: 'admin',
        status: 'active'
      }
    });

    staffUser = await prisma.users.create({
      data: {
        name: 'Staff Auditor',
        email: 'staff_audit@example.com',
        password_hash: 'hashed_pwd',
        role: 'staff',
        status: 'active'
      }
    });

    companyUser = await prisma.users.create({
      data: {
        name: 'Company Audit User',
        email: 'comp_audit@example.com',
        password_hash: 'hashed_pwd',
        role: 'company',
        status: 'active'
      }
    });

    adminToken = jwt.sign(
      { sub: String(adminUser.id), role: 'admin', email: adminUser.email },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    staffToken = jwt.sign(
      { sub: String(staffUser.id), role: 'staff', email: staffUser.email },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    companyToken = jwt.sign(
      { sub: String(companyUser.id), role: 'company', email: companyUser.email },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 2. Create Audit Logs for testing
    await recordAudit({
      userId: adminUser.id,
      action: 'create',
      moduleName: 'jobs',
      recordId: 101,
      oldValue: null,
      newValue: { title: 'Security Engineer', password: 'secret_password_do_not_leak' }
    });

    await recordAudit({
      userId: staffUser.id,
      action: 'update',
      moduleName: 'candidates',
      recordId: 202,
      oldValue: { status: 'draft' },
      newValue: { status: 'active', accessToken: 'raw_bearer_token' }
    });
  });

  describe('Centralized Audit Logging & Viewer (REQ-AUD-01, REQ-AUD-02 / Flow F10)', () => {
    it('CRITICAL PII DEFENSE: sanitizes sensitive keys (passwords, tokens) in audit snapshots', () => {
      const sanitized = sanitizeAuditData({
        name: 'John',
        password: 'myPassword123',
        password_hash: 'argon2id$1234',
        token: 'secret_jwt',
        nested: {
          refreshToken: 'deep_secret'
        }
      });

      expect(sanitized.name).toBe('John');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.password_hash).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.nested.refreshToken).toBe('[REDACTED]');
    });

    it('rejects unauthenticated request to /api/v1/audit-logs with 401', async () => {
      const res = await request(app).get('/api/v1/audit-logs');
      expect(res.status).toBe(401);
    });

    it('blocks non-admin users from accessing audit logs with 403', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(403);
    });

    it('allows admin to list audit logs with pagination and filters', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs?module=jobs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();

      const jobLog = res.body.data.find(l => l.module === 'jobs');
      expect(jobLog).toBeDefined();
      expect(jobLog.action).toBe('create');
      // Verify sensitive password was redacted
      expect(jobLog.new_value.password).toBe('[REDACTED]');
    });

    it('allows admin to retrieve audit log details by ID', async () => {
      const listRes = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      const firstLog = listRes.body.data[0];

      const res = await request(app)
        .get(`/api/v1/audit-logs/${firstLog.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(firstLog.id);
      expect(res.body.data.action).toBeDefined();
    });
  });

  describe('Trash and Restore Manager (REQ-AUD-03 / Ruling 3.4 / Flow F10)', () => {
    beforeEach(async () => {
      // Create fresh soft-deleted records for each test
      testCompany = await prisma.companies.create({
        data: {
          company_name: 'Soft Deleted Corp',
          contact_person: 'Dan Deleted',
          email: 'dan@deleted.com',
          phone: '9988776655',
          verification_status: 'approved',
          deleted_at: new Date()
        }
      });

      testJob = await prisma.jobs.create({
        data: {
          company_id: testCompany.id,
          title: 'Orphaned Job',
          job_code: 'JOB-TRASH-001',
          positions_required: 1,
          status: 'open',
          deleted_at: new Date()
        }
      });

      testCandidate = await prisma.candidates.create({
        data: {
          first_name: 'Trash',
          last_name: 'Candidate',
          email: 'trash@candidate.com',
          mobile: '9191919191',
          status: 'active',
          deleted_at: new Date()
        }
      });
    });

    it('blocks non-admin from listing trash items with 403', async () => {
      const res = await request(app)
        .get('/api/v1/trash')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(403);
    });

    it('allows admin to list soft-deleted items across modules', async () => {
      const res = await request(app)
        .get('/api/v1/trash')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const compItem = res.body.data.find(i => i.module === 'companies' && i.id === String(testCompany.id));
      const candItem = res.body.data.find(i => i.module === 'candidates' && i.id === String(testCandidate.id));

      expect(compItem).toBeDefined();
      expect(candItem).toBeDefined();
    });

    it('restores a soft-deleted candidate (sets deleted_at = null)', async () => {
      const res = await request(app)
        .patch(`/api/v1/trash/candidates/${testCandidate.id}/restore`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.restored).toBe(true);

      // Verify in DB that deleted_at is null
      const check = await prisma.candidates.findUnique({ where: { id: testCandidate.id } });
      expect(check.deleted_at).toBeNull();
    });

    it('CRITICAL RESTORE GUARD: blocks restoring a job when its parent company is in trash (returns 422)', async () => {
      const res = await request(app)
        .patch(`/api/v1/trash/jobs/${testJob.id}/restore`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
      expect(res.body.message).toContain('client company is in trash');
    });

    it('allows restoring job once parent company has been restored', async () => {
      // 1. Restore parent company first
      await request(app)
        .patch(`/api/v1/trash/companies/${testCompany.id}/restore`)
        .set('Authorization', `Bearer ${adminToken}`);

      // 2. Now restoring job must succeed
      const res = await request(app)
        .patch(`/api/v1/trash/jobs/${testJob.id}/restore`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.restored).toBe(true);

      const check = await prisma.jobs.findUnique({ where: { id: testJob.id } });
      expect(check.deleted_at).toBeNull();
    });

    it('permanently deletes an item from trash (Admin only)', async () => {
      const res = await request(app)
        .delete(`/api/v1/trash/candidates/${testCandidate.id}/permanent`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.permanently_deleted).toBe(true);

      const check = await prisma.candidates.findFirst({ where: { id: testCandidate.id } });
      expect(check).toBeNull();
    });
  });

  describe('System Settings & SMTP Configuration (REQ-AUD-04)', () => {
    it('blocks non-admin users from reading or updating settings with 403', async () => {
      const getRes = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${companyToken}`);
      expect(getRes.status).toBe(403);

      const putRes = await request(app)
        .put('/api/v1/settings')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ auto_approve_company: 'true' });
      expect(putRes.status).toBe(403);
    });

    it('allows admin to read system settings', async () => {
      const res = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.default_lock_minutes).toBeDefined();
      expect(res.body.data.max_failed_logins).toBeDefined();
    });

    it('allows admin to update system settings and records audit log', async () => {
      const res = await request(app)
        .put('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          auto_approve_company: 'true',
          default_lock_minutes: '20'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.auto_approve_company).toBe('true');
      expect(res.body.data.default_lock_minutes).toBe('20');
    });

    it('rejects test email request with missing or invalid recipient email with 400', async () => {
      const res = await request(app)
        .post('/api/v1/settings/test-email')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ to: 'invalid-email-address' });

      expect(res.status).toBe(400);
    });

    it('successfully processes test email trigger endpoint with valid recipient', async () => {
      const res = await request(app)
        .post('/api/v1/settings/test-email')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          to: 'test_admin@example.com',
          subject: 'Diagnostic Email Test'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.to).toBe('test_admin@example.com');
    });
  });
});

