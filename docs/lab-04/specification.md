# Lab 4 Sprint Engineering Specification
## TokTickIT: Actions Taken, Dashboards, and Final Regression

---

## 1. Sprint Goal

Sprint 4 delivers formal operational work tracking and executive visibility for TokTickIT. It introduces the **Actions Taken** subsystem under each Ticket, allowing IT Staff and Administrators to record, update, and review concrete troubleshooting steps with timestamps, results, follow-up flags, and attachment notes. It establishes a strict **Status Transition Matrix with a backend Resolution Gate** requiring ticket ownership and verified action outcomes prior to resolution. It introduces dedicated, backend-computed **Dashboards** for Requesters, IT Staff, and Administrators with responsive metrics and direct filter drill-downs. Finally, it enforces **optimistic concurrency control** and hardens the application across accessibility (WCAG AA), responsive design (360px–1280px), zero-regression backward compatibility, and clean data migration.

---

## 2. Stakeholder Request Interpretation

The stakeholder requires advancing TokTickIT from a basic communication and ticketing platform into an operational IT service desk that tracks actual engineering work and provides clear management visibility:

1. **Structured Work Records ("Actions Taken")**: Communication threads (Public Comments, Internal Notes) are insufficient for auditing and resolution verification. Every ticket must support an append-only log of formal actions taken by IT Staff, tracking what was done, when it occurred, who performed it, what outcome was achieved, whether follow-up is needed, and any relevant log/file references.
2. **Accountability & Distributed Execution**: While a primary Ticket Owner coordinates the ticket lifecycle, different IT Staff members or Administrators may perform and record individual actions. The system must automatically attribute actions to the authenticated actor without allowing spoofing.
3. **Formal Resolution Governance ("Resolution Gate")**: Tickets must not be arbitrarily marked as Resolved. A ticket can only be transitioned to `RESOLVED` if an owner is assigned and at least one verifiable action taken with a non-empty result is recorded. Advisory signals from Requesters ("Problem Appears Resolved") must remain non-authoritative recommendations for IT Staff review.
4. **Role-Tailored Dashboards**: Users need concise, immediate summaries rather than scanning raw ticket tables:
   - **Requesters** need an immediate snapshot of their active tickets, items requiring their feedback (`Waiting for Requester`), and recent resolutions.
   - **IT Staff** need operational metrics: unassigned tickets needing triage, tickets assigned to themselves, distribution by priority and status, urgent items, and a log of their own recently recorded actions.
   - **Administrators** need oversight over IT Staff queues plus user account distributions.
5. **Data Integrity & Concurrency**: Multiple staff members frequently triage and resolve tickets simultaneously. The system must detect stale updates using versioning and return clear 409 Conflict notices rather than silently overwriting changes.
6. **Design Continuity & Hardening**: All new screens and controls must strictly extend the established **Zen Green** design tokens (`#006B3C`, `#008751`, `#e8f5e9`) with zero page-level horizontal overflow, accessible touch targets (≥44px), semantic structure, and zero console warnings.

---

## 3. Scope

