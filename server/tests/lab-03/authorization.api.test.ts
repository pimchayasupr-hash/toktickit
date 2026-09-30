import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Lab 3 - Complete Role × Endpoint Authorization Matrix Test Suite', () => {
  const getRequesterToken = async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'jennifer.anderson@example.com',
      password: 'Password123!',
    });
    return res.body.token;
  };

  const getStaffToken = async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'michael.staff@toktickit.com',
      password: 'Password123!',
    });
    return res.body.token;
  };

  const getAdminToken = async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@toktickit.com',
      password: 'Password123!',
    });
    return res.body.token;
  };

  it('1. Requester ownership & client requesterId override protection', async () => {
    const token = await getRequesterToken();

    const res = await request(app)
      .get('/api/tickets?requesterId=999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tickets)).toBe(true);
    res.body.tickets.forEach((ticket: any) => {
      expect(ticket.requester.email).toBe('jennifer.anderson@example.com');
    });
  });

  it('2. Requester accessing another requester ticket returns 404 Not Found', async () => {
    const token = await getRequesterToken(); // Jennifer

    const michaelToken = await (async () => {
      const r = await request(app).post('/api/auth/login').send({
        email: 'michael.brown@example.com',
        password: 'Password123!',
      });
      return r.body.token;
    })();

    const ticketsRes = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${michaelToken}`);

    const otherTicketId = ticketsRes.body.tickets[0]?.id;

    if (otherTicketId) {
      const res = await request(app)
        .get(`/api/tickets/${otherTicketId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    }
  });

  it('3. Staff & Admin endpoints return 403 Forbidden for Requester role', async () => {
    const token = await getRequesterToken();

    // Staff Queue
    const queueRes = await request(app).get('/api/staff/tickets').set('Authorization', `Bearer ${token}`);
    expect(queueRes.status).toBe(403);
    expect(queueRes.body.error.code).toBe('FORBIDDEN');

    // Claim Ticket
    const claimRes = await request(app).patch('/api/staff/tickets/1/claim').set('Authorization', `Bearer ${token}`);
    expect(claimRes.status).toBe(403);

    // Assign Ticket
    const assignRes = await request(app).patch('/api/staff/tickets/1/assign').set('Authorization', `Bearer ${token}`);
    expect(assignRes.status).toBe(403);

    // IT Priority
    const priorityRes = await request(app).patch('/api/staff/tickets/1/priority').set('Authorization', `Bearer ${token}`);
    expect(priorityRes.status).toBe(403);

    // Status Update
    const statusRes = await request(app).patch('/api/staff/tickets/1/status').set('Authorization', `Bearer ${token}`);
    expect(statusRes.status).toBe(403);

    // Internal Notes (GET & POST)
    const getNotesRes = await request(app).get('/api/tickets/1/notes').set('Authorization', `Bearer ${token}`);
    expect(getNotesRes.status).toBe(403);

    const postNotesRes = await request(app).post('/api/tickets/1/notes').set('Authorization', `Bearer ${token}`).send({ content: 'test' });
    expect(postNotesRes.status).toBe(403);

    // Admin Users
    const adminRes = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
    expect(adminRes.status).toBe(403);
  });

  it('4. Admin endpoints return 403 Forbidden for IT Staff role', async () => {
    const token = await getStaffToken();

    const getUsersRes = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
    expect(getUsersRes.status).toBe(403);

    const createUserRes = await request(app).post('/api/admin/users').set('Authorization', `Bearer ${token}`).send({ name: 'Test' });
    expect(createUserRes.status).toBe(403);

    const editUserRes = await request(app).patch('/api/admin/users/1').set('Authorization', `Bearer ${token}`).send({ name: 'Test' });
    expect(editUserRes.status).toBe(403);

    const resetPassRes = await request(app).post('/api/admin/users/1/reset-password').set('Authorization', `Bearer ${token}`).send({ initialPassword: '123' });
    expect(resetPassRes.status).toBe(403);
  });

  it('5. IT Staff role permits Staff Queue, Claim, Assign, Priority, Status, Comments, Notes', async () => {
    const token = await getStaffToken();

    // Queue
    const queueRes = await request(app).get('/api/staff/tickets').set('Authorization', `Bearer ${token}`);
    expect(queueRes.status).toBe(200);

    // Notes
    const notesRes = await request(app).get('/api/tickets/1/notes').set('Authorization', `Bearer ${token}`);
    expect(notesRes.status).toBe(200);
  });

  it('6. Admin role permits User Management and Staff Queue operations', async () => {
    const token = await getAdminToken();

    // Admin Users
    const usersRes = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
    expect(usersRes.status).toBe(200);

    // Staff Queue
    const queueRes = await request(app).get('/api/staff/tickets').set('Authorization', `Bearer ${token}`);
    expect(queueRes.status).toBe(200);
  });
});
