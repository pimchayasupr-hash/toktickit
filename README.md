# TokTickIT

TokTickIT (ตอกติ๊กกิต) is a modern IT Service Desk application designed for Account and Access, Hardware, Software, and Network service requests. This repository contains the **Lab 2 MVP (Requester-Facing IT Service Desk)** full-stack application.

- **Frontend:** React 19 + TypeScript + Vite + Bootstrap 5 (`client/`)
- **Backend:** Node.js + Express + TypeScript (`server/`)
- **Database:** PostgreSQL accessed via Prisma ORM (`server/prisma/`)
- **Testing:** Vitest (frontend component/unit tests & backend API tests), Supertest, Playwright (end-to-end integration tests)

---

## Key Features (Lab 2 MVP)

- **Development Requester Selector:** Quick-switch menu to simulate different requesters (e.g. Standard User, VIP User, user with active tickets) for identity and permissions testing.
- **Create Ticket Flow:** Comprehensive ticket submission form supporting Category, Priority, Urgency, Detailed Description, and file attachment uploads (PDF, PNG, JPG <= 5MB, max 3 files).
- **My Tickets View:** Filterable and searchable ticket directory supporting status filtering (Open, In Progress, Resolved, Closed), category filtering, priority sorting, search by keywords/ID, and dynamic pagination.
- **Ticket Detail View:** Interactive view presenting full ticket metadata, responsive status timeline tracker, requester contact card, and attachment download/deletion interface.
- **Attachment Management:** Multipart upload via Multer with validation checks, file type verification, size enforcement, and cascade deletion.

---

## Repository Structure

```
toktickit/
├── client/                          # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/              # UI Components (RequesterSelector, TicketForm, TicketList, TicketDetail)
│   │   ├── context/                 # Requester Context & active user state management
│   │   └── tests/                   # Frontend Vitest & React Testing Library tests
│   └── package.json
├── server/                          # Node.js + Express REST API server
│   ├── prisma/                      # Prisma schema, SQL migrations, & seed script (`seed.ts`)
│   ├── src/
│   │   ├── routes/                  # API Controllers (`tickets.ts`, `attachments.ts`, `requesters.ts`)
│   │   ├── middleware/              # Multer file upload & validation middlewares
│   │   └── uploads/                 # Server-side file attachment storage
│   └── tests/lab-02/                # Backend Vitest + Supertest integration tests
├── docs/
│   ├── lab-01/                      # Lab 1 foundation documentation
│   └── lab-02/                      # Lab 2 specifications, UI/API specs, test reports, reviewer logs
│       ├── specification.md
│       ├── api-spec.md
│       ├── ui-spec.md
│       ├── tests.md                 # Test execution matrix & Section 27 Final Test Results
│       ├── reviewer.md              # Peer review logs & partner PR links
│       └── ai-use.md                # AI usage disclosure
├── e2e/lab-02/                      # Playwright End-to-End integration test suite
├── artifacts/lab-02/screenshots/    # Verification evidence screenshots (Create Ticket, My Tickets, Detail, Selection)
├── package.json                     # Monorepo root package.json with scripts
├── .gitignore
└── README.md
```

---

## Setup & Local Development

### Prerequisites

- Node.js 18+ and npm
- A running PostgreSQL database instance (local PostgreSQL server or Docker container)

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/pimchayasupr-hash/toktickit.git
cd toktickit

# Install root dependencies
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
cd ..
```

### 2. Configure Environment Variables

Create a `.env` file inside the `server/` directory based on `.env.example`:

```bash
cd server
cp .env.example .env
```

Ensure your `.env` contains your local database connection string and server configuration:

```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/toktickit_db?schema=public"
PORT=3000
UPLOAD_DIR=uploads
```

### 3. Run Database Migrations and Seed Data

```bash
cd server
# Run migrations
npx prisma migrate dev

# Seed database with initial requesters and sample tickets
npm run prisma:seed
cd ..
```

### 4. Run Development Servers

You can launch both the backend API and frontend client from the root directory:

```bash
# Terminal 1: Backend API (http://localhost:3000)
npm run dev:server

# Terminal 2: Frontend Client (http://localhost:5173)
npm run dev:client
```

---

## Running Tests

The test suite covers backend API integration tests, frontend React component unit tests, and Playwright end-to-end user flows.

```bash
# Run all Vitest suites (Backend + Frontend)
npm test

# Run Backend tests only (32/32 Passed)
npm run test:server

# Run Frontend tests only (11/11 Passed)
npm run test:client

# Run Playwright End-to-End tests (1/1 Flow Passed)
npx playwright test
```

### Test Suite Execution Summary
- **Backend API Tests (Vitest + Supertest):** 32 tests passed
- **Frontend UI Tests (Vitest + React Testing Library):** 11 tests passed
- **End-to-End Tests (Playwright):** 1 E2E flow test passed
- **Total:** 44 / 44 tests passing (100%)

---

## Tech Stack & Architecture

| Area         | Technology Stack                       |
|--------------|----------------------------------------|
| Frontend     | React 19 + TypeScript + Vite + Bootstrap 5 |
| Backend      | Node.js + Express 5 + TypeScript + Multer |
| Database     | PostgreSQL + Prisma ORM                |
| API Style    | RESTful JSON API + Multipart Form Data |
| Testing      | Vitest, Supertest, Playwright          |

---

## Git Workflow & Peer Reviews

Development follows feature branch branching model merged into `lab2-staging` via peer-reviewed Pull Requests, and finally merged into `main`.

- Detailed peer review logs, partner PR reviews, and approval links are recorded in [`docs/lab-02/reviewer.md`](file:///Users/pimchayasuprateravarnit/toktickit/docs/lab-02/reviewer.md).
- Detailed test cases and evidence matrix are recorded in [`docs/lab-02/tests.md`](file:///Users/pimchayasuprateravarnit/toktickit/docs/lab-02/tests.md).


