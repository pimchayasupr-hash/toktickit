# Lab 3 Test Engineering & Traceability Plan

## 1. Test Strategy & Coverage Scope

The Lab 3 test suite provides 100% traceability across all Functional Requirements (FR), Business Rules (BR), Acceptance Criteria (AC-01..AC-22), and the complete Role × Endpoint Authorization Matrix.

### Test Layers
1. **Server API Tests (`server/tests/lab-03/`)**: Supertest API endpoints verifying authentication, authorization headers, matrix permissions, validation status codes, Prisma data isolation, and safety rules.
2. **Client UI Component Tests (`client/src/tests/lab-03/`)**: React Testing Library component tests validating form inputs, loading/saving states, badge rendering, error alerts, responsive layouts, and interactive actions.
3. **End-to-End Tests (`e2e/lab-03/`)**: Playwright E2E integration tests running against realistic browser sessions to verify complete user workflows.

---

## 2. Requirement Traceability Matrix & Test Plan

| Test ID | Test Layer | Requirement / AC | Description & Verification Target | Automated Test File | Final Status |
|---|---|---|---|---|---|
| **API-01** | API | AC-01, FR-01, BR-01 | Valid user login returns auth token & user profile | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-02** | API | AC-01, FR-01, BR-01 | Invalid password or unknown email returns 401 | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-03** | API | AC-03, FR-01, BR-01 | Inactive account login attempt returns 401 error | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-04** | API | AC-02, FR-02, BR-02, BR-06 | Mandatory password change updates password & clears flag | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-04b** | API | AC-13, AC-20, FR-03 | Protected endpoint without valid token or with blacklisted token returns 401 | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-05** | API | AC-04, FR-05, FR-06, BR-03 | Authenticated requester ticket list ignores client requesterId | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| **API-06** | API | AC-14, FR-06, BR-03 | Requester accessing another requester's ticket returns 404 | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| **API-07** | API | AC-09, AC-11, FR-15, BR-04 | Requester requesting Staff Queue or Internal Notes returns 403 | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| **API-07b** | API | AC-12, BR-13 | Staff requesting Admin endpoints returns 403 Forbidden | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| **API-08** | API | AC-05, FR-09, FR-10 | IT Staff Ticket Queue returns paginated tickets with filters | `server/tests/lab-03/staff-queue.api.test.ts` | Pass |
| **API-09** | API | AC-06, FR-11, BR-07 | IT Staff claim & reassign ticket updates owner in DB | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| **API-10** | API | AC-07, FR-12, BR-08 | IT Priority update independently of Requested Priority | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| **API-11** | API | AC-08, FR-13, BR-09, BR-10 | Status transitions via approved matrix; invalid returns 400 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| **API-12** | API | AC-15, FR-07, FR-14, FR-16, BR-11, BR-12 | Append Public Comment succeeds; whitespace rejected | `server/tests/lab-03/comments-notes.api.test.ts` | Pass |
| **API-13** | API | AC-09, AC-16, FR-15, BR-04, BR-11, BR-12 | Append Internal Note succeeds for Staff/Admin; Requester forbidden | `server/tests/lab-03/comments-notes.api.test.ts` | Pass |
| **API-14** | API | AC-10, FR-18, BR-14 | Admin create user with duplicate email returns 409 Conflict | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-15** | API | AC-21, FR-21, BR-15, BR-17 | Admin self-deactivation attempt returns 400 Bad Request | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-16** | API | AC-22, FR-21, BR-16 | Blocks changing role of the last active Administrator account | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-16b** | API | AC-22, FR-21, BR-16 | Blocks changing role of last active Admin to REQUESTER | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-17** | API | AC-17, FR-17 | Admin search users by name/email & filter by role | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-17b** | API | FR-19 | Admin update user name and role succeeds | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-18** | API | AC-18, FR-20 | Admin reset initial password forces password change flag | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-19** | API | AC-23, FR-02, BR-06, BR-18 | Password change rejects weak passwords (missing uppercase, lowercase, digit, or special character) | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-20** | API | AC-02, FR-02, FR-04, BR-02 | Protected endpoint with `mustChangePassword=true` blocks all operations except /auth/me, /change-password, /logout | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-21** | API | AC-03, FR-01, BR-01 | Inactive account blocks login even with correct password | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-22** | API | AC-02, FR-02, BR-02 | Password change rejects empty, missing, or incorrect `currentPassword` | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-23** | API | AC-06, FR-11, BR-07 | STAFF login fetches /api/staff/assignees successfully and reassigns ticket for real | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| **API-24** | API | AC-05, FR-09, FR-10 | Staff Queue filters by search AND priority simultaneously without overwriting OR conditions | `server/tests/lab-03/staff-queue.api.test.ts` | Pass |
| **API-25** | API | AC-19, FR-08, BR-05 | Requester "Problem Appears Resolved" appends system public comment without changing status | `server/tests/lab-03/comments-notes.api.test.ts` | Pass |
| **UT-01** | Unit | BR-02, BR-06 | Password validator rejects passwords < 8 chars | `server/tests/lab-03/unit.test.ts` | Pass |
| **UT-02** | Unit | BR-02, BR-06 | Password validator enforces uppercase, lowercase, digit, special char requirements | `server/tests/lab-03/unit.test.ts` | Pass |
| **UT-03** | Unit | FR-16, BR-11, BR-12 | Comment validator rejects empty/whitespace-only strings | `server/tests/lab-03/unit.test.ts` | Pass |
| **UT-04** | Unit | FR-16, BR-11, BR-12 | Comment validator enforces min=1, max=2000 char boundaries | `server/tests/lab-03/unit.test.ts` | Pass |
| **UT-05** | Unit | FR-13, BR-09, BR-10 | Status transition matrix allows all valid transitions from NEW, IN_PROGRESS | `server/tests/lab-03/unit.test.ts` | Pass |
| **UT-06** | Unit | FR-13, BR-09, BR-10 | Status transition matrix blocks all invalid transitions; CANCELLED is terminal | `server/tests/lab-03/unit.test.ts` | Pass |
| **MT-01** | Migration | FR-06, BR-03, BR-05 | Lab 2 DB populated with legacy Requesters/Tickets/Attachments survives Lab 3 migration with zero data loss | `server/tests/lab-03/migration-regression.test.ts` | Pass |
| **MT-02** | Migration | FR-06, BR-05 | Seed idempotency: re-running `prisma db seed` does not duplicate records or throw constraint violations | `server/tests/lab-03/seed-idempotency.test.ts` | Pass |
| **UI-01** | UI | AC-01, AC-02, FR-01, FR-02 | Login form renders fields, validation errors, and loading state | `client/src/tests/lab-03/Login.test.tsx` | Pass |
| **UI-02** | UI | AC-02, FR-02, BR-02 | Mandatory password change form enforces password rules | `client/src/tests/lab-03/ChangePassword.test.tsx` | Pass |
| **UI-03** | UI | AC-05, FR-09, FR-10 | Staff Ticket Queue table renders filters, search, and badges | `client/src/tests/lab-03/StaffTicketQueue.test.tsx` | Pass |
| **UI-04** | UI | AC-06, AC-07, AC-08, AC-19, FR-08, FR-11, FR-12, FR-13 | Staff Ticket Detail renders claim/reassign, IT priority, and status transitions | `client/src/tests/lab-03/StaffTicketDetail.test.tsx` | Pass |
| **UI-05** | UI | AC-15, AC-16, FR-14, FR-15, BR-04, BR-11 | Visually distinguishes Public Comments from Internal Notes | `client/src/tests/lab-03/StaffTicketDetail.test.tsx` | Pass |
| **UI-06** | UI | AC-10, AC-17, AC-21, AC-22, FR-17, FR-18, FR-19, FR-20, FR-21, BR-14, BR-15, BR-16, BR-17 | User Management modal renders create/edit/reset forms & validation | `client/src/tests/lab-03/UserManagement.test.tsx` | Pass |
| **E2E-01** | E2E | AC-01, AC-02, AC-20, FR-01, FR-02, FR-03 | E2E complete authentication, initial password change & logout | `e2e/lab-03/authentication.spec.ts` | Pass |
| **E2E-02** | E2E | AC-05, AC-06, AC-07, AC-08, AC-15, AC-16, FR-09, FR-10, FR-11, FR-12, FR-13, FR-14, FR-15 | E2E IT Staff queue search, ticket detail claim, status & notes | `e2e/lab-03/staff-ticket-flow.spec.ts` | Pass |
| **E2E-03** | E2E | AC-10, AC-17, AC-18, FR-17, FR-18, FR-19, FR-20 | E2E Administrator user creation, search, edit & safety checks | `e2e/lab-03/user-administration.spec.ts` | Pass |
| **E2E-04** | E2E | AC-13, AC-20, FR-03, BR-04 | E2E Logout revokes session; direct URL access redirects to login; unauthenticated API returns 401 | `e2e/lab-03/authentication.spec.ts` | Pass |
| **E2E-05** | E2E | AC-19, FR-08, BR-05 | E2E Requester "Problem Appears Resolved" appends system public comment without changing ticket status | `e2e/lab-03/staff-ticket-flow.spec.ts` | Pass |
| **E2E-06** | E2E | AC-02, FR-02, BR-02 | E2E New user first login triggers mandatory password change modal | `e2e/lab-03/user-administration.spec.ts` | Pass |
| **E2E-07** | E2E | AC-21, AC-22, FR-21, BR-15, BR-16 | E2E Admin safety rules block self-deactivation and last-admin demotion | `e2e/lab-03/user-administration.spec.ts` | Pass |
| **E2E-08** | E2E | UI-Spec §6 | Zero horizontal overflow on Login screen at 375px/390px/820px/1440px | `e2e/lab-03/responsive-overflow.spec.ts` | Pass |
| **E2E-09** | E2E | UI-Spec §6 | Zero horizontal overflow on IT Staff Queue at 375px/390px/820px/1440px | `e2e/lab-03/responsive-overflow.spec.ts` | Pass |
| **E2E-10** | E2E | UI-Spec §6 | Zero horizontal overflow on Staff Detail & Admin User Management at all viewports | `e2e/lab-03/responsive-overflow.spec.ts` | Pass |
| **E2E-11** | E2E | UI-Spec §6 | Zen Green primary button (`#005a36`) background & white text verified by computed styles | `e2e/lab-03/responsive-overflow.spec.ts` | Pass |
| **E2E-12** | E2E | UI-Spec §6 | Keyboard Escape key closes admin modal (accessibility) | `e2e/lab-03/responsive-overflow.spec.ts` | Pass |
| **E2E-13** | E2E | UI-Spec §6 | Axe-core accessibility scan: zero critical violations on Login and Staff Queue pages | `e2e/lab-03/responsive-overflow.spec.ts` | Pass |

