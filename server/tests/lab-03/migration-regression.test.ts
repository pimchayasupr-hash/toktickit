import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { PrismaClient, Role } from '@prisma/client';

describe('Lab 3 - Migration & Regression Test Suite (Handout §10)', () => {
  const prisma = new PrismaClient();

  it('Lab 2 data structures (Categories, Systems, Requesters) survive with correct types and relations', async () => {
    // 1. Verify Categories
    const categories = await prisma.category.findMany();
    expect(categories.length).toBeGreaterThanOrEqual(4);
    const names = categories.map((c) => c.name);
    expect(names).toContain('Hardware');
    expect(names).toContain('Software');

    // 2. Verify Related Systems
    const systems = await prisma.relatedSystem.findMany();
    expect(systems.length).toBeGreaterThanOrEqual(5);

    // 3. Verify Requesters migrated into User model with Role.REQUESTER
    const requesters = await prisma.user.findMany({
      where: { role: Role.REQUESTER },
    });
    expect(requesters.length).toBeGreaterThanOrEqual(5); // 4 active + 1 inactive
    const emails = requesters.map((r) => r.email);
    expect(emails).toContain('jennifer.anderson@example.com');
    expect(emails).toContain('alex.turner@example.com');
  });

  it('Lab 2 ticket ownership and attachments remain intact and accessible', async () => {
    // Check tickets have valid requesterId matching a user
    const tickets = await prisma.ticket.findMany({
      include: { requester: true, attachments: true },
      take: 5,
    });

    expect(tickets.length).toBeGreaterThan(0);
    for (const ticket of tickets) {
      expect(ticket.requester).toBeDefined();
      expect(ticket.requester.role).toBe(Role.REQUESTER);
      expect(ticket.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    }
  });

  it('Lab 2 end-to-end flow functions seamlessly with authenticated identity', async () => {
    // Login as Lab 2 requester Jennifer Anderson
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'jennifer.anderson@example.com',
      password: 'Password123!',
    });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token;

    // Fetch categories and systems
    const catRes = await request(app).get('/api/categories');
    expect(catRes.status).toBe(200);
    const sysRes = await request(app).get('/api/related-systems');
    expect(sysRes.status).toBe(200);

    // Create a ticket as authenticated requester
    const createRes = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: catRes.body[0].id,
        relatedSystemId: sysRes.body.relatedSystems[0].id,
        summary: 'Regression Test Ticket from Lab 2 Flow',
        description: 'Verifying authenticated requester ticket creation regression safety.',
        requestedPriority: 'MEDIUM',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.ticket.requester.email).toBe('jennifer.anderson@example.com');

    // View My Tickets list
    const myTicketsRes = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${token}`);

    expect(myTicketsRes.status).toBe(200);
    const created = myTicketsRes.body.tickets.find((t: any) => t.id === createRes.body.ticket.id);
    expect(created).toBeDefined();
  });
});
