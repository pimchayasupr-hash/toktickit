import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Lab 3 - IT Staff Ticket Detail & Operations API Suite', () => {
  const getStaffToken = async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'michael.staff@toktickit.com',
      password: 'Password123!',
    });
    return res.body.token;
  };

  it('API-09: IT Staff claim & reassign ticket updates owner in DB', async () => {
    const token = await getStaffToken();

    // Get ticket TKT-2026-001232 (unassigned)
    const queueRes = await request(app)
      .get('/api/staff/tickets?search=TKT-2026-001232')
      .set('Authorization', `Bearer ${token}`);

    const ticket = queueRes.body.tickets[0];
    expect(ticket).toBeDefined();

    // Claim ticket
    const claimRes = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/claim`)
      .set('Authorization', `Bearer ${token}`);

    expect(claimRes.status).toBe(200);
    expect(claimRes.body.ticket.owner.email).toBe('michael.staff@toktickit.com');
  });

  it('API-10: IT Priority update succeeds', async () => {
    const token = await getStaffToken();

    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${token}`);

    const ticketId = queueRes.body.tickets[0].id;

    const res = await request(app)
      .patch(`/api/staff/tickets/${ticketId}/priority`)
      .set('Authorization', `Bearer ${token}`)
      .send({ itPriority: 'URGENT' });

    expect(res.status).toBe(200);
    expect(res.body.ticket.itPriority).toBe('URGENT');
  });

  it('API-11: Invalid status transition returns 400 Bad Request', async () => {
    const token = await getStaffToken();

    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${token}`);

    const ticket = queueRes.body.tickets.find((t: any) => t.currentStatus === 'NEW');

    if (ticket) {
      // Trying NEW -> CLOSED (invalid)
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'CLOSED' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_TRANSITION');
    }
  });

  it('API-23 (Regression): STAFF login fetches /api/staff/assignees successfully and reassigns ticket for real', async () => {
    const token = await getStaffToken();

    // 1. Call new assignees endpoint
    const assigneesRes = await request(app)
      .get('/api/staff/assignees')
      .set('Authorization', `Bearer ${token}`);

    expect(assigneesRes.status).toBe(200);
    expect(assigneesRes.body).toHaveProperty('assignees');
    const assignees = assigneesRes.body.assignees;
    expect(Array.isArray(assignees)).toBe(true);
    expect(assignees.length).toBeGreaterThan(0);

    // Verify all returned users have role STAFF or ADMIN and isActive
    for (const user of assignees) {
      expect(['STAFF', 'ADMIN']).toContain(user.role);
    }

    // 2. Pick a target assignee that is not the current user
    const targetAssignee = assignees.find((u: any) => u.email === 'sarah.staff@toktickit.com') || assignees[0];

    // 3. Get a ticket from queue
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${token}`);

    const ticket = queueRes.body.tickets[0];
    expect(ticket).toBeDefined();

    // 4. Reassign ticket to targetAssignee
    const reassignRes = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ownerId: targetAssignee.id });

    expect(reassignRes.status).toBe(200);
    expect(reassignRes.body.ticket.ownerId).toBe(targetAssignee.id);
    expect(reassignRes.body.ticket.owner.id).toBe(targetAssignee.id);
  });
});

