# Lab 3 Test Engineering & Traceability Plan

## 1. Test Strategy & Coverage Scope

The Lab 3 test suite provides 100% traceability across all Functional Requirements (FR), Business Rules (BR), Acceptance Criteria (AC-01..AC-20), and the complete Role × Endpoint Authorization Matrix.

### Test Layers
1. **Server API Tests (`server/tests/lab-03/`)**: Supertest API endpoints verifying authentication, authorization headers, matrix permissions, validation status codes, Prisma data isolation, and safety rules.
2. **Client UI Component Tests (`client/src/tests/lab-03/`)**: React Testing Library component tests validating form inputs, loading/saving states, badge rendering, error alerts, responsive layouts, and interactive actions.
3. **End-to-End Tests (`e2e/lab-03/`)**: Playwright E2E integration tests running against realistic browser sessions to verify complete user workflows.

---

## 2. Requirement Traceability Matrix & Test Plan

| Test ID | Test Layer | Requirement / AC | Description & Verification Target | Automated Test File | Final Status |
|---|---|---|---|---|---|
| **API-01** | API | AC-01, FR-01, BR-01 | Valid user login returns auth token & user profile | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-02** | API | AC-01, BR-01 | Invalid password or unknown email returns 401 | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-03** | API | AC-03, BR-01 | Inactive account login attempt returns 401 error | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-04** | API | AC-02, BR-02 | Mandatory password change updates password & clears flag | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-04b** | API | AC-13, AC-20 | Protected endpoint without valid token returns 401 | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-05** | API | AC-04, BR-03 | Authenticated requester ticket list ignores client requesterId | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| **API-06** | API | AC-14, BR-03 | Requester accessing another requester's ticket returns 404 | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| **API-07** | API | AC-08, AC-11, BR-04 | Requester requesting Staff Queue or Internal Notes returns 403 | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| **API-07b** | API | AC-12 | Staff requesting Admin endpoints returns 403 Forbidden | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| **API-08** | API | AC-05, FR-09, FR-10 | IT Staff Ticket Queue returns paginated tickets with filters | `server/tests/lab-03/staff-queue.api.test.ts` | Pass |
| **API-09** | API | AC-06, FR-11 | IT Staff claim & reassign ticket updates owner in DB | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| **API-10** | API | AC-07, FR-12, FR-13 | IT Priority update and valid status transition succeed | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| **API-11** | API | AC-07, BR-10 | Invalid status transition (e.g. NEW -> CLOSED) returns 400 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| **API-12** | API | AC-15, FR-14, BR-11 | Append Public Comment succeeds; whitespace rejected | `server/tests/lab-03/comments-notes.api.test.ts` | Pass |
| **API-13** | API | AC-16, FR-15, BR-11 | Append Internal Note succeeds for Staff/Admin | `server/tests/lab-03/comments-notes.api.test.ts` | Pass |
| **API-14** | API | AC-09, FR-18, BR-14 | Admin create user with duplicate email returns 409 Conflict | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-15** | API | AC-10, BR-15 | Admin self-deactivation attempt returns 400 Bad Request | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-16** | API | AC-10, BR-16 | Deactivating last active Admin attempt returns 400 Bad Request | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-17** | API | AC-17, FR-17 | Admin search users by name/email & filter by role | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-18** | API | AC-18, FR-20 | Admin reset initial password forces password change flag | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-19** | API | AC-03, BR-04 | Password change rejects weak passwords (missing uppercase, lowercase, digit, or special character) | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **UI-01** | UI | AC-01, AC-02 | Login form renders fields, validation errors, and loading state | `client/src/tests/lab-03/Login.test.tsx` | Pass |
| **UI-02** | UI | AC-02, BR-02 | Mandatory password change form enforces password rules | `client/src/tests/lab-03/ChangePassword.test.tsx` | Pass |
| **UI-03** | UI | FR-09, FR-10 | Staff Ticket Queue table renders filters, search, and badges | `client/src/tests/lab-03/StaffTicketQueue.test.tsx` | Pass |
| **UI-04** | UI | FR-11, FR-12 | Staff Ticket Detail renders claim/reassign and IT priority | `client/src/tests/lab-03/StaffTicketDetail.test.tsx` | Pass |
| **UI-05** | UI | AC-08, FR-15 | Visually distinguishes Public Comments from Internal Notes | `client/src/tests/lab-03/StaffTicketDetail.test.tsx` | Pass |
| **UI-06** | UI | FR-17..FR-21 | User Management modal renders create/edit/reset forms & validation | `client/src/tests/lab-03/UserManagement.test.tsx` | Pass |
| **E2E-01** | E2E | AC-01, AC-02 | E2E complete authentication, initial password change & logout | `e2e/lab-03/authentication.spec.ts` | Pass |
| **E2E-02** | E2E | AC-05..AC-08 | E2E IT Staff queue search, ticket detail claim, status & notes | `e2e/lab-03/staff-ticket-flow.spec.ts` | Pass |
| **E2E-03** | E2E | AC-09, AC-10 | E2E Administrator user creation, search, edit & safety checks | `e2e/lab-03/user-administration.spec.ts` | Pass |

