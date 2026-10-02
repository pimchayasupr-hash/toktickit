import { describe, it, expect, afterAll } from 'vitest';
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

  it('Admin updates user role successfully for non-admin user', async () => {
    const token = await getAdminToken();

    // Create a staff user
    const testEmail = `role.change.${Date.now()}@toktickit.com`;
    const createRes = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Role Change User',
        email: testEmail,
        role: 'STAFF',
        initialPassword: 'InitialPassword123!',
      });
    const userId = createRes.body.user.id;

    // Update role to REQUESTER
    const updateRes = await request(app)
      .patch(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'REQUESTER' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.user.role).toBe('REQUESTER');
  });

  it('API-16 / AC-22: Blocks changing role of the last active Administrator account', async () => {
    const token = await getAdminToken();

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    const adminId = meRes.body.user.id;

    // Attempt to demote self/last admin to STAFF
    const res = await request(app)
      .patch(`/api/admin/users/${adminId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'STAFF' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('LAST_ADMIN_PROTECTION');
  });

  it('API-16b / AC-22: Blocks changing role of last active Admin to REQUESTER', async () => {
    const token = await getAdminToken();

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    const adminId = meRes.body.user.id;

    // Attempt to demote self/last admin to REQUESTER
    const res = await request(app)
      .patch(`/api/admin/users/${adminId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'REQUESTER' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('LAST_ADMIN_PROTECTION');
  });

  it('Admin search users by keyword', async () => {
    const token = await getAdminToken();

    const res = await request(app)
      .get('/api/admin/users?search=Jennifer')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);
    expect(res.body.users[0].name).toContain('Jennifer');
  });
  afterAll(async () => {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const users = await prisma.user.findMany({
        where: { email: { startsWith: 'test.staff.' } },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);
      if (userIds.length > 0) {
        // FK-safe deletion order
        await prisma.internalNote.deleteMany({
          where: { authorId: { in: userIds } },
        });
        await prisma.publicComment.deleteMany({
          where: { authorId: { in: userIds } },
        });
        await prisma.attachment.deleteMany({
          where: { uploadedById: { in: userIds } },
        });
        await prisma.ticket.deleteMany({
          where: {
            OR: [
              { ownerId: { in: userIds } },
              { assignedStaffId: { in: userIds } },
            ],
          },
        });
        await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });
});

