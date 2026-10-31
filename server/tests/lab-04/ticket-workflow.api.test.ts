import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Lab 4 - Ticket Workflow & Resolution Gate API Test Suite', () => {
  const getStaffToken = async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'michael.staff@toktickit.com',
      password: 'Password123!',
    });
    return res.body.token;
  };

  const getRequesterToken = async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'jennifer.anderson@example.com',
      password: 'Password123!',
    });
    return res.body.token;
  };

  it('TEST-WFK-02: Transition to RESOLVED on unassigned ticket is blocked by Resolution Gate', async () => {
    const staffToken = await getStaffToken();
    const reqToken = await getRequesterToken();

    // Create a dedicated ticket with no owner
    const createRes = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${reqToken}`)
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'Resolution gate unassigned test ticket',
        description: 'Testing that unassigned ticket cannot be resolved.',
        requestedPriority: 'MEDIUM',
      });
    const ticket = createRes.body.ticket;

    // Transition from NEW to OPEN (permitted matrix transition)
    const openRes = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'OPEN', version: ticket.version || 1 });

    const openTicket = openRes.body.ticket;

    // Attempt to transition unassigned ticket from OPEN to RESOLVED
    const res = await request(app)
      .patch(`/api/staff/tickets/${openTicket.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        status: 'RESOLVED',
        version: openTicket.version,
      });

    // Must be blocked by resolution gate (OWNER_REQUIRED)
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('RESOLUTION_GATE_FAILED');
  });

  it('TEST-WFK-03: Transition to RESOLVED with zero actions is blocked by Resolution Gate', async () => {
    const staffToken = await getStaffToken();
    const reqToken = await getRequesterToken();

    // Create a dedicated ticket
    const createRes = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${reqToken}`)
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'Resolution gate zero actions test ticket',
        description: 'Testing that ticket with no actions taken cannot be resolved.',
        requestedPriority: 'MEDIUM',
      });
    const ticket = createRes.body.ticket;

    // Claim the ticket so ownerId is set
    const claimRes = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/claim`)
      .set('Authorization', `Bearer ${staffToken}`);

    // Move from NEW to IN_PROGRESS (permitted matrix transition)
    const progressRes = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'IN_PROGRESS', version: claimRes.body.ticket.version });

    const inProgressTicket = progressRes.body.ticket;

    // Attempt to transition from IN_PROGRESS to RESOLVED with zero actions taken
    const res = await request(app)
      .patch(`/api/staff/tickets/${inProgressTicket.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        status: 'RESOLVED',
        version: inProgressTicket.version,
      });

    // Must be blocked by resolution gate (ACTION_TAKEN_REQUIRED)
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('RESOLUTION_GATE_FAILED');
  });

  it('TEST-WFK-04: Status transition with stale ticket version returns 409 Conflict', async () => {
    const token = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${token}`);
    const ticket = queueRes.body.tickets.find((t: any) => t.currentStatus === 'NEW');

    if (ticket) {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'OPEN',
          version: 9999, // Stale version
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONCURRENCY_CONFLICT');
    }
  });

  it('TEST-WFK-05: Disallowed status transition (e.g. NEW directly to RESOLVED) returns 400/422', async () => {
    const token = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${token}`);
    const newTicket = queueRes.body.tickets.find((t: any) => t.currentStatus === 'NEW');

    if (newTicket) {
      const res = await request(app)
        .patch(`/api/staff/tickets/${newTicket.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'RESOLVED',
          version: newTicket.version || 1,
        });

      expect([400, 422]).toContain(res.status);
    }
  });

  it('TEST-WFK-01: Transition to RESOLVED succeeds when owner is assigned and action is documented', async () => {
    const token = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${token}`);
    const ticket = queueRes.body.tickets.find((t: any) => t.currentStatus === 'IN_PROGRESS' || t.currentStatus === 'OPEN');

    if (ticket) {
      // Ensure claimed
      await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/claim`)
        .set('Authorization', `Bearer ${token}`);

      // Add a valid action taken
      await request(app)
        .post(`/api/tickets/${ticket.id}/actions-taken`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          actionDateTime: new Date().toISOString(),
          description: 'Replaced failed disk drive in RAID array and rebuilt storage pool.',
          result: 'RAID array status returned to Optimal; all volumes online.',
          status: 'COMPLETED',
          followUpRequired: false,
        });

      // Refetch ticket to get latest version
      const detailRes = await request(app)
        .get(`/api/staff/tickets/${ticket.id}`)
        .set('Authorization', `Bearer ${token}`);
      const latestTicket = detailRes.body.ticket;

      const resolveRes = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'RESOLVED',
          version: latestTicket.version || 1,
        });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.ticket.currentStatus).toBe('RESOLVED');
    }
  });

  // =========================================================================
  // REVIEW REGRESSION TESTS (PR #55 Feedback - Atomic Concurrency & TicketStatusHistory)
  // =========================================================================

  it('TEST-WFK-06: Omitting version on status write returns 400 validation error', async () => {
    const staffToken = await getStaffToken();
    const reqToken = await getRequesterToken();

    // Create a new dedicated ticket
    const createRes = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${reqToken}`)
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'Missing version validation test ticket',
        description: 'Verifying that omitting version on status write fails.',
        requestedPriority: 'MEDIUM',
      });
    const ticket = createRes.body.ticket;

    // Send update with NO version field
    const res = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        status: 'OPEN',
        // version omitted!
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message.toLowerCase()).toContain('version');
  });

  it('TEST-WFK-07: Append-only TicketStatusHistory records actor-attributed transitions in same transaction', async () => {
    const staffToken = await getStaffToken();
    const reqToken = await getRequesterToken();

    // Create a new dedicated ticket
    const createRes = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${reqToken}`)
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'Status history audit test ticket',
        description: 'Verifying actor-attributed status history append.',
        requestedPriority: 'MEDIUM',
      });
    const ticket = createRes.body.ticket;

    // Check initial history (0 transitions)
    const initialHistRes = await request(app)
      .get(`/api/staff/tickets/${ticket.id}/status-history`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(initialHistRes.status).toBe(200);
    expect(initialHistRes.body.statusHistory).toHaveLength(0);

    // Transition 1: NEW -> OPEN
    const openRes = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'OPEN', version: ticket.version });

    expect(openRes.status).toBe(200);
    expect(openRes.body.historyEntry).toBeDefined();
    expect(openRes.body.historyEntry.fromStatus).toBe('NEW');
    expect(openRes.body.historyEntry.toStatus).toBe('OPEN');

    // Fetch history and verify exactly 1 entry with stable ordering
    const historyRes1 = await request(app)
      .get(`/api/staff/tickets/${ticket.id}/status-history`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(historyRes1.body.statusHistory).toHaveLength(1);
    expect(historyRes1.body.statusHistory[0].fromStatus).toBe('NEW');
    expect(historyRes1.body.statusHistory[0].toStatus).toBe('OPEN');
    expect(historyRes1.body.statusHistory[0].changedBy).toBeDefined();

    // Transition 2: OPEN -> IN_PROGRESS
    const progressRes = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'IN_PROGRESS', version: openRes.body.ticket.version });

    expect(progressRes.status).toBe(200);

    // Fetch history again and verify exactly 2 entries in stable chronological order
    const historyRes2 = await request(app)
      .get(`/api/staff/tickets/${ticket.id}/status-history`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(historyRes2.body.statusHistory).toHaveLength(2);
    expect(historyRes2.body.statusHistory[0].toStatus).toBe('OPEN');
    expect(historyRes2.body.statusHistory[1].toStatus).toBe('IN_PROGRESS');

    // Requester can view status history of owned ticket
    const reqHistRes = await request(app)
      .get(`/api/tickets/${ticket.id}/status-history`)
      .set('Authorization', `Bearer ${reqToken}`);
    expect(reqHistRes.status).toBe(200);
    expect(reqHistRes.body.statusHistory).toHaveLength(2);

    // Append-only immutability verification: DELETE and PATCH attempts on status-history are rejected (404) and preserve all rows
    const delHistRes = await request(app)
      .delete(`/api/staff/tickets/${ticket.id}/status-history`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(delHistRes.status).toBe(404);

    const verifyAfterDel = await request(app)
      .get(`/api/staff/tickets/${ticket.id}/status-history`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(verifyAfterDel.body.statusHistory).toHaveLength(2);
  });

  it('TEST-WFK-08: Concurrent status updates: atomic DB lock guarantees one 200, one 409, and zero duplicate history', async () => {
    const staffToken = await getStaffToken();
    const reqToken = await getRequesterToken();

    // Create a new ticket
    const createRes = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${reqToken}`)
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'Concurrent status race condition test ticket',
        description: 'Verifying atomic predicate on status write.',
        requestedPriority: 'MEDIUM',
      });
    const ticket = createRes.body.ticket;
    const version = ticket.version;

    // Both attempt transition from NEW: one to OPEN, one to IN_PROGRESS (both valid next from NEW)
    const [res1, res2] = await Promise.all([
      request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'OPEN', version }),
      request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'IN_PROGRESS', version }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 409]);

    const conflictRes = res1.status === 409 ? res1 : res2;
    expect(conflictRes.body.error.code).toBe('CONCURRENCY_CONFLICT');

    // Verify history contains EXACTLY 1 row (the loser appended nothing!)
    const historyRes = await request(app)
      .get(`/api/staff/tickets/${ticket.id}/status-history`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(historyRes.body.statusHistory).toHaveLength(1);
  });
});
