const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const prisma = require('../../src/config/db');
const { JWT_ACCESS_SECRET } = require('../../src/config/env');

describe('Integration: Users Management (Phase 2 / REQ-MST-04 / Flow F10)', () => {
  let adminToken;
  let staffToken;
  let primaryAdmin;
  let secondaryAdmin;
  let testStaffUser;

  beforeAll(async () => {
    primaryAdmin = await prisma.users.create({
      data: {
        name: 'Primary Admin',
        email: 'primaryadmin@portal.com',
        password_hash: 'hash',
        role: 'admin',
        status: 'active'
      }
    });

    secondaryAdmin = await prisma.users.create({
      data: {
        name: 'Secondary Admin',
        email: 'secondaryadmin@portal.com',
        password_hash: 'hash',
        role: 'admin',
        status: 'active'
      }
    });

    testStaffUser = await prisma.users.create({
      data: {
        name: 'Staff Candidate Recruiter',
        email: 'recruiter@portal.com',
        mobile: '9876543211',
        password_hash: 'hash',
        role: 'staff',
        status: 'active'
      }
    });

    adminToken = jwt.sign({ sub: String(primaryAdmin.id), role: 'admin' }, JWT_ACCESS_SECRET);
    staffToken = jwt.sign({ sub: String(testStaffUser.id), role: 'staff' }, JWT_ACCESS_SECRET);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should reject non-admin users from accessing /api/v1/users with 403', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(403);
  });

  it('admin should list staff and admin users with pagination', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
    // Ensure password hashes are never leaked
    expect(res.body.data[0]).not.toHaveProperty('password_hash');
  });

  it('admin should create a new staff member with auto-generated temporary password', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New Recruiter Hire',
        email: 'newhire@portal.com',
        mobile: '9123456780',
        role: 'staff'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('newhire@portal.com');
    expect(res.body.data.role).toBe('staff');
    expect(res.body.data).toHaveProperty('temporaryPassword');
  });

  it('admin should update user profile fields', async () => {
    const res = await request(app)
      .put(`/api/v1/users/${testStaffUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Senior Lead Recruiter',
        mobile: '9998887776'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Senior Lead Recruiter');
    expect(res.body.data.mobile).toBe('9998887776');
  });

  it('CRITICAL GUARD: Admin cannot deactivate or block their own account (returns 422)', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${primaryAdmin.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'inactive' });

    expect(res.status).toBe(422);
    expect(res.body.message).toContain('Cannot alter status or deactivate your own');
  });

  it('CRITICAL GUARD: Admin cannot delete their own account (returns 422)', async () => {
    const res = await request(app)
      .delete(`/api/v1/users/${primaryAdmin.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(422);
    expect(res.body.message).toContain('Cannot delete your own administrator account');
  });

  it('CRITICAL GUARD: System blocks deactivating or deleting the last active admin (returns 422)', async () => {
    // 1. Delete secondary admin first
    await request(app)
      .delete(`/api/v1/users/${secondaryAdmin.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Now primaryAdmin is the ONLY active admin in the system
    // Test the service layer guard directly when targeting the last active admin
    const usersService = require('../../src/modules/users/users.service');

    await expect(
      usersService.updateUserStatus(primaryAdmin.id, 'inactive', 99999n)
    ).rejects.toMatchObject({
      status: 422,
      message: expect.stringContaining('at least one active administrator')
    });

    await expect(
      usersService.deleteUser(primaryAdmin.id, 99999n)
    ).rejects.toMatchObject({
      status: 422,
      message: expect.stringContaining('last active administrator')
    });
  });
});
