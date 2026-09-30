import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Issue 4: My Tickets List API Tests', () => {
  const getToken = async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'jennifer.anderson@example.com',
      password: 'Password123!',
    });
    return res.body.token;
  };

  it('GET /api/tickets returns paginated tickets for active development requester', async () => {
    const token = await getToken();
    const res = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.tickets).toBeDefined();
    expect(Array.isArray(res.body.tickets)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('GET /api/tickets filters by categoryId and search keyword', async () => {
    const token = await getToken();
    const res = await request(app)
      .get('/api/tickets?categoryId=1&search=Wi-Fi')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.tickets).toBeDefined();
    expect(Array.isArray(res.body.tickets)).toBe(true);
  });
});