### 3.1 Included Work
- **ActionTaken Data Model & Backend APIs**: Full parent-child relationship under Ticket, tracking `actionDateTime`, `description`, `result`, `performedById` (auto-derived from session), `followUpRequired`, `followUpNote`, `attachmentNotes`, and concurrency `version`.
- **ActionTaken UI**: Chronological display on Ticket Detail, create modal/form with inline validation, edit mode with dirty-state and conflict protection, read-only view for Requesters on their own tickets.
- **Strict Status Transition Matrix**: Single source of truth backend transition engine enforcing permitted transitions across all 8 statuses (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`).
- **Resolution Gate**: Backend enforcement requiring an assigned owner, at least one action taken with non-empty result, and resolution of required follow-up items before allowing transition to `RESOLVED`.
- **Optimistic Concurrency Control**: Integer `version` column on `Ticket` and `ActionTaken` tables; API rejects stale updates with HTTP 409 Conflict returning current entity state.
- **Idempotency Protection**: Support for client request identifiers / `Idempotency-Key` headers on write endpoints, coupled with client-side double-submit disabling.
- **Role-Tailored Dashboards**:
  - `GET /api/dashboard/requester`: Backend-computed metrics for requester's own tickets (Open, Waiting for Requester, Recently Updated, Recently Resolved, Closed).
  - `GET /api/dashboard/staff`: Backend-computed metrics for IT Staff (Unassigned, My Assigned, Status breakdown, Priority breakdown, Urgent items, My Recent Actions Taken).
  - `GET /api/dashboard/staff` (Admin context): Includes IT Staff metrics plus administrative user account distributions.
- **Database Migration & Backfill**: Non-destructive Prisma migration preserving all existing Lab 1–3 data, adding `version` to `Ticket`, and establishing `ActionTaken` table with foreign keys and performance indexes.
- **Idempotent Seed Data**: Seed script populating realistic sample tickets across all 8 statuses, multiple actions taken per ticket, varied performers, zero-action legacy tickets, and clean repeatable execution.
- **UI/UX Hardening**: Full responsive layout (360px, 768px, 1280px), WCAG AA color contrast, keyboard navigation, focus management, empty/loading/error states.
- **Comprehensive Test Suite**: Unit, integration, authorization matrix, component, and Playwright E2E tests validating 100% of Acceptance Criteria without regressing Lab 1–3 test suites.

### 3.2 Explicitly Excluded Work
- Binary file uploads for Action Taken attachment notes (strictly plain text descriptions).
- Automated SLA clocking engines, countdown timers, and escalation cron jobs.
- External notification delivery (email, SMS, push notifications, webhooks).
- Hard deletion of Actions Taken or Tickets (system is append-only / audit-preserved).
- Multi-tenant organizational partitioning and multi-department approval hierarchies.
- Real-time WebSocket subscriptions (dashboards utilize REST with on-demand refresh).

---

## 4. Functional Requirements

### 4.1 Actions Taken Subsystem
- **FR-01**: The system MUST allow authenticated IT Staff and Administrators to record a new Action Taken under an active (non-terminal) Ticket.
- **FR-02**: The system MUST automatically populate `performedById` from the authenticated session user, strictly ignoring and rejecting any client-supplied performer identifier.
- **FR-03**: The system MUST allow an IT Staff or Administrator to record an Action Taken on a ticket even if that ticket is assigned to a different IT Staff member or unassigned.
- **FR-04**: The system MUST enforce mandatory validation for `actionDateTime`, `description`, and `result`.
- **FR-05**: If `followUpRequired` is set to `true`, the system MUST enforce that `followUpNote` is provided with non-empty text. If `followUpRequired` is `false`, `followUpNote` MUST be cleared to `null`.
- **FR-06**: The system MUST accept plain-text `attachmentNotes` describing relevant reference documents, screenshots, or logs without accepting binary file uploads.
- **FR-07**: Authenticated Requesters MUST be able to view all Actions Taken recorded on tickets they own, but MUST be prohibited from creating, updating, or deleting Actions Taken.
- **FR-08**: The system MUST allow IT Staff and Administrators to edit existing Actions Taken, preserving immutable audit creation metadata (`createdAt`, `createdById`), updating modification metadata (`updatedAt`, `updatedById`), and incrementing `version`.
- **FR-09**: The system MUST NOT provide any delete endpoint for Actions Taken, preserving an append-only audit trail.

### 4.2 Ticket Workflow & Resolution Gate
- **FR-10**: The backend MUST strictly enforce the approved Ticket Status Transition Matrix for all status update requests, returning HTTP 400/422 for disallowed transitions.
- **FR-11**: The backend MUST enforce the Resolution Gate: a transition to `RESOLVED` MUST be rejected with HTTP 422 `RESOLUTION_GATE_FAILED` unless the ticket has an assigned owner (`ownerId != null`) AND at least one associated `ActionTaken` with a non-empty `result`.
- **FR-12**: The ticket detail API and UI MUST provide dynamic `allowedTransitions` based on current ticket status and user role, ensuring client controls reflect backend reality.
- **FR-13**: When a Requester clicks "Problem Appears Resolved", the system MUST record an advisory Public Comment without mutating the ticket's formal status.

### 4.3 Concurrency & Idempotency
- **FR-14**: Every Ticket and Action Taken update request MUST supply the known entity `version`. If the supplied version does not match the database version, the server MUST return HTTP 409 Conflict with the current server entity.
- **FR-15**: Create endpoints MUST support an optional idempotency header (`Idempotency-Key` or `clientSubmissionId`), returning the existing entity upon duplicate submission.
- **FR-16**: Form submit buttons in the client MUST disable immediately upon submission to prevent accidental double-submits.

### 4.4 Dashboards
- **FR-17**: The backend MUST expose `GET /api/dashboard/requester` computing real-time counts and recent lists for the authenticated Requester (Open tickets, Waiting for Requester, Recently Updated, Recently Resolved, Closed).
- **FR-18**: The backend MUST expose `GET /api/dashboard/staff` computing real-time operational metrics for IT Staff (Unassigned queue, My Assigned tickets, tickets by status, tickets by IT priority, Urgent attention list, and My Recent Actions Taken).
- **FR-19**: The staff dashboard endpoint MUST provide additional user account summaries (total, active, by role) when accessed by an Administrator.
- **FR-20**: All dashboard metric cards and summary lists MUST provide clickable drill-down links navigating directly to filtered ticket queues with valid URL parameters.

### 4.5 UI Design, Accessibility & Hardening
- **FR-21**: All new views MUST utilize the Zen Green design system tokens, maintain high readability, and present responsive layouts across Mobile (360px–375px), Tablet (768px), and Desktop (1024px–1280px).
- **FR-22**: The UI MUST provide accessible feedback for all asynchronous operations: loading skeletons, empty states with clear calls to action, inline field validation, conflict banners with reload buttons, and safe generic error notifications.

---

## 5. Business Rules (BR-01 .. BR-26)

| BR ID | Rule Name | Mandatory Statement & Enforcement Details |
|---|---|---|
| **BR-01** | **Ticket Ownership of Actions** | An `ActionTaken` belongs strictly to exactly one `Ticket` via an immutable `ticketId` foreign key with `onDelete: Restrict`. Moving an action between tickets is prohibited. |
| **BR-02** | **Independent Action Performer** | The primary `Ticket.ownerId` coordinates ticket resolution, but an `ActionTaken` may be performed and logged by any active IT Staff or Administrator. An IT Staff member does not need to own the ticket to record work done. |
| **BR-03** | **Performer Session Binding** | The `performedById` and `createdById` fields are set strictly by the server from the authenticated user's session JWT. Any client-provided performer ID in request payloads is ignored and rejected. |
| **BR-04** | **Action Timestamp Rules** | `actionDateTime` is required, must be a valid ISO-8601 UTC timestamp, cannot be more than 5 minutes in the future (`now() + 5 minutes` clock skew tolerance), and cannot precede the parent ticket's `createdAt` timestamp. Stored in UTC; presented in client local time (Asia/Bangkok default). |
| **BR-05** | **Content Validation & Sanitization** | `description` (1–2000 chars) and `result` (1–1000 chars) are required non-empty strings after trimming. All input text is strictly sanitized and escaped to prevent stored cross-site scripting (XSS). |
| **BR-06** | **Conditional Follow-up Note** | If `followUpRequired` is `true`, `followUpNote` is mandatory (1–1000 chars non-empty after trimming). If `followUpRequired` is `false`, `followUpNote` is automatically set to `null` and any submitted note text is cleared. |
| **BR-07** | **Attachment Notes Text Only** | `attachmentNotes` is an optional plain-text field (max 1000 chars) describing physical or digital assets to inspect (e.g., "See router log in syslog server under 10.0.1.5"). It is strictly descriptive and does not accept or process binary file uploads. |
| **BR-08** | **Requester Read Isolation** | Requesters may view Actions Taken only on tickets where `ticket.requesterId === sessionUser.id`. Querying actions for another user's ticket returns HTTP 404 Not Found to prevent ticket enumeration and information leakage. |
| **BR-09** | **Role Authorization for Actions** | Creating or updating an `ActionTaken` is restricted to users with role `STAFF` or `ADMIN`. Requester attempts return HTTP 403 Forbidden regardless of UI presentation. |
| **BR-10** | **Append-Only & Audit Preservation** | Actions Taken cannot be deleted (`DELETE` endpoint is omitted). Edits preserve original `createdAt` and `createdById`, update `updatedAt` and `updatedById`, and increment `version`. Actions display in stable order: `actionDateTime ASC, createdAt ASC, id ASC`. |
| **BR-11** | **Terminal State Invariance** | New Actions Taken cannot be added to tickets in terminal statuses (`CLOSED`, `CANCELLED`). If a ticket is reopened (`REOPENED`), logging new actions is resumed. |
| **BR-12** | **Status Transition Matrix** | Ticket status changes must strictly adhere to the approved status transition matrix. Disallowed transitions are rejected with HTTP 400/422 `INVALID_STATUS_TRANSITION`. |
| **BR-13** | **Resolution Gate** | A ticket may transition to `RESOLVED` only if: (1) `ownerId !== null`, (2) the ticket has at least one associated `ActionTaken`, (3) at least one `ActionTaken` has a non-empty `result` (trimmed length ≥ 1), and (4) all actions with `followUpRequired = true` have documented notes. Advisory Requester signals ("Problem Appears Resolved") do NOT bypass the gate. |
| **BR-14** | **Optimistic Concurrency Control** | Every update to an `ActionTaken` or a `Ticket` status must supply the known entity `version`. If the submitted version does not match the current database version, the update is aborted with HTTP 409 Conflict returning current entity state. |
| **BR-15** | **Duplicate Submission Guard** | Create endpoints accept an optional idempotency identifier (`Idempotency-Key` header or `clientSubmissionId`). Submitting the same identifier returns the existing record without creating duplicate entries. Client UI disables submit buttons during in-flight requests. |
| **BR-16** | **Requester Metric: Open Tickets** | Total count of non-terminal tickets owned by the requester: `requesterId = user.id` AND `currentStatus IN ('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED')`. |
| **BR-17** | **Requester Metric: Waiting for Requester** | Count of tickets owned by the requester where `currentStatus = 'WAITING_FOR_REQUESTER'`. Highlights items requiring requester action. |
| **BR-18** | **Requester Metric: Recently Updated** | List of the 5 most recently updated tickets owned by the requester (`orderBy: { updatedAt: 'desc' }`). |
| **BR-19** | **Requester Metric: Resolved & Closed** | Count of tickets in `RESOLVED` (resolved within last 30 days) and total count in `CLOSED`. List of top 5 recently resolved tickets. |
| **BR-20** | **Staff Metric: Unassigned Queue** | Total count of non-terminal tickets where `ownerId IS NULL` and `currentStatus NOT IN ('CLOSED', 'CANCELLED')`. |
| **BR-21** | **Staff Metric: My Assigned Tickets** | Total count of non-terminal tickets where `ownerId = user.id` and `currentStatus NOT IN ('CLOSED', 'CANCELLED')`. |
| **BR-22** | **Staff Metric: Status & Priority Distributions** | Real-time counts of active tickets grouped by `currentStatus` and grouped by `itPriority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`). |
| **BR-23** | **Staff Metric: My Recent Actions Taken** | List of the 5 most recent `ActionTaken` records performed by the current staff user (`performedById = user.id`, ordered by `actionDateTime DESC, createdAt DESC`). |
| **BR-24** | **Staff Metric: Urgent Attention List** | Top 5 active tickets where `itPriority = 'URGENT'`, ordered by `createdAt ASC`. |
| **BR-25** | **Admin Metric: System Overview** | When accessed by an Administrator, the dashboard includes all IT Staff metrics plus user account distributions: total users, active vs deactivated, and breakdown by role (`REQUESTER`, `STAFF`, `ADMIN`). |
| **BR-26** | **Legacy Ticket Compatibility** | Existing tickets from Labs 1–3 having zero Actions Taken remain completely valid. Dashboard queries and ticket detail views handle empty action collections without errors. |

---

### 5.1 Status Transition Matrix (BR-12 & BR-13)

| From Status | Permitted Target Status | Permitted Roles | Pre-conditions / Gates | Side Effects / UI Prompts |
|---|---|---|---|---|
| `NEW` | `OPEN` | STAFF, ADMIN | None | Ticket triaged & acknowledged |
| `NEW` | `IN_PROGRESS` | STAFF, ADMIN | None | Active work initiated |
| `NEW` | `CANCELLED` | STAFF, ADMIN, REQUESTER (own) | Confirmation prompt | Terminal state; reason logged |
| `OPEN` | `IN_PROGRESS` | STAFF, ADMIN | None | Investigation begins |
| `OPEN` | `WAITING_FOR_REQUESTER` | STAFF, ADMIN | None | Requires public comment prompt |
| `OPEN` | `RESOLVED` | STAFF, ADMIN | **Resolution Gate (BR-13)**: Owner assigned + ≥1 Action with result | Confirmation dialog required |
| `OPEN` | `CANCELLED` | STAFF, ADMIN, REQUESTER (own) | Confirmation prompt | Terminal state |
| `IN_PROGRESS` | `WAITING_FOR_REQUESTER` | STAFF, ADMIN | None | Awaiting requester reply |
| `IN_PROGRESS` | `RESOLVED` | STAFF, ADMIN | **Resolution Gate (BR-13)**: Owner assigned + ≥1 Action with result | Confirmation dialog required |
| `IN_PROGRESS` | `CANCELLED` | STAFF, ADMIN | Confirmation prompt | Terminal state |
| `IN_PROGRESS` | `OPEN` | STAFF, ADMIN | None | Returned to queue |
| `WAITING_FOR_REQUESTER` | `IN_PROGRESS` | STAFF, ADMIN | Requester reply / Staff update | Active triage resumed |
| `WAITING_FOR_REQUESTER` | `RESOLVED` | STAFF, ADMIN | **Resolution Gate (BR-13)**: Owner assigned + ≥1 Action with result | Confirmation dialog required |
| `WAITING_FOR_REQUESTER` | `CANCELLED` | STAFF, ADMIN, REQUESTER (own) | Confirmation prompt | Terminal state |
| `RESOLVED` | `CLOSED` | STAFF, ADMIN | Confirmation dialog | Formal closure |
| `RESOLVED` | `REOPENED` | STAFF, ADMIN, REQUESTER (own) | Confirmation dialog | Reopened for rework |
| `CLOSED` | `REOPENED` | STAFF, ADMIN | Confirmation dialog | Reopened investigation |
| `REOPENED` | `IN_PROGRESS` | STAFF, ADMIN | None | Work resumed |
| `REOPENED` | `RESOLVED` | STAFF, ADMIN | **Resolution Gate (BR-13)**: Owner assigned + ≥1 Action with result | Confirmation dialog required |
| `REOPENED` | `CANCELLED` | STAFF, ADMIN | Confirmation prompt | Terminal state |
| `CANCELLED` | *(None - Terminal)* | None | Immutable terminal state | No transitions allowed |

---

## 6. UI Specification Summary

Complete layout mockups, token mappings, and screen modes are detailed in [ui-spec.md](file:///Users/pimchayasuprateravarnit/toktickit/docs/lab-04/ui-spec.md).

### 6.1 Screen Structure & Interaction Modes

1. **IT Staff / Admin Dashboard (`StaffDashboard.tsx`)**:
   - Metric summary cards: Unassigned Tickets, My Assigned Tickets, High/Urgent Tickets, Open Total.
   - Status & Priority distribution pills with direct filter links.
   - "My Recent Actions Taken" card displaying the logged-in staff member's latest contributions.
   - "Urgent Attention" list with one-click navigation to ticket detail.
   - Quick Actions bar ("Open Ticket Queue", "Create Ticket", "Refresh Metrics").

2. **Requester Dashboard (`RequesterDashboard.tsx`)**:
   - Metric cards: Open Tickets, Waiting for My Feedback, Recently Resolved, Closed Tickets.
   - "Attention Required" banner when tickets are waiting for requester response.
   - "Recent Tickets" list with status pills, relative timestamps, and direct links.
   - Quick Actions: "➕ Create Ticket", "📄 View All Tickets".

3. **Actions Taken on Ticket Detail (`ActionsTakenSection.tsx`)**:
   - **View Mode**: Chronological cards/table showing Action Date/Time, Performed By, Description, Result, Follow-up badge + note, Attachment notes.
   - **Create Mode (Staff/Admin only)**: Modal or inline form with datetime picker, description textarea, result textarea, follow-up toggle checkbox, conditional follow-up note input, and attachment notes input. Inline validation and disabled submit on save.
   - **Edit Mode (Staff/Admin only)**: Form pre-filled with existing data. Version conflict detection with "Reload latest" banner.
   - **Requester View**: Pure read-only view on own ticket detail. No action buttons rendered.

4. **Workflow Status Control**:
   - Dropdown or button group displaying **only permitted target transitions** based on backend `allowedTransitions`.
   - Transition to `RESOLVED` validates resolution gate client-side and server-side, displaying descriptive error if gate requirements are missing.

---

## 7. Data Changes & Migration Strategy

### 7.1 Prisma Schema Additions

```prisma
model Ticket {
  id                 Int              @id @default(autoincrement())
  ticketNumber       String           @unique
  clientSubmissionId String?          @unique
  requesterId        Int
  ownerId            Int?
  categoryId         Int?
  relatedSystemId    Int?
  summary            String
  description        String
  requestedPriority  String           @default("MEDIUM")
  itPriority         String?
  currentStatus      String           @default("NEW")
  version            Int              @default(1)
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  requester          User             @relation("RequesterTickets", fields: [requesterId], references: [id])
  owner              User?            @relation("StaffTickets", fields: [ownerId], references: [id])
  category           Category?        @relation(fields: [categoryId], references: [id])
  relatedSystem      RelatedSystem?   @relation(fields: [relatedSystemId], references: [id])
  attachments        Attachment[]
  publicComments     PublicComment[]
  internalNotes      InternalNote[]
  actionsTaken       ActionTaken[]

  @@index([currentStatus])
  @@index([requesterId, updatedAt])
  @@index([ownerId, currentStatus])
  @@index([createdAt])
}

model ActionTaken {
  id                 Int      @id @default(autoincrement())
  ticketId           Int
  actionDateTime     DateTime
  description        String
  result             String
  performedById      Int
  followUpRequired   Boolean  @default(false)
  followUpNote       String?
  attachmentNotes    String?
  version            Int      @default(1)
  createdAt          DateTime @default(now())
  createdById        Int
  updatedAt          DateTime @updatedAt
  updatedById        Int?

  ticket             Ticket   @relation(fields: [ticketId], references: [id], onDelete: Restrict)
  performedBy        User     @relation("ActionPerformedBy", fields: [performedById], references: [id])
  createdBy          User     @relation("ActionCreatedBy", fields: [createdById], references: [id])
  updatedBy          User?    @relation("ActionUpdatedBy", fields: [updatedById], references: [id])

  @@index([ticketId, actionDateTime])
  @@index([performedById, createdAt])
}
```

### 7.2 Non-Destructive Migration & Backfill Strategy
1. **Additive Schema Migration**: Adding `version Int @default(1)` to `Ticket` is fully backwards compatible; existing rows automatically receive `version = 1`.
2. **New Table**: Creating `ActionTaken` with foreign key relations does not modify existing table structures.
3. **Rollback Safety**:
   - Pre-migration database dump via `pg_dump` before applying migration.
   - Safe rollback script: `DROP TABLE IF EXISTS "ActionTaken"; ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "version";`.
4. **Idempotent Seed Strategy**:
   - Seed creates/updates users, categories, systems, and 18+ realistic tickets.
   - Populates tickets with 0 actions (testing legacy tickets), 1 action, and multiple actions.
   - Actions simulate multiple distinct performers (e.g., ticket owned by Michael Staff, action logged by Sarah Admin).
   - Script runs repeatedly without errors or duplicate rows.

---

## 8. API Contract Summary

Detailed request/response payloads, validation bounds, and error schemas are documented in [api-spec.md](file:///Users/pimchayasuprateravarnit/toktickit/docs/lab-04/api-spec.md).

| Endpoint Path | Method | Roles Permitted | Purpose | Status Codes |
|---|---|---|---|---|
| `/api/tickets/:ticketId/actions-taken` | `GET` | Requester (own), Staff, Admin | List actions for a ticket | 200, 401, 403, 404 |
| `/api/tickets/:ticketId/actions-taken` | `POST` | Staff, Admin | Create a new action taken | 201, 400, 401, 403, 404, 409 |
| `/api/tickets/:ticketId/actions-taken/:actionId` | `GET` | Requester (own), Staff, Admin | Get single action taken | 200, 401, 403, 404 |
| `/api/tickets/:ticketId/actions-taken/:actionId` | `PATCH` | Staff, Admin | Update action taken (concurrency version required) | 200, 400, 401, 403, 404, 409 |
| `/api/staff/tickets/:id/status` | `PATCH` | Staff, Admin, Requester (cancel/reopen own) | Update ticket status (resolution gate + concurrency) | 200, 400, 401, 403, 404, 409, 422 |
| `/api/dashboard/requester` | `GET` | Requester | Get requester personal dashboard metrics | 200, 401, 403 |
| `/api/dashboard/staff` | `GET` | Staff, Admin | Get operational IT staff dashboard metrics | 200, 401, 403 |
| `/api/health` | `GET` | Public | Database and service health check | 200, 503 |

---

## 9. Acceptance Criteria (AC-01 .. AC-28)

- **AC-01**: Given an authenticated IT Staff or Admin user, when submitting a valid `POST /api/tickets/:ticketId/actions-taken`, the action is recorded with HTTP 201, `performedById` bound to the session user, and `version = 1`.
- **AC-02**: Given a request body containing a spoofed `performedById`, when creating an Action Taken, the server ignores the body value and sets `performedById` strictly to the authenticated user ID.
- **AC-03**: Given a ticket owned by Staff Member A, when Staff Member B creates an Action Taken on that ticket, the action is created successfully with `performedById = Staff Member B`.
- **AC-04**: Given an action creation request where `actionDateTime` is missing, not valid ISO-8601, more than 5 minutes in the future, or earlier than `Ticket.createdAt`, the request is rejected with HTTP 400 `VALIDATION_ERROR`.
- **AC-05**: Given an action creation request where `description` or `result` is empty, whitespace-only, or exceeds max lengths (2000 and 1000 chars), the request is rejected with HTTP 400 `VALIDATION_ERROR`.
- **AC-06**: Given an action creation request with `followUpRequired = true` and an empty `followUpNote`, the request is rejected with HTTP 400 `VALIDATION_ERROR`.
- **AC-07**: Given an action creation request with `followUpRequired = false` and a non-empty `followUpNote`, the action is saved with `followUpNote = null`.
- **AC-08**: Given an authenticated Requester, when attempting to `POST` or `PATCH` `/api/tickets/:ticketId/actions-taken`, the server rejects the request with HTTP 403 `FORBIDDEN`.
- **AC-09**: Given an authenticated Requester, when requesting `GET /api/tickets/:ticketId/actions-taken` for a ticket owned by another user, the server returns HTTP 404 `NOT_FOUND`.
- **AC-10**: Given an authenticated Requester, when requesting `GET /api/tickets/:ticketId/actions-taken` for their own ticket, the server returns HTTP 200 with the full chronological list of actions.
- **AC-11**: Given a ticket in `CLOSED` or `CANCELLED` status, when attempting to create an Action Taken, the server rejects the request with HTTP 400 `TERMINAL_STATE_LOCKED`.
- **AC-12**: Given an IT Staff user, when editing an Action Taken with matching `version`, the record updates with HTTP 200, incrementing `version` by 1 and updating `updatedById`.
- **AC-13**: Given an IT Staff user, when editing an Action Taken with a stale `version`, the server rejects the update with HTTP 409 `CONCURRENCY_CONFLICT` returning current server data.
- **AC-14**: Given any user, when attempting a `DELETE` request on `/api/tickets/:ticketId/actions-taken/:actionId`, the server returns HTTP 404 or 405 (endpoint does not exist).
- **AC-15**: Given a ticket with an assigned owner and at least one Action Taken with a non-empty result, when an IT Staff user transitions status to `RESOLVED`, the transition succeeds with HTTP 200.
- **AC-16**: Given a ticket with no assigned owner (`ownerId = null`), when an IT Staff user attempts to transition status to `RESOLVED`, the server rejects with HTTP 422 `RESOLUTION_GATE_FAILED` (`OWNER_REQUIRED`).
- **AC-17**: Given a ticket with zero Actions Taken or only actions with empty results, when transitioning status to `RESOLVED`, the server rejects with HTTP 422 `RESOLUTION_GATE_FAILED` (`ACTION_TAKEN_REQUIRED`).
- **AC-18**: Given a ticket status update request with a stale `version`, the server rejects with HTTP 409 `CONCURRENCY_CONFLICT`.
- **AC-19**: Given an invalid status transition (e.g. `NEW` to `RESOLVED` directly), the server rejects with HTTP 400 `INVALID_STATUS_TRANSITION`.
- **AC-20**: Given a Requester user, when requesting `GET /api/dashboard/requester`, the server returns HTTP 200 with accurate counts of their own Open, Waiting, Resolved, and Closed tickets.
- **AC-21**: Given a new Requester with zero tickets, when requesting `GET /api/dashboard/requester`, the server returns HTTP 200 with all metric counts equal to 0 and empty lists (no errors).
- **AC-22**: Given an IT Staff user, when requesting `GET /api/dashboard/staff`, the server returns HTTP 200 with counts of Unassigned tickets, My Assigned tickets, Priority/Status breakdowns, and My Recent Actions Taken.
- **AC-23**: Given an Administrator user, when requesting `GET /api/dashboard/staff`, the response includes staff operational metrics plus administrative user account distributions.
- **AC-24**: Given a dashboard metric card in the UI, when clicked, the client navigates to the ticket queue pre-filtered with the matching query parameters.
- **AC-25**: Given an Action Taken creation in the UI, when the user toggles `Follow-up Required` on, the `Follow-up Note` field appears and displays required field cues.
- **AC-26**: Given mobile viewport (360px–375px), all dashboard and ticket detail screens render without horizontal scrolling (`scrollWidth <= clientWidth`).
- **AC-27**: Given an idempotent seed execution, running the seed script multiple times produces identical database counts with zero errors.
- **AC-28**: Given the complete regression suite from Labs 1–3, all 104 server tests, 32 client tests, and E2E specs pass without regression.

---

## 10. Definition of Done (DoD) Checklist

- [ ] All 3 specification documents in `docs/lab-04/` complete, consistent, and committed on `lab4/spec` branch.
- [ ] Non-destructive Prisma migration applied adding `ActionTaken` model and `version` to `Ticket`.
- [ ] Database seed script updated and verified idempotent (two consecutive runs yield identical record counts).
- [ ] Backend routes for Actions Taken (`GET`, `POST`, `PATCH`), Dashboards, and Status Workflow implemented with 100% server-side validation.
- [ ] Resolution Gate and Concurrency Versioning strictly enforced on all status updates and action edits.
- [ ] Frontend IT Staff and Requester Dashboards implemented with Zen Green tokens and responsive grids.
- [ ] Actions Taken UI implemented on Ticket Detail with create, edit, conflict detection, and Requester read-only isolation.
- [ ] Automated tests implemented covering all ACs and BRs (Unit, API, Component, E2E).
- [ ] Zero horizontal scroll at 360px, 768px, and 1280px viewports.
- [ ] Zero console errors or unhandled promise rejections during browser execution.
- [ ] Full regression verified: 100% of tests from Labs 1–3 pass without modification.

---

## 11. Assumptions and Decisions

### 11.1 Ambiguity Resolution: Handout §Answer Part 6 ("Assignee vs Performer")
- **Context**: The Lab 4 handout §Answer Part 6 mentions phrases such as "assign, complete, cancel, inactive-assignee rejection" in relation to actions.
- **Resolution**: In TokTickIT's domain architecture, Tickets possess an `ownerId` representing the assigned staff member coordinating the ticket. Actions Taken do NOT have a separate "assignee" to be assigned in advance; they represent work that has already been executed (`performedById`). The performer is automatically derived from the active authenticated session user (BR-03).
- **Inactive User Protection**: A deactivated user cannot authenticate (BR-01 from Lab 3); therefore, an inactive user can never record an Action Taken. Ticket ownership reassignment continues to reject inactive staff with HTTP 400 (Lab 3 BR-07). Historical actions recorded by a user who is later deactivated remain intact for audit preservation.

### 11.2 Append-Only Semantics & Auditability (BR-10)
- **Decision**: Actions Taken cannot be deleted (`DELETE` route omitted). However, operational realities require allowing edits to correct typographical errors or clarify technical notes.
- **Implementation**: Edits maintain immutable creation metadata (`createdAt`, `createdById`), record modification audit fields (`updatedAt`, `updatedById`), and increment an integer `version`. The UI displays an edited badge when `updatedAt > createdAt`.

### 11.3 Resolution Gate Definition (BR-13)
- **Decision**: Moving a ticket to `RESOLVED` requires:
  1. An assigned ticket owner (`ownerId !== null`).
  2. At least one `ActionTaken` record on the ticket.
  3. At least one `ActionTaken` record having a non-empty `result` string.
  4. Any `ActionTaken` having `followUpRequired = true` must have an associated non-empty `followUpNote`.
- **Advisory Requester Action**: The Requester "Problem Appears Resolved" button remains strictly advisory, appending a system Public Comment without mutating `Ticket.currentStatus`.

### 11.4 Concurrency Mechanism (BR-14)
- **Decision**: Use an integer `version` field (defaulting to 1, incremented on each update) rather than timestamp comparison.
- **Rationale**: Integer versions eliminate millisecond rounding discrepancies between PostgreSQL `timestamptz` and JavaScript `Date` objects, providing foolproof deterministic concurrency checks.

### 11.5 Timezone & Date Formatting (BR-04)
- **Decision**: Timestamps are stored in PostgreSQL as UTC ISO-8601 strings (`DateTime`).
- **Display**: Client components format all timestamps in the user's localized timezone, defaulting to `Asia/Bangkok` (GMT+7) per course specification, using 24-hour time formatting (`YYYY-MM-DD HH:mm`).

### 11.6 Requester Isolation HTTP Status Code (BR-08)
- **Decision**: When a Requester requests `/api/tickets/:ticketId/actions-taken` for a ticket owned by another user, the server returns HTTP 404 Not Found (rather than 403 Forbidden).
- **Rationale**: Returning 403 confirms that a ticket with that ID exists, enabling ticket ID enumeration. Returning 404 maintains consistent privacy semantics established in Lab 2 and Lab 3.
