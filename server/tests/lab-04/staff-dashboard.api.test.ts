import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Lab 4 - IT Staff & Administrator Dashboard API Test Suite', () => {
  const getStaffToken = async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'michael.staff@toktickit.com',
      password: 'Password123!',
    });
    return res.body.token;
  };

  const getAdminToken = async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@toktickit.com',
      password: 'Password123!',
    });
    return res.body.token;
  };

  const getRequesterToken = async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'jennifer.anderson@example.com',
      password: 'Password123!',
    });
    return res.body.token;
  };

  it('TEST-DSH-STF-01: IT Staff queries GET /api/dashboard/staff receives operational metrics', async () => {
    const token = await getStaffToken();

    const res = await request(app)
      .get('/api/dashboard/staff')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.metrics).toBeDefined();
    expect(typeof res.body.metrics.unassignedCount).toBe('number');
    expect(typeof res.body.metrics.myAssignedCount).toBe('number');
    expect(typeof res.body.metrics.openTotalCount).toBe('number');
    expect(typeof res.body.metrics.urgentCount).toBe('number');
    expect(res.body.metrics.byStatus).toBeDefined();
    expect(res.body.metrics.byPriority).toBeDefined();
    expect(Array.isArray(res.body.urgentTickets)).toBe(true);
    expect(Array.isArray(res.body.myRecentActions)).toBe(true);
    // For non-admin, adminMetrics is null
    expect(res.body.adminMetrics).toBeNull();
  });

  it('TEST-DSH-STF-02: IT Staff dashboard includes "My Recent Actions Taken"', async () => {
    const token = await getStaffToken();

    const res = await request(app)
      .get('/api/dashboard/staff')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.myRecentActions)).toBe(true);
    expect(res.body.myRecentActions.length).toBeLessThanOrEqual(5);
  });

  it('TEST-DSH-ADM-01: Administrator queries GET /api/dashboard/staff receives staff metrics plus adminMetrics', async () => {
    const adminToken = await getAdminToken();

    const res = await request(app)
      .get('/api/dashboard/staff')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.metrics).toBeDefined();
    expect(res.body.adminMetrics).toBeDefined();
    expect(res.body.adminMetrics).not.toBeNull();
    expect(typeof res.body.adminMetrics.totalUsers).toBe('number');
    expect(typeof res.body.adminMetrics.activeUsers).toBe('number');
    expect(res.body.adminMetrics.byRole).toBeDefined();
  });

  it('TEST-DSH-ADM-02: Requester role receives 403 Forbidden on staff dashboard', async () => {
    const requesterToken = await getRequesterToken();

    const res = await request(app)
      .get('/api/dashboard/staff')
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(res.status).toBe(403);
  });
});