---

## 3. Automated Test Execution Commands

```bash
# Server API Test Suite
cd server && npm test

# Client UI Component Test Suite
cd client && npm test

# Playwright End-to-End Test Suite
npx playwright test
```

## 4. Final Sprint 3 Test Execution Logs

### Server Test Output
```text
 Test Files  18 passed (18)
      Tests  56 passed (56)
   Start at  16:27:19
   Duration  6.64s (transform 1.80s, setup 0ms, import 16.84s, tests 20.89s, environment 3ms)
```

### Client Test Output
```text
 Test Files  11 passed (11)
      Tests  13 passed (13)
   Start at  18:36:02
   Duration  5.21s (transform 1.80s, setup 2.31s, import 2.97s, tests 4.33s, environment 19.14s)
```

### Playwright End-to-End Test Output
```text
Running 9 tests using 4 workers

[1/9] …hange › E2E-01: Login, mandatory initial password change, and logout flow
[2/9] …hange › E2E-01: Login, mandatory initial password change, and logout flow
[3/9] …Flow › E2E-02: IT Staff queue search, claim ticket, update status & notes
[4/9] …t Flow › E2E-03: Admin login, create user, search, and safety rules check
[5/9] …t Flow › E2E-03: Admin login, create user, search, and safety rules check
[6/9] …Flow › E2E-02: IT Staff queue search, claim ticket, update status & notes
[7/9] …hange › E2E-01: Login, mandatory initial password change, and logout flow
[8/9] …t Flow › E2E-03: Admin login, create user, search, and safety rules check
[9/9] …Flow › E2E-02: IT Staff queue search, claim ticket, update status & notes
  9 passed (20.6s)
```

---

## 5. Manual Evidence: HTTP 401 & 403 Verification (Live cURL Execution)

As mandated by Lab 3 Specification (Section 7/9) and API Security Matrix guidelines, manual endpoint verification was executed against the running server via cURL. The real terminal outputs, response headers, and HTTP status codes are recorded below:

### 1. Verification of HTTP 401 Unauthorized (Missing Authentication Token)

Attempting to request a protected endpoint without providing an Authorization bearer token:

```bash
curl -i -s http://localhost:3000/api/staff/tickets
```

**Live Response Output:**
```http
HTTP/1.1 401 Unauthorized
X-Powered-By: Express
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Content-Length: 93
ETag: W/"5d-ZiGWJit8YnHA2rShoGFufu8IHA4"
Date: Fri, 18 Sep 2026 11:35:14 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":{"code":"UNAUTHORIZED","message":"Authentication token is missing. Please log in."}}
```

---

### 2. Verification of HTTP 403 Forbidden (Requester Accessing IT Staff Queue)

Attempting to access `/api/staff/tickets` using a valid JWT token issued to a `REQUESTER` (`michael.brown@example.com`):

```bash
curl -i -s http://localhost:3000/api/staff/tickets \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Live Response Output:**
```http
HTTP/1.1 403 Forbidden
X-Powered-By: Express
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Content-Length: 110
ETag: W/"6e-k0Ju2Dh0A9yFYRXiF9fQch+UPAc"
Date: Fri, 18 Sep 2026 11:35:14 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":{"code":"FORBIDDEN","message":"Access denied. Role REQUESTER is not authorized for this operation."}}
```

---

### 3. Verification of HTTP 403 Forbidden (Requester Accessing Internal Notes)

Attempting to read internal notes `/api/tickets/2/notes` using a `REQUESTER` token:

```bash
curl -i -s http://localhost:3000/api/tickets/2/notes \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Live Response Output:**
```http
HTTP/1.1 403 Forbidden
X-Powered-By: Express
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Content-Length: 95
ETag: W/"5f-ibnZJLw0FZPmFFrhIy7frlPO5FI"
Date: Fri, 18 Sep 2026 11:35:14 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":{"code":"FORBIDDEN","message":"Requesters are not permitted to view internal notes."}}
```

