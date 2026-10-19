import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Lab 4 - Ticket Workflow & Resolution Gate API Test Suite', () => {
  const getStaffToken = async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'michael.staff@toktickit.com',
      password: 'Password123!',
    });
    return res.body.token;
  };

  it('TEST-WFK-02: Transition to RESOLVED on unassigned ticket is blocked by Resolution Gate', async () => {
    const token = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${token}`);

    // Find an unassigned ticket or unassign one
    const unassignedTicket = queueRes.body.tickets.find((t: any) => t.ownerId === null);
    expect(unassignedTicket).toBeDefined();

    const res = await request(app)
      .patch(`/api/staff/tickets/${unassignedTicket.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'RESOLVED',
        version: unassignedTicket.version || 1,
      });

    // Must be blocked by resolution gate
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('RESOLUTION_GATE_FAILED');
  });

  it('TEST-WFK-03: Transition to RESOLVED with zero actions is blocked by Resolution Gate', async () => {
    const token = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${token}`);

    // Claim a ticket with no actions
    const ticket = queueRes.body.tickets[0];

    // Ensure it is assigned
    await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/claim`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'RESOLVED',
        version: ticket.version || 1,
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('RESOLUTION_GATE_FAILED');
  });

  it('TEST-WFK-04: Status transition with stale ticket version returns 409 Conflict', async () => {
    const token = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${token}`);
    const ticket = queueRes.body.tickets.find((t: any) => t.currentStatus === 'NEW');

    if (ticket) {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'OPEN',
          version: 9999, // Stale version
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONCURRENCY_CONFLICT');
    }
  });

  it('TEST-WFK-05: Disallowed status transition (e.g. NEW directly to RESOLVED) returns 400/422', async () => {
    const token = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${token}`);
    const newTicket = queueRes.body.tickets.find((t: any) => t.currentStatus === 'NEW');

    if (newTicket) {
      const res = await request(app)
        .patch(`/api/staff/tickets/${newTicket.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'RESOLVED',
          version: newTicket.version || 1,
        });

      expect([400, 422]).toContain(res.status);
    }
  });

  it('TEST-WFK-01: Transition to RESOLVED succeeds when owner is assigned and action is documented', async () => {
    const token = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${token}`);
    const ticket = queueRes.body.tickets.find((t: any) => t.currentStatus === 'IN_PROGRESS' || t.currentStatus === 'OPEN');

    if (ticket) {
      // Ensure claimed
      await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/claim`)
        .set('Authorization', `Bearer ${token}`);

      // Add a valid action taken
      await request(app)
        .post(`/api/tickets/${ticket.id}/actions-taken`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          actionDateTime: new Date().toISOString(),
          description: 'Replaced failed disk drive in RAID array and rebuilt storage pool.',
          result: 'RAID array status returned to Optimal; all volumes online.',
          followUpRequired: false,
        });

      // Refetch ticket to get latest version
      const detailRes = await request(app)
        .get(`/api/staff/tickets/${ticket.id}`)
        .set('Authorization', `Bearer ${token}`);
      const latestTicket = detailRes.body.ticket;

      const resolveRes = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'RESOLVED',
          version: latestTicket.version || 1,
        });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.ticket.currentStatus).toBe('RESOLVED');
    }
  });
});
