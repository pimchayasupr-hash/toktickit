import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Issue 4: My Tickets List API Tests', () => {
  const requesterId = 1;

  it('GET /api/tickets returns paginated tickets for active development requester', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('X-Development-Requester-Id', String(requesterId));

    expect(res.status).toBe(200);
    expect(res.body.tickets).toBeDefined();
    expect(Array.isArray(res.body.tickets)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination).toHaveProperty('total');
    expect(res.body.pagination).toHaveProperty('page');
    expect(res.body.pagination).toHaveProperty('pageSize');
    expect(res.body.pagination).toHaveProperty('totalPages');
  });

  it('GET /api/tickets filters by categoryId and search keyword', async () => {
    const res = await request(app)
      .get('/api/tickets?categoryId=1&search=Wi-Fi')
      .set('X-Development-Requester-Id', String(requesterId));

    expect(res.status).toBe(200);
    expect(res.body.tickets).toBeDefined();
  });
});