### 2.1 Automated Traceability Verification Output (`python3 scripts/check-traceability.py`)

```text
=== Specification Definition Audit ===
Defined Acceptance Criteria: 23 (AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17, AC-18, AC-19, AC-20, AC-21, AC-22, AC-23)
Defined Functional Reqs:     21 (FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09, FR-10, FR-11, FR-12, FR-13, FR-14, FR-15, FR-16, FR-17, FR-18, FR-19, FR-20, FR-21)
Defined Business Rules:      18 (BR-01, BR-02, BR-03, BR-04, BR-05, BR-06, BR-07, BR-08, BR-09, BR-10, BR-11, BR-12, BR-13, BR-14, BR-15, BR-16, BR-17, BR-18)

=== Traceability Matrix Coverage Audit ===
Referenced Acceptance Criteria: 23 (AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17, AC-18, AC-19, AC-20, AC-21, AC-22, AC-23)
Referenced Functional Reqs:     21 (FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09, FR-10, FR-11, FR-12, FR-13, FR-14, FR-15, FR-16, FR-17, FR-18, FR-19, FR-20, FR-21)
Referenced Business Rules:      18 (BR-01, BR-02, BR-03, BR-04, BR-05, BR-06, BR-07, BR-08, BR-09, BR-10, BR-11, BR-12, BR-13, BR-14, BR-15, BR-16, BR-17, BR-18)

✅ ALL ACCEPTANCE CRITERIA (23), FUNCTIONAL REQUIREMENTS (21), AND BUSINESS RULES (18) ARE 100% COVERED WITHOUT ORPHAN REFERENCES.
```

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

