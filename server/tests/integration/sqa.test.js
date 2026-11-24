const request = require('supertest');
const app = require('../../src/app');

describe('SQA Landing Page & CRM API End-to-End Tests', () => {
  let createdLeadCode = '';
  let createdLeadId = '';

  test('POST /api/v1/sqa/leads submits admission inquiry successfully', async () => {
    const res = await request(app)
      .post('/api/v1/sqa/leads')
      .send({
        fullName: 'Alexander Wright',
        email: 'alex.wright@quantum.dev',
        phone: '+91 98765 43210',
        serviceCategory: 'Pillar 4: Applied AI & Data Intelligence',
        subStream: 'Autonomous Agent Engineering',
        goals: 'Looking to transition from senior fullstack into enterprise AI orchestration.'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toMatch(/^LEAD-\d+/);
    expect(res.body.data.fullName).toBe('Alexander Wright');
    expect(res.body.data.status).toBe('NEW');

    createdLeadCode = res.body.data.id;
    createdLeadId = res.body.data.dbId;
  });

  test('POST /api/leads/submit alias works for legacy HTML form submission', async () => {
    const res = await request(app)
      .post('/api/leads/submit')
      .send({
        fullName: 'Maya Patel',
        email: 'maya.patel@designhub.io',
        phone: '+91 98111 22334',
        serviceCategory: 'Pillar 3: Creative Design & Media Lab',
        subStream: 'Spatial Design & HMI',
        goals: 'AR/VR spatial prototyping.'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe('Maya Patel');
  });

  test('GET /api/v1/sqa/leads lists leads with aggregated CRM metrics', async () => {
    const res = await request(app).get('/api/v1/sqa/leads');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.meta.stats).toBeDefined();
    expect(res.body.meta.stats.totalLeads).toBeGreaterThanOrEqual(2);
  });

  test('PATCH /api/v1/sqa/leads/:id/status updates lead status to CONTACTED and ENROLLED', async () => {
    const res1 = await request(app)
      .patch(`/api/v1/sqa/leads/${createdLeadCode}/status`)
      .send({ status: 'CONTACTED' });

    expect(res1.statusCode).toBe(200);
    expect(res1.body.data.status).toBe('CONTACTED');

    const res2 = await request(app)
      .patch(`/api/v1/sqa/leads/${createdLeadCode}/status`)
      .send({ status: 'ENROLLED' });

    expect(res2.statusCode).toBe(200);
    expect(res2.body.data.status).toBe('ENROLLED');
  });

  test('POST /api/v1/sqa/applications registers candidate for corporate placement', async () => {
    const res = await request(app)
      .post('/api/v1/sqa/applications')
      .send({
        fullName: 'Priya Sharma',
        email: 'priya.sharma@techcorp.in',
        phone: '+91 99887 76655',
        targetRole: 'Senior Cloud & DevOps Architect',
        experienceLevel: '3-5 Years',
        resumeUrl: 'https://linkedin.com/in/priya-sharma-dev',
        statement: 'AWS certified professional seeking top tier placement.'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toMatch(/^APP-\d+/);
    expect(res.body.data.fullName).toBe('Priya Sharma');
  });

  test('GET /api/v1/sqa/certificates/verify/:code validates official credential ledger', async () => {
    const validRes = await request(app).get('/api/v1/sqa/certificates/verify/SQA-2026-AI01');
    expect(validRes.statusCode).toBe(200);
    expect(validRes.body.data.valid).toBe(true);
    expect(validRes.body.data.studentName).toBe('Dr. Vivek Ranade');
    expect(validRes.body.data.status).toBe('VALID');

    const invalidRes = await request(app).get('/api/v1/sqa/certificates/verify/INVALID-FAKE-CODE-999');
    expect(invalidRes.statusCode).toBe(200);
    expect(invalidRes.body.data.valid).toBe(false);
  });

  test('GET /api/v1/sqa/leads/export returns sanitized CSV string', async () => {
    const res = await request(app).get('/api/v1/sqa/leads/export');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Candidate Name');
    expect(res.text).toContain('Alexander Wright');
  });

  test('DELETE /api/v1/sqa/leads/:id deletes a lead', async () => {
    const res = await request(app).delete(`/api/v1/sqa/leads/${createdLeadCode}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

