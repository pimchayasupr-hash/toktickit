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

  it('API-24 (Regression): Staff Queue filters by search AND priority simultaneously without overwriting OR conditions', async () => {
    const token = await getStaffToken();

    // 1. Fetch all tickets with search=battery only
    const searchOnlyRes = await request(app)
      .get('/api/staff/tickets?search=battery')
      .set('Authorization', `Bearer ${token}`);

    expect(searchOnlyRes.status).toBe(200);
    const searchOnlyTickets = searchOnlyRes.body.tickets;
    expect(searchOnlyTickets.length).toBeGreaterThan(0);

    // 2. Query with search=battery AND priority=URGENT
    const combinedUrgentRes = await request(app)
      .get('/api/staff/tickets?search=battery&priority=URGENT')
      .set('Authorization', `Bearer ${token}`);

    expect(combinedUrgentRes.status).toBe(200);
    const combinedUrgentTickets = combinedUrgentRes.body.tickets;

    // Every ticket in combinedUrgentTickets must match search AND priority URGENT
    for (const t of combinedUrgentTickets) {
      const matchesSearch = t.summary.toLowerCase().includes('battery') ||
                            t.description.toLowerCase().includes('battery') ||
                            t.ticketNumber.toLowerCase().includes('battery');
      expect(matchesSearch).toBe(true);

      const matchesPriority = t.itPriority === 'URGENT' || t.requestedPriority === 'URGENT';
      expect(matchesPriority).toBe(true);
    }

    // 3. Query with search=battery AND a priority that does not match
    const nonMatchingPriorityRes = await request(app)
      .get('/api/staff/tickets?search=battery&priority=NONEXISTENT_PRIORITY')
      .set('Authorization', `Bearer ${token}`);

    expect(nonMatchingPriorityRes.status).toBe(200);
    expect(nonMatchingPriorityRes.body.tickets.length).toBe(0);
  });

  it('rejects invalid query parameters with 400 VALIDATION_ERROR', async () => {
    const token = await getStaffToken();

    // Invalid page=0
    const resPage = await request(app)
      .get('/api/staff/tickets?page=0')
      .set('Authorization', `Bearer ${token}`);
    expect(resPage.status).toBe(400);
    expect(resPage.body.error.code).toBe('VALIDATION_ERROR');

    // Invalid pageSize=9999
    const resPageSize = await request(app)
      .get('/api/staff/tickets?pageSize=9999')
      .set('Authorization', `Bearer ${token}`);
    expect(resPageSize.status).toBe(400);
    expect(resPageSize.body.error.code).toBe('VALIDATION_ERROR');

    // Invalid status
    const resStatus = await request(app)
      .get('/api/staff/tickets?status=INVALID_STATUS_VALUE')
      .set('Authorization', `Bearer ${token}`);
    expect(resStatus.status).toBe(400);
    expect(resStatus.body.error.code).toBe('VALIDATION_ERROR');

    // Invalid sort
    const resSort = await request(app)
      .get('/api/staff/tickets?sort=DROP_DATABASE')
      .set('Authorization', `Bearer ${token}`);
    expect(resSort.status).toBe(400);
    expect(resSort.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns empty results array and total 0 for non-matching filter criteria', async () => {
    const token = await getStaffToken();

    const res = await request(app)
      .get('/api/staff/tickets?search=NONEXISTENT_QUERY_FOR_EMPTY_STATE_12345')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.tickets).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });
});


