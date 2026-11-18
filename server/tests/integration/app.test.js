const request = require('supertest');
const app = require('../../src/app');

describe('Integration: App Bootstrap & Global Middleware', () => {
  it('GET /api/v1/health should return 200 with status healthy', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET non-existent endpoint should return 404 with uniform error envelope', async () => {
    const res = await request(app).get('/api/v1/non-existent-route-999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Resource not found');
  });

  it('POST with malformed JSON body should return 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ "email": "broken"'); // Malformed JSON

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Malformed JSON body');
  });
});
