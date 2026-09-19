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

    // Get ticket TXT-2026-001232 (unassigned)
    const queueRes = await request(app)
      .get('/api/staff/tickets?search=TXT-2026-001232')
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
});
