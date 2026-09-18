import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import path from 'path';
import fs from 'fs';

describe('Lab 2 API Integration Tests', () => {
  const requesterId = 1; // Jennifer Anderson
  const otherRequesterId = 2; // Michael Brown

  let createdTicketId: number;
  let createdTicketNumber: string;
  let uploadedAttachmentId: number;

  it('GET /api/requesters returns active requesters', async () => {
    const res = await request(app).get('/api/requesters');
    expect(res.status).toBe(200);
    expect(res.body.requesters).toBeDefined();
    expect(res.body.requesters.length).toBeGreaterThan(0);
    expect(res.body.requesters[0]).toHaveProperty('id');
    expect(res.body.requesters[0]).toHaveProperty('name');
  });

  it('GET /api/related-systems returns active systems', async () => {
    const res = await request(app).get('/api/related-systems');
    expect(res.status).toBe(200);
    expect(res.body.relatedSystems).toBeDefined();
    expect(res.body.relatedSystems.length).toBeGreaterThan(0);
  });

  it('Rejects requests without X-Development-Requester-Id header', async () => {
    const res = await request(app).get('/api/tickets');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUESTER_CONTEXT');
  });

  it('POST /api/tickets creates a ticket for valid requester', async () => {
    const clientSubmissionId = `sub-${Date.now()}`;
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Development-Requester-Id', String(requesterId))
      .send({
        clientSubmissionId,
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'Cannot connect to campus Wi-Fi network',
        requestedPriority: 'HIGH',
        description: 'Unable to connect to the Wi-Fi network from Building 3 floor 2 since morning.',
      });

    expect(res.status).toBe(201);
    expect(res.body.ticket).toBeDefined();
    expect(res.body.ticket.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(res.body.ticket.requesterId).toBe(requesterId);
    expect(res.body.ticket.summary).toBe('Cannot connect to campus Wi-Fi network');

    createdTicketId = res.body.ticket.id;
    createdTicketNumber = res.body.ticket.ticketNumber;
  });

  it('POST /api/tickets fails on invalid fields', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Development-Requester-Id', String(requesterId))
      .send({
        categoryId: 999,
        relatedSystemId: 999,
        summary: 'Short',
        requestedPriority: 'INVALID',
        description: 'Too short',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields).toBeDefined();
  });

  it('GET /api/tickets lists only requester owned tickets', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('X-Development-Requester-Id', String(requesterId));

    expect(res.status).toBe(200);
    expect(res.body.tickets).toBeDefined();
    expect(res.body.pagination).toBeDefined();
    expect(res.body.tickets.every((t: any) => t.requesterId === requesterId)).toBe(true);
  });

  it('GET /api/tickets/:id enforces ownership (returns 404 for another requester)', async () => {
    const res = await request(app)
      .get(`/api/tickets/${createdTicketId}`)
      .set('X-Development-Requester-Id', String(otherRequesterId));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('TICKET_NOT_FOUND');
  });

  it('GET /api/tickets/:id retrieves ticket detail for owner', async () => {
    const res = await request(app)
      .get(`/api/tickets/${createdTicketId}`)
      .set('X-Development-Requester-Id', String(requesterId));

    expect(res.status).toBe(200);
    expect(res.body.ticket.id).toBe(createdTicketId);
  });

  it('POST /api/tickets/:id/attachments uploads a permitted file', async () => {
    const dummyFile = path.join(__dirname, 'dummy.txt');
    fs.writeFileSync(dummyFile, 'Test attachment content');

    const res = await request(app)
      .post(`/api/tickets/${createdTicketId}/attachments`)
      .set('X-Development-Requester-Id', String(requesterId))
      .attach('file', dummyFile, { filename: 'test_doc.pdf', contentType: 'application/pdf' });

    if (fs.existsSync(dummyFile)) fs.unlinkSync(dummyFile);

    expect(res.status).toBe(201);
    expect(res.body.attachment).toBeDefined();
    expect(res.body.attachment.originalFilename).toBe('test_doc.pdf');

    uploadedAttachmentId = res.body.attachment.id;
  });

  it('GET /api/attachments/:id/download downloads an active attachment', async () => {
    const res = await request(app)
      .get(`/api/attachments/${uploadedAttachmentId}/download`)
      .set('X-Development-Requester-Id', String(requesterId));

    expect(res.status).toBe(200);
  });

  it('POST /api/attachments/:id/remove soft-removes an attachment with reason', async () => {
    const res = await request(app)
      .post(`/api/attachments/${uploadedAttachmentId}/remove`)
      .set('X-Development-Requester-Id', String(requesterId))
      .send({ removalReason: 'Uploaded wrong document version' });

    expect(res.status).toBe(200);
    expect(res.body.attachment.isRemoved).toBe(true);
    expect(res.body.attachment.removalReason).toBe('Uploaded wrong document version');
  });

  it('GET /api/attachments/:id/download blocks download of removed attachment', async () => {
    const res = await request(app)
      .get(`/api/attachments/${uploadedAttachmentId}/download`)
      .set('X-Development-Requester-Id', String(requesterId));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ATTACHMENT_REMOVED');
  });
});
