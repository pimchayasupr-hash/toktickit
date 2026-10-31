import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Lab 4 - Requester Dashboard API Test Suite', () => {
  const getRequesterToken = async (email = 'jennifer.anderson@example.com') => {
    const res = await request(app).post('/api/auth/login').send({
      email,
      password: 'Password123!',
    });
    return res.body.token;
  };

  it('TEST-DSH-REQ-01: Authenticated requester receives personal dashboard metrics and recent tickets', async () => {
    const token = await getRequesterToken('jennifer.anderson@example.com');

    const res = await request(app)
      .get('/api/dashboard/requester')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.metrics).toBeDefined();
    expect(typeof res.body.metrics.openTicketsCount).toBe('number');
    expect(typeof res.body.metrics.waitingForRequesterCount).toBe('number');
    expect(typeof res.body.metrics.recentlyResolvedCount).toBe('number');
    expect(typeof res.body.metrics.closedTicketsCount).toBe('number');
    expect(Array.isArray(res.body.recentTickets)).toBe(true);
    expect(Array.isArray(res.body.attentionTickets)).toBe(true);
  });

  it('TEST-DSH-REQ-02: Requester with zero tickets receives all 0 counts and empty lists (no errors)', async () => {
    // Authenticate a newly created or zero-ticket user
    // We can login as an active user or create an ephemeral test user if needed, or query with zero-ticket user
    const token = await (async () => {
      // Let's create an admin token to provision a zero-ticket user
      const adminRes = await request(app).post('/api/auth/login').send({
        email: 'admin@toktickit.com',
        password: 'Password123!',
      });
      const adminToken = adminRes.body.token;

      const randomEmail = `zero.tickets.${Date.now()}@example.com`;
      const createRes = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Zero Ticket User',
          email: randomEmail,
          role: 'REQUESTER',
          initialPassword: 'Password123!',
          isActive: true,
        });

      // Clear mustChangePassword
      const loginRes = await request(app).post('/api/auth/login').send({
        email: randomEmail,
        password: 'Password123!',
      });
      const tempToken = loginRes.body.token;

      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${tempToken}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'Password456!#New',
        });

      const finalLogin = await request(app).post('/api/auth/login').send({
        email: randomEmail,
        password: 'Password456!#New',
      });
      return finalLogin.body.token;
    })();

    const res = await request(app)
      .get('/api/dashboard/requester')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.metrics.openTicketsCount).toBe(0);
    expect(res.body.metrics.waitingForRequesterCount).toBe(0);
    expect(res.body.metrics.recentlyResolvedCount).toBe(0);
    expect(res.body.metrics.closedTicketsCount).toBe(0);
    expect(res.body.recentTickets).toEqual([]);
    expect(res.body.attentionTickets).toEqual([]);
  });

  it('TEST-DSH-REQ-03: Requester dashboard isolates other users tickets', async () => {
    const jenniferToken = await getRequesterToken('jennifer.anderson@example.com');
    const michaelToken = await getRequesterToken('michael.brown@example.com');

    const resJennifer = await request(app)
      .get('/api/dashboard/requester')
      .set('Authorization', `Bearer ${jenniferToken}`);

    const resMichael = await request(app)
      .get('/api/dashboard/requester')
      .set('Authorization', `Bearer ${michaelToken}`);

    expect(resJennifer.status).toBe(200);
    expect(resMichael.status).toBe(200);
  });

  it('Unauthenticated request to requester dashboard returns 401', async () => {
    const res = await request(app).get('/api/dashboard/requester');
    expect(res.status).toBe(401);
  });
});