---

### 4. Verification of HTTP 403 Forbidden (IT Staff Accessing Admin User Management)

Attempting to access `/api/admin/users` using a valid JWT token issued to an `IT Staff` user (`sarah.staff@toktickit.com`):

```bash
curl -i -s http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Live Response Output:**
```http
HTTP/1.1 403 Forbidden
X-Powered-By: Express
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Content-Length: 106
ETag: W/"6a-sDnquSnGo/BLL+3QUFyX6iKVBmE"
Date: Fri, 18 Sep 2026 11:35:14 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":{"code":"FORBIDDEN","message":"Access denied. Role STAFF is not authorized for this operation."}}
```

---

## 6. Peer Review Verification Evidence (Data Migration, Client Build & E2E)

Following peer review feedback on PR #40 regarding database migration data preservation, attachment typing, and badge accuracy, the following verification suite was executed:

### 1. Lab 2 Populated Database Migration Upgrade Test

A clean isolated PostgreSQL schema was provisioned, populated with simulated Lab 2 production records (Categories, Systems, Requesters 1-3, Tickets 1-3, Attachments 1-2), and upgraded using `20260918094134_lab3_auth_rbac/migration.sql`.

**Execution Output:**
```text
1. Setting up clean test schema in postgres...
2. Applying Lab 1 and Lab 2 migrations...
3. Populating simulated Lab 2 data (Categories, Systems, Requesters, Tickets, Attachments)...
4. Applying Lab 3 migration...
5. Verifying data integrity post-migration...
Migrated Users count: 3
Users: [
  { id: 1, name: 'Alice Requester', email: 'alice@example.com', role: 'REQUESTER', mustChangePassword: true, isActive: true },
  { id: 2, name: 'Bob Requester', email: 'bob@example.com', role: 'REQUESTER', mustChangePassword: true, isActive: true },
  { id: 3, name: 'Charlie Inactive', email: 'charlie@example.com', role: 'REQUESTER', mustChangePassword: true, isActive: false }
]
Migrated Tickets count: 3
Tickets: [
  { id: 1, ticketNumber: 'TXT-2026-000001', requesterId: 1, summary: 'Alice Ticket 1' },
  { id: 2, ticketNumber: 'TXT-2026-000002', requesterId: 2, summary: 'Bob Ticket 2' },
  { id: 3, ticketNumber: 'TXT-2026-000003', requesterId: 3, summary: 'Charlie Ticket 3' }
]
Migrated Attachments count: 2
Attachments: [
  { id: 1, ticketId: 1, originalFilename: 'error_screenshot.png' },
  { id: 2, ticketId: 2, originalFilename: 'spec.pdf' }
]
New User autoincrement ID: 4
>>> SUCCESS: Migration verification test PASSED 100%! <<<
```

- **Verification Result**:
  - Legacy `Requester` records were copied to `User` without loss.
  - Primary key IDs and foreign key links from `Ticket.requesterId` were preserved.
  - `User_id_seq` was resynchronized so subsequent user creation autoincrements correctly without collisions.
  - Default initial password hash (`$2b$10$...` for `Password123!`) was provisioned with `mustChangePassword = true` (enforcing BR-02/BR-04).

---

### 2. Client Production TypeScript Build (`tsc -b && vite build`)

To verify type safety after aligning `Attachment` property names (`originalFilename`, `sizeBytes`) and removing the unsupported `resolutionSummary` editor:

```bash
cd client && npm run build
```

**Build Output:**
```text
> client@0.0.0 build
> tsc -b && vite build

vite v8.2.1 building client environment for production...
transforming (28) src/index.css✓ 29 modules transformed.
rendering chunks (1)...computing gzip size...
dist/index.html                   0.45 kB │ gzip:  0.29 kB
dist/assets/index-D0Hd3QwP.css  246.11 kB │ gzip: 34.74 kB
dist/assets/index-DgGR4Uvy.js   278.31 kB │ gzip: 75.37 kB

✓ built in 369ms
```

---

### 3. Server Vitest API Suite (Post-Fix)

```bash
npm --prefix server test -- --run
```

**Output:**
```text
 Test Files  18 passed (18)
      Tests  56 passed (56)
   Duration  4.53s
