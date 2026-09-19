import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Lab 3 - Public Comments & Internal Notes API Suite', () => {
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

  it('API-12: Post Public Comment succeeds and whitespace content is rejected', async () => {
    const reqToken = await getRequesterToken();

    const ticketsRes = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${reqToken}`);

    const ticketId = ticketsRes.body.tickets[0].id;

    // Reject whitespace
    const invalidRes = await request(app)
      .post(`/api/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${reqToken}`)
      .send({ content: '   ' });

    expect(invalidRes.status).toBe(400);

    // Valid post
    const validRes = await request(app)
      .post(`/api/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${reqToken}`)
      .send({ content: 'Testing public comment post from requester.' });

    expect(validRes.status).toBe(201);
    expect(validRes.body.comment.content).toBe('Testing public comment post from requester.');
  });

  it('API-07/13: Internal Notes restricted to Staff/Admin, Forbidden (403) for Requester', async () => {
    const reqToken = await getRequesterToken();
    const staffToken = await getStaffToken();

    const ticketsRes = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${reqToken}`);

    const ticketId = ticketsRes.body.tickets[0].id;

    // Requester GET notes -> 403
    const reqGetNotes = await request(app)
      .get(`/api/tickets/${ticketId}/notes`)
      .set('Authorization', `Bearer ${reqToken}`);

    expect(reqGetNotes.status).toBe(403);

    // Requester POST notes -> 403
    const reqPostNotes = await request(app)
      .post(`/api/tickets/${ticketId}/notes`)
      .set('Authorization', `Bearer ${reqToken}`)
      .send({ content: 'Unauthorized note' });

    expect(reqPostNotes.status).toBe(403);

    // Staff POST notes -> 201
    const staffPostNotes = await request(app)
      .post(`/api/tickets/${ticketId}/notes`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ content: 'Internal note created by IT Staff.' });

    expect(staffPostNotes.status).toBe(201);
    expect(staffPostNotes.body.note.content).toBe('Internal note created by IT Staff.');
  });
});
