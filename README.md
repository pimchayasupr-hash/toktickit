# TokTickIT (ตอกติ๊กกิต) — IT Service Desk

TokTickIT is a modern, enterprise-grade IT Service Desk application for Account and Access, Hardware, Software, and Network service requests. This repository contains the complete full-stack increment up to **Lab 4: Actions Taken Subsystem, Role-Tailored Dashboards, Backend Resolution Gate, and Concurrency Control**.

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS & Zen Green CSS (`client/`)
- **Backend:** Node.js + Express + TypeScript (`server/`)
- **Database:** PostgreSQL accessed via Prisma ORM (`server/prisma/`)
- **Auth & Concurrency:** JWT with RBAC + atomic database predicate optimistic locking (`version`)
- **Testing:** Vitest (Server API + Client RTL components) + Playwright (E2E browser tests) — **196 unique tests passing (144 Server, 40 Client, 12 Playwright E2E specs executed across Chromium, Firefox, WebKit = 220 total test runs, 100% PASS)**

---

## Key Features & Lab 4 Increments

1. **Actions Taken Subsystem & Operational Lifecycle (Part 6)**:
   - Record formal operational work entries under tickets with `ActionStatus` (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
   - Automatically derive `performedById` and `createdById` from the authenticated session, preventing identity spoofing.
   - Delegate actions to active IT Staff/Admin assignees (`assigneeId`), strictly rejecting inactive users and requesters with HTTP 400 (`INACTIVE_ASSIGNEE`).
   - Require `result` only upon completing an action; enforce permanent terminal immutability on completed and cancelled actions (`TERMINAL_ACTION_LOCKED`).
2. **Strict Backend Resolution Gate (Part 7, BR-13)**:
   - Transitioning tickets to `RESOLVED` requires:
     1. An assigned ticket owner (`ownerId !== null`).
     2. At least one recorded `ActionTaken`.
     3. At least one `ActionTaken` in `COMPLETED` status with a non-empty `result`.
     4. Documented `followUpNote` for all actions requiring follow-up.
   - The Requester "Problem Appears Resolved" indication remains strictly advisory, appending a Public Comment without bypassing the gate.
3. **Atomic Optimistic Concurrency Control (BR-14, BR-24)**:
   - Prevents lost updates using atomic database write predicates (`updateMany({ where: { id, version }, data: { ..., version: version + 1 } })`) inside transactions.
   - Stale or colliding writes receive HTTP 409 Conflict with the current database record.
4. **Append-Only Ticket Status History (BR-25, BR-26)**:
   - Automatically records `TicketStatusHistory` rows in the same transaction as status transitions.
   - Guarantees 0 appended history rows on stale/failed writes, and exactly 1 actor-attributed row on success.
5. **Role-Tailored Operational Dashboards (Part 8)**:
   - **Requester Dashboard**: Summary cards (Open, Waiting for Feedback, Resolved, Closed), Attention Banner, and recent tickets list.
   - **IT Staff Dashboard**: Team queue counts (Unassigned, My Assigned, Open Total, Urgent Priority), status/priority breakdowns, and recent personal actions taken.
   - **Administrator Overview**: User distribution statistics by role and active status.
6. **Zen Green Design Language & Accessibility (Part 9)**:
   - Unified `#006B3C` / `#008751` / `#e8f5e9` design tokens, responsive layout across Desktop (1280px), Tablet (768px), and Mobile (360px) with zero horizontal overflow.
   - Zero WCAG 2.1 AA violations verified via Axe-core accessibility audits.

---

## Repository Structure

```
toktickit/
├── client/                          # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/                # LoginForm, ChangePasswordModal
│   │   │   ├── requester/           # RequesterDashboard
│   │   │   ├── staff/               # StaffDashboard, StaffTicketQueue, StaffTicketDetail, ActionsTakenSection
│   │   │   ├── admin/               # UserManagement
│   │   │   └── layout/              # Navbar
│   │   ├── context/                 # AuthContext (JWT, session storage, roles)
│   │   └── tests/lab-04/            # RTL component tests (StaffDashboard, RequesterDashboard, ActionsTaken, TicketWorkflow)
│   └── vite.config.ts
│
├── server/                          # Node.js + Express + TypeScript backend
│   ├── src/
│   │   ├── middleware/              # authMiddleware, role guards
│   │   ├── routes/
│   │   │   ├── auth.ts              # Login, logout, me, change-password
│   │   │   ├── tickets.ts           # Requester ticket CRUD & attachments
│   │   │   ├── staff.ts             # Staff queue, claim/assign, status workflow, resolution gate
│   │   │   ├── actions-taken.ts     # Actions Taken CRUD, lifecycle, concurrency
│   │   │   ├── dashboard.ts         # Server-aggregated dashboard metrics
│   │   │   └── admin-users.ts       # Admin user management & password resets
│   │   └── app.ts                   # Express application setup
│   ├── prisma/
│   │   ├── schema.prisma            # Models: User, Ticket, ActionTaken, TicketStatusHistory, Comment, Note
│   │   ├── migrations/              # Non-destructive migration history
│   │   └── seed.ts                  # Idempotent database seed (18 realistic tickets)
│   └── tests/lab-04/                # Vitest + Supertest API integration tests (40 tests)
│
├── e2e/lab-04/                      # Playwright E2E browser test suite (12 scenarios / 36 cross-browser runs)
│   ├── actions-taken-flow.spec.ts   # Actions Taken lifecycle, assignees, requester read-only mode
│   ├── ticket-resolution.spec.ts    # Deterministic resolution gate rejection & success verification
│   └── dashboards.spec.ts           # Responsive viewports (360px, 768px, 1280px), SVG <= 64px & Axe-core a11y
│
├── docs/lab-04/                     # Sprint 4 documentation & engineering artifacts
│   ├── specification.md             # 11-section formal engineering contract
│   ├── ui-spec.md                   # Screen layouts, tokens, responsive conventions
│   ├── api-spec.md                  # REST API contract and status codes
│   ├── tests.md                     # Traceability matrix and planned test register
│   ├── ai-use.md                    # AI Use & Reflection report
│   ├── reviewer.md                  # Peer review governance log
│   ├── screenshots/                 # 31+ high-resolution application screenshots across viewports
│   └── LAB4_SUBMISSION.pdf          # Official single submission PDF (17 pages)
│
└── artifacts/lab-04/                # Generated audit and review evidence
    ├── metrics-vs-db.txt            # Direct DB query vs API metrics mathematical comparison
    ├── test-output/                 # Real test execution outputs (Red & Green)
    └── submission/                  # Submission markdown and PDF bundles
```

---

## Setup & Running Locally

### 1. Prerequisites
- Node.js 18+ (tested on Node.js 20 & 24)
- PostgreSQL running locally on port 5432

### 2. Environment Configuration
Create or verify `server/.env`:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/toktickit?schema=public"
JWT_SECRET="toktickit_super_secret_jwt_key_2026_cpe334"
JWT_EXPIRES_IN="8h"
NODE_ENV="development"
```

### 3. Database Migration & Seed
Run the migrations and populate the database with realistic seed data:
```bash
# Navigate to server directory
cd server

# Apply database migrations
npx prisma migrate deploy

# Run idempotent database seed
npx prisma db seed
```

### 4. Start Development Servers
Start both backend API and frontend Vite servers concurrently:
```bash
# From repository root
npm run dev
```
Or start individually:
- Backend server: `npm run dev:server` (runs on `http://localhost:3000`)
- Frontend client: `npm run dev:client` (runs on `http://localhost:5173`)

---

## Demo Accounts

All seeded accounts use password: `Password123!`

| Role | Email | Password | Intended Workflow / Demo Focus |
|---|---|---|---|
| **IT Staff** | `michael.staff@toktickit.com` | `Password123!` | Operational Dashboard, Shared Queue, Actions Taken, Resolution Gate |
| **IT Staff** | `sarah.staff@toktickit.com` | `Password123!` | Active assignee delegation and team collaboration |
| **Requester** | `jennifer.anderson@example.com` | `Password123!` | Requester Dashboard, Attention Banner, Read-Only Actions Taken |
| **Requester** | `michael.brown@example.com` | `Password123!` | Create tickets, view ticket detail, public comments |
| **Administrator** | `john.admin@toktickit.com` | `Password123!` | Staff dashboard + Admin user metrics, User Management, Password resets |
| **Inactive Staff** | `kevin.inactive@toktickit.com` | `Password123!` | Negative testing (Login blocked, Assignee delegation rejected) |

---

## Running Automated Test Suites

TokTickIT features a complete multi-layered automated test suite. Run the entire verification pipeline with one command:

```bash
# Run full automated test suite (Traceability + Server + Client)
npm test
```

### Individual Test Commands:
```bash
# 1. Requirements Traceability Audit (AST parser)
npm run test:traceability

# 2. Server API & Concurrency Tests (144 tests across 29 files)
npm run test:server

# 3. Client Component Tests (40 tests across 17 suites)
npm run test:client

# 4. Playwright End-to-End Tests (12 scenarios across Chromium, Firefox, WebKit = 36 runs)
npx playwright test e2e/lab-04/ --reporter=list
```

---

## Interactive Demonstration Script

1. **Requester Dashboard & Read-Only Actions**:
   - Log in as `jennifer.anderson@example.com` (`Password123!`).
   - Observe the **My Support Dashboard** featuring personal metrics (Open, Waiting for Feedback, Resolved, Closed) and attention banner.
   - Open ticket `TKT-2026-001234`.
   - Click on the **Actions Taken** tab. Confirm that all actions recorded by IT Staff are visible in read-only mode (no `+ Add Action` or `Edit` buttons).
   - Click on the **Status History** tab. View the append-only transition timeline.

2. **Actions Taken Lifecycle & Delegation**:
   - Log out and log in as IT Staff: `michael.staff@toktickit.com` (`Password123!`).
   - Observe the **IT Staff Operational Dashboard** showing unassigned tickets, my assigned tickets, status breakdown, and recent actions.
   - Open ticket `TKT-2026-001234`.
   - Under **Actions Taken**, click `+ Add Action`. Record an action with status `Pending` and assign to `Sarah Staff`.
   - Click `Start Work` on the pending card (status transitions to `In Progress`).
   - Click `Complete` (prompts for required result, then transitions to `Completed`).
   - Notice the card displays `(Terminal / Immutable)` and action controls are permanently locked.

3. **Strict Resolution Gate Enforcement**:
   - From the Staff Ticket Queue, search for `TKT-2026-001233` (Status: `OPEN`, zero actions taken).
   - Attempt to change the ticket status to `Resolved` in the dropdown.
   - Notice the system immediately displays the prominent red alert banner:  
     `Resolution Gate Failed: At least one COMPLETED Action Taken with a recorded result is required before resolving a ticket.`
   - Notice the ticket status remains safely at `OPEN` without side effects.
