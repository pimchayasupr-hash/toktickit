import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Issue 5: Ticket Detail and Attachment Lifecycle API Tests', () => {
  const requesterId = 1;
  let createdTicketId: number;
  let createdAttachmentId: number;

  it('Setup: Create a test ticket for Issue 5 tests', async () => {
    const clientSubmissionId = `sub-issue5-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Development-Requester-Id', String(requesterId))
      .send({
        clientSubmissionId,
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'Issue 5 test ticket for attachments',
        requestedPriority: 'MEDIUM',
        description: 'Testing ticket detail and attachment upload/removal lifecycle.',
      });

    expect(res.status).toBe(201);
    createdTicketId = res.body.ticket.id;
  });

  it('GET /api/tickets/:id retrieves owned ticket detail', async () => {
    const res = await request(app)
      .get(`/api/tickets/${createdTicketId}`)
      .set('X-Development-Requester-Id', String(requesterId));

    expect(res.status).toBe(200);
    expect(res.body.ticket).toBeDefined();
    expect(res.body.ticket.id).toBe(createdTicketId);
  });

  it('GET /api/tickets/:id rejects access when owned by different requester (404/Safe Error)', async () => {
    const res = await request(app)
      .get(`/api/tickets/${createdTicketId}`)
      .set('X-Development-Requester-Id', '2'); // Michael Brown

    expect([404, 403]).toContain(res.status);
    expect(res.body.error).toBeDefined();
  });

  it('POST /api/tickets/:id/attachments uploads valid attachment (PDF)', async () => {
    const res = await request(app)
      .post(`/api/tickets/${createdTicketId}/attachments`)
      .set('X-Development-Requester-Id', String(requesterId))
      .attach('file', Buffer.from('%PDF-1.4 test content'), 'test-doc.pdf');

    expect(res.status).toBe(201);
    expect(res.body.attachment).toBeDefined();
    expect(res.body.attachment.originalFilename).toBe('test-doc.pdf');
    createdAttachmentId = res.body.attachment.id;
  });

  it('POST /api/attachments/:id/remove soft removes attachment with reason', async () => {
    const res = await request(app)
      .post(`/api/attachments/${createdAttachmentId}/remove`)
      .set('X-Development-Requester-Id', String(requesterId))
      .send({
        removalReason: 'File uploaded by mistake and contains old information.',
      });

    expect(res.status).toBe(200);
    expect(res.body.attachment.isRemoved).toBe(true);
    expect(res.body.attachment.removalReason).toBe('File uploaded by mistake and contains old information.');
  });
});
