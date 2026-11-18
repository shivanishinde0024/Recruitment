const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const prisma = require('../../src/config/db');
const { JWT_ACCESS_SECRET } = require('../../src/config/env');

describe('Integration: Masters Module (Phase 2 / REQ-MST-01, REQ-MST-02, REQ-MST-03 / Flow F10)', () => {
  let adminToken;
  let staffToken;
  let companyToken;
  let testAdmin;
  let testStaff;
  let testCompanyUser;

  beforeAll(async () => {
    testAdmin = await prisma.users.create({
      data: {
        name: 'Master Admin',
        email: 'masteradmin@portal.com',
        password_hash: 'hash',
        role: 'admin',
        status: 'active'
      }
    });

    testStaff = await prisma.users.create({
      data: {
        name: 'Master Staff',
        email: 'masterstaff@portal.com',
        password_hash: 'hash',
        role: 'staff',
        status: 'active'
      }
    });

    testCompanyUser = await prisma.users.create({
      data: {
        name: 'Master Company',
        email: 'mastercomp@portal.com',
        password_hash: 'hash',
        role: 'company',
        status: 'active'
      }
    });

    adminToken = jwt.sign({ sub: String(testAdmin.id), role: 'admin' }, JWT_ACCESS_SECRET);
    staffToken = jwt.sign({ sub: String(testStaff.id), role: 'staff' }, JWT_ACCESS_SECRET);
    companyToken = jwt.sign({ sub: String(testCompanyUser.id), role: 'company' }, JWT_ACCESS_SECRET);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/v1/masters/:type (List & Dropdowns)', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/v1/masters/skills');
      expect(res.status).toBe(401);
    });

    it('should allow any authenticated role (admin, staff, company) to read master lists', async () => {
      const res1 = await request(app)
        .get('/api/v1/masters/skills?limit=10')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);

      const res2 = await request(app)
        .get('/api/v1/masters/skills?limit=10')
        .set('Authorization', `Bearer ${companyToken}`);
      expect(res2.status).toBe(200);
    });

    it('should support search and pagination metadata', async () => {
      await prisma.skills.create({ data: { name: 'Rust Lang' } });

      const res = await request(app)
        .get('/api/v1/masters/skills?search=Rust')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.some((s) => s.name.includes('Rust'))).toBe(true);
      expect(res.body.meta).toHaveProperty('totalPages');
    });

    it('should support cascading location queries (country -> state -> city)', async () => {
      const country = await prisma.countries.create({ data: { name: 'Testland', iso_code: 'TLD' } });
      const state = await prisma.states.create({ data: { name: 'TestState', country_id: country.id } });
      const city = await prisma.cities.create({ data: { name: 'TestCity', state_id: state.id } });

      const statesRes = await request(app)
        .get(`/api/v1/masters/states?parentId=${country.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(statesRes.status).toBe(200);
      expect(statesRes.body.data.some((s) => s.id === state.id)).toBe(true);

      const citiesRes = await request(app)
        .get(`/api/v1/masters/cities?parentId=${state.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(citiesRes.status).toBe(200);
      expect(citiesRes.body.data.some((c) => c.id === city.id)).toBe(true);
    });
  });

  describe('Admin Mutation Endpoints (POST, PUT, PATCH)', () => {
    let createdSkillId;

    it('should reject non-admin users from creating master records with 403', async () => {
      const res = await request(app)
        .post('/api/v1/masters/skills')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ name: 'Unauthorized Skill' });

      expect(res.status).toBe(403);
    });

    it('should allow admin to create master item', async () => {
      const res = await request(app)
        .post('/api/v1/masters/skills')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Solidity Smart Contracts' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Solidity Smart Contracts');
      createdSkillId = res.body.data.id;
    });

    it('should allow admin to update master item', async () => {
      const res = await request(app)
        .put(`/api/v1/masters/skills/${createdSkillId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Solidity & Web3' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Solidity & Web3');
    });

    it('should allow admin to toggle active status', async () => {
      const res = await request(app)
        .patch(`/api/v1/masters/skills/${createdSkillId}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.is_active).toBe(false);
    });
  });

  describe('CRITICAL EXIT GATE: Delete Blocked When In Use (REQ-MST-02)', () => {
    it('should block deletion with 422 if skill is in use by a candidate or job', async () => {
      // 1. Create a skill
      const lockedSkill = await prisma.skills.create({ data: { name: 'Locked Python' } });

      // 2. Link skill to a candidate
      const cand = await prisma.candidates.create({
        data: {
          name: 'Skill User',
          email: 'skilluser@test.com',
          mobile: '9876543210',
          resume_path: '/resumes/test.pdf',
          uploaded_by: testStaff.id
        }
      });
      await prisma.candidate_skills.create({
        data: { candidate_id: cand.id, skill_id: lockedSkill.id }
      });

      // 3. Attempt delete -> Expect 422
      const deleteRes = await request(app)
        .delete(`/api/v1/masters/skills/${lockedSkill.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(422);
      expect(deleteRes.body.success).toBe(false);
      expect(deleteRes.body.message).toContain('Cannot delete skills');
      expect(deleteRes.body.message).toContain('is referenced by');
    });

    it('should successfully soft-delete master item when NOT in use', async () => {
      const freeSkill = await prisma.skills.create({ data: { name: 'Unused Obsolete Skill' } });

      const deleteRes = await request(app)
        .delete(`/api/v1/masters/skills/${freeSkill.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Verify soft deleted
      const checkRes = await request(app)
        .get(`/api/v1/masters/skills/${freeSkill.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(checkRes.status).toBe(404);
    });
  });
});
