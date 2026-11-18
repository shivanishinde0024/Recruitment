const request = require('supertest');
const jwt = require('jsonwebtoken');
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

describe('Phase 3: Company Registration and Verification', () => {
  let adminUser, staffUser, companyAUser, companyBUser;
  let adminToken, staffToken, companyAToken, companyBToken;
  let companyA, companyB;

  beforeEach(async () => {
    // Reset test in-memory tables
    if (prisma.users.records) prisma.users.records = [];
    if (prisma.companies.records) prisma.companies.records = [];
    if (prisma.company_documents.records) prisma.company_documents.records = [];
    if (prisma.company_verification_logs.records) prisma.company_verification_logs.records = [];
    if (prisma.notifications.records) prisma.notifications.records = [];
    if (prisma.audit_logs.records) prisma.audit_logs.records = [];
    if (prisma.settings.records) prisma.settings.records = [];

    // Seed Admin
    adminUser = await prisma.users.create({
      data: {
        name: 'Super Admin',
        email: 'admin@portal.com',
        mobile: '9999999990',
        password_hash: '$2b$10$abcdefghijklmnopqrstuu',
        role: 'admin',
        status: 'active'
      }
    });
    adminToken = makeToken(adminUser);

    // Seed Staff
    staffUser = await prisma.users.create({
      data: {
        name: 'Staff Reviewer',
        email: 'staff@portal.com',
        mobile: '9999999991',
        password_hash: '$2b$10$abcdefghijklmnopqrstuu',
        role: 'staff',
        status: 'active'
      }
    });
    staffToken = makeToken(staffUser);

    // Seed Company A
    companyAUser = await prisma.users.create({
      data: {
        name: 'Acme HR',
        email: 'hr@acme.com',
        mobile: '9888888881',
        password_hash: '$2b$10$abcdefghijklmnopqrstuu',
        role: 'company',
        status: 'active'
      }
    });
    companyA = await prisma.companies.create({
      data: {
        user_id: companyAUser.id,
        company_name: 'Acme Corp',
        contact_person: 'John Doe',
        contact_email: 'hr@acme.com',
        contact_mobile: '9888888881',
        gst_no: '27AAAAA0000A1Z5',
        pan_no: 'AAAAA0000A',
        status: 'pending'
      }
    });
    companyAToken = makeToken(companyAUser, companyA.id);

    // Seed Company B
    companyBUser = await prisma.users.create({
      data: {
        name: 'Beta HR',
        email: 'hr@beta.com',
        mobile: '9888888882',
        password_hash: '$2b$10$abcdefghijklmnopqrstuu',
        role: 'company',
        status: 'active'
      }
    });
    companyB = await prisma.companies.create({
      data: {
        user_id: companyBUser.id,
        company_name: 'Beta Global',
        contact_person: 'Jane Smith',
        contact_email: 'hr@beta.com',
        contact_mobile: '9888888882',
        gst_no: '27BBBBB0000B1Z5',
        pan_no: 'BBBBB0000B',
        status: 'approved'
      }
    });
    companyBToken = makeToken(companyBUser, companyB.id);
  });

  describe('Company Self-Registration (Flow F1 / REQ-CMP-01)', () => {
    it('successfully registers a company and sets status to pending', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register-company')
        .field('name', 'Stark Director')
        .field('email', 'director@stark.com')
        .field('mobile', '9123456789')
        .field('password', 'SuperSecret123!')
        .field('company_name', 'Stark Industries')
        .field('contact_person', 'Tony Stark')
        .field('contact_email', 'director@stark.com')
        .field('contact_mobile', '9123456789')
        .field('gst_no', '27CCCCC0000C1Z5')
        .field('pan_no', 'CCCCC0000C');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.company.company_name).toBe('Stark Industries');
      expect(res.body.data.company.status).toBe('pending');
      expect(res.body.data.user.role).toBe('company');
      expect(res.body.data.user.password_hash).toBeUndefined();

      // Check notification sent to admin and staff
      const notifications = await prisma.notifications.findMany();
      expect(notifications.length).toBeGreaterThanOrEqual(1);
      expect(notifications.some((n) => n.type === 'company_registered')).toBe(true);
    });

    it('rejects registration with duplicate email with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register-company')
        .field('name', 'Acme Clone')
        .field('email', 'hr@acme.com') // Existing email
        .field('mobile', '9000000000')
        .field('password', 'Password123!')
        .field('company_name', 'Acme Duplicate')
        .field('contact_person', 'Clone User')
        .field('contact_email', 'hr@acme.com')
        .field('contact_mobile', '9000000000');

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already registered/i);
    });

    it('rejects registration with duplicate GST with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register-company')
        .field('name', 'Acme Clone GST')
        .field('email', 'newemail@domain.com')
        .field('mobile', '9000000000')
        .field('password', 'Password123!')
        .field('company_name', 'Acme With Same GST')
        .field('contact_person', 'Clone User')
        .field('contact_email', 'newemail@domain.com')
        .field('contact_mobile', '9000000000')
        .field('gst_no', '27AAAAA0000A1Z5'); // Existing GST

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/GST number.*already registered/i);
    });

    it('auto-approves company registration when auto_approve_company setting is true', async () => {
      await prisma.settings.create({
        data: { key: 'auto_approve_company', value: 'true' }
      });

      const res = await request(app)
        .post('/api/v1/auth/register-company')
        .field('name', 'Wayne Executive')
        .field('email', 'bruce@wayne.com')
        .field('mobile', '9988776655')
        .field('password', 'BatSecret123!')
        .field('company_name', 'Wayne Enterprises')
        .field('contact_person', 'Bruce Wayne')
        .field('contact_email', 'bruce@wayne.com')
        .field('contact_mobile', '9988776655');

      expect(res.status).toBe(201);
      expect(res.body.data.company.status).toBe('approved');
    });
  });

  describe('Company Verification Workflow & Exit Gate (REQ-CMP-03 / REQ-CMP-04)', () => {
    it('EXIT GATE: returns HTTP 422 if reject action has no remark or empty remark', async () => {
      const res = await request(app)
        .patch(`/api/v1/companies/${companyA.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'reject', remark: '   ' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/remark is mandatory/i);

      // Verify DB record remained pending
      const comp = await prisma.companies.findUnique({ where: { id: companyA.id } });
      expect(comp.status).toBe('pending');
    });

    it('EXIT GATE: returns HTTP 422 if need_info action has no remark', async () => {
      const res = await request(app)
        .patch(`/api/v1/companies/${companyA.id}/verify`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ action: 'need_info' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/remark is mandatory/i);
    });

    it('EXIT GATE: returns HTTP 422 if suspend action has no remark', async () => {
      const res = await request(app)
        .patch(`/api/v1/companies/${companyB.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'suspend' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/remark is mandatory/i);
    });

    it('approves company without mandatory remark and notifies company user', async () => {
      const res = await request(app)
        .patch(`/api/v1/companies/${companyA.id}/verify`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ action: 'approve' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('approved');

      // Check verification log was created
      const logs = await prisma.company_verification_logs.findMany({
        where: { company_id: companyA.id }
      });
      expect(logs.some((l) => l.new_status === 'approved')).toBe(true);

      // Check notification sent to company user
      const notifications = await prisma.notifications.findMany({
        where: { user_id: companyAUser.id }
      });
      expect(notifications.some((n) => n.type === 'company_approve')).toBe(true);
    });

    it('rejects company with descriptive remark and logs it', async () => {
      const res = await request(app)
        .patch(`/api/v1/companies/${companyA.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'reject', remark: 'Invalid GST certificate uploaded' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('rejected');
      expect(res.body.data.remark).toBe('Invalid GST certificate uploaded');

      const log = await prisma.company_verification_logs.findFirst({
        where: { company_id: companyA.id, new_status: 'rejected' }
      });
      expect(log).toBeDefined();
      expect(log.remark).toBe('Invalid GST certificate uploaded');
    });

    it('suspends and reactivates company profile', async () => {
      // Suspend
      const resSuspend = await request(app)
        .patch(`/api/v1/companies/${companyB.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'suspend', remark: 'Compliance check audit failure' });
      expect(resSuspend.status).toBe(200);
      expect(resSuspend.body.data.status).toBe('suspended');

      // Reactivate
      const resReactivate = await request(app)
        .patch(`/api/v1/companies/${companyB.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'reactivate', remark: 'Resolved compliance issues' });
      expect(resReactivate.status).toBe(200);
      expect(resReactivate.body.data.status).toBe('approved');
    });
  });

  describe('Company Profile Modification & Reverification (Ruling 3.9 / REQ-CMP-05)', () => {
    it('flags needs_reverification = true when approved company edits legal GST or PAN', async () => {
      const res = await request(app)
        .put(`/api/v1/companies/${companyB.id}`)
        .set('Authorization', `Bearer ${companyBToken}`)
        .send({ gst_no: '27BBBBB9999B1Z9' });

      expect(res.status).toBe(200);
      expect(res.body.data.needs_reverification).toBe(true);

      // Verify in DB
      const comp = await prisma.companies.findUnique({ where: { id: companyB.id } });
      expect(comp.needs_reverification).toBe(true);

      // Check notification sent to staff
      const notifications = await prisma.notifications.findMany({
        where: { user_id: staffUser.id }
      });
      expect(notifications.some((n) => n.type === 'company_reverification_needed')).toBe(true);
    });

    it('does NOT flag needs_reverification when updating non-legal fields like contact person', async () => {
      const res = await request(app)
        .put(`/api/v1/companies/${companyB.id}`)
        .set('Authorization', `Bearer ${companyBToken}`)
        .send({ contact_person: 'Jane Doe Manager' });

      expect(res.status).toBe(200);
      expect(res.body.data.needs_reverification).toBeFalsy();
    });
  });

  describe('Multi-Tenant Access Control & IDOR Protection (§8.2 / REQ-CMP-02)', () => {
    it('returns HTTP 404 when Company A attempts to view Company B profile', async () => {
      const res = await request(app)
        .get(`/api/v1/companies/${companyB.id}`)
        .set('Authorization', `Bearer ${companyAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('returns HTTP 404 when Company A attempts to update Company B profile', async () => {
      const res = await request(app)
        .put(`/api/v1/companies/${companyB.id}`)
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({ company_name: 'Hacked Name' });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('allows Admin to view any company profile', async () => {
      const res = await request(app)
        .get(`/api/v1/companies/${companyA.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.company_name).toBe('Acme Corp');
    });

    it('allows Staff to view company directory and filter by status', async () => {
      const res = await request(app)
        .get('/api/v1/companies?status=pending')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].company_name).toBe('Acme Corp');
    });
  });

  describe('Company Document Management (REQ-CMP-06)', () => {
    it('uploads a document to company profile and downloads it', async () => {
      // Create document in in-memory store
      const doc = await prisma.company_documents.create({
        data: {
          company_id: companyA.id,
          doc_type: 'gst',
          original_name: 'gst_certificate.pdf',
          file_path: '/uploads/docs/gst_certificate.pdf',
          mime_type: 'application/pdf',
          size_bytes: 1024
        }
      });

      const res = await request(app)
        .get(`/api/v1/companies/${companyA.id}/documents/${doc.id}/download`)
        .set('Authorization', `Bearer ${companyAToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toMatch(/attachment; filename="gst_certificate.pdf"/);
    });

    it('returns HTTP 404 when downloading document belonging to another company', async () => {
      const docB = await prisma.company_documents.create({
        data: {
          company_id: companyB.id,
          doc_type: 'pan',
          original_name: 'pan_card.pdf',
          file_path: '/uploads/docs/pan_card.pdf',
          mime_type: 'application/pdf',
          size_bytes: 2048
        }
      });

      const res = await request(app)
        .get(`/api/v1/companies/${companyB.id}/documents/${docB.id}/download`)
        .set('Authorization', `Bearer ${companyAToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Company Deletion (Admin Only)', () => {
    it('soft deletes company and deactivates associated user account', async () => {
      const res = await request(app)
        .delete(`/api/v1/companies/${companyA.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const comp = await prisma.companies.findFirst({ where: { id: companyA.id } });
      expect(comp.deleted_at).toBeDefined();

      const user = await prisma.users.findUnique({ where: { id: companyAUser.id } });
      expect(user.status).toBe('inactive');
    });

    it('forbids staff from deleting a company with 403 Forbidden', async () => {
      const res = await request(app)
        .delete(`/api/v1/companies/${companyA.id}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
    });
  });
});
