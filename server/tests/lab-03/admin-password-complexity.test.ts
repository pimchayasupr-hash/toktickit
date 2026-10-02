import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Lab 3 - Admin Password Complexity (BR-Security, AC-02)', () => {
  const getAdminToken = async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@toktickit.com',
      password: 'Password123!',
    });
    return res.body.token;
  };

  it('rejects weak password on user creation (<8 chars, missing special/digit/case)', async () => {
    const token = await getAdminToken();

    // 1. Too short
    const res1 = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Weak User 1',
        email: `weak1_${Date.now()}@example.com`,
        role: 'REQUESTER',
        initialPassword: 'Weak1!',
      });
    expect(res1.status).toBe(400);
    expect(res1.body.error.code).toBe('VALIDATION_ERROR');

    // 2. Missing special character
    const res2 = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Weak User 2',
        email: `weak2_${Date.now()}@example.com`,
        role: 'REQUESTER',
        initialPassword: 'Password123',
      });
    expect(res2.status).toBe(400);
    expect(res2.body.error.code).toBe('VALIDATION_ERROR');

    // 3. Missing uppercase
    const res3 = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Weak User 3',
        email: `weak3_${Date.now()}@example.com`,
        role: 'REQUESTER',
        initialPassword: 'password123!',
      });
    expect(res3.status).toBe(400);
    expect(res3.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('accepts compliant password on user creation and user is created', async () => {
    const token = await getAdminToken();
    const uniqueEmail = `valid_${Date.now()}@example.com`;

    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Valid Password User',
        email: uniqueEmail,
        role: 'REQUESTER',
        initialPassword: 'ValidPassword123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(uniqueEmail);
  });

  it('rejects weak initialPassword on admin password reset', async () => {
    const token = await getAdminToken();

    // Try resetting user 2 with weak passwords
    const res1 = await request(app)
      .post('/api/admin/users/2/reset-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        initialPassword: 'simple',
      });
    expect(res1.status).toBe(400);
    expect(res1.body.error.code).toBe('VALIDATION_ERROR');

    const res2 = await request(app)
      .post('/api/admin/users/2/reset-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        initialPassword: 'NoSpecialDigitPassword',
      });
    expect(res2.status).toBe(400);
    expect(res2.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('accepts compliant initialPassword on admin password reset', async () => {
    const token = await getAdminToken();

    const res = await request(app)
      .post('/api/admin/users/2/reset-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        initialPassword: 'ResetCompliant123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });
});