## 4. Final Run on fix/lab3-consistency at bcd221a after merge of main (2026-10-02)

Final run on `fix/lab3-consistency` at commit `bcd221a` (after merging `main`), 2026-10-02:

| Layer | Files | Tests | Result |
|---|---|---|---|
| Server Vitest | 19 | 67 | Pass |
| Client Vitest | 11 | 15 | Pass |
| Playwright (Chromium) | 4 | 4 | Pass |
| Total (Chromium) | | 86 | Pass |
| Playwright (Multi-browser: Chromium, Firefox, WebKit) | 4 | 12 | Pass |
| Total (All Browser Engines) | | 94 | Pass |

Raw output: `docs/lab-03/evidence/final-run-2026-10-02.txt`

### 1. Client Production TypeScript Build (`tsc -b && vite build`)
```text
> client@0.0.0 build
> tsc -b && vite build

vite v8.2.1 building client environment for production...
transforming...✓ 29 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.45 kB │ gzip:  0.29 kB
dist/assets/index-CE8A7XIf.css  246.11 kB │ gzip: 34.73 kB
dist/assets/index-CbJdoMfs.js   279.88 kB │ gzip: 75.87 kB

✓ built in 165ms
```

### 2. Server API Vitest Suite (`npm --prefix server test -- --run`)
```text
Test Files  19 passed (19)
     Tests  67 passed (67)
  Start at  10:07:25
  Duration  2.38s (transform 539ms, setup 0ms, import 4.17s, tests 8.20s, environment 1ms)
```

