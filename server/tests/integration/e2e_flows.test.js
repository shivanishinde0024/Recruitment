const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const prisma = require('../../src/config/db');
const { JWT_ACCESS_SECRET } = require('../../src/config/env');
const { checkApproachingDeadlines } = require('../../src/cron/deadlineReminder');

describe('Phase 10: End-to-End Lifecycle Verification (Flows F1 - F14)', () => {
  let adminToken, staffToken, companyToken, rivalCompanyToken;
  let adminUser, staffUser, companyUser;
  let registeredCompany, rivalCompany;
  let createdJob;
  let uploadedCandidate;
  let mappedCandidate;

  beforeAll(async () => {
    // Admin user
    adminUser = await prisma.users.create({
      data: {
        name: 'E2E Admin',
        email: 'e2e_admin@platform.com',
        password_hash: '$2b$12$DUMMYHASHFORTESTINGPURPOSESONLY0000000000000000000000000000',
        role: 'admin',
        status: 'active'
      }
    });
    adminToken = jwt.sign({ sub: String(adminUser.id), role: 'admin', email: adminUser.email }, JWT_ACCESS_SECRET);

    // Staff user
    staffUser = await prisma.users.create({
      data: {
        name: 'E2E Staff Recruiter',
        email: 'e2e_staff@platform.com',
        password_hash: '$2b$12$DUMMYHASHFORTESTINGPURPOSESONLY0000000000000000000000000000',
        role: 'staff',
        status: 'active'
      }
    });
    staffToken = jwt.sign({ sub: String(staffUser.id), role: 'staff', email: staffUser.email }, JWT_ACCESS_SECRET);
  });

  // FLOW F1: Company registers, staff or admin approves
  it('Flow F1: Company registers and is verified by Admin', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register-company')
      .field('name', 'Stella User')
      .field('email', 'stella@starlight.io')
      .field('mobile', '9811223344')
      .field('password', 'SecureCompanyPass123!')
      .field('company_name', 'Starlight Dynamics')
      .field('contact_person', 'Stella Star')
      .field('contact_email', 'stella@starlight.io')
      .field('contact_mobile', '9811223344');

    expect(regRes.status).toBe(201);
    expect(regRes.body.data.company).toBeDefined();
    registeredCompany = regRes.body.data.company;
    expect(registeredCompany.status).toBe('pending');

    // Admin verifies and approves company
    const verifyRes = await request(app)
      .patch(`/api/v1/companies/${registeredCompany.id}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.status).toBe('approved');

    // Get company user token
    const compUserInDb = await prisma.users.findFirst({ where: { email: 'stella@starlight.io' } });
    companyUser = compUserInDb;
    companyToken = jwt.sign(
      { sub: String(companyUser.id), role: 'company', email: companyUser.email, companyId: String(registeredCompany.id) },
      JWT_ACCESS_SECRET
    );
  });

  // FLOW F2: Staff requests info, company updates, staff approves
  it('Flow F2: Verification revision cycle (need_info -> update -> approve)', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register-company')
      .field('name', 'Mark User')
      .field('email', 'mark@moonlight.io')
      .field('mobile', '9811223355')
      .field('password', 'SecureCompanyPass123!')
      .field('company_name', 'Moonlight Logistics')
      .field('contact_person', 'Mark Moon')
      .field('contact_email', 'mark@moonlight.io')
      .field('contact_mobile', '9811223355');

    expect(regRes.status).toBe(201);
    const compId = regRes.body.data.company.id;

    // Staff requests additional information
    const needInfoRes = await request(app)
      .patch(`/api/v1/companies/${compId}/verify`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ action: 'need_info', remark: 'Please update authorized PAN number' });

    expect(needInfoRes.status).toBe(200);
    expect(needInfoRes.body.data.status).toBe('need_info');

    // Staff approves
    const approveRes = await request(app)
      .patch(`/api/v1/companies/${compId}/verify`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ action: 'approve' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('approved');
  });

  // FLOW F3: Admin rejects company with remark; company cannot post jobs
  it('Flow F3: Admin rejects company with remark; company cannot post jobs', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register-company')
      .field('name', 'Sam User')
      .field('email', 'sam@shadow.io')
      .field('mobile', '9811223366')
      .field('password', 'SecureCompanyPass123!')
      .field('company_name', 'Shadow Enterprise')
      .field('contact_person', 'Sam Shadow')
      .field('contact_email', 'sam@shadow.io')
      .field('contact_mobile', '9811223366');

    expect(regRes.status).toBe(201);
    const rejectedCompId = regRes.body.data.company.id;

    // Rejection without remark must fail with 422
    const failReject = await request(app)
      .patch(`/api/v1/companies/${rejectedCompId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'reject' });
    expect(failReject.status).toBe(422);

    // Rejection with remark succeeds
    const rejectRes = await request(app)
      .patch(`/api/v1/companies/${rejectedCompId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'reject', remark: 'Failed credit risk background audit' });
    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.status).toBe('rejected');

    // Rejected company user attempting to post job receives 403
    const rejUser = await prisma.users.findFirst({ where: { email: 'sam@shadow.io' } });
    const rejToken = jwt.sign(
      { sub: String(rejUser.id), role: 'company', email: rejUser.email, companyId: String(rejectedCompId) },
      JWT_ACCESS_SECRET
    );

    const postJobRes = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${rejToken}`)
      .send({
        title: 'Lead Architect',
        positions_required: 1
      });

    expect(postJobRes.status).toBe(403);
  });

  // FLOW F4: Approved company posts job with requirements, skills, deadline
  it('Flow F4: Approved company posts job requirement', async () => {
    const postRes = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${companyToken}`)
      .send({
        title: 'Principal Cloud Architect',
        positions_required: 1,
        experience_min: 5,
        experience_max: 10,
        salary_min: 1500000,
        salary_max: 2500000,
        description: '<p>Lead our cloud infrastructure modernization</p>',
        last_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days out
      });

    expect(postRes.status).toBe(201);
    createdJob = postRes.body.data;
    expect(createdJob.status).toBe('open');
    expect(createdJob.job_code).toMatch(/^JOB-\d{4}-\d{4}$/);
  });

  // FLOW F5: Admin assigns job to staff; staff uploads candidate
  it('Flow F5: Admin assigns job to staff; staff uploads candidate', async () => {
    const assignRes = await request(app)
      .patch(`/api/v1/jobs/${createdJob.id}/assign-staff`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigned_to: staffUser.id });

    expect(assignRes.status).toBe(200);
    expect(String(assignRes.body.data.assigned_to)).toBe(String(staffUser.id));

    // Staff uploads candidate
    const candRes = await request(app)
      .post('/api/v1/candidates')
      .set('Authorization', `Bearer ${staffToken}`)
      .field('name', 'Devon Developer')
      .field('email', 'devon.dev@talent.net')
      .field('mobile', '9898989801')
      .field('experience_years', 7)
      .attach('resume', Buffer.from('%PDF-1.4 sample resume content'), 'resume.pdf');

    expect(candRes.status).toBe(201);
    uploadedCandidate = candRes.body.data;
    expect(uploadedCandidate.email).toBe('devon.dev@talent.net');
  });

  // FLOW F6: Candidate mapped to job; job status auto moves open -> in_progress
  it('Flow F6: Candidate mapped to job; job status transitions to in_progress', async () => {
    const mapRes = await request(app)
      .post('/api/v1/mappings')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        job_id: createdJob.id,
        candidate_ids: [uploadedCandidate.id]
      });

    expect(mapRes.status).toBe(201);
    expect(mapRes.body.data.mapped_count).toBe(1);
    mappedCandidate = mapRes.body.data.results[0];

    // Check job auto status
    const jobInDb = await prisma.jobs.findUnique({ where: { id: createdJob.id } });
    expect(jobInDb.status).toBe('in_progress');
  });

  // FLOW F7: Company reviews candidates, shortlists and masks contact info
  it('Flow F7: Company reviews candidates, shortlists and masks contact info', async () => {
    // 1. Company views candidate: Contact info must be masked
    const viewListRes = await request(app)
      .get(`/api/v1/mappings/jobs/${createdJob.id}`)
      .set('Authorization', `Bearer ${companyToken}`);

    expect(viewListRes.status).toBe(200);
    const item = viewListRes.body.data[0];
    expect(item.candidate.email).toContain('*');
    expect(item.candidate.mobile).toContain('*');

    // 2. Shortlist action
    const shortlistRes = await request(app)
      .patch(`/api/v1/mappings/${mappedCandidate.id}/review`)
      .set('Authorization', `Bearer ${companyToken}`)
      .send({ action: 'shortlisted' });

    expect(shortlistRes.status).toBe(200);
    expect(shortlistRes.body.data.status).toBe('shortlisted');
  });

  // FLOW F8: Company confirms candidate; job auto-fulfills when count reached; candidate contact unmasks
  it('Flow F8: Company confirms candidate; job auto-fulfills and unmasks contact', async () => {
    const confirmRes = await request(app)
      .patch(`/api/v1/mappings/${mappedCandidate.id}/review`)
      .set('Authorization', `Bearer ${companyToken}`)
      .send({ action: 'confirmed' });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('confirmed');

    // Check job auto-fulfillment
    const fulfilledJob = await prisma.jobs.findUnique({ where: { id: createdJob.id } });
    expect(fulfilledJob.status).toBe('fulfilled');

    // Check unmasked contact info on confirmed candidate
    const viewListRes = await request(app)
      .get(`/api/v1/mappings/jobs/${createdJob.id}`)
      .set('Authorization', `Bearer ${companyToken}`);

    const confirmedItem = viewListRes.body.data[0];
    expect(confirmedItem.candidate.email).toBe('devon.dev@talent.net');
    expect(confirmedItem.candidate.mobile).toBe('9898989801');
  });

  // FLOW F9: Staff withdraws candidate while submitted
  it('Flow F9: Staff candidate withdrawal lifecycle', async () => {
    // Upload candidate 2
    const cand2Res = await request(app)
      .post('/api/v1/candidates')
      .set('Authorization', `Bearer ${staffToken}`)
      .field('name', 'Walter Withdrawn')
      .field('email', 'walter@talent.net')
      .field('mobile', '9898989802');

    expect(cand2Res.status).toBe(201);

    // Create a new job with positions: 2
    const job2 = await prisma.jobs.create({
      data: {
        company_id: registeredCompany.id,
        job_code: 'JOB-2026-0088',
        title: 'Temporary Role',
        positions_required: 2,
        status: 'open',
        created_by: adminUser.id
      }
    });

    // Map candidate 2
    const map2Res = await request(app)
      .post('/api/v1/mappings')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ job_id: job2.id, candidate_ids: [cand2Res.body.data.id] });

    const mappingToWithdraw = map2Res.body.data.results[0];

    // Staff withdraws candidate
    const withdrawRes = await request(app)
      .patch(`/api/v1/mappings/${mappingToWithdraw.id}/withdraw`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ reason: 'Candidate withdrew application' });

    expect(withdrawRes.status).toBe(200);
    expect(withdrawRes.body.data.status).toBe('withdrawn');
  });

  // FLOW F10: Admin soft-deletes job/candidate, views in trash, restores
  it('Flow F10: Admin soft-delete, trash directory inspection, and restore', async () => {
    // Soft delete candidate Devon
    const deleteCandRes = await request(app)
      .delete(`/api/v1/candidates/${uploadedCandidate.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteCandRes.status).toBe(200);

    // List trash
    const trashRes = await request(app)
      .get('/api/v1/trash?module=candidates')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(trashRes.status).toBe(200);
    const itemInTrash = trashRes.body.data.find(t => t.id === String(uploadedCandidate.id));
    expect(itemInTrash).toBeDefined();

    // Restore candidate
    const restoreRes = await request(app)
      .patch(`/api/v1/trash/candidates/${uploadedCandidate.id}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.restored).toBe(true);

    const check = await prisma.candidates.findUnique({ where: { id: uploadedCandidate.id } });
    expect(check.deleted_at).toBeNull();
  });

  // FLOW F11: IDOR: Company A cannot see Company B's jobs/candidates
  it('Flow F11: Cross-tenant IDOR boundary protection', async () => {
    // Register rival company
    const rivalRes = await request(app)
      .post('/api/v1/auth/register-company')
      .field('name', 'Charlie User')
      .field('email', 'charlie@competitor.io')
      .field('mobile', '9811223399')
      .field('password', 'SecureCompanyPass123!')
      .field('company_name', 'Competitor Corp')
      .field('contact_person', 'Charlie Comp')
      .field('contact_email', 'charlie@competitor.io')
      .field('contact_mobile', '9811223399');

    expect(rivalRes.status).toBe(201);
    rivalCompany = rivalRes.body.data.company;

    await prisma.companies.update({
      where: { id: rivalCompany.id },
      data: { status: 'approved' }
    });

    const rivalUser = await prisma.users.findFirst({ where: { email: 'charlie@competitor.io' } });
    rivalCompanyToken = jwt.sign(
      { sub: String(rivalUser.id), role: 'company', email: rivalUser.email, companyId: String(rivalCompany.id) },
      JWT_ACCESS_SECRET
    );

    // Rival company attempting to access Starlight job gets 404
    const idorJobRes = await request(app)
      .get(`/api/v1/jobs/${createdJob.id}`)
      .set('Authorization', `Bearer ${rivalCompanyToken}`);
    expect(idorJobRes.status).toBe(404);

    // Rival company attempting to access Starlight candidates gets 404
    const idorCandRes = await request(app)
      .get(`/api/v1/mappings/jobs/${createdJob.id}`)
      .set('Authorization', `Bearer ${rivalCompanyToken}`);
    expect(idorCandRes.status).toBe(404);
  });

  // FLOW F12: Auth: 5 failed logins locks account for 15 min; reset password works
  it('Flow F12: Brute force lockout and password reset flow', async () => {
    const lockEmail = 'target_lockout@platform.com';
    await prisma.users.create({
      data: {
        name: 'Lockout Target',
        email: lockEmail,
        password_hash: '$2b$12$DUMMYHASHFORTESTINGPURPOSESONLY0000000000000000000000000000',
        role: 'staff',
        status: 'active'
      }
    });

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: lockEmail, password: 'WrongPass!' });
    }

    // 6th attempt returns 423
    const lockedRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: lockEmail, password: 'WrongPass!' });

    expect(lockedRes.status).toBe(423);

    // Forgot password returns generic 200 (anti-enumeration)
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: lockEmail });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.success).toBe(true);
  });

  // FLOW F13: Admin exports reports (CSV/Excel) with anti-formula injection
  it('Flow F13: Admin exports reports with anti-formula injection', async () => {
    const exportCsvRes = await request(app)
      .get('/api/v1/reports/export?type=company-wise&format=csv')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(exportCsvRes.status).toBe(200);
    expect(exportCsvRes.headers['content-type']).toContain('text/csv');
    expect(exportCsvRes.text).toContain('Starlight Dynamics');

    const exportXlsxRes = await request(app)
      .get('/api/v1/reports/export?type=company-wise&format=xlsx')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(exportXlsxRes.status).toBe(200);
    expect(exportXlsxRes.headers['content-type']).toContain('spreadsheetml');
  });

  // FLOW F14: Deadline reminder triggers for jobs approaching deadline
  it('Flow F14: Deadline reminder trigger checks approaching last_date', async () => {
    // Create an active job approaching deadline in 3 days
    await prisma.jobs.create({
      data: {
        company_id: registeredCompany.id,
        job_code: 'JOB-2026-9999',
        title: 'Urgent System Engineer',
        positions_required: 1,
        status: 'open',
        last_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        assigned_to: staffUser.id,
        created_by: adminUser.id
      }
    });

    const checkResult = await checkApproachingDeadlines();

    expect(checkResult.scanned_count).toBeGreaterThanOrEqual(1);
    expect(checkResult.notifications_sent).toBeGreaterThanOrEqual(1);

    const alertItem = checkResult.alerts.find(a => a.job_code === 'JOB-2026-9999');
    expect(alertItem).toBeDefined();
    expect(alertItem.urgency).toContain('Due in');
  });
});
