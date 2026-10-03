# TokTickIT

TokTickIT (ตอกติ๊กกิต) is a modern IT Service Desk application designed for Account and Access, Hardware, Software, and Network service requests. This repository contains the **Lab 3 Role-Based IT Service Desk** full-stack application with JWT authentication, RBAC (Requester / IT Staff / Administrator), and a fully tested backend API.

- **Frontend:** React 19 + TypeScript + Vite + Bootstrap 5 (`client/`)
- **Backend:** Node.js + Express + TypeScript (`server/`)
- **Database:** PostgreSQL accessed via Prisma ORM (`server/prisma/`)
- **Auth:** JSON Web Tokens (JWT) with role-based middleware (`server/src/middleware/authMiddleware.ts`)
- **Testing:** Vitest (server unit + API integration tests), React Testing Library (component tests), Playwright (end-to-end tests) — **163 / 163 tests passing (104 Server, 32 Client, 27 Playwright E2E)**

---

## Key Features (Lab 3)

- **JWT Authentication:** Email + password login returning a signed JWT Bearer token. Automatic forced password-change flow for users with `mustChangePassword = true`.
- **Role-Based Access Control (RBAC):** Three roles — `REQUESTER`, `STAFF`, `ADMIN`. All authorization rules are enforced server-side; UI navigation adapts per role.
- **Requester Workflow:** Create tickets, view owned tickets, add attachments and Public Comments, indicate "Problem Appears Resolved".
- **IT Staff Ticket Queue:** Shared queue with text search, five dropdown filters (Status, Category, Related System, Priority, Owner), sorting, and pagination. Automatically renders as stacked cards on mobile viewports (< 768 px).
- **IT Staff Operations:** Claim/reassign ticket ownership, update IT Priority, execute permitted status transitions (NEW → OPEN → IN_PROGRESS → WAITING_FOR_REQUESTER → RESOLVED → CLOSED → REOPENED / CANCELLED), post Public Comments and private Internal Notes.
- **Administrator User Management:** List / search / filter all users; create users with initial password (`mustChangePassword = true`); edit name, email, role, active status; reset initial password. Safety guards prevent self-deactivation and last-admin removal.
- **Zen Green Design System:** All screens use `#006B3C` / `#0B7A46` / `#EAF6EF` color tokens with Bootstrap 5, fully responsive across Desktop (≥ 1024 px), Tablet (768 – 1023 px), and Mobile (375 px / 390 px) without horizontal overflow.

---

## Repository Structure

```
toktickit/
├── client/                          # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/              # UI Components (Login, Navbar, TicketForm, StaffQueue, UserManagement, …)
│   │   ├── context/                 # AuthContext — current user, JWT storage, role helpers
│   │   └── tests/lab-03/            # React Testing Library component tests (32 tests)
│   └── vite.config.ts
│
├── server/                          # Node.js + Express + TypeScript backend
│   ├── src/
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts    # JWT verification + role guard (requireRole)
│   │   ├── routes/
│   │   │   ├── auth.ts              # POST /api/auth/login, POST /api/auth/change-password, GET /api/auth/me, POST /api/auth/logout
│   │   │   ├── tickets.ts           # CRUD tickets (Requester-scoped + Staff/Admin)
│   │   │   ├── staff.ts             # Staff Queue, claim/reassign, status transitions, comments, notes
│   │   │   └── admin.ts             # Admin user management endpoints
│   │   └── index.ts                 # Express app entry point
│   ├── prisma/
│   │   ├── schema.prisma            # User, Ticket, PublicComment, InternalNote models
│   │   ├── migrations/              # Prisma migration history (Lab 2 → Lab 3 migration included)
│   │   └── seed.ts                  # Idempotent seed — 1 Admin, 4 Staff (3 active, 1 inactive), 5 Requesters (4 active, 1 inactive) + 18 tickets
│   └── tests/lab-03/                # Vitest + Supertest API integration tests (104 tests)
│
├── e2e/lab-03/                      # Playwright end-to-end tests (27 tests)
│   ├── auth.spec.ts
│   ├── staff-queue.spec.ts
│   ├── admin-users.spec.ts
│   └── responsive-overflow.spec.ts
│
└── docs/lab-03/                     # Lab 3 documentation
    ├── specification.md             # 11-section Spec DD document
    ├── tests.md                     # Test DD + traceability matrix (163/163)
    ├── report.md                    # Sprint report / Git workflow evidence
    ├── reviewer.md                  # Peer review log across PRs #35–#42
    ├── ai-use.md                    # AI usage log & reflection
    ├── ui-spec.md                   # UI layout & screen wireframes
    ├── api-spec.md                  # OpenAPI-style endpoint reference
    ├── evidence/                    # Verbatim test execution evidence
    │   ├── final-run-2026-10-02.txt # Real terminal test run logs
    │   └── preflight-2026-10-02.txt # Automated preflight verification
    ├── screenshots/                 # Multi-tier responsive visual evidence
    ├── submission.html              # Compiled PDF submission source
    └── LAB3_SUBMISSION.pdf          # Final submission PDF
```

