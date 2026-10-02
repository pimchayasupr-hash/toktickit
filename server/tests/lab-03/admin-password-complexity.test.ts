import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

describe('Lab 3 - Admin Password Complexity (BR-Security, AC-02)', () => {
  const prisma = new PrismaClient();
  const createdUserIds: number[] = [];
  const testEmailPrefix = `pwd.complexity.${Date.now()}`;

  const getAdminToken = async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@toktickit.com',
      password: 'Password123!',
    });
    return res.body.token;
  };

  afterAll(async () => {
    try {
      if (createdUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: createdUserIds } },
        });
      }
      // Also clean up any lingering test accounts with this run's prefix
      await prisma.user.deleteMany({
        where: { email: { startsWith: 'pwd.complexity.' } },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  it('rejects weak password on user creation (<8 chars, missing special/digit/case)', async () => {
    const token = await getAdminToken();

    // 1. Too short (<8 chars)
    const res1 = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Weak User 1',
        email: `${testEmailPrefix}.weak1@toktickit.com`,
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
        email: `${testEmailPrefix}.weak2@toktickit.com`,
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
        email: `${testEmailPrefix}.weak3@toktickit.com`,
        role: 'REQUESTER',
        initialPassword: 'password123!',
      });
    expect(res3.status).toBe(400);
    expect(res3.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('accepts compliant password on user creation and user is created', async () => {
    const token = await getAdminToken();
    const uniqueEmail = `${testEmailPrefix}.created@toktickit.com`;

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

    if (res.body.user?.id) {
      createdUserIds.push(res.body.user.id);
    }
  });

  it('rejects weak initialPassword on admin password reset for a freshly created test user', async () => {
    const token = await getAdminToken();
    const targetEmail = `${testEmailPrefix}.for-reset@toktickit.com`;

    // Create a fresh test user to reset
    const createRes = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Reset Target User',
        email: targetEmail,
        role: 'REQUESTER',
        initialPassword: 'TargetInitialPassword123!',
      });
    expect(createRes.status).toBe(201);
    const targetUserId = createRes.body.user.id;
    createdUserIds.push(targetUserId);

    // Try resetting with weak passwords (should fail)
    const res1 = await request(app)
      .post(`/api/admin/users/${targetUserId}/reset-password`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        initialPassword: 'simple',
      });
    expect(res1.status).toBe(400);
    expect(res1.body.error.code).toBe('VALIDATION_ERROR');

    const res2 = await request(app)
      .post(`/api/admin/users/${targetUserId}/reset-password`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        initialPassword: 'NoSpecialDigitPassword',
      });
    expect(res2.status).toBe(400);
    expect(res2.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('accepts compliant initialPassword on admin password reset for a freshly created test user', async () => {
    const token = await getAdminToken();
    const targetEmail = `${testEmailPrefix}.for-reset-ok@toktickit.com`;

    // Create a fresh test user to reset
    const createRes = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Reset Target User OK',
        email: targetEmail,
        role: 'REQUESTER',
        initialPassword: 'InitialTargetPassword123!',
      });
    expect(createRes.status).toBe(201);
    const targetUserId = createRes.body.user.id;
    createdUserIds.push(targetUserId);

    const res = await request(app)
      .post(`/api/admin/users/${targetUserId}/reset-password`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        initialPassword: 'ResetCompliant123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
    expect(res.body.user?.mustChangePassword).toBe(true);
  });
});
