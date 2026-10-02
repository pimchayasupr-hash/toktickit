# TokTickIT

TokTickIT (ตอกติ๊กกิต) is a modern IT Service Desk application designed for Account and Access, Hardware, Software, and Network service requests. This repository contains the **Lab 3 Role-Based IT Service Desk** full-stack application with JWT authentication, RBAC (Requester / IT Staff / Administrator), and a fully tested backend API.

- **Frontend:** React 19 + TypeScript + Vite + Bootstrap 5 (`client/`)
- **Backend:** Node.js + Express + TypeScript (`server/`)
- **Database:** PostgreSQL accessed via Prisma ORM (`server/prisma/`)
- **Auth:** JSON Web Tokens (JWT) with role-based middleware (`server/src/middleware/authMiddleware.ts`)
- **Testing:** Vitest (server unit + API integration tests: 67 tests), React Testing Library (component tests: 15 tests), Playwright (end-to-end tests: 12 tests across Chromium, Firefox, WebKit) — **94 test executions / 86 unique tests (100% Passing)**

---

## Key Features (Lab 3)

- **JWT Authentication:** Email + password login returning a signed JWT Bearer token. Automatic forced password-change flow for users with `mustChangePassword = true`.
- **Role-Based Access Control (RBAC):** Three roles — `REQUESTER`, `STAFF`, `ADMIN`. All authorization rules are enforced server-side; UI navigation adapts per role.
- **Requester Workflow:** Create tickets, view owned tickets, add attachments and Public Comments, indicate "Problem Appears Resolved".
- **IT Staff Ticket Queue:** Shared queue with text search, five dropdown filters (Status, Category, Related System, Priority, Owner), sorting, and pagination. Automatically renders as stacked cards on mobile viewports (< 768 px).
- **IT Staff Operations:** Claim/reassign ticket ownership, update IT Priority, execute permitted status transitions (`NEW` → `OPEN` → `IN_PROGRESS` → `WAITING_FOR_REQUESTER` → `RESOLVED` → `CLOSED` → `REOPENED` / `CANCELLED`), post Public Comments and private Internal Notes.
- **Administrator User Management:** List / search / filter all users; create users with initial password (`mustChangePassword = true`); edit name, email, role, active status; reset initial password. Safety guards prevent self-deactivation and last-admin removal.
- **Zen Green Design System:** All screens use `#006B3C` / `#0B7A46` / `#EAF6EF` / `#F5F7F6` color tokens with Bootstrap 5, fully responsive across Desktop (≥ 1024 px), Tablet (768 – 1023 px), and Mobile (375 px / 390 px) without horizontal overflow.

---

## Repository Structure

```
toktickit/
├── client/                          # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/              # UI Components (Login, Navbar, TicketDetail, StaffTicketQueue, UserManagement, …)
│   │   ├── context/                 # AuthContext — current user, JWT storage, role helpers
│   │   └── tests/                   # React Testing Library component tests (15 tests across 11 files)
│   └── vite.config.ts
│
├── server/                          # Node.js + Express + TypeScript backend
│   ├── src/
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts    # JWT verification + role guard + requirePasswordChangeCheck
│   │   ├── routes/
│   │   │   ├── auth.ts              # POST /api/auth/login, POST /api/auth/change-password, GET /api/auth/me, POST /api/auth/logout
│   │   │   ├── tickets.ts           # CRUD tickets (Requester-scoped + Staff/Admin)
│   │   │   ├── staff.ts             # Staff Queue, assignees, claim/reassign, status transitions, comments, notes
│   │   │   └── admin-users.ts       # Admin user management endpoints
│   │   └── index.ts                 # Express app entry point (port 3000)
│   ├── prisma/
│   │   ├── schema.prisma            # User, Ticket, PublicComment, InternalNote models
│   │   ├── migrations/              # Prisma migration history (Lab 2 → Lab 3 migration included)
│   │   └── seed.ts                  # Idempotent seed — 1 Admin, 4 Staff, 5 Requesters, 8 realistic tickets
│   └── tests/                       # Vitest + Supertest API integration tests (67 tests across 19 files)
│
├── e2e/                             # Playwright end-to-end tests (4 specs, 12 test runs)
│   ├── lab-02/
│   │   └── requester-ticket-flow.spec.ts
│   └── lab-03/
│       ├── authentication.spec.ts
│       ├── staff-ticket-flow.spec.ts
│       └── user-administration.spec.ts
│
└── docs/lab-03/                     # Lab 3 documentation
    ├── specification.md             # 11-section Spec DD document
    ├── tests.md                     # Test DD + traceability matrix (API-01..API-25, UT, MT, UI, E2E)
    ├── report.md                    # Sprint report / Git workflow evidence
    ├── ui-spec.md                   # UI layout & Zen Green design system tokens
    ├── api-spec.md                  # OpenAPI-style endpoint reference
    ├── reviewer.md                  # Peer review log & change resolutions
    ├── process-notes.md             # Process disclosure on main direct commit remediation
    └── evidence/                    # Raw test run logs
```