---

## Environment Variables

Create `server/.env` (copy from `server/.env.example` and fill in):

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/toktickit?schema=public"
PORT=3000
JWT_SECRET="your-strong-random-secret-key-here"
```

> **Note:** `JWT_SECRET` is required in production. A default fallback is used only during local development. Use a cryptographically random string (≥ 32 characters) in any shared or deployed environment.

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
cd .. && npx playwright install --with-deps chromium
```

### Database Setup

```bash
# Apply all migrations (creates schema + Lab 2→Lab 3 migration)
cd server && npx prisma migrate deploy

# (Optional) Seed demo data
npx prisma db seed
```

Default seeded accounts (password for all seeded accounts is `Password123!`):

| Role | Email | Status | Initial Password | First Login Action |
|---|---|---|---|---|
| Admin | `admin@toktickit.com` | Active | `Password123!` | Ready (`mustChangePassword: false`) |
| IT Staff | `michael.staff@toktickit.com` | Active | `Password123!` | Ready (`mustChangePassword: false`) |
| IT Staff | `sarah.staff@toktickit.com` | Active | `Password123!` | Ready (`mustChangePassword: false`) |
| IT Staff | `david.staff@toktickit.com` | Active | `Password123!` | Ready (`mustChangePassword: false`) |
| IT Staff (Inactive) | `kevin.inactive@toktickit.com` | Inactive | `Password123!` | Inactive / Blocked |
| Requester | `jennifer.anderson@example.com` | Active | `Password123!` | Must change password (`mustChangePassword: true`) |
| Requester | `michael.brown@example.com` | Active | `Password123!` | Must change password (`mustChangePassword: true`) |
| Requester | `sarah.jenkins@example.com` | Active | `Password123!` | Must change password (`mustChangePassword: true`) |
| Requester | `david.kim@example.com` | Active | `Password123!` | Must change password (`mustChangePassword: true`) |
| Requester (Inactive) | `alex.turner@example.com` | Inactive | `Password123!` | Inactive / Blocked |

> Seeded Requesters have `mustChangePassword = true` to verify the mandatory initial-password change gate upon first login.

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

> **Prerequisite**: Every full automated test run MUST start from a fresh database reset and seed to guarantee clean initial state and zero cross-test state contamination:
> ```bash
> cd server && npx prisma migrate reset --force && npx prisma db seed
> ```
>
> `migrate reset --force` drops the database, re-applies all migrations, and triggers the seeder configured in `package.json#prisma.seed`. The explicit `&& npx prisma db seed` above is a safety net — if the built-in seeder hook is skipped (e.g. `--skip-seed` flag), the seed still runs. Omitting this step causes Playwright tests to fail because they expect the canonical 5 seeded users and demo tickets.

```bash
# Server tests (104 tests — API integration, authorization matrix, unit)
cd server && npm test

# Client tests (32 tests — component feedback states, form validation)
cd client && npm test

# Playwright E2E tests (27 tests — auth flow, staff queue, admin, responsive)
npx playwright test --project=chromium
```

All 163 tests pass (104 Server, 32 Client, 27 Playwright E2E).

---

## Ticket ID Format

Tickets are identified as `TKT-YYYY-XXXXXX` (e.g. `TKT-2026-001234`). The prefix, year, and zero-padded sequence number are auto-generated server-side.

---

## Status Lifecycle

```
NEW → OPEN → IN_PROGRESS → WAITING_FOR_REQUESTER → RESOLVED → CLOSED
                ↑                                      ↓
                └──────────── REOPENED ←───────────────┘
NEW / OPEN / IN_PROGRESS / WAITING_FOR_REQUESTER → CANCELLED
```

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code; merge via reviewed PRs only |
| `lab3-staging` | Lab 3 integration target |
| `feature/issue-*` | Individual feature branches |

---

## Documentation

Full Lab 3 documentation is in [`docs/lab-03/`](docs/lab-03/):

- [`specification.md`](docs/lab-03/specification.md) — Spec DD (Sprint Goal → FR → BR → UI → Data → API → AC)
- [`tests.md`](docs/lab-03/tests.md) — Test DD (163 tests with full traceability matrix)
- [`report.md`](docs/lab-03/report.md) — Sprint report and Git workflow evidence
