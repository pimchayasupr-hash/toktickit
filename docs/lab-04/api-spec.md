# Lab 4 REST API Specification
## TokTickIT: Actions Taken, Dashboards, and Concurrency Control

---

## 1. Authentication, Authorization & Session Standards

### 1.1 Session Handling
- **Header**: `Authorization: Bearer <token>`
- **Token Format**: Signed JSON Web Token (JWT) using HMAC-SHA256 (`HS256`) containing `userId`, `email`, `role`, and `mustChangePassword`.
- **RBAC Roles**: `REQUESTER`, `STAFF`, `ADMIN`.
- **First-Login Enforcement**: Any user with `mustChangePassword: true` receives HTTP 403 `MUST_CHANGE_PASSWORD` when attempting to access operational endpoints.

### 1.2 Standard Error Envelope
All error responses across all endpoints adhere to the unified TokTickIT error format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | RESOLUTION_GATE_FAILED | TERMINAL_STATE_LOCKED | INTERNAL_ERROR",
    "message": "Human-readable description of error.",
    "fields": {
      "fieldName": "Specific correction prompt"
    },
    "currentEntity": {}
  }
}
```

---

## 2. API Endpoints Contract

### 2.1 Actions Taken Endpoints

#### `GET /api/tickets/:ticketId/actions-taken`
- **Description**: Retrieve all Actions Taken for a ticket in stable chronological order (`actionDateTime ASC, createdAt ASC, id ASC`).
- **Authorization**:
  - `REQUESTER`: Permitted ONLY if `ticket.requesterId === sessionUser.id`. (Accessing another requester's ticket returns HTTP 404).
  - `STAFF`, `ADMIN`: Permitted on all tickets.
- **Parameters**: `ticketId` (integer in path).
- **Response 200 OK**:
```json
{
  "actionsTaken": [
    {
      "id": 12,
      "ticketId": 105,
      "status": "COMPLETED",
      "actionDateTime": "2026-10-19T14:30:00.000Z",
      "description": "Inspected VPN gateway logs and re-keyed IPsec tunnel session.",
      "result": "Tunnel re-established successfully; ping latency stable at 18ms.",
      "performedById": 4,
      "performedBy": {
        "id": 4,
        "name": "Michael Staff",
        "email": "michael.staff@toktickit.com"
      },
      "assigneeId": 5,
      "assignee": {
        "id": 5,
        "name": "Sarah Staff",
        "email": "sarah.staff@toktickit.com"
      },
      "followUpRequired": true,
      "followUpNote": "Monitor connection logs every 4 hours for re-key timeouts.",
      "attachmentNotes": "Log capture stored under /var/log/ipsec-debug-20261019.log",
      "version": 1,
      "createdAt": "2026-10-19T14:35:12.000Z",
      "createdById": 4,
      "updatedAt": "2026-10-19T14:35:12.000Z",
      "updatedById": null
    }
  ]
}
```
- **Errors**:
  - `401 Unauthorized`: Missing or invalid Bearer token.
  - `404 Not Found`: Ticket does not exist or belongs to another Requester.

---

#### `POST /api/tickets/:ticketId/actions-taken`
- **Description**: Record a new Action Taken under an active ticket with operational status lifecycle.
- **Authorization**: `STAFF`, `ADMIN` only. (Requesters receive HTTP 403).
- **Headers**:
  - `Authorization: Bearer <token>`
  - `Idempotency-Key: <UUID>` (Optional, prevents duplicate submissions on network retries).
- **Request Body**:
```json
{
  "status": "PENDING",
  "assigneeId": 5,
  "actionDateTime": "2026-10-19T14:30:00.000Z",
  "description": "Inspected VPN gateway logs and re-keyed IPsec tunnel session.",
  "result": "Tunnel re-established successfully; ping latency stable at 18ms.",
  "followUpRequired": true,
  "followUpNote": "Monitor connection logs every 4 hours for re-key timeouts.",
  "attachmentNotes": "Log capture stored under /var/log/ipsec-debug-20261019.log"
}
```
- **Validation Rules**:
  - `status`: Optional enum (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`). Defaults to `PENDING`.
  - `assigneeId`: Optional integer. Must reference an active operational user with role `STAFF` or `ADMIN`. Inactive users or requesters rejected with HTTP 400 (`INACTIVE_ASSIGNEE`).
  - `actionDateTime`: Required valid ISO-8601 string. Cannot exceed `now() + 5 minutes`. Cannot precede `Ticket.createdAt`.
  - `description`: Required string, 1–2000 characters after trimming.
  - `result`: Optional for `PENDING` and `IN_PROGRESS`; strictly required (1–1000 characters) when `status` is `COMPLETED`.
  - `followUpRequired`: Boolean (defaults to `false`).
  - `followUpNote`: Required if `followUpRequired = true` (1–1000 characters after trimming). Cleared to `null` if `false`.
  - `attachmentNotes`: Optional plain text, max 1000 characters.
  - `performedById`: Disallowed in payload; server automatically sets to `req.user.id`.
