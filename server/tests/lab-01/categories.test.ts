import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('GET /api/categories (API-02)', () => {
  it('returns 200 with the seeded categories sorted by id', async () => {
    const response = await request(app).get('/api/categories');

    expect(response.status).toBe(200);
    const list = Array.isArray(response.body) ? response.body : response.body.categories;
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(4);

    const categoryNames = list.map((c: { name: string }) => c.name);
    expect(categoryNames).toEqual([
      'Account and Access',
      'Hardware',
      'Software',
      'Network',
    ]);

    expect(list).toEqual([
      { id: 1, name: 'Account and Access' },
      { id: 2, name: 'Hardware' },
      { id: 3, name: 'Software' },
      { id: 4, name: 'Network' },
    ]);
  });
});