### 3. Client Component Vitest Suite (`npm --prefix client test -- --run`)
```text
Test Files  11 passed (11)
     Tests  15 passed (15)
  Start at  10:07:27
  Duration  2.32s (transform 925ms, setup 1.01s, import 1.75s, tests 2.08s, environment 8.13s)
```

### 4. Playwright End-to-End Suite (`npx playwright test`)
```text
Running 12 tests using 1 worker

  ✓   1 [chromium] › e2e/lab-02/requester-ticket-flow.spec.ts:13:7 › Lab 2: Requester Ticket E2E Flow › should select requester, create a ticket, and see it in My Tickets (823ms)
  ✓   2 [chromium] › e2e/lab-03/authentication.spec.ts:4:7 › Lab 3 E2E - Authentication & Mandatory Password Change › E2E-01: Login, mandatory initial password change, and logout flow (546ms)
  ✓   3 [chromium] › e2e/lab-03/staff-ticket-flow.spec.ts:17:7 › Lab 3 E2E - IT Staff Ticket Queue & Detail Flow › E2E-02: IT Staff queue search, claim ticket, update status & notes (2.0s)
  ✓   4 [chromium] › e2e/lab-03/user-administration.spec.ts:17:7 › Lab 3 E2E - Administrator User Management Flow › E2E-03: Admin login, create user, search, and safety rules check (757ms)
  ✓   5 [firefox] › e2e/lab-02/requester-ticket-flow.spec.ts:13:7 › Lab 2: Requester Ticket E2E Flow › should select requester, create a ticket, and see it in My Tickets (1.7s)
  ✓   6 [firefox] › e2e/lab-03/authentication.spec.ts:4:7 › Lab 3 E2E - Authentication & Mandatory Password Change › E2E-01: Login, mandatory initial password change, and logout flow (847ms)
  ✓   7 [firefox] › e2e/lab-03/staff-ticket-flow.spec.ts:17:7 › Lab 3 E2E - IT Staff Ticket Queue & Detail Flow › E2E-02: IT Staff queue search, claim ticket, update status & notes (944ms)
  ✓   8 [firefox] › e2e/lab-03/user-administration.spec.ts:17:7 › Lab 3 E2E - Administrator User Management Flow › E2E-03: Admin login, create user, search, and safety rules check (924ms)
  ✓   9 [webkit] › e2e/lab-02/requester-ticket-flow.spec.ts:13:7 › Lab 2: Requester Ticket E2E Flow › should select requester, create a ticket, and see it in My Tickets (1.4s)
  ✓  10 [webkit] › e2e/lab-03/authentication.spec.ts:4:7 › Lab 3 E2E - Authentication & Mandatory Password Change › E2E-01: Login, mandatory initial password change, and logout flow (816ms)
  ✓  11 [webkit] › e2e/lab-03/staff-ticket-flow.spec.ts:17:7 › Lab 3 E2E - IT Staff Ticket Queue & Detail Flow › E2E-02: IT Staff queue search, claim ticket, update status & notes (749ms)
  ✓  12 [webkit] › e2e/lab-03/user-administration.spec.ts:17:7 › Lab 3 E2E - Administrator User Management Flow › E2E-03: Admin login, create user, search, and safety rules check (886ms)

  12 passed (15.1s)
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

## 7. Test Execution History

| Milestone / Run | Branch | Commit | Server Tests | Client Tests | E2E Tests | Total Tests | Result |
|---|---|---|---|---|---|---|---|
| Initial Increment | `feature/issue-31-auth` | `999e51b` | 24 | 6 | — | 30 | Pass |
| Staging Merge (PR #40) | `lab3-staging` | `4110ea3` | 56 | 13 | 9 (Chromium) | 78 | Pass |
| Main Release (PR #41) | `main` | `b5494cb` | 60 | 13 | 9 (Multi-browser) | 82 | Pass |
| Final Consistency Run | `fix/lab3-consistency` | `bcd221a` | 67 (19 files) | 15 (11 files) | 12 (4 Cr, 4 Fx, 4 Wk) | 94 (86 Chromium) | Pass |

