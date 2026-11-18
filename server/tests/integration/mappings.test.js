const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const prisma = require('../../src/config/db');
const { JWT_ACCESS_SECRET } = require('../../src/config/env');
const { calculateMatchScore } = require('../../src/modules/mappings/matching.service');

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

describe('Phase 6: Candidate Mapping and Company Review Module', () => {
  let adminUser, staffUser, companyUser;
  let adminToken, staffToken, companyToken;
  let companyRecord, testJob, candidateA, candidateB, skillNode, skillReact;

  beforeEach(async () => {
    // Reset test tables
    if (prisma.users.records) prisma.users.records = [];
    if (prisma.companies.records) prisma.companies.records = [];
    if (prisma.jobs.records) prisma.jobs.records = [];
    if (prisma.job_skills.records) prisma.job_skills.records = [];
    if (prisma.candidates.records) prisma.candidates.records = [];
    if (prisma.candidate_skills.records) prisma.candidate_skills.records = [];
    if (prisma.job_candidates.records) prisma.job_candidates.records = [];
    if (prisma.job_candidate_history.records) prisma.job_candidate_history.records = [];
    if (prisma.notifications.records) prisma.notifications.records = [];
    if (prisma.audit_logs.records) prisma.audit_logs.records = [];
    if (prisma.skills.records) prisma.skills.records = [];

    // Seed Admin
    adminUser = await prisma.users.create({
      data: { name: 'Admin One', email: 'admin@portal.com', role: 'admin', status: 'active' }
    });
    adminToken = makeToken(adminUser);

    // Seed Staff
    staffUser = await prisma.users.create({
      data: { name: 'Staff Recruiter', email: 'staff@portal.com', role: 'staff', status: 'active' }
    });
    staffToken = makeToken(staffUser);

    // Seed Company
    companyUser = await prisma.users.create({
      data: { name: 'Acme HR', email: 'hr@acme.com', role: 'company', status: 'active' }
    });
    companyRecord = await prisma.companies.create({
      data: {
        user_id: companyUser.id,
        company_name: 'Acme Technologies',
        status: 'approved',
        contact_person: 'Alice',
        contact_email: 'hr@acme.com',
        contact_mobile: '9876543210'
      }
    });
    companyToken = makeToken(companyUser, companyRecord.id);

    // Seed Skills
    skillNode = await prisma.skills.create({ data: { name: 'Node.js', status: 'active' } });
    skillReact = await prisma.skills.create({ data: { name: 'React', status: 'active' } });

    // Seed Job (1 position required, open status)
    testJob = await prisma.jobs.create({
      data: {
        company_id: companyRecord.id,
        job_code: 'JOB-2026-0001',
        title: 'Full Stack Engineer',
        positions_required: 1,
        experience_min: 3,
        experience_max: 5,
        qualification_id: 10n,
        city_id: 50n,
        status: 'open'
      }
    });

    await prisma.job_skills.create({
      data: { job_id: testJob.id, skill_id: skillNode.id, is_mandatory: true }
    });
    await prisma.job_skills.create({
      data: { job_id: testJob.id, skill_id: skillReact.id, is_mandatory: false }
    });

    // Seed Candidate A (Strong Match)
    candidateA = await prisma.candidates.create({
      data: {
        name: 'Alice Developer',
        email: 'alice@example.com',
        mobile: '9888888881',
        experience_years: 4,
        qualification_id: 10n,
        city_id: 50n,
        uploaded_by: staffUser.id,
        status: 'available'
      }
    });
    await prisma.candidate_skills.create({
      data: { candidate_id: candidateA.id, skill_id: skillNode.id, rating: 5 }
    });
    await prisma.candidate_skills.create({
      data: { candidate_id: candidateA.id, skill_id: skillReact.id, rating: 4 }
    });

    // Seed Candidate B (Partial Match)
    candidateB = await prisma.candidates.create({
      data: {
        name: 'Bob Junior',
        email: 'bob@example.com',
        mobile: '9888888882',
        experience_years: 1,
        qualification_id: 20n,
        city_id: 99n,
        uploaded_by: staffUser.id,
        status: 'available'
      }
    });
    await prisma.candidate_skills.create({
      data: { candidate_id: candidateB.id, skill_id: skillReact.id, rating: 3 }
    });
  });

  describe('Weighted Matching Algorithm (REQ-MAP-01)', () => {
    it('computes 100% match score for candidate matching all skills, experience, location, and qualification', () => {
      const jobWithSkills = {
        ...testJob,
        skills: [
          { skill_id: skillNode.id, is_mandatory: true },
          { skill_id: skillReact.id, is_mandatory: false }
        ]
      };
      const candidateWithSkills = {
        ...candidateA,
        skills: [{ skill_id: skillNode.id }, { skill_id: skillReact.id }]
      };

      const match = calculateMatchScore(jobWithSkills, candidateWithSkills);
      expect(match.totalScore).toBe(100);
      expect(match.breakdown.skillsScore).toBe(50);
      expect(match.breakdown.expScore).toBe(25);
      expect(match.breakdown.locScore).toBe(15);
      expect(match.breakdown.qualScore).toBe(10);
    });

    it('computes lower score for candidate missing mandatory skill and under-experienced', () => {
      const jobWithSkills = {
        ...testJob,
        skills: [
          { skill_id: skillNode.id, is_mandatory: true },
          { skill_id: skillReact.id, is_mandatory: false }
        ]
      };
      const candidateWithSkills = {
        ...candidateB,
        skills: [{ skill_id: skillReact.id }]
      };

      const match = calculateMatchScore(jobWithSkills, candidateWithSkills);
      expect(match.totalScore).toBeLessThan(50);
      expect(match.breakdown.skillsScore).toBe(15); // Got optional skill (15), missed mandatory (35)
    });
  });

  describe('Suggested Candidates (REQ-MAP-02)', () => {
    it('returns ranked candidates sorted descending by match score', async () => {
      const res = await request(app)
        .get(`/api/v1/jobs/${testJob.id}/suggested-candidates`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].id).toBe(candidateA.id);
      expect(res.body.data[0].matchScore).toBeGreaterThan(res.body.data[1].matchScore);
    });
  });

  describe('Candidate Mapping & Auto Status Transition (Flow F6 / REQ-MAP-03, REQ-MAP-04)', () => {
    it('maps candidate to job, updates job status from open to in_progress, and notifies company', async () => {
      const res = await request(app)
        .post('/api/v1/mappings')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          job_id: testJob.id,
          candidate_ids: [candidateA.id, candidateB.id]
        });

      expect(res.status).toBe(201);
      expect(res.body.data.mapped_count).toBe(2);

      // Verify job status automatically transitioned to in_progress
      const updatedJob = await prisma.jobs.findUnique({ where: { id: testJob.id } });
      expect(updatedJob.status).toBe('in_progress');

      // Verify candidate status updated to mapped
      const cand = await prisma.candidates.findUnique({ where: { id: candidateA.id } });
      expect(cand.status).toBe('mapped');

      // Verify notification sent to company user
      const notifications = await prisma.notifications.findMany({
        where: { user_id: companyUser.id, type: 'candidates_submitted' }
      });
      expect(notifications.length).toBeGreaterThanOrEqual(1);
    });

    it('skips duplicate candidate mapping gracefully without failing', async () => {
      // First mapping
      await request(app)
        .post('/api/v1/mappings')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ job_id: testJob.id, candidate_ids: [candidateA.id] });

      // Second mapping with same candidate + new candidate
      const res = await request(app)
        .post('/api/v1/mappings')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ job_id: testJob.id, candidate_ids: [candidateA.id, candidateB.id] });

      expect(res.status).toBe(201);
      expect(res.body.data.mapped_count).toBe(1);
      expect(res.body.data.skipped_count).toBe(1);
    });
  });

  describe('Strict Candidate Contact Masking (Ruling 3.3 / REQ-MAP-07)', () => {
    let mappingA;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/mappings')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ job_id: testJob.id, candidate_ids: [candidateA.id] });
      mappingA = res.body.data.results[0];
    });

    it('masks candidate email, mobile, and address when company views submitted profile', async () => {
      const res = await request(app)
        .get(`/api/v1/mappings/jobs/${testJob.id}`)
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(200);
      const cand = res.body.data[0].candidate;
      expect(cand.email).toContain('***');
      expect(cand.mobile).toContain('******');
      expect(cand.address).toMatch(/locked until candidate confirmation/i);
    });

    it('does NOT mask candidate contact details for staff or admin', async () => {
      const res = await request(app)
        .get(`/api/v1/mappings/jobs/${testJob.id}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      const cand = res.body.data[0].candidate;
      expect(cand.email).toBe('alice@example.com');
      expect(cand.mobile).toBe('9888888881');
    });
  });

  describe('Company Candidate Review & Race-Safe Confirmation (Flow F7, F8 / Ruling 3.11 / REQ-MAP-05, REQ-MAP-06)', () => {
    let mappingA, mappingB;

    beforeEach(async () => {
      const mapRes = await request(app)
        .post('/api/v1/mappings')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ job_id: testJob.id, candidate_ids: [candidateA.id, candidateB.id] });
      mappingA = mapRes.body.data.results[0];
      mappingB = mapRes.body.data.results[1];
    });

    it('allows company to shortlist candidate and records history', async () => {
      const res = await request(app)
        .patch(`/api/v1/mappings/${mappingA.id}/review`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ action: 'shortlisted', remark: 'Strong technical resume' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('shortlisted');

      const history = await prisma.job_candidate_history.findMany({
        where: { job_candidate_id: mappingA.id }
      });
      expect(history.some((h) => h.new_status === 'shortlisted')).toBe(true);
    });

    it('CONFIRMATION & AUTO-FULFILLMENT: confirms candidate, unmasks contact info, and marks job fulfilled when quota is met', async () => {
      const res = await request(app)
        .patch(`/api/v1/mappings/${mappingA.id}/review`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ action: 'confirmed', remark: 'Selected for offer' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('confirmed');

      // Candidate status becomes placed
      const cand = await prisma.candidates.findUnique({ where: { id: candidateA.id } });
      expect(cand.status).toBe('placed');

      // Job auto-fulfilled (1/1 positions confirmed)
      const job = await prisma.jobs.findUnique({ where: { id: testJob.id } });
      expect(job.status).toBe('fulfilled');

      // Verify notification sent to staff and admin
      const notifications = await prisma.notifications.findMany({
        where: { type: 'job_fulfilled' }
      });
      expect(notifications.length).toBeGreaterThanOrEqual(1);

      // Verify company now sees unmasked contact info for confirmed candidate
      const getRes = await request(app)
        .get(`/api/v1/mappings/jobs/${testJob.id}`)
        .set('Authorization', `Bearer ${companyToken}`);

      const confirmedCand = getRes.body.data.find((m) => m.id === mappingA.id).candidate;
      expect(confirmedCand.email).toBe('alice@example.com');
      expect(confirmedCand.mobile).toBe('9888888881');
    });

    it('CRITICAL RACE GUARD: blocks confirming candidate when job positions are already satisfied (returns 422)', async () => {
      // Confirm candidate A (fills the 1 position required)
      await request(app)
        .patch(`/api/v1/mappings/${mappingA.id}/review`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ action: 'confirmed' });

      // Attempt to confirm candidate B for the same fulfilled job
      const res = await request(app)
        .patch(`/api/v1/mappings/${mappingB.id}/review`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ action: 'confirmed' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already fully satisfied/i);
    });
  });

  describe('Staff Candidate Withdrawal (REQ-MAP-08 / Flow F9)', () => {
    let mappingA;

    beforeEach(async () => {
      const mapRes = await request(app)
        .post('/api/v1/mappings')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ job_id: testJob.id, candidate_ids: [candidateA.id] });
      mappingA = mapRes.body.data.results[0];
    });

    it('allows staff to withdraw a candidate whose status is still submitted', async () => {
      const res = await request(app)
        .patch(`/api/v1/mappings/${mappingA.id}/withdraw`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ reason: 'Candidate withdrew application' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('withdrawn');

      // Candidate status reverts to available
      const cand = await prisma.candidates.findUnique({ where: { id: candidateA.id } });
      expect(cand.status).toBe('available');
    });

    it('CRITICAL GUARD: blocks staff from withdrawing candidate once reviewed by company (returns 422)', async () => {
      // Company shortlists candidate
      await request(app)
        .patch(`/api/v1/mappings/${mappingA.id}/review`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ action: 'shortlisted' });

      // Staff attempts withdrawal
      const res = await request(app)
        .patch(`/api/v1/mappings/${mappingA.id}/withdraw`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/Cannot withdraw candidate: status is already 'shortlisted'/i);
    });

    it('supports PDF §7 alias endpoints /job-candidates/:id/status and DELETE /job-candidates/:id', async () => {
      // Review via alias
      const resReview = await request(app)
        .patch(`/api/v1/job-candidates/${mappingA.id}/status`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ action: 'viewed' });

      expect(resReview.status).toBe(200);
      expect(resReview.body.data.status).toBe('viewed');

      // Map another candidate to test delete alias
      const mapRes = await request(app)
        .post('/api/v1/mappings')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ job_id: testJob.id, candidate_ids: [candidateB.id] });
      const mappingB = mapRes.body.data.results[0];

      const resWithdraw = await request(app)
        .delete(`/api/v1/job-candidates/${mappingB.id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ reason: 'Withdrawn by recruiter' });

      expect(resWithdraw.status).toBe(200);
      expect(resWithdraw.body.data.status).toBe('withdrawn');
    });
  });
});

