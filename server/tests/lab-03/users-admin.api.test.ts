import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Lab 3 - Administrator User Management API Suite', () => {
  const getAdminToken = async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@toktickit.com',
      password: 'Password123!',
    });
    return res.body.token;
  };

  it('API-14: Admin create user with duplicate email returns 409 Conflict', async () => {
    const token = await getAdminToken();

    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Duplicate User',
        email: 'jennifer.anderson@example.com', // Existing email
        role: 'REQUESTER',
        initialPassword: 'InitialPassword123!',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('API-15: Admin self-deactivation attempt returns 400 Bad Request', async () => {
    const token = await getAdminToken();

    // Get admin ID
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    const adminId = meRes.body.user.id;

    const res = await request(app)
      .patch(`/api/admin/users/${adminId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isActive: false });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('SELF_DEACTIVATION_FORBIDDEN');
  });

  it('Admin list users with search and role filter', async () => {
    const token = await getAdminToken();

    const res = await request(app)
      .get('/api/admin/users?role=STAFF')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    res.body.users.forEach((u: any) => {
      expect(u.role).toBe('STAFF');
    });
  });

  it('Admin create user and reset initial password', async () => {
    const token = await getAdminToken();

    const testEmail = `test.staff.${Date.now()}@toktickit.com`;

    // Create user
    const createRes = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New Test Staff',
        email: testEmail,
        role: 'STAFF',
        initialPassword: 'InitialPassword123!',
      });

    expect(createRes.status).toBe(201);
    const userId = createRes.body.user.id;

    // Reset password
    const resetRes = await request(app)
      .post(`/api/admin/users/${userId}/reset-password`)
      .set('Authorization', `Bearer ${token}`)
      .send({ initialPassword: 'ResetPassword123!' });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.user.mustChangePassword).toBe(true);
  });
});
