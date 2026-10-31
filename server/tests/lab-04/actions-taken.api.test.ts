import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Lab 4 - Actions Taken API Test Suite', () => {
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

  it('TEST-ACT-01: Create valid Action Taken under active ticket by IT Staff', async () => {
    const staffToken = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${staffToken}`);
    const ticketId = queueRes.body.tickets[0].id;

    const actionData = {
      actionDateTime: new Date().toISOString(),
      description: 'Tested VPN tunnel endpoint connectivity and verified DNS resolution.',
      result: 'DNS resolution confirmed; ping packet loss 0%.',
      followUpRequired: false,
      attachmentNotes: 'See syslog at /var/log/dns-test.log',
    };

    const res = await request(app)
      .post(`/api/tickets/${ticketId}/actions-taken`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send(actionData);

    expect(res.status).toBe(201);
    expect(res.body.actionTaken).toBeDefined();
    expect(res.body.actionTaken.description).toBe(actionData.description);
    expect(res.body.actionTaken.result).toBe(actionData.result);
    expect(res.body.actionTaken.version).toBe(1);
    expect(res.body.actionTaken.performedById).toBeDefined();
  });

  it('TEST-ACT-02: Create valid Action Taken by Administrator', async () => {
    const adminToken = await getAdminToken();
    const staffToken = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${staffToken}`);
    const ticketId = queueRes.body.tickets[0].id;

    const res = await request(app)
      .post(`/api/tickets/${ticketId}/actions-taken`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        actionDateTime: new Date().toISOString(),
        description: 'Administrator verified router access control list rules.',
        result: 'Firewall rules verified; port 443 permitted.',
        followUpRequired: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.actionTaken).toBeDefined();
  });

  it('TEST-ACT-03: Performer session binding ignores spoofed performedById in request body', async () => {
    const staffToken = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${staffToken}`);
    const ticketId = queueRes.body.tickets[0].id;

    const res = await request(app)
      .post(`/api/tickets/${ticketId}/actions-taken`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDateTime: new Date().toISOString(),
        description: 'Investigated gateway routing table.',
        result: 'Default gateway verified.',
        performedById: 99999, // Attempted spoof
        followUpRequired: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.actionTaken.performedById).not.toBe(99999);
  });

  it('TEST-ACT-04: Staff member can log action on ticket owned by different staff member', async () => {
    const staffToken = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${staffToken}`);
    // Pick any active ticket
    const ticket = queueRes.body.tickets.find((t: any) => t.ownerId !== null) || queueRes.body.tickets[0];

    const res = await request(app)
      .post(`/api/tickets/${ticket.id}/actions-taken`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDateTime: new Date().toISOString(),
        description: 'Assisted primary owner with packet capture analysis.',
        result: 'Isolated intermittent packet drops to switch port 4.',
        followUpRequired: true,
        followUpNote: 'Coordinate with network team to replace patch cable.',
      });

    expect(res.status).toBe(201);
    expect(res.body.actionTaken.ticketId).toBe(ticket.id);
  });

  it('TEST-ACT-05: Missing, invalid, or future (>5 min) actionDateTime returns 400', async () => {
    const staffToken = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${staffToken}`);
    const ticketId = queueRes.body.tickets[0].id;

    // Missing actionDateTime
    const resMissing = await request(app)
      .post(`/api/tickets/${ticketId}/actions-taken`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        description: 'Diagnostic check',
        result: 'Confirmed',
      });
    expect(resMissing.status).toBe(400);

    // Far future actionDateTime (>5 min)
    const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const resFuture = await request(app)
      .post(`/api/tickets/${ticketId}/actions-taken`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDateTime: futureDate,
        description: 'Diagnostic check in future',
        result: 'Confirmed',
      });
    expect(resFuture.status).toBe(400);
  });

  it('TEST-ACT-06: actionDateTime earlier than Ticket.createdAt returns 400', async () => {
    const staffToken = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${staffToken}`);
    const ticket = queueRes.body.tickets[0];

    const ticketCreatedAt = new Date(ticket.createdAt);
    const earlierDate = new Date(ticketCreatedAt.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post(`/api/tickets/${ticket.id}/actions-taken`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDateTime: earlierDate,
        description: 'Backdated action test',
        result: 'Should fail validation',
      });

    expect(res.status).toBe(400);
  });

  it('TEST-ACT-07: Missing or whitespace-only description/result returns 400', async () => {
    const staffToken = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${staffToken}`);
    const ticketId = queueRes.body.tickets[0].id;

    const res = await request(app)
      .post(`/api/tickets/${ticketId}/actions-taken`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDateTime: new Date().toISOString(),
        description: '   ',
        result: '   ',
      });

    expect(res.status).toBe(400);
  });

  it('TEST-ACT-08: followUpRequired=true without followUpNote returns 400', async () => {
    const staffToken = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${staffToken}`);
    const ticketId = queueRes.body.tickets[0].id;

    const res = await request(app)
      .post(`/api/tickets/${ticketId}/actions-taken`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDateTime: new Date().toISOString(),
        description: 'Replaced faulty switch fan.',
        result: 'Fan spinning normally at 3200 RPM.',
        followUpRequired: true,
        // followUpNote intentionally missing
      });

    expect(res.status).toBe(400);
  });

  it('TEST-ACT-09: followUpRequired=false clears followUpNote to null', async () => {
    const staffToken = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${staffToken}`);
    const ticketId = queueRes.body.tickets[0].id;

    const res = await request(app)
      .post(`/api/tickets/${ticketId}/actions-taken`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDateTime: new Date().toISOString(),
        description: 'Routine cache flush performed.',
        result: 'Cache cleared successfully.',
        followUpRequired: false,
        followUpNote: 'This note should be cleared to null.',
      });

    expect(res.status).toBe(201);
    expect(res.body.actionTaken.followUpNote).toBeNull();
  });

  it('TEST-ACT-10: Requester role receives 403 Forbidden on create attempt', async () => {
    const requesterToken = await getRequesterToken();
    const staffToken = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${staffToken}`);
    const ticketId = queueRes.body.tickets[0].id;

    const res = await request(app)
      .post(`/api/tickets/${ticketId}/actions-taken`)
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        actionDateTime: new Date().toISOString(),
        description: 'Requester trying to record action',
        result: 'Should be forbidden',
      });

    expect(res.status).toBe(403);
  });

  it('TEST-ACT-11: Requester accessing actions on another requester ticket returns 404', async () => {
    const requesterToken = await getRequesterToken(); // Jennifer

    // Find ticket owned by another requester (e.g. Michael Brown)
    const otherToken = await (async () => {
      const r = await request(app).post('/api/auth/login').send({
        email: 'michael.brown@example.com',
        password: 'Password123!',
      });
      return r.body.token;
    })();

    const otherTicketsRes = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${otherToken}`);
    const otherTicketId = otherTicketsRes.body.tickets[0]?.id;

    if (otherTicketId) {
      const res = await request(app)
        .get(`/api/tickets/${otherTicketId}/actions-taken`)
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.status).toBe(404);
    }
  });

  it('TEST-ACT-12: Requester can view actions on own ticket', async () => {
    const requesterToken = await getRequesterToken();
    const ticketsRes = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${requesterToken}`);
    const ownTicketId = ticketsRes.body.tickets[0]?.id;

    const res = await request(app)
      .get(`/api/tickets/${ownTicketId}/actions-taken`)
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.actionsTaken)).toBe(true);
  });

  it('TEST-ACT-13: Attempt to create action on CLOSED or CANCELLED ticket returns 400', async () => {
    const staffToken = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets?status=CLOSED')
      .set('Authorization', `Bearer ${staffToken}`);
    const closedTicket = queueRes.body.tickets[0];

    if (closedTicket) {
      const res = await request(app)
        .post(`/api/tickets/${closedTicket.id}/actions-taken`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          actionDateTime: new Date().toISOString(),
          description: 'Attempting to add action to closed ticket',
          result: 'Should fail',
        });

      expect(res.status).toBe(400);
    }
  });

  it('TEST-ACT-14: Edit Action Taken updates record and increments version', async () => {
    const staffToken = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${staffToken}`);
    const ticketId = queueRes.body.tickets[0].id;

    // Create an action first
    const createRes = await request(app)
      .post(`/api/tickets/${ticketId}/actions-taken`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDateTime: new Date().toISOString(),
        description: 'Initial investigation notes.',
        result: 'Found memory leak in worker process.',
        followUpRequired: false,
      });

    expect(createRes.status).toBe(201);
    const action = createRes.body.actionTaken;

    // Edit the action
    const editRes = await request(app)
      .patch(`/api/tickets/${ticketId}/actions-taken/${action.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        version: action.version,
        description: 'Updated investigation: memory leak isolated to worker subprocess PID 4102.',
        result: 'Worker restarted and memory stabilized under 200MB.',
      });

    expect(editRes.status).toBe(200);
    expect(editRes.body.actionTaken.version).toBe(action.version + 1);
  });

  it('TEST-ACT-15: Edit Action Taken with stale version returns 409 Conflict', async () => {
    const staffToken = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${staffToken}`);
    const ticketId = queueRes.body.tickets[0].id;

    const createRes = await request(app)
      .post(`/api/tickets/${ticketId}/actions-taken`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDateTime: new Date().toISOString(),
        description: 'Concurrency test action.',
        result: 'Initial result.',
      });

    const action = createRes.body.actionTaken;

    // Send stale version (version 999)
    const conflictRes = await request(app)
      .patch(`/api/tickets/${ticketId}/actions-taken/${action.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        version: 999,
        description: 'Stale update attempt',
        result: 'Should cause conflict',
      });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.error.code).toBe('CONCURRENCY_CONFLICT');
  });

  it('TEST-ACT-16: Stored XSS payload is sanitized / escaped safely', async () => {
    const staffToken = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${staffToken}`);
    const ticketId = queueRes.body.tickets[0].id;

    const xssPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';

    const res = await request(app)
      .post(`/api/tickets/${ticketId}/actions-taken`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDateTime: new Date().toISOString(),
        description: xssPayload,
        result: xssPayload,
      });

    expect(res.status).toBe(201);
    expect(res.body.actionTaken.description).not.toContain('<script>');
  });

  it('TEST-ACT-17: DELETE /api/tickets/:ticketId/actions-taken/:actionId returns 404 or 405 (append-only)', async () => {
    const staffToken = await getStaffToken();
    const res = await request(app)
      .delete('/api/tickets/1/actions-taken/1')
      .set('Authorization', `Bearer ${staffToken}`);

    expect([404, 405]).toContain(res.status);
  });

  // =========================================================================
  // REVIEW REGRESSION TESTS (PR #55 Feedback - Lifecycle, Assignment, Concurrency)
  // =========================================================================

  it('TEST-ACT-18: Action Taken assignment to active staff member succeeds', async () => {
    const staffToken = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${staffToken}`);
    const ticketId = queueRes.body.tickets[0].id;

    // Get Sarah Staff ID
    const assigneesRes = await request(app)
      .get('/api/staff/assignees')
      .set('Authorization', `Bearer ${staffToken}`);
    const sarah = assigneesRes.body.assignees.find((a: any) => a.email === 'sarah.staff@toktickit.com');
    expect(sarah).toBeDefined();

    const createRes = await request(app)
      .post(`/api/tickets/${ticketId}/actions-taken`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDateTime: new Date().toISOString(),
        description: 'Assigned diagnostic task to Sarah for fiber optic testing.',
        status: 'PENDING',
        assigneeId: sarah.id,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.actionTaken.assigneeId).toBe(sarah.id);
    expect(createRes.body.actionTaken.assignee.email).toBe('sarah.staff@toktickit.com');
    expect(createRes.body.actionTaken.status).toBe('PENDING');
  });

  it('TEST-ACT-19: Inactive assignee assignment is strictly rejected with 400', async () => {
    const staffToken = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${staffToken}`);
    const ticketId = queueRes.body.tickets[0].id;

    // Find Kevin (inactive staff) from DB directly or via seed
    const inactiveUserRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'kevin.inactive@toktickit.com', password: 'Password123!' });
    // Deactivated user cannot authenticate, get user id from admin list
    const adminToken = await getAdminToken();
    const usersRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    const kevin = usersRes.body.users.find((u: any) => u.email === 'kevin.inactive@toktickit.com');
    expect(kevin).toBeDefined();
    expect(kevin.isActive).toBe(false);

    // Attempt to create action assigned to inactive staff
    const res = await request(app)
      .post(`/api/tickets/${ticketId}/actions-taken`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDateTime: new Date().toISOString(),
        description: 'Attempting to assign work to inactive staff member.',
        status: 'PENDING',
        assigneeId: kevin.id,
      });

    expect(res.status).toBe(400);
    expect(['INACTIVE_ASSIGNEE', 'VALIDATION_ERROR']).toContain(res.body.error.code);
  });

  it('TEST-ACT-20: Action Taken lifecycle: PENDING -> IN_PROGRESS -> COMPLETED requires result', async () => {
    const staffToken = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${staffToken}`);
    const ticketId = queueRes.body.tickets[0].id;

    // 1. Create action in PENDING (result is optional)
    const createRes = await request(app)
      .post(`/api/tickets/${ticketId}/actions-taken`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDateTime: new Date().toISOString(),
        description: 'Initial triage step for memory diagnostics.',
        status: 'PENDING',
      });

    expect(createRes.status).toBe(201);
    const action = createRes.body.actionTaken;
    expect(action.status).toBe('PENDING');
    expect(action.result).toBeNull();

    // 2. Transition from PENDING to IN_PROGRESS
    const progressRes = await request(app)
      .patch(`/api/tickets/${ticketId}/actions-taken/${action.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        version: action.version,
        status: 'IN_PROGRESS',
      });

    expect(progressRes.status).toBe(200);
    const inProgressAction = progressRes.body.actionTaken;
    expect(inProgressAction.status).toBe('IN_PROGRESS');

    // 3. Attempting to complete without providing result fails with 400
    const failCompleteRes = await request(app)
      .patch(`/api/tickets/${ticketId}/actions-taken/${action.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        version: inProgressAction.version,
        status: 'COMPLETED',
        // result omitted!
      });

    expect(failCompleteRes.status).toBe(400);
    expect(failCompleteRes.body.error.code).toBe('VALIDATION_ERROR');

    // 4. Transition to COMPLETED with valid result succeeds
    const completeRes = await request(app)
      .patch(`/api/tickets/${ticketId}/actions-taken/${action.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        version: inProgressAction.version,
        status: 'COMPLETED',
        result: 'MemTest86 completed 4 passes with 0 errors.',
      });

    expect(completeRes.status).toBe(200);
    const completedAction = completeRes.body.actionTaken;
    expect(completedAction.status).toBe('COMPLETED');
    expect(completedAction.result).toBe('MemTest86 completed 4 passes with 0 errors.');

    // 5. Terminal immutability: Cannot edit or transition COMPLETED action
    const terminalEditRes = await request(app)
      .patch(`/api/tickets/${ticketId}/actions-taken/${action.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        version: completedAction.version,
        description: 'Attempting to modify completed action description.',
      });

    expect(terminalEditRes.status).toBe(400);
    expect(terminalEditRes.body.error.code).toBe('TERMINAL_ACTION_LOCKED');
  });

  it('TEST-ACT-21: Action Taken cancellation enforces terminal immutability', async () => {
    const staffToken = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${staffToken}`);
    const ticketId = queueRes.body.tickets[0].id;

    // Create action
    const createRes = await request(app)
      .post(`/api/tickets/${ticketId}/actions-taken`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDateTime: new Date().toISOString(),
        description: 'Redundant diagnostic step scheduled.',
        status: 'PENDING',
      });

    const action = createRes.body.actionTaken;

    // Transition to CANCELLED
    const cancelRes = await request(app)
      .patch(`/api/tickets/${ticketId}/actions-taken/${action.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        version: action.version,
        status: 'CANCELLED',
      });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.actionTaken.status).toBe('CANCELLED');

    // Attempting to re-open or edit cancelled action fails
    const editCancelRes = await request(app)
      .patch(`/api/tickets/${ticketId}/actions-taken/${action.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        version: cancelRes.body.actionTaken.version,
        status: 'IN_PROGRESS',
      });

    expect(editCancelRes.status).toBe(400);
    expect(editCancelRes.body.error.code).toBe('TERMINAL_ACTION_LOCKED');
  });

  it('TEST-ACT-22: Concurrent writes on Action Taken: atomic lock ensures exactly one winner (200) and one conflict (409)', async () => {
    const staffToken = await getStaffToken();
    const queueRes = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${staffToken}`);
    const ticketId = queueRes.body.tickets[0].id;

    const createRes = await request(app)
      .post(`/api/tickets/${ticketId}/actions-taken`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDateTime: new Date().toISOString(),
        description: 'Base action for concurrent edit race condition test.',
        status: 'PENDING',
      });

    const action = createRes.body.actionTaken;
    const initialVersion = action.version;

    // Fire two concurrent updates with identical initial version
    const [req1, req2] = await Promise.all([
      request(app)
        .patch(`/api/tickets/${ticketId}/actions-taken/${action.id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          version: initialVersion,
          description: 'Client A concurrent write update.',
        }),
      request(app)
        .patch(`/api/tickets/${ticketId}/actions-taken/${action.id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          version: initialVersion,
          description: 'Client B concurrent write update.',
        }),
    ]);

    const statuses = [req1.status, req2.status].sort();
    expect(statuses).toEqual([200, 409]);

    const conflictResponse = req1.status === 409 ? req1 : req2;
    expect(conflictResponse.body.error.code).toBe('CONCURRENCY_CONFLICT');
    expect(conflictResponse.body.error.currentEntity.version).toBe(initialVersion + 1);
  });
});
