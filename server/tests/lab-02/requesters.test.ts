import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Feature 1: Development Requester Context API Tests', () => {
  it('GET /api/requesters returns active requesters sorted by name', async () => {
    const res = await request(app).get('/api/requesters');
    expect(res.status).toBe(200);
    expect(res.body.requesters).toBeDefined();
    expect(Array.isArray(res.body.requesters)).toBe(true);
    expect(res.body.requesters.length).toBeGreaterThan(0);
    expect(res.body.requesters[0]).toHaveProperty('id');
    expect(res.body.requesters[0]).toHaveProperty('name');
    expect(res.body.requesters[0]).toHaveProperty('email');
  });
});