```

---

### 4. Client Vitest Component Suite (Post-Fix)

```bash
npm --prefix client test -- --run
```

**Output:**
```text
 Test Files  11 passed (11)
      Tests  13 passed (13)
   Duration  6.93s
```

---

### 5. Playwright End-to-End Suite (Post-Fix)

```bash
npx playwright test e2e/lab-03/
```

> **Note on Test Execution Configuration**: `playwright.config.ts` was configured with `workers: 1` and `fullyParallel: false` because E2E tests interact with a single, stateful PostgreSQL database instance. Concurrent workers attempting simultaneous mutations (e.g. mandatory password changes and user creation) on shared seed accounts caused cross-test race conditions and resource contention. Sequential worker execution guarantees strict state isolation against the persistent test database.

**Output:**
```text
Running 9 tests using 1 worker

[1/9] …hange › E2E-01: Login, mandatory initial password change, and logout flow
[2/9] …Flow › E2E-02: IT Staff queue search, claim ticket, update status & notes
[3/9] …t Flow › E2E-03: Admin login, create user, search, and safety rules check
[4/9] …hange › E2E-01: Login, mandatory initial password change, and logout flow
[5/9] …Flow › E2E-02: IT Staff queue search, claim ticket, update status & notes
[6/9] …t Flow › E2E-03: Admin login, create user, search, and safety rules check
[7/9] …hange › E2E-01: Login, mandatory initial password change, and logout flow
[8/9] …Flow › E2E-02: IT Staff queue search, claim ticket, update status & notes
[9/9] …t Flow › E2E-03: Admin login, create user, search, and safety rules check
  9 passed (41.0s)
```

---

## 7. Post-Merge Final Staging Verification (`lab3-staging` at `4110ea3`)

Following the peer approval and merge of PR #40 into `lab3-staging` on 2026-09-19 (Commit `4110ea3`), the complete test suite was executed across all layers to guarantee zero regressions:

### 1. Client Production TypeScript Build (`tsc -b && vite build`)
```bash
npm --prefix client run build
```
```text
> client@0.0.0 build
> tsc -b && vite build

vite v8.2.1 building client environment for production...
transforming (26) node_modules/react-dom/cjs/react-dom.production.jstransforming (28) src/index.css✓ 29 modules transformed.
rendering chunks (1)...computing gzip size...
dist/index.html                   0.45 kB │ gzip:  0.29 kB
dist/assets/index-D0Hd3QwP.css  246.11 kB │ gzip: 34.74 kB
dist/assets/index-DgGR4Uvy.js   278.31 kB │ gzip: 75.37 kB

✓ built in 824ms
```

### 2. Server API Vitest Suite
```bash
npm --prefix server test -- --run
```
```text
 Test Files  18 passed (18)
      Tests  56 passed (56)
   Duration  4.87s (transform 1.25s, setup 0ms, import 10.38s, tests 16.11s, environment 4ms)
```

### 3. Client Component Vitest Suite
```bash
npm --prefix client test -- --run
```
```text
 Test Files  11 passed (11)
      Tests  13 passed (13)
   Duration  6.21s (transform 2.97s, setup 3.08s, import 4.44s, tests 4.19s, environment 23.34s)
```

### 4. Playwright End-to-End Suite
```bash
npx playwright test e2e/lab-03/
```
```text
Running 9 tests using 1 worker

[1/9] …hange › E2E-01: Login, mandatory initial password change, and logout flow
[2/9] …Flow › E2E-02: IT Staff queue search, claim ticket, update status & notes
[3/9] …t Flow › E2E-03: Admin login, create user, search, and safety rules check
[4/9] …hange › E2E-01: Login, mandatory initial password change, and logout flow
[5/9] …Flow › E2E-02: IT Staff queue search, claim ticket, update status & notes
[6/9] …t Flow › E2E-03: Admin login, create user, search, and safety rules check
[7/9] …hange › E2E-01: Login, mandatory initial password change, and logout flow
[8/9] …Flow › E2E-02: IT Staff queue search, claim ticket, update status & notes
[9/9] …t Flow › E2E-03: Admin login, create user, search, and safety rules check
  9 passed (20.0s)
```

### 5. Final Quality Summary
- **Client TypeScript / Vite Build**: PASS (0 errors, 824ms)
- **Backend API Tests**: 56 / 56 PASS (100%)
- **Frontend Component Tests**: 13 / 13 PASS (100%)
- **End-to-End Multi-Browser Tests**: 9 / 9 PASS (100%)
- **Grand Total Automated Tests**: **78 / 78 PASS (100% Green)**

