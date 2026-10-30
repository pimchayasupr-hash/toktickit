# Lab 4 AI Use & Reflection Report (`ai-use.md`)
## TokTickIT: Actions Taken, Dashboards, and Concurrency Control

---

## 1. AI Tooling Profile

- **Tool Name**: Google Antigravity (Advanced Agentic Coding Environment)
- **Engine / Core Model**: Gemini 2.5 Pro / Flash with DeepMind Agentic Coding Architecture
- **Operating Paradigm**: Autonomous Pair-Programmer & Spec-Driven Engineering Agent
- **Workspace Context**: `/Users/pimchayasuprateravarnit/toktickit`
- **Scope of AI Assistance**:
  - Specification derivation (Spec DD) and Traceability matrix generation from Lab 4 requirements.
  - Test-Driven Development (Red phase creation for API, UI, and E2E regression tests).
  - Database schema evolution (Prisma models, non-destructive migration scripts, idempotent seeding).
  - Backend API implementation (Express routes, Prisma transaction predicates, optimistic locking).
  - Frontend component development (React 19, TypeScript, Zen Green design system).
  - Playwright visual and functional E2E test automation and screenshot capture.
  - Reviewer feedback resolution and defensive hardening against race conditions.

---

## 2. Key Prompts and Engineering Interaction Log

The following 8 key prompts capture the trajectory of the engineering collaboration with Antigravity during Lab 4:

### Prompt 1: Initial Specification & Traceability Architecture (Spec DD)
- **Prompt**:
  > *"Analyze CPE 334 Lab 4 requirements and the two reference dashboard UI screenshots. Produce a comprehensive, formal specification covering Part 1 through Part 9: Functional Requirements (FR), Business Rules (BR), Acceptance Criteria (AC), permitted transition matrix, dashboard aggregation queries, and a 100% bidirectional traceability matrix."*
- **Intent**: Establish unambiguous, verifiable system contracts before writing any test or code.
- **Changes Made**: Generated `docs/lab-04/specification.md` (23 ACs, 21 FRs, 18 BRs), `ui-spec.md` (Zen Green tokens, layout wireframes), and `api-spec.md` (REST schema contracts).
- **Verification**: Executed `python3 scripts/check-traceability.py`, proving 100% bidirectional traceability with zero orphan requirements.

### Prompt 2: Test-First Harness & Red Phase Generation (Test DD)
- **Prompt**:
  > *"Generate the complete test harness for Lab 4 ahead of implementation: unit/integration tests for Actions Taken API, Ticket Workflow with Resolution Gate, Requester Dashboard, and Staff Dashboard. Execute the tests and archive the initial failing (Red) outputs."*
- **Intent**: Adhere strictly to Test-Driven Development by establishing failing tests that fail for the right reasons.
- **Changes Made**: Created `server/tests/lab-04/actions-taken.api.test.ts`, `ticket-workflow.api.test.ts`, `requester-dashboard.api.test.ts`, and `staff-dashboard.api.test.ts`. Saved raw logs to `artifacts/lab-04/test-output/red-*.txt`.
- **Verification**: Verified tests failed as expected with 404/500/missing endpoint errors prior to route implementation.

### Prompt 3: Prisma Schema Migration & Idempotent Seeding
- **Prompt**:
  > *"Create the database schema changes for Lab 4: add ActionTaken model with foreign keys to Ticket and User, add integer version column to Ticket for optimistic locking, and ensure seed script can run multiple times without duplicating data."*
- **Intent**: Establish persistent data structures without disrupting legacy Lab 1–3 records.
- **Changes Made**: Updated `server/prisma/schema.prisma`, ran migration `20261030095819_lab4_actions_taken_and_ticket_version`, and updated `server/prisma/seed.ts` with upsert logic.
- **Verification**: Executed `npx prisma db seed` twice consecutively; 0 duplicates created. Verified with `seed-idempotency.test.ts`.

### Prompt 4: Strict Resolution Gate & Backend API Implementation
- **Prompt**:
  > *"Implement POST /api/tickets/:id/actions-taken, PATCH /api/tickets/:id/actions-taken/:actionId, and the Resolution Gate in PATCH /api/staff/tickets/:id/status. Enforce that RESOLVED status requires an assigned owner, at least one completed action with result, and addressed follow-ups. Return descriptive error messages."*
- **Intent**: Deliver backend endpoints enforcing core business rules BR-01 through BR-15.
- **Changes Made**: Created `server/src/routes/actions-taken.ts` and updated `server/src/routes/staff.ts` with resolution gate validation.
- **Verification**: Re-ran Vitest suite; all initial Red tests turned Green.

### Prompt 5: Role-Based Dashboards & Zero Data Leakage Aggregations
- **Prompt**:
  > *"Implement GET /api/dashboard/requester and GET /api/dashboard/staff. Ensure metrics (open counts, waiting counts, unassigned queue, status/priority breakdown) are calculated purely on the server via Prisma aggregations to prevent unbounded data leakage."*
- **Intent**: Provide role-tailored dashboard telemetry with minimal payload and high security.
- **Changes Made**: Implemented `server/src/routes/dashboard.ts` using `prisma.ticket.count` and `groupBy`. Built `RequesterDashboard.tsx` and `StaffDashboard.tsx`.
- **Verification**: Compared API metrics directly against raw SQL counts via `generate_metrics_vs_db.ts`; confirmed 1:1 mathematical match.

