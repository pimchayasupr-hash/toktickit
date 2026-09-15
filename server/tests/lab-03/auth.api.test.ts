import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Lab 3 - Authentication & Token Revocation API Suite', () => {
  it('API-01: Valid user login returns auth token & user profile', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jennifer.anderson@example.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({
      email: 'jennifer.anderson@example.com',
      role: 'REQUESTER',
      mustChangePassword: false,
      isActive: true,
    });
  });

  it('API-02: Invalid password or unknown email returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jennifer.anderson@example.com',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('API-03: Inactive account login attempt returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alex.turner@example.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('API-04: Mandatory password change updates password and clears flag', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'sarah.jenkins@example.com',
        password: 'Password123!',
      });

    const token = loginRes.body.token;

    const changeRes = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'Password123!',
        newPassword: 'NewUpdatedPassword123!',
      });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.mustChangePassword).toBe(false);

    const reloginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'sarah.jenkins@example.com',
        password: 'NewUpdatedPassword123!',
      });

    expect(reloginRes.status).toBe(200);

    // Restore password back to default
    await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${reloginRes.body.token}`)
      .send({
        currentPassword: 'NewUpdatedPassword123!',
        newPassword: 'Password123!',
      });
  });

  it('API-04b: Sending X-Development-Requester-Id header without valid JWT token returns 401 Unauthorized (Strict BR-03)', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('X-Development-Requester-Id', '1');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('API-04c: Real Server-Side Logout Invalidation - Calling API with revoked token returns 401 Unauthorized', async () => {
    // 1. Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jennifer.anderson@example.com',
        password: 'Password123!',
      });

    const token = loginRes.body.token;
    expect(token).toBeDefined();

    // 2. Access protected endpoint before logout -> 200 OK
    const preLogoutRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(preLogoutRes.status).toBe(200);

    // 3. Logout
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(logoutRes.status).toBe(200);

    // 4. Try accessing protected endpoint after logout using old token -> 401 Unauthorized
    const postLogoutRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(postLogoutRes.status).toBe(401);
    expect(postLogoutRes.body.error.code).toBe('UNAUTHORIZED');
  });
});
