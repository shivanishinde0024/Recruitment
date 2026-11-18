const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const prisma = require('../../src/config/db');
const { JWT_ACCESS_SECRET } = require('../../src/config/env');
const { checkApproachingDeadlines } = require('../../src/cron/deadlineReminder');
const { sanitizeFormulaCell } = require('../../src/utils/csvExport');

describe('Phase 7: Dashboards, Notifications, and Reports Module', () => {
  let adminToken;
  let staffToken;
  let company1Token;
  let company2Token;

  let adminUser;
  let staffUser;
  let company1User;
  let company2User;

  let testCompany1;
  let testCompany2;
  let testJob1;
  let testJob2;

  beforeAll(async () => {
    // 1. Create Users
    adminUser = await prisma.users.create({
      data: {
        name: 'Report Admin',
        email: 'report_admin@example.com',
        password_hash: 'hashed',
        role: 'admin',
        status: 'active'
      }
    });

    staffUser = await prisma.users.create({
      data: {
        name: 'Report Staff',
        email: 'report_staff@example.com',
        password_hash: 'hashed',
        role: 'staff',
        status: 'active'
      }
    });

    company1User = await prisma.users.create({
      data: {
        name: 'Company 1 Rep',
        email: 'rep1@acmeapex.com',
        password_hash: 'hashed',
        role: 'company',
        status: 'active'
      }
    });

    company2User = await prisma.users.create({
      data: {
        name: 'Company 2 Rep',
        email: 'rep2@betaglobal.com',
        password_hash: 'hashed',
        role: 'company',
        status: 'active'
      }
    });

    // 2. Create Companies linked to company users
    testCompany1 = await prisma.companies.create({
      data: {
        company_name: 'Acme Apex Corp',
        contact_person: 'Alice Apex',
        email: 'alice@acmeapex.com',
        phone: '9876543210',
        industry: 'Information Technology',
        verification_status: 'approved',
        status: 'approved',
        user_id: company1User.id
      }
    });

    testCompany2 = await prisma.companies.create({
      data: {
        company_name: 'Beta Global Ltd',
        contact_person: 'Bob Beta',
        email: 'bob@betaglobal.com',
        phone: '9876543211',
        industry: 'Finance',
        verification_status: 'approved',
        status: 'approved',
        user_id: company2User.id
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

    company1Token = jwt.sign(
      { sub: String(company1User.id), role: 'company', email: company1User.email, companyId: String(testCompany1.id) },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    company2Token = jwt.sign(
      { sub: String(company2User.id), role: 'company', email: company2User.email, companyId: String(testCompany2.id) },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 3. Create Jobs
    const approachingDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
    testJob1 = await prisma.jobs.create({
      data: {
        company_id: testCompany1.id,
        title: 'Lead Architect',
        job_code: 'JOB-2026-0001',
        positions_required: 2,
        status: 'in_progress',
        assigned_to: staffUser.id,
        last_date: approachingDeadline,
        created_by: adminUser.id
      }
    });

    testJob2 = await prisma.jobs.create({
      data: {
        company_id: testCompany2.id,
        title: 'Financial Analyst',
        job_code: 'JOB-2026-0002',
        positions_required: 1,
        status: 'open',
        last_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        created_by: adminUser.id
      }
    });

    // 4. Create Candidates and Mappings
    const cand1 = await prisma.candidates.create({
      data: {
        first_name: 'Carol',
        last_name: 'Coder',
        email: 'carol@example.com',
        mobile: '9123456780',
        created_by: staffUser.id,
        status: 'active'
      }
    });

    await prisma.job_candidates.create({
      data: {
        job_id: testJob1.id,
        candidate_id: cand1.id,
        status: 'confirmed',
        match_score: 95
      }
    });
  });

  describe('Admin Company-Wise Dashboard (REQ-DSH-01 / Ruling 3.1)', () => {
    it('rejects unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/v1/reports/company-wise');
      expect(res.status).toBe(401);
    });

    it('blocks company role from accessing admin company-wise dashboard with 403', async () => {
      const res = await request(app)
        .get('/api/v1/reports/company-wise')
        .set('Authorization', `Bearer ${company1Token}`);
      expect(res.status).toBe(403);
    });

    it('allows admin and staff to retrieve decoupled company-wise analytics', async () => {
      const res = await request(app)
        .get('/api/v1/reports/company-wise')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { summary, companies, urgent_requisitions } = res.body.data;

      expect(summary).toBeDefined();
      expect(summary.total_companies).toBeGreaterThanOrEqual(2);
      expect(summary.total_positions).toBeGreaterThanOrEqual(3);
      expect(summary.total_confirmed).toBeGreaterThanOrEqual(1);
      expect(typeof summary.overall_fulfillment_rate).toBe('number');

      expect(Array.isArray(companies)).toBe(true);
      const acmeRow = companies.find(c => c.company_name === 'Acme Apex Corp');
      expect(acmeRow).toBeDefined();
      expect(acmeRow.positions_total).toBe(2);
      expect(acmeRow.candidates_confirmed).toBe(1);
      expect(acmeRow.fulfillment_rate).toBe(50);

      // Urgent requisitions (testJob1 has deadline in 3 days)
      expect(Array.isArray(urgent_requisitions)).toBe(true);
      const urgentItem = urgent_requisitions.find(u => u.job_code === 'JOB-2026-0001');
      expect(urgentItem).toBeDefined();
      expect(urgentItem.title).toBe('Lead Architect');
    });
  });

  describe('Company Drill-Down & Multi-Tenant IDOR Boundary (REQ-DSH-02 / §8.2)', () => {
    it('allows admin to view drill-down for any company', async () => {
      const res = await request(app)
        .get(`/api/v1/reports/company/${testCompany1.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.company.company_name).toBe('Acme Apex Corp');
      expect(res.body.data.metrics.total_positions).toBe(2);
      expect(res.body.data.jobs.length).toBeGreaterThanOrEqual(1);
    });

    it('allows company user to view their own company drill-down', async () => {
      const res = await request(app)
        .get(`/api/v1/reports/company/${testCompany1.id}`)
        .set('Authorization', `Bearer ${company1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.company.company_name).toBe('Acme Apex Corp');
    });

    it('CRITICAL IDOR GUARD: returns 404 when company 2 attempts to view company 1 drill-down', async () => {
      const res = await request(app)
        .get(`/api/v1/reports/company/${testCompany1.id}`)
        .set('Authorization', `Bearer ${company2Token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Staff Dashboard (REQ-DSH-03)', () => {
    it('returns staff dashboard with assigned jobs and metrics', async () => {
      const res = await request(app)
        .get('/api/v1/reports/staff-dashboard')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.metrics.assigned_jobs_count).toBeGreaterThanOrEqual(1);
      expect(res.body.data.metrics.candidates_uploaded_count).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.data.assigned_jobs)).toBe(true);
      expect(Array.isArray(res.body.data.urgent_jobs)).toBe(true);
    });
  });

  describe('Company Dashboard (REQ-DSH-04)', () => {
    it('returns company dashboard with metrics and active requisitions', async () => {
      const res = await request(app)
        .get('/api/v1/reports/company-dashboard')
        .set('Authorization', `Bearer ${company1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.metrics.total_positions).toBe(2);
      expect(res.body.data.metrics.confirmed_positions).toBe(1);
      expect(res.body.data.metrics.fulfillment_rate).toBe(50);
      expect(Array.isArray(res.body.data.active_jobs)).toBe(true);
    });
  });

  describe('Anti-Formula-Injection Defense & Report Export (REQ-DSH-05, REQ-DSH-06 / Master §8.4)', () => {
    it('CRITICAL DEFENSE: sanitizes malicious formula triggers (=, +, -, @, \\t, \\r)', () => {
      expect(sanitizeFormulaCell('=cmd|"/C calc"!A0')).toBe("'=cmd|\"/C calc\"!A0");
      expect(sanitizeFormulaCell('+SUM(1,2)')).toBe("'+SUM(1,2)");
      expect(sanitizeFormulaCell('-100')).toBe("'-100");
      expect(sanitizeFormulaCell('@SUM(A1:A5)')).toBe("'@SUM(A1:A5)");
      expect(sanitizeFormulaCell('\tmalicious')).toBe("'\tmalicious");
      expect(sanitizeFormulaCell('Safe Standard Text')).toBe('Safe Standard Text');
      expect(sanitizeFormulaCell(12345)).toBe('12345');
      expect(sanitizeFormulaCell(null)).toBe('');
    });

    it('exports safe CSV report with proper headers', async () => {
      const res = await request(app)
        .get('/api/v1/reports/export?type=company-wise&format=csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('.csv');
      expect(res.text).toContain('"Company Name","Industry"');
      expect(res.text).toContain('Acme Apex Corp');
    });

    it('exports safe XLSX report with binary stream', async () => {
      const res = await request(app)
        .get('/api/v1/reports/export?type=company-wise&format=xlsx')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheetml');
      expect(res.headers['content-disposition']).toContain('.xlsx');
      expect(res.body).toBeDefined();
    });
  });

  describe('Daily Deadline Reminder Service (REQ-DSH-07 / Flow F14)', () => {
    it('dispatches reminder notifications for jobs with approaching deadlines', async () => {
      const result = await checkApproachingDeadlines();

      expect(result.scanned_count).toBeGreaterThanOrEqual(1);
      expect(result.notifications_sent).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(result.alerts)).toBe(true);

      const alertItem = result.alerts.find(a => a.job_code === 'JOB-2026-0001');
      expect(alertItem).toBeDefined();
      expect(alertItem.urgency).toContain('Due in');
    });

    it('allows admin to trigger deadline check endpoint manually', async () => {
      const res = await request(app)
        .post('/api/v1/reports/trigger-deadline-check')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications_sent).toBeGreaterThanOrEqual(1);
    });
  });
});