- **Response 201 Created**:
```json
{
  "actionTaken": {
    "id": 12,
    "ticketId": 105,
    "status": "PENDING",
    "assigneeId": 5,
    "actionDateTime": "2026-10-19T14:30:00.000Z",
    "description": "Inspected VPN gateway logs and re-keyed IPsec tunnel session.",
    "result": null,
    "performedById": 4,
    "followUpRequired": true,
    "followUpNote": "Monitor connection logs every 4 hours for re-key timeouts.",
    "attachmentNotes": "Log capture stored under /var/log/ipsec-debug-20261019.log",
    "version": 1,
    "createdAt": "2026-10-19T14:35:12.000Z",
    "createdById": 4,
    "updatedAt": "2026-10-19T14:35:12.000Z",
    "updatedById": null
  }
}
```
```
- **Errors**:
  - `400 Bad Request`: `VALIDATION_ERROR` (Validation rule violation or `TERMINAL_STATE_LOCKED`).
  - `401 Unauthorized`: Not authenticated.
  - `403 Forbidden`: Role is `REQUESTER`.
  - `404 Not Found`: Ticket does not exist.

---

#### `GET /api/tickets/:ticketId/actions-taken/:actionId`
- **Description**: Retrieve a single Action Taken record by ID.
- **Authorization**: `REQUESTER` (own ticket only), `STAFF`, `ADMIN`.
- **Response 200 OK**:
```json
{
  "actionTaken": {
    "id": 12,
    "ticketId": 105,
    "actionDateTime": "2026-10-19T14:30:00.000Z",
    "description": "Inspected VPN gateway logs and re-keyed IPsec tunnel session.",
    "result": "Tunnel re-established successfully; ping latency stable at 18ms.",
    "performedById": 4,
    "followUpRequired": true,
    "followUpNote": "Monitor connection logs every 4 hours for re-key timeouts.",
    "attachmentNotes": "Log capture stored under /var/log/ipsec-debug-20261019.log",
    "version": 1,
    "createdAt": "2026-10-19T14:35:12.000Z",
    "createdById": 4,
    "updatedAt": "2026-10-19T14:35:12.000Z",
    "updatedById": null
  }
}
```

---

#### `PATCH /api/tickets/:ticketId/actions-taken/:actionId`
- **Description**: Update an existing Action Taken record with optimistic concurrency validation.
- **Authorization**: `STAFF`, `ADMIN` only.
- **Request Body**:
```json
{
  "version": 1,
  "actionDateTime": "2026-10-19T14:35:00.000Z",
  "description": "Inspected VPN gateway logs and updated IPsec tunnel timeout configuration.",
  "result": "Latency improved to 14ms.",
  "followUpRequired": false,
  "attachmentNotes": "Syslog captured."
}
```
- **Validation Rules**:
  - `version`: Mandatory integer matching the database record's current `version`.
  - Editable fields validated with identical rules to creation.
- **Response 200 OK**:
```json
{
  "actionTaken": {
    "id": 12,
    "ticketId": 105,
    "version": 2,
    "description": "Inspected VPN gateway logs and updated IPsec tunnel timeout configuration.",
    "result": "Latency improved to 14ms.",
    "followUpRequired": false,
    "followUpNote": null,
    "attachmentNotes": "Syslog captured.",
    "updatedAt": "2026-10-19T15:10:00.000Z",
    "updatedById": 4
  }
}
```
- **Errors**:
  - `400 Bad Request`: `VALIDATION_ERROR` (Invalid field values or invalid assignee), `TERMINAL_ACTION_LOCKED` (Action is COMPLETED or CANCELLED).
  - `403 Forbidden`: Requester role.
  - `404 Not Found`: Ticket or Action does not exist or action does not belong to ticket.
  - `409 Conflict`: `CONCURRENCY_CONFLICT` (Atomic database predicate `updateMany` where `id` and `version` returned 0 updated rows). Returns current entity.

---

### 2.2 Status Workflow & Resolution Gate Endpoints

#### `PATCH /api/staff/tickets/:id/status` (and `PATCH /api/tickets/:id/status`)
- **Description**: Execute a status transition with transition matrix validation, resolution gate, atomic database compare-and-increment concurrency check, and append-only status history.
- **Authorization**:
  - `STAFF`, `ADMIN`: Permitted all matrix transitions.
  - `REQUESTER`: Permitted to cancel (`CANCELLED`) or reopen (`REOPENED`) own tickets only.
- **Request Body**:
```json
{
  "status": "RESOLVED",
  "version": 3,
  "reason": "Issue resolved after router firmware upgrade and gateway tunnel re-key."
}
```
- **Validation & Gate Logic**:
  1. **Transition Matrix**: `VALID_TRANSITIONS[ticket.currentStatus].includes(body.status)`. Mismatch → HTTP 400 `INVALID_STATUS_TRANSITION`.
  2. **Mandatory Version Parameter**: `typeof version === 'number'`. Missing or non-numeric → HTTP 400 `VALIDATION_ERROR`.
  3. **Resolution Gate (Target = `RESOLVED`)**:
     - `ticket.ownerId !== null` (Owner required).
     - `ticket.actionsTaken.length >= 1` (At least one Action Taken).
     - At least one `ActionTaken` has `status === 'COMPLETED'` and non-empty `result.trim().length > 0`.
     - All actions with `followUpRequired = true` have valid non-empty `followUpNote`.
     - Gate failure → HTTP 422 `RESOLUTION_GATE_FAILED`.
  4. **Atomic Concurrency & History Transaction**:
     - Uses `tx.ticket.updateMany({ where: { id: ticketId, version }, data: { currentStatus: status, version: version + 1 } })`.
     - If count === 0 → Rollback transaction and return HTTP 409 Conflict (0 history rows written).
     - If count === 1 → Atomically execute `tx.ticketStatusHistory.create` with `fromStatus`, `toStatus`, `changedById: req.user.id` (exactly 1 history row written).
- **Response 200 OK**:
```json
{
  "ticket": {
    "id": 105,
    "ticketNumber": "TKT-2026-000105",
    "currentStatus": "RESOLVED",
    "version": 4,
    "updatedAt": "2026-10-19T15:20:00.000Z"
  }
}
```
- **Errors**:
  - `400 Bad Request`: `INVALID_STATUS_TRANSITION`, `VALIDATION_ERROR` (Missing version).
  - `409 Conflict`: `CONCURRENCY_CONFLICT` (Stale version; status unchanged, 0 history appended).
  - `422 Unprocessable Entity`: `RESOLUTION_GATE_FAILED`.

---

#### `GET /api/staff/tickets/:id/status-history`
- **Description**: Retrieve append-only history of all status changes for a ticket, ordered chronologically (`changedAt ASC, id ASC`).
- **Authorization**: `STAFF`, `ADMIN`.
- **Response 200 OK**:
```json
{
  "history": [
    {
      "id": 1,
      "ticketId": 105,
      "fromStatus": "NEW",
      "toStatus": "OPEN",
      "changedById": 4,
      "changedBy": {
        "id": 4,
        "name": "Michael Staff",
        "role": "STAFF"
      },
      "changedAt": "2026-10-19T09:00:00.000Z"
    }
  ]
}
```

---

#### `GET /api/tickets/:id/status-history`
- **Description**: Requester access to status history for tickets they own.
- **Authorization**: `REQUESTER` (isolated to own tickets; returns 404 for others).
  - `409 Conflict`: `CONCURRENCY_CONFLICT`.
  - `422 Unprocessable Entity`: `RESOLUTION_GATE_FAILED` with detailed missing criteria.

---

### 2.3 Dashboard Endpoints

#### `GET /api/dashboard/requester`
- **Description**: Retrieve personal operational metrics for the authenticated Requester.
- **Authorization**: `REQUESTER` (Staff and Admin also permitted).
- **Query Filter**: Bound strictly to `requesterId = req.user.id`.
- **Response 200 OK**:
```json
{
  "metrics": {
    "openTicketsCount": 4,
    "waitingForRequesterCount": 1,
    "recentlyResolvedCount": 2,
    "closedTicketsCount": 7
  },
  "attentionTickets": [
    {
      "id": 102,
      "ticketNumber": "TKT-2026-000102",
      "summary": "Cannot access staging database from home IP",
      "currentStatus": "WAITING_FOR_REQUESTER",
      "updatedAt": "2026-10-19T11:00:00.000Z"
    }
  ],
  "recentTickets": [
    {
      "id": 105,
      "ticketNumber": "TKT-2026-000105",
      "summary": "VPN connection drops every 15 minutes",
      "currentStatus": "IN_PROGRESS",
      "requestedPriority": "HIGH",
      "updatedAt": "2026-10-19T14:35:00.000Z"
    }
  ]
}
```

---

#### `GET /api/dashboard/staff`
- **Description**: Retrieve operational service desk metrics for IT Staff and Administrators.
- **Authorization**: `STAFF`, `ADMIN` only. (Requesters receive HTTP 403).
- **Response 200 OK (IT Staff)**:
```json
{
  "metrics": {
    "unassignedCount": 3,
    "myAssignedCount": 5,
    "openTotalCount": 14,
    "urgentCount": 2,
    "byStatus": {
      "NEW": 3,
      "OPEN": 2,
      "IN_PROGRESS": 5,
      "WAITING_FOR_REQUESTER": 2,
      "RESOLVED": 2,
      "CLOSED": 8,
      "REOPENED": 0,
      "CANCELLED": 1
    },
    "byPriority": {
      "LOW": 2,
      "MEDIUM": 6,
      "HIGH": 4,
      "URGENT": 2
    }
  },
  "myRecentActions": [
    {
      "id": 12,
      "ticketId": 105,
      "ticketNumber": "TKT-2026-000105",
      "actionDateTime": "2026-10-19T14:30:00.000Z",
      "description": "Inspected VPN gateway logs and re-keyed IPsec tunnel session.",
      "result": "Tunnel re-established successfully.",
      "followUpRequired": true
    }
  ],
  "urgentTickets": [
    {
      "id": 98,
      "ticketNumber": "TKT-2026-000098",
      "summary": "Production ERP gateway database connection timeout",
      "currentStatus": "IN_PROGRESS",
      "itPriority": "URGENT",
      "ownerName": "Michael Staff",
      "createdAt": "2026-10-19T08:15:00.000Z"
    }
  ],
  "adminMetrics": null
}
```
- **Response 200 OK (Administrator additions)**:
When called by an `ADMIN` user, `adminMetrics` is populated:
```json
{
  "adminMetrics": {
    "totalUsers": 24,
    "activeUsers": 23,
    "deactivatedUsers": 1,
    "byRole": {
      "REQUESTER": 16,
      "STAFF": 6,
      "ADMIN": 2
    }
  }
}
```

---

### 2.4 Health Endpoint

#### `GET /api/health`
- **Description**: Verify database connection and service responsiveness.
- **Authorization**: Public.
- **Response 200 OK**:
```json
{
  "status": "ok",
  "service": "TokTickIT API",
  "database": "connected",
  "timestamp": "2026-10-19T20:30:00.000Z"
}
```

---

## 3. Traceability Matrix (AC → FR/BR → Planned Test IDs)

| AC ID | Requirements Covered | Business Rules | Planned Test IDs | Test Type |
|---|---|---|---|---|
| **AC-01** | FR-01, FR-02 | BR-01, BR-02, BR-03 | `TEST-ACT-01`, `TEST-ACT-02` | API Integration |
| **AC-02** | FR-02 | BR-03 | `TEST-ACT-03` | API Security |
| **AC-03** | FR-03 | BR-02 | `TEST-ACT-04` | API Integration |
| **AC-04** | FR-04 | BR-04 | `TEST-ACT-05`, `TEST-ACT-06` | API Validation |
| **AC-05** | FR-04 | BR-05 | `TEST-ACT-07` | API Validation |
| **AC-06** | FR-05 | BR-06 | `TEST-ACT-08` | API Validation |
| **AC-07** | FR-05 | BR-06 | `TEST-ACT-09` | API Validation |
| **AC-08** | FR-07 | BR-09 | `TEST-ACT-10` | API Authorization |
| **AC-09** | FR-07 | BR-08 | `TEST-ACT-11` | API Security / IDOR |
| **AC-10** | FR-07 | BR-08 | `TEST-ACT-12` | API Integration |
| **AC-11** | FR-01 | BR-11 | `TEST-ACT-13` | API Workflow |
| **AC-12** | FR-08 | BR-10, BR-14 | `TEST-ACT-14` | API Integration |
| **AC-13** | FR-08, FR-14 | BR-10, BR-14 | `TEST-ACT-15`, `TEST-ACT-16` | API Concurrency |
| **AC-14** | FR-09 | BR-10 | `TEST-ACT-17` | API Security |
| **AC-15** | FR-10, FR-11 | BR-12, BR-13 | `TEST-WFK-01` | API Workflow |
| **AC-16** | FR-10, FR-11 | BR-12, BR-13 | `TEST-WFK-02` | API Resolution Gate |
| **AC-17** | FR-10, FR-11 | BR-12, BR-13 | `TEST-WFK-03` | API Resolution Gate |
| **AC-18** | FR-14 | BR-14 | `TEST-WFK-04` | API Concurrency |
| **AC-19** | FR-10 | BR-12 | `TEST-WFK-05` | API Workflow |
| **AC-20** | FR-17 | BR-16, BR-17, BR-18, BR-19 | `TEST-DSH-REQ-01` | API Integration |
| **AC-21** | FR-17 | BR-16, BR-26 | `TEST-DSH-REQ-02` | API Integration |
| **AC-22** | FR-18 | BR-20, BR-21, BR-22, BR-23, BR-24 | `TEST-DSH-STF-01` | API Integration |
| **AC-23** | FR-19 | BR-25 | `TEST-DSH-ADM-01` | API Integration |
| **AC-24** | FR-20 | BR-16, BR-20 | `TEST-UI-DSH-01` | UI Component |
| **AC-25** | FR-05, FR-22 | BR-06 | `TEST-UI-ACT-01` | UI Component |
| **AC-26** | FR-21 | BR-16..BR-25 | `TEST-UI-RESP-01` | Responsive / Style |
| **AC-27** | FR-15 | BR-15, BR-26 | `TEST-MIG-SEED-01` | Database / Regression |
| **AC-28** | FR-21 | BR-26 | `TEST-REGR-ALL` | Full Regression |
