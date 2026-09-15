import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Lab 3 - IT Staff Ticket Queue API Suite', () => {
  const getStaffToken = async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'michael.staff@toktickit.com',
      password: 'Password123!',
    });
    return res.body.token;
  };

  it('API-08: IT Staff Ticket Queue returns paginated tickets with search & filters', async () => {
    const token = await getStaffToken();

    const res = await request(app)
      .get('/api/staff/tickets?search=battery&page=1&pageSize=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tickets');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination.page).toBe(1);

    if (res.body.tickets.length > 0) {
      expect(res.body.tickets[0].summary.toLowerCase()).toContain('battery');
    }
  });

  it('IT Staff Queue supports filtering by status and priority', async () => {
    const token = await getStaffToken();

    const res = await request(app)
      .get('/api/staff/tickets?status=IN_PROGRESS&priority=MEDIUM')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tickets)).toBe(true);
  });
});
