import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Lab 3 - IT Staff Queue Status Filter Validation (BR-TicketQueue)', () => {
  const getStaffToken = async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'michael.staff@toktickit.com',
      password: 'Password123!',
    });
    return res.body.token;
  };

  it('rejects PENDING_VENDOR as an invalid status filter', async () => {
    const token = await getStaffToken();

    const res = await request(app)
      .get('/api/staff/tickets?status=PENDING_VENDOR')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('Invalid status filter value.');
  });

  it('rejects arbitrary unknown statuses with 400 VALIDATION_ERROR', async () => {
    const token = await getStaffToken();

    const res = await request(app)
      .get('/api/staff/tickets?status=UNKNOWN_STATUS')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('accepts valid Lab 3 statuses (WAITING_FOR_REQUESTER, IN_PROGRESS, RESOLVED)', async () => {
    const token = await getStaffToken();

    for (const status of ['WAITING_FOR_REQUESTER', 'IN_PROGRESS', 'RESOLVED']) {
      const res = await request(app)
        .get(`/api/staff/tickets?status=${status}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tickets');
    }
  });
});
