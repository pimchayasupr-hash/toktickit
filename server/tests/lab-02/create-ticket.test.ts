import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Issue 3: Create Ticket API Tests', () => {
  const requesterId = 1;

  it('POST /api/tickets creates a new ticket and generates official ticketNumber', async () => {
    const clientSubmissionId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${Math.random().toString(36).substring(2, 9)}`;
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Development-Requester-Id', String(requesterId))
      .send({
        clientSubmissionId,
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'Cannot connect to campus Wi-Fi network',
        requestedPriority: 'HIGH',
        description: 'Unable to connect to the Wi-Fi network from Building 3 floor 2 since morning.',
      });

    expect(res.status).toBe(201);
    expect(res.body.ticket).toBeDefined();
    expect(res.body.ticket.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(res.body.ticket.requesterId).toBe(requesterId);
    expect(res.body.ticket.summary).toBe('Cannot connect to campus Wi-Fi network');
  });

  it('POST /api/tickets returns 400 Bad Request on invalid fields', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Development-Requester-Id', String(requesterId))
      .send({
        categoryId: 999,
        relatedSystemId: 999,
        summary: 'Bad',
        requestedPriority: 'INVALID',
        description: 'Short',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields).toBeDefined();
  });
});
