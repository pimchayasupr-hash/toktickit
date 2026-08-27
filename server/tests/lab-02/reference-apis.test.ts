import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Issue 2: Categories and Related Systems Reference APIs', () => {
  it('returns active categories', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    const categories = Array.isArray(res.body) ? res.body : res.body.categories;
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBe(4);
    const categoryNames = categories.map((c: { name: string }) => c.name);
    expect(categoryNames).toEqual([
      'Account and Access',
      'Hardware',
      'Software',
      'Network',
    ]);
  });

  it('GET /api/related-systems returns active related systems', async () => {
    const res = await request(app).get('/api/related-systems');
    expect(res.status).toBe(200);
    expect(res.body.relatedSystems).toBeDefined();
    expect(Array.isArray(res.body.relatedSystems)).toBe(true);
    expect(res.body.relatedSystems.length).toBe(7);
    const systemNames = res.body.relatedSystems.map((s: { name: string }) => s.name);
    expect(systemNames).toEqual([
      'Email',
      'Campus Wi-Fi',
      'VPN',
      'LEB2 App',
      'Grade Submission App',
      'Printer',
      'Corporate Laptop',
    ]);
  });
});