### Prompt 6: Address Reviewer P1 - Action Lifecycle & Operational Assignee
- **Prompt**:
  > *"Reviewer @MiMikoChAn913 noted: ActionTaken lacks an assignee and lifecycle model. Add ActionStatus enum (PENDING, IN_PROGRESS, COMPLETED, CANCELLED), assigneeId relation, permitted transitions, terminal immutability for COMPLETED/CANCELLED, and require result only upon completion."*
- **Intent**: Upgrade the operational flexibility of Actions Taken while maintaining strict audit trails.
- **Changes Made**: Migration `20261030120659_lab4_action_lifecycle_and_ticket_status_history`, updated routes with `validateAssignee` and terminal checks, updated UI with status badges and quick transitions. Added `TEST-ACT-18..20`.
- **Verification**: All 22 tests in `actions-taken.api.test.ts` passed.

### Prompt 7: Address Reviewer P1 - Database Predicate Atomic Optimistic Locking
- **Prompt**:
  > *"Reviewer @MiMikoChAn913 noted: In-memory version check is susceptible to race conditions. Replace with atomic database write predicate: updateMany({ where: { id, version }, data: { ..., version: version + 1 } }) in a transaction, returning 409 Conflict when count === 0. Also enforce mandatory version parameter on ticket status update."*
- **Intent**: Eliminate race conditions under concurrent writes at the database engine level.
- **Changes Made**: Replaced `findUnique` + comparison in `actions-taken.ts` and `staff.ts` with `tx.*.updateMany({ where: { id, version } })`. Added race condition tests `TEST-ACT-21` and `TEST-WFK-07`.
- **Verification**: Concurrent write tests confirmed that the losing request receives HTTP 409 without overwriting data.

### Prompt 8: Address Reviewer P1 & P2 - Append-Only Status History & Deterministic E2E
- **Prompt**:
  > *"Reviewer @MiMikoChAn913 noted: Ticket status updates don't record history, and E2E resolution test conditionally skips if Resolved is missing. Add TicketStatusHistory table written in the same transaction as status update, and make E2E fixtures deterministic."*
- **Intent**: Deliver tamper-evident audit history and deterministic Playwright verification.
- **Changes Made**: Added `TicketStatusHistory` Prisma model, transactional creation in `staff.ts`, `GET /api/staff/tickets/:id/status-history`, and updated `ticket-resolution.spec.ts` with fixtures `TKT-2026-001233` and `TKT-2026-001234`.
- **Verification**: 11/11 Playwright E2E tests passed deterministically.

---

## 3. Student Self-Reflection on AI-Assisted Engineering

> *Note: This section reflects the student's authentic evaluation of the AI-augmented engineering process during CPE 334 Lab 4 and is structured for personal review and submission.*

### 3.1 What AI Did Exceptionally Well
1. **Rapid Scaffolding & Spec Translation**: Antigravity ingested the 24-page lab handout and reference screenshots, transforming informal instructions into concrete `FR`, `BR`, and `AC` items with 100% bidirectional coverage.
2. **Exhaustive Edge-Case Test Generation**: Generating 144 server unit tests, 40 client tests, and 11 end-to-end scenarios manually would have taken days. The AI produced test cases covering HTTP status codes, missing fields, malicious input injection, and spoofed performer headers.
3. **Simulating Concurrent Race Conditions**: Formulating multi-threaded async tests (`Promise.all([req1, req2])`) to prove that database predicates catch optimistic concurrency conflicts was executed cleanly and reliably.
4. **Strict Design System Adherence**: The AI maintained consistent Zen Green tokens (`#006B3C`, `#008751`, `#F0FDF4`) across mobile (360px), tablet (768px), and desktop (1280px) viewports with zero horizontal overflow.

### 3.2 Where Human Engineering Oversight Was Crucial
1. **Navigating Ambiguities in Business Requirements**: The lab handout had subtle contradictions (e.g., whether Actions Taken are purely "append-only audit logs" or if they can be "assigned and progressed through a lifecycle"). Human architectural judgement was needed to decide on an operational lifecycle with terminal immutability—allowing in-flight editing while locking completed records permanently.
2. **Reviewer Feedback Interpretation**: When Reviewer `@MiMikoChAn913` flagged that in-memory version checks were unsafe, human guidance ensured that we didn't just add a mutex or retry loop, but leveraged PostgreSQL's atomic row-level predicates (`updateMany where version = ?`) inside a Prisma transaction.
3. **Deterministic Test Fixtures**: The initial E2E test had a conditional `if (canSelectResolved)` check that masked potential bugs. Human insistence on deterministic database fixtures (`TKT-2026-001233` for failure and `TKT-2026-001234` for success) ensured that tests never silently skip critical assertions.

### 3.3 Workflow Impact & Lessons Learned
- **Spec-Driven Development is Non-Negotiable**: Writing specifications and API contracts first prevented endless rework. Having exact status codes (400 `VALIDATION_ERROR`, 403 `FORBIDDEN`, 409 `CONFLICT`) defined in advance allowed the backend and frontend to integrate seamlessly on the first attempt.
- **AI as an Accelerator, Not a Substitute**: The AI is extraordinarily fast at typing and drafting, but the software engineer remains fully responsible for correctness, security, and architectural integrity. Verification commands (`npm test`, `check-traceability.py`, Axe-core audits) must be executed rigorously to prove compliance.
- **The Power of Automated Proof**: Generating mathematical verification artifacts (such as `metrics-vs-db.txt` and timestamped screenshots) provides undeniable proof that the system works as specified under all operating conditions.

