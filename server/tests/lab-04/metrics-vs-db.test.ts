import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

describe('Lab 4 Audit - Metrics vs Database Raw SQL Integrity', () => {
  it('AUDIT-DSH-01: Staff dashboard counts strictly match direct Prisma DB queries', async () => {
    // 1. Login as staff
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'michael.staff@toktickit.com',
      password: 'Password123!',
    });
    const token = loginRes.body.token;
    const staffId = loginRes.body.user.id;

    // 2. Fetch staff dashboard API
    const dashRes = await request(app)
      .get('/api/dashboard/staff')
      .set('Authorization', `Bearer ${token}`);

    expect(dashRes.status).toBe(200);
    const { metrics } = dashRes.body;

    // 3. Direct DB verification queries (Unified Active Open statuses across Staff & Requester)
    const activeOpenFilter = { in: ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED'] };

    const expectedUnassigned = await prisma.ticket.count({
      where: { ownerId: null, currentStatus: activeOpenFilter },
    });

    const expectedMyAssigned = await prisma.ticket.count({
      where: { ownerId: staffId, currentStatus: activeOpenFilter },
    });

    const expectedOpenTotal = await prisma.ticket.count({
      where: { currentStatus: activeOpenFilter },
    });

    const expectedUrgent = await prisma.ticket.count({
      where: { itPriority: 'URGENT', currentStatus: activeOpenFilter },
    });

    // 4. Assert 1:1 mathematical equality
    expect(metrics.unassignedCount).toBe(expectedUnassigned);
    expect(metrics.myAssignedCount).toBe(expectedMyAssigned);
    expect(metrics.openTotalCount).toBe(expectedOpenTotal);
    expect(metrics.urgentCount).toBe(expectedUrgent);
  });

  it('AUDIT-DSH-02: Requester dashboard counts strictly match direct Prisma DB queries', async () => {
    // 1. Login as requester
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'jennifer.anderson@example.com',
      password: 'Password123!',
    });
    const token = loginRes.body.token;
    const requesterId = loginRes.body.user.id;

    // 2. Fetch requester dashboard API
    const dashRes = await request(app)
      .get('/api/dashboard/requester')
      .set('Authorization', `Bearer ${token}`);

    expect(dashRes.status).toBe(200);
    const { metrics } = dashRes.body;

    // 3. Direct DB verification queries
    const expectedOpen = await prisma.ticket.count({
      where: {
        requesterId,
        currentStatus: { in: ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED'] },
      },
    });

    const expectedWaiting = await prisma.ticket.count({
      where: {
        requesterId,
        currentStatus: 'WAITING_FOR_REQUESTER',
      },
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const expectedResolved = await prisma.ticket.count({
      where: {
        requesterId,
        currentStatus: 'RESOLVED',
        updatedAt: { gte: thirtyDaysAgo },
      },
    });

    const expectedClosed = await prisma.ticket.count({
      where: {
        requesterId,
        currentStatus: 'CLOSED',
      },
    });

    // 4. Assert 1:1 mathematical equality
    expect(metrics.openTicketsCount).toBe(expectedOpen);
    expect(metrics.waitingForRequesterCount).toBe(expectedWaiting);
    expect(metrics.recentlyResolvedCount).toBe(expectedResolved);
    expect(metrics.closedTicketsCount).toBe(expectedClosed);
  });
});
