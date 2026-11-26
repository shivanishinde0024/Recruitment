const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const prisma = require('../../src/config/db');

describe('Integration: Authentication Module (Phase 1 / Flows F1, F12)', () => {
  let testAdmin;
  let testStaff;
  let rawPassword = 'Password@123';

  beforeAll(async () => {
    // Clean up test users
    await prisma.refresh_tokens.deleteMany({});
    await prisma.password_resets.deleteMany({});
    await prisma.users.deleteMany({
      where: { email: { in: ['testadmin@portal.com', 'teststaff@portal.com', 'lockout@portal.com'] } }
    });

    const hash = await bcrypt.hash(rawPassword, 12);

    testAdmin = await prisma.users.create({
      data: {
        name: 'Test Administrator',
        email: 'testadmin@portal.com',
        mobile: '+91-9999999991',
        password_hash: hash,
        role: 'admin',
        status: 'active'
      }
    });

    testStaff = await prisma.users.create({
      data: {
        name: 'Test Staff User',
        email: 'teststaff@portal.com',
        mobile: '+91-9999999992',
        password_hash: hash,
        role: 'staff',
        status: 'active'
      }
    });
  });

  afterAll(async () => {
    await prisma.refresh_tokens.deleteMany({});
    await prisma.password_resets.deleteMany({});
    await prisma.users.deleteMany({
      where: { email: { in: ['testadmin@portal.com', 'teststaff@portal.com', 'lockout@portal.com'] } }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should reject invalid email format with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'notanemail', password: 'Password@123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });

    it('should reject non-existent email with generic 401 (anti-enumeration)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@portal.com', password: 'Password@123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject incorrect password with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'testadmin@portal.com', password: 'WrongPassword@999' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should authenticate valid credentials, set cookies and return token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'testadmin@portal.com', password: rawPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('testadmin@portal.com');
      expect(res.body.data.user.role).toBe('admin');
      expect(res.body.data).toHaveProperty('token');
      expect(typeof res.body.data.expiresAt).toBe('number');
      expect(res.body.data.expiresAt).toBeGreaterThan(Date.now());
      expect(typeof res.body.data.inactivityTimeoutMs).toBe('number');

      // Verify Cookies
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = cookies.join(';');
      expect(cookieStr).toContain('access_token=');
      expect(cookieStr).toContain('refresh_token=');
      expect(cookieStr).toContain('HttpOnly');
    });

    it('should reject login for company with pending approval with 403', async () => {
      const compEmail = 'pending_company@portal.com';
      const hash = await bcrypt.hash(rawPassword, 12);
      const user = await prisma.users.create({
        data: {
          name: 'Pending Company User',
          email: compEmail,
          password_hash: hash,
          role: 'company',
          status: 'active'
        }
      });
      await prisma.companies.create({
        data: {
          user_id: user.id,
          company_name: 'Pending Corp',
          contact_person: 'John Doe',
          contact_email: compEmail,
          contact_mobile: '9876543210',
          status: 'pending'
        }
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: compEmail, password: rawPassword });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/pending approval/i);
    });

    it('should allow login for company once approved with 200', async () => {
      const compEmail = 'approved_company@portal.com';
      const hash = await bcrypt.hash(rawPassword, 12);
      const user = await prisma.users.create({
        data: {
          name: 'Approved Company User',
          email: compEmail,
          password_hash: hash,
          role: 'company',
          status: 'active'
        }
      });
      await prisma.companies.create({
        data: {
          user_id: user.id,
          company_name: 'Approved Corp',
          contact_person: 'Jane Doe',
          contact_email: compEmail,
          contact_mobile: '9876543211',
          status: 'approved'
        }
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: compEmail, password: rawPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('company');
      expect(res.body.data.user.companyStatus).toBe('approved');
    });

    it('should trigger account lockout (HTTP 423) after 5 consecutive failures (Flow F12)', async () => {
      const lockEmail = 'lockout@portal.com';
      const hash = await bcrypt.hash(rawPassword, 12);
      await prisma.users.create({
        data: {
          name: 'Lockout Test',
          email: lockEmail,
          password_hash: hash,
          role: 'staff',
          status: 'active'
        }
      });

      // 4 wrong attempts
      for (let i = 0; i < 4; i++) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({ email: lockEmail, password: 'BadPassword@123' });
        expect(res.status).toBe(401);
      }

      // 5th attempt -> triggers lockout with 423
      const fifthRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: lockEmail, password: 'BadPassword@123' });
      expect(fifthRes.status).toBe(423);
      expect(fifthRes.body.message).toContain('Account locked');

      // Even correct password is now blocked with 423
      const lockedRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: lockEmail, password: rawPassword });
      expect(lockedRes.status).toBe(423);
      expect(lockedRes.body.message).toContain('Account locked');
    });
  });

  describe('POST /api/v1/auth/refresh & Reuse Detection (Ruling 3.5)', () => {
    let initialRefreshToken;
    let initialAccessToken;

    beforeEach(async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'teststaff@portal.com', password: rawPassword });

      initialAccessToken = loginRes.body.data.token;
      const cookies = loginRes.headers['set-cookie'];
      const rfCookie = cookies.find((c) => c.startsWith('refresh_token='));
      initialRefreshToken = rfCookie.split(';')[0].split('=')[1];
    });

    it('should rotate refresh token and issue new access token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refresh_token=${initialRefreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.token).not.toBe(initialAccessToken);
      expect(typeof res.body.data.expiresAt).toBe('number');
      expect(res.body.data.expiresAt).toBeGreaterThan(Date.now());

      const cookies = res.headers['set-cookie'];
      const newRfCookie = cookies.find((c) => c.startsWith('refresh_token='));
      const newRefreshToken = newRfCookie.split(';')[0].split('=')[1];
      expect(newRefreshToken).not.toBe(initialRefreshToken);
    });

    it('should detect reuse of already rotated refresh token and revoke family', async () => {
      // 1. First rotation -> works
      const firstRefresh = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refresh_token=${initialRefreshToken}`]);
      expect(firstRefresh.status).toBe(200);

      // 2. Attacker replays old initialRefreshToken -> triggers reuse detection
      const replayedRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refresh_token=${initialRefreshToken}`]);

      expect(replayedRes.status).toBe(401);
      expect(replayedRes.body.message).toContain('replay detected');

      // 3. The legitimate rotated token is also now revoked
      const legitimateToken = firstRefresh.headers['set-cookie']
        .find((c) => c.startsWith('refresh_token='))
        .split(';')[0].split('=')[1];

      const afterRevokeRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refresh_token=${legitimateToken}`]);

      expect(afterRevokeRes.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should clear cookies and revoke token', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'testadmin@portal.com', password: rawPassword });

      const cookies = loginRes.headers['set-cookie'];

      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', cookies);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.message).toBe('Logged out successfully');

      const logoutCookies = logoutRes.headers['set-cookie'].join(';');
      expect(logoutCookies).toContain('access_token=;');
      expect(logoutCookies).toContain('refresh_token=;');
    });
  });

  describe('Forgot and Reset Password Flow (Flow F12)', () => {
    it('forgot-password should return 200 for both existing and non-existing email', async () => {
      const res1 = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'testadmin@portal.com' });
      expect(res1.status).toBe(200);
      expect(res1.body.message).toContain('password reset link has been sent');

      const res2 = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'unknown@example.com' });
      expect(res2.status).toBe(200);
      expect(res2.body.message).toContain('password reset link has been sent');
    });

    it('reset-password should change password and prevent reuse of same token', async () => {
      const forgotRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'testadmin@portal.com' });

      const debugToken = forgotRes.body.data?.debugToken;
      expect(debugToken).toBeDefined();

      const newPassword = 'NewSecretPassword@999';

      // Reset password with token
      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: debugToken, password: newPassword });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.message).toContain('Password has been reset');

      // Re-using same token fails
      const reuseRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: debugToken, password: newPassword });
      expect(reuseRes.status).toBe(400);

      // Login with old password fails
      const oldLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'testadmin@portal.com', password: rawPassword });
      expect(oldLogin.status).toBe(401);

      // Login with new password succeeds
      const newLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'testadmin@portal.com', password: newPassword });
      expect(newLogin.status).toBe(200);

      // Restore password for other tests
      rawPassword = newPassword;
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return user profile with valid Bearer token', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'testadmin@portal.com', password: rawPassword });

      const token = loginRes.body.data.token;

      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.email).toBe('testadmin@portal.com');
      expect(meRes.body.data.role).toBe('admin');
      expect(typeof meRes.body.data.sessionExpiresAt).toBe('number');
      expect(typeof meRes.body.data.inactivityTimeoutMs).toBe('number');
    });
  });
});