---

## Environment Variables

Create `server/.env` (copy from `server/.env.example` and fill in):

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/toktickit?schema=public"
PORT=3000
JWT_SECRET="your-strong-random-secret-key-here"
```

> **Security Note:** `JWT_SECRET` is required in production (`NODE_ENV=production`). At startup, the server enforces this check and will throw an error if missing. In development, a fallback is provided and a warning is logged.

---

## Setup & Running Locally

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm 9+

### Installation

```bash
# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install

# Install Playwright browsers (for E2E tests)
cd .. && npx playwright install --with-deps chromium firefox webkit
```

### Database Setup

```bash
# Apply all migrations (creates schema + Lab 2 → Lab 3 migration)
cd server && npx prisma migrate deploy

# Seed idempotent development data
npx prisma db seed
```

Default seeded accounts (local-development only):

| Role | Email | Status | Initial Password | Notes |
|---|---|---|---|---|
| Admin | `admin@toktickit.com` | Active | `Password123!` | Initial password, `mustChangePassword = false` |
| Staff | `michael.staff@toktickit.com` | Active | `Password123!` | Initial password, `mustChangePassword = false` |
| Staff | `sarah.staff@toktickit.com` | Active | `Password123!` | Initial password, `mustChangePassword = false` |
| Staff | `david.staff@toktickit.com` | Active | `Password123!` | Initial password, `mustChangePassword = false` |
| Staff | `kevin.inactive@toktickit.com` | Inactive | `Password123!` | Inactive staff account (`isActive = false`) |
| Requester | `jennifer.anderson@example.com` | Active | `Password123!` | Migrated Requester, `mustChangePassword = false` |
| Requester | `michael.brown@example.com` | Active | `Password123!` | Migrated Requester, `mustChangePassword = false` |
| Requester | `sarah.jenkins@example.com` | Active | `Password123!` | Migrated Requester, `mustChangePassword = false` |
| Requester | `david.kim@example.com` | Active | `Password123!` | Migrated Requester, `mustChangePassword = false` |
| Requester | `alex.turner@example.com` | Inactive | `Password123!` | Inactive requester account (`isActive = false`) |

> **Note on "Forgot your password?":** Self-service password reset / email-based reset is explicitly excluded by the Lab 3 handout scope. Password resets are handled by Administrators through the User Management panel (`/admin/users`).

### Running

```bash
# Terminal 1 — Backend (port 3000)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Running Tests

```bash
# Client TypeScript / Vite build check
npm --prefix client run build

# Server Vitest suite (67 tests across 19 files)
npm --prefix server test -- --run

# Client Vitest suite (15 tests across 11 files)
npm --prefix client test -- --run

# Playwright E2E suite (12 tests across Chromium, Firefox, WebKit)
npx playwright test
```

All 94 test executions pass cleanly (raw evidence saved to `docs/lab-03/evidence/final-run-2026-10-02.txt`).

---

## Ticket ID Format

Tickets are identified as `TKT-YYYY-XXXXXX` (e.g. `TKT-2026-000001`). The prefix, year, and zero-padded sequence number are auto-generated server-side.

---

## Status Lifecycle (8 Canonical Statuses)

```
NEW → OPEN → IN_PROGRESS → WAITING_FOR_REQUESTER → RESOLVED → CLOSED
                ↑                                      ↓
                └──────────── REOPENED ←───────────────┘
NEW / OPEN / IN_PROGRESS / WAITING_FOR_REQUESTER / REOPENED → CANCELLED
```

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code; merge via reviewed PRs only |
| `lab3-staging` | Lab 3 integration target |
| `fix/lab3-consistency` | Final consistency and remediation branch |
| `feature/issue-*` | Individual feature branches |

---

## Documentation

Full Lab 3 documentation is in [`docs/lab-03/`](docs/lab-03/):

- [`specification.md`](docs/lab-03/specification.md) — Spec DD (Sprint Goal → FR → BR → UI → Data → API → AC)
- [`tests.md`](docs/lab-03/tests.md) — Test DD + full traceability matrix (API-01..API-25, UT, MT, UI, E2E)
- [`ui-spec.md`](docs/lab-03/ui-spec.md) — UI layout & Zen Green design tokens
- [`api-spec.md`](docs/lab-03/api-spec.md) — OpenAPI-style endpoint reference
- [`reviewer.md`](docs/lab-03/reviewer.md) — Peer review log and PR resolutions
- [`process-notes.md`](docs/lab-03/process-notes.md) — Process disclosure on branch remediation
- [`evidence/final-run-2026-10-02.txt`](docs/lab-03/evidence/final-run-2026-10-02.txt) — Raw test execution evidence
