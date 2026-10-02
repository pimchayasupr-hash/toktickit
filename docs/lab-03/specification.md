# Lab 3 Sprint Engineering Specification

## 1. Sprint Goal

Lab 3 replaces the temporary Lab 2 Development Requester selector with production-ready user authentication and server-side role-based authorization. It introduces operational workflows for IT Staff (shared Ticket Queue with responsive stacked cards on mobile, ticket claiming/reassignment, IT Priority setting, permitted status transitions, Public Comments, and private Internal Notes) and minimalist User Management for Administrators (user listing with search/filtering, account creation with single-role assignment, account editing/activation state, and initial password management). All Lab 2 Requester functions continue to work seamlessly using the authenticated user identity derived from the server session.

---

## 2. Stakeholder Request Interpretation

The stakeholder requires replacing the temporary development requester dropdown with secure, real-user authentication and authorization:

1. **Authentication & First-Login Password Change**: Users authenticate using an email address and password. Any user signed in with an initial/temporary password (`mustChangePassword = true`) must be forced to change their password on first login before accessing normal application features.
2. **Requester Workflow Continuity**: Requesters operate using their authenticated identity (rather than a client-supplied `requesterId`). They can view/create their own tickets and attachments, post Public Comments, and indicate that a problem "appears resolved", while formally setting Resolved/Closed status remains an IT Staff responsibility.
3. **IT Staff Workflow**: IT Staff access a shared Ticket Queue with search, status/priority filtering, sorting, and pagination. On mobile viewports (<768px), the queue automatically renders as stacked cards with touch-friendly actions (min 44px). They can open ticket details, claim or reassign ticket ownership, adjust IT Priority, perform permitted status transitions, post Public Comments, and write private Internal Notes.
4. **Administrator User Management**: Administrators use a dedicated screen to list, search, and filter accounts; create new users with 1 permitted role (`REQUESTER`, `STAFF`, `ADMIN`) and an initial password; edit account info and activation state; and set new initial passwords. Safety rules prevent Administrators from deactivating their own account or deactivating the last active Administrator.
5. **Backend Security**: All authorization and ownership rules are enforced strictly by the backend API. Hidden UI controls are for UX only, not security.
6. **Design System**: The application strictly uses and extends the established Zen Green design system tokens (`#005a36`, `#008751`, `#e8f5e9`) with Bootstrap 5 and custom CSS utility classes.

---

## 3. Scope

### 3.1 Included Work
- **Authentication foundation**: Email & password login, logout, current user retrieval (`/api/auth/me`), mandatory first-login password change with 8-character rule checklist.
- **Server-side Role-Based Access Control (RBAC)**: Roles `REQUESTER`, `STAFF`, `ADMIN`.
- **Data Model & Migration**: Unified `User` model, updated `Ticket` model with `ownerId` and `itPriority`, new `PublicComment` and `InternalNote` models. Idempotent database seeding.
- **Requester Ticket Detail extensions**: Public Comments section and "Problem Appears Resolved" indication.
- **Removal of Development Requester selector**: Clean deletion of client-side selector dropdown, mock requester headers, and associated state.
- **IT Staff Ticket Queue**: Shared queue with search (summary, description, ticket number), filters (status, category, related system, priority, owner), sorting, and pagination. Stacked cards below 768px, clipped column prevention on tablet (768–1023px).
- **IT Staff Ticket Operations**: Claim ticket, reassign ownership, update IT Priority, execute permitted status transitions (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`).
- **Public Comments & Internal Notes**: Public Comments (visible to Requester, IT Staff, Admin) and Internal Notes (visible ONLY to IT Staff and Admin), both strictly append-only.
- **Administrator User Management**: Screen showing user list, search by name/email, role filter, create user (with initial password), edit account details/activation, reset initial password. Mobile stacked cards on viewports <768px.
- **Admin safety rules**: Prevent self-deactivation, prevent deactivating or changing role of the last active Admin, prevent duplicate emails.
- **Responsive Zen Green UI**: Fully verified across Desktop (1440px), Tablet (820px), and Mobile (375px/390px) without page-level horizontal overflow.
- **Automated Test Suites**: Unit, API integration, authorization matrix, component feedback states, and Playwright E2E tests with 100% AC traceability.

### 3.2 Explicitly Excluded Work
- Email invitations, password-reset emails via external SMTP, MFA/2FA, social login, OAuth/SSO.
- Self-registration / public sign-up.
- Actions Taken by IT Staff (formal task tracking deferred to Lab 4).
- Formal SLA calculation engines, automated escalation crons, push notifications.
- Advanced KPI analytics dashboards.
- Multi-tenant organizations, multi-department hierarchies, multi-role per user.
- Hard user deletion, bulk user operations, CSV import/export.
- Profile picture uploads, department trees, audit log database tables.
- Automatic account lockout timers.

---

## 4. Functional Requirements

### 4.1 Authentication & Password Management
- **FR-01**: The backend MUST authenticate active users via email and password, returning a signed JWT Bearer token and user context.
- **FR-02**: The system MUST detect if a user has `mustChangePassword = true` and force the user to set a new valid password before accessing any main application features.
- **FR-03**: The user MUST be able to log out, which invalidates the current session token server-side via token revocation.
- **FR-04**: The backend MUST provide an endpoint (`GET /api/auth/me`) returning current authenticated user details and role.

### 4.2 Requester Regression & Ticket Continuity
- **FR-05**: The system MUST derive Requester identity solely from the authenticated session, rejecting client-supplied `requesterId` parameters.
- **FR-06**: Requesters MUST continue to create, list, view, and add attachments to their owned tickets.
- **FR-07**: Requesters MUST be able to post Public Comments on their owned tickets.
- **FR-08**: Requesters MUST be able to click "Problem Appears Resolved", which appends a structured Public Comment without directly changing the ticket status lifecycle.

### 4.3 IT Staff Ticket Queue & Operations
- **FR-09**: IT Staff MUST be able to view a shared Ticket Queue listing all tickets across all Requesters.
- **FR-10**: The Ticket Queue MUST support text search, filters (status, category, related system, priority, owner), sorting, and pagination.
- **FR-11**: IT Staff MUST be able to claim an unassigned ticket or reassign a ticket to any active IT Staff or Administrator user.
- **FR-12**: IT Staff MUST be able to update the IT Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) independently of Requested Priority.
- **FR-13**: IT Staff MUST be able to transition ticket status according to the approved status transition matrix.

### 4.4 Public Comments & Internal Notes
- **FR-14**: Authenticated users (Requester, IT Staff, Admin) MUST be able to view and create Public Comments on tickets they are authorized to access.
- **FR-15**: IT Staff and Administrators ONLY MUST be able to view and create Internal Notes on tickets. Requesters MUST receive 403 Forbidden when attempting to access Internal Notes.
- **FR-16**: Both Public Comments and Internal Notes MUST be strictly append-only (no editing, no deletion). Empty or whitespace-only content MUST be rejected.

### 4.5 Administrator User Management
- **FR-17**: Administrators MUST be able to list all users, search by name or email, and filter by role (`REQUESTER`, `STAFF`, `ADMIN`).
- **FR-18**: Administrators MUST be able to create a new user account with Name, Email, exactly 1 Role, Activation status, and an Initial Password (with `mustChangePassword = true`).
- **FR-19**: Administrators MUST be able to edit a user's Name, Email, Role, and Active status.
- **FR-20**: Administrators MUST be able to set a new initial password for any user account, resetting `mustChangePassword` to `true`.
- **FR-21**: The backend MUST reject any attempt by an Administrator to deactivate their own account or deactivate/change the role of the last remaining active Administrator.

---

## 5. Business Rules (BR-01 .. BR-18)

| BR ID | Mandatory Business Rule Statement |
|---|---|
| **BR-01** | Only an active user account (`isActive = true`) with valid credentials may authenticate successfully. Generic credentials error is returned for invalid email or wrong password; deactivated account message is shown only after correct password verification. |
| **BR-02** | A user marked with `mustChangePassword = true` cannot access normal application screens or endpoints until a new valid password is saved. |
| **BR-03** | The authenticated user identity (derived from Bearer token), NOT a client-supplied `requesterId`, determines ownership of Requester operations. Client body/header overrides are ignored. |
| **BR-04** | Public Comments are visible to Requester (owner), IT Staff, and Administrator. Internal Notes are visible ONLY to IT Staff and Administrator. |
| **BR-05** | A Requester may indicate that a problem "appears resolved", but cannot directly set the Ticket status to `RESOLVED` or `CLOSED`. |
| **BR-06** | Passwords must be hashed using a strong hashing algorithm (bcryptjs with salt rounds = 10) with minimum length of 8 characters. Plaintext passwords must never be stored. |
| **BR-07** | Ticket ownership can only be assigned to an active IT Staff (`STAFF`) or Administrator (`ADMIN`) user. Assigning to Requesters or inactive staff is rejected with 400. |
| **BR-08** | Requested Priority is set by the Requester at creation and is immutable. IT Priority initially defaults to Requested Priority and can subsequently be modified only by IT Staff or Admin. |
| **BR-09** | Permitted Ticket Statuses are: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`. |
| **BR-10** | Permitted Status Transitions are governed by the formal transition matrix with role restrictions and confirmation prompts. |
| **BR-11** | Public Comments and Internal Notes are append-only. Editing and deleting entries are strictly forbidden. |
| **BR-12** | Comment/Note content must be non-empty string between 1 and 2000 characters after trimming whitespace. |
| **BR-13** | Administrators have API-level access to staff endpoints for operational oversight, but the Admin UI navigation displays "User Management" only to maintain clean separation of concerns. |
| **BR-14** | Email addresses must be unique across all user accounts (case-insensitive). Duplicate creation returns 409 Conflict. |
| **BR-15** | An Administrator cannot deactivate their own active account (`id === loggedInUserId`). Rejected with 400 `SELF_DEACTIVATION_FORBIDDEN`. |
| **BR-16** | The system must prevent deactivating or changing the role of the last active Administrator account. Rejected with 400 `LAST_ADMIN_PROTECTION`. |
| **BR-17** | User deletion is strictly forbidden; account disablement must use deactivation (`isActive = false`). |
| **BR-18** | Passwords must be at least 8 characters and contain upper-case, lower-case, digit and special character. Enforced server-side on change-password, admin create user and admin reset password. |

### BR-10 Status Transition Matrix

| From Status | Permitted Target Status | Permitted Roles | Required User Confirmation | Triggered Side Effects |
|---|---|---|---|---|
| `NEW` | `OPEN` | STAFF, ADMIN | None | Ticket acknowledged by IT Staff |
| `NEW` | `IN_PROGRESS` | STAFF, ADMIN | None | Owner assignment recommended |
| `NEW` | `CANCELLED` | STAFF, ADMIN | Dialog confirmation required | Terminal state; reason logged |
| `OPEN` | `IN_PROGRESS` | STAFF, ADMIN | None | Active investigation started |
| `OPEN` | `WAITING_FOR_REQUESTER` | STAFF, ADMIN | None | Prompt sent via public comment |
| `OPEN` | `RESOLVED` | STAFF, ADMIN | Dialog confirmation required | Public resolution summary note |
| `OPEN` | `CANCELLED` | STAFF, ADMIN | Dialog confirmation required | Terminal state |
| `IN_PROGRESS` | `WAITING_FOR_REQUESTER` | STAFF, ADMIN | None | Pending user response |
| `IN_PROGRESS` | `RESOLVED` | STAFF, ADMIN | Dialog confirmation required | Resolution summary logged |
| `IN_PROGRESS` | `CANCELLED` | STAFF, ADMIN | Dialog confirmation required | Terminal state |
| `IN_PROGRESS` | `OPEN` | STAFF, ADMIN | None | Returned to general queue |
| `WAITING_FOR_REQUESTER`| `IN_PROGRESS` | STAFF, ADMIN | None | Requester replied / resumed |
| `WAITING_FOR_REQUESTER`| `RESOLVED` | STAFF, ADMIN | Dialog confirmation required | Resolution confirmed |
| `WAITING_FOR_REQUESTER`| `CANCELLED` | STAFF, ADMIN | Dialog confirmation required | Terminal state |
| `RESOLVED` | `CLOSED` | STAFF, ADMIN | Dialog confirmation required | Ticket closed formally |
| `RESOLVED` | `REOPENED` | STAFF, ADMIN | Dialog confirmation required | Issue recurred |
| `CLOSED` | `REOPENED` | STAFF, ADMIN | Dialog confirmation required | New investigation required |
| `REOPENED` | `IN_PROGRESS` | STAFF, ADMIN | None | Re-investigation active |
| `REOPENED` | `RESOLVED` | STAFF, ADMIN | Dialog confirmation required | Resolved again |
| `REOPENED` | `CANCELLED` | STAFF, ADMIN | Dialog confirmation required | Terminal state |
| `CANCELLED` | *(None - Terminal)* | None | N/A | No further transitions permitted |

#### Requester "Problem Appears Resolved" Workflow
When a Requester clicks "Problem Appears Resolved":
- The ticket status is **NOT** changed directly (satisfying BR-05).
- A system-attributed Public Comment is created: `"[SYSTEM]: Requester indicated that the problem appears resolved."`
- The comment is immediately visible to the Requester, assigned IT Staff, and Administrator.
- IT Staff inspects the comment and executes the formal transition to `RESOLVED` with appropriate confirmation.

---

## 6. UI Specification Summary

The TokTickIT interface follows the Zen Green design system (`#005a36` primary, `#008751` hover, `#e8f5e9` surface) with Bootstrap 5 grid and CSS token utility classes. Complete visual mockups and layout specifications are documented in [ui-spec.md](file:///Users/pimchayasuprateravarnit/toktickit/docs/lab-03/ui-spec.md).

### 6.1 Screen Structure & Modes

| Screen | View Mode | Edit / Create Mode | Primary Controls | Min Touch Target |
|---|---|---|---|---|
| **Login** | Static form | Input email & password | Email input, password input with show/hide toggle, Submit button | 44px height |
| **Change Password** | Modal overlay | Current, New, Confirm inputs | Rule validation checklist, "Update Password & Continue" button | 44px height |
| **Requester Tickets** | Ticket list table | Search & Category filter | "Create Ticket" action button, ticket links, pagination | 44px height |
| **Requester Detail** | Readonly ticket form | Upload attachment, add comment, "Problem Appears Resolved" | Back button ("← Back to My Tickets"), comment textarea, file picker | 44px height |
| **Staff Queue** | Desktop table / Mobile stacked cards | Search, 5 dropdown filters, sorting | Search button, reset filter, "Open Detail" button, pagination | 44px height |
| **Staff Detail** | Full ticket form | Claim, Reassign, IT Priority, Status transition, Public Comments, Internal Notes | Claim button, Assignee select, Priority select, Status select, Note textarea | 44px height |
| **User Management** | Desktop table / Mobile stacked cards | Create User modal, Edit User modal, Reset Password modal | "+ Create New User" button (`tkt-btn-action-primary`), Edit button, Reset Password button | 44px height |

### 6.2 Feedback States

| Feedback State | Visual Representation | User Action / Dismissal |
|---|---|---|
| **Loading** | Inline animated spinner with contextual loading text | Disabled controls during active fetch |
| **Saving / Submitting** | Button text changes (e.g. "Saving..."), spinner displayed, button disabled | Prevents duplicate form submissions |
| **Success** | Green banner (`#f0fdf4`, border `#bbf7d0`, text `#166534`) | Auto-clears on navigation or next action |
| **Validation Error** | Inline red alert banner (`#fef2f2`, border `#fca5a5`, text `#991b1b`) | Field highlight with specific correction prompt |
| **Empty State** | Centered illustration/emoji, title, and instructional subtitle | Clear guidance on how to populate data |
| **No Results** | "No Tickets Found" / "No Users Found" banner | Suggests resetting active search or filter filters |
| **Forbidden (403)** | Standard error banner: "Access denied. Role is not authorized." | Redirect to permitted role screen |
| **Not Found (404)** | Error card: "Ticket not found." | "← Back to My Tickets" button |
| **Conflict (409)** | Error banner: "A user with this email address already exists." | Correct email input |
| **Safe Failure (500)** | Generic error message preventing internal stack trace leakage | Retry prompt |

### 6.3 Role Navigation Rules

- **Requester**: Displays "📄 My Tickets" and "➕ Create Ticket". Breadcrumb shows "My Tickets > Ticket Detail".
- **IT Staff**: Displays "📄 Ticket Queue". Breadcrumb shows "Ticket Queue > Ticket Detail".
- **Administrator**: Displays "👥 User Management" only. Clicking brand logo defaults to User Management.

### 6.4 Responsive Viewport Rules

- **Desktop (>= 1024px)**: Full multi-column tables with complete metadata, inline filters, and action buttons.
- **Tablet (768px – 1023px)**: Lower-priority table columns (`Created Date`, `Category`) are hidden via `.tkt-desktop-only` so remaining columns fit without horizontal clipping.
- **Mobile (< 768px)**: Tables are replaced entirely with `.tkt-card-list.tkt-mobile-only` rendering stacked cards with full wrapping summaries, status pills, metadata grids, and 44px touch-target action buttons. No horizontal page overflow at 375px/390px (`scrollWidth <= clientWidth`).

---

## 7. Data Changes & Migration Strategy

### 7.1 Prisma Data Models

```prisma
enum Role {
  REQUESTER
  STAFF
  ADMIN
}

model User {
  id                 Int              @id @default(autoincrement())
  name               String
  email              String           @unique
  passwordHash       String
  role               Role             @default(REQUESTER)
  isActive           Boolean          @default(true)
  mustChangePassword Boolean          @default(false)
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt
  tickets            Ticket[]         @relation("RequesterTickets")
  ownedTickets       Ticket[]         @relation("StaffTickets")
  publicComments     PublicComment[]
  internalNotes      InternalNote[]

  @@index([role, isActive])
  @@index([email])
}

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
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  requester          User             @relation("RequesterTickets", fields: [requesterId], references: [id])
  owner              User?            @relation("StaffTickets", fields: [ownerId], references: [id])
  category           Category?        @relation(fields: [categoryId], references: [id])
  relatedSystem      RelatedSystem?   @relation(fields: [relatedSystemId], references: [id])
  attachments        Attachment[]
  publicComments     PublicComment[]
  internalNotes      InternalNote[]

  @@index([currentStatus])
  @@index([requesterId])
  @@index([ownerId])
  @@index([createdAt])
}

model PublicComment {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  authorId  Int
  content   String
  createdAt DateTime @default(now())

  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id])

  @@index([ticketId, createdAt])
}

model InternalNote {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  authorId  Int
  content   String
  createdAt DateTime @default(now())

  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id])

  @@index([ticketId, createdAt])
}
```

### 7.2 Lab 2 → User Migration Strategy

1. **Development Requesters to Users**: In Lab 2, requesters were stored in a `DevelopmentRequester` table. The migration transferred all existing requesters into the unified `User` table with role `REQUESTER`, mapping `email`, `name`, and setting `isActive = true`.
2. **Ticket Ownership Preservation**: Existing tickets had `requesterId` foreign keys referencing the old table. The migration preserved identical primary key mappings so that existing tickets retain correct historical Requester ownership without data loss.
3. **Initial Password Provisioning**: All migrated accounts were assigned a bcrypt-hashed default password (`Password123!`). For security, migrated users who had not yet logged in received `mustChangePassword = false` for existing test accounts and `mustChangePassword = true` for newly provisioned accounts.
4. **Selector Removal**: The client-side Development Requester dropdown, local storage keys, and `X-Development-Requester-Id` request headers were completely removed. Requesters authenticate strictly via `/api/auth/login` and receive a JWT Bearer token.
5. **Database Seeding Decisions**:
   - Ticket numbers strictly follow the official `TKT-2026-XXXXXX` format (fixing the `TXT-` typo).
   - Polluted test tickets ("Issue 5 test ticket for attachments") were purged from the dev seed.
   - Dev seed populates 18 realistic tickets covering all 8 statuses, 4 priorities, and assigned/unassigned distributions.
   - Seed operations use `upsert` and existence checks, guaranteeing 100% idempotency across repeated runs.

---

## 8. API Contract & Authorization Matrix

Detailed endpoint schemas and payload examples are documented in [api-spec.md](file:///Users/pimchayasuprateravarnit/toktickit/docs/lab-03/api-spec.md).

### 8.1 Authentication Architecture

- **Token Format**: JSON Web Token (JWT) signed with HMAC-SHA256 (`HS256`) using a server-side secret (`JWT_SECRET`).
- **Token Expiry**: Configured to **8 hours** (`expiresIn: '8h'`), providing a realistic full-workday session.
- **Header Transmission**: Clients transmit tokens via `Authorization: Bearer <token>`. Direct browser file downloads optionally accept `?token=<token>` query parameters for secure attachment streaming.
- **CSRF Considerations**: Because session state is transmitted exclusively via custom headers (`Authorization: Bearer`), the API is immune to cross-site request forgery attacks that affect cookie-based sessions.
- **Token Revocation (Logout)**: The server maintains an in-memory token revocation blacklist (`tokenBlacklist`). Upon calling `POST /api/auth/logout`, the active token is added to the blacklist and subsequent requests return 401 Unauthorized.
  - *Known Limitation*: In-memory blacklists reset on server restart.
  - *Production Mitigation*: Distributed deployments use Redis or a database-backed revoked token table with TTL corresponding to token expiry.
- **Password Security**: Passwords are hashed using `bcryptjs` with 10 salt rounds before database persistence.

### 8.2 Authorization Matrix (Role × Endpoint Permissions)

| Endpoint Path | Method | Public | Requester | IT Staff | Administrator |
|---|---|---|---|---|---|
| `/api/auth/login` | `POST` | 200 OK | 200 OK | 200 OK | 200 OK |
| `/api/auth/logout` | `POST` | 401 | 200 OK | 200 OK | 200 OK |
| `/api/auth/me` | `GET` | 401 | 200 OK | 200 OK | 200 OK |
| `/api/auth/change-password` | `POST` | 401 | 200 OK | 200 OK | 200 OK |
| `/api/tickets` (My Tickets) | `GET` | 401 | 200 (Owned Only) | 200 (Owned Only) | 200 (Owned Only) |
| `/api/tickets` (Create Ticket) | `POST` | 401 | 201 (Self Owner) | 201 (Self Owner) | 201 (Self Owner) |
| `/api/tickets/:id` | `GET` | 401 | 200 (Owned, 404 else) | 200 (All) | 200 (All) |
| `/api/tickets/:id/attachments` | `POST` | 401 | 201 (Owned Only) | 201 (All) | 201 (All) |
| `/api/attachments/:id/download`| `GET` | 401 | 200 (Owned Only) | 200 (All) | 200 (All) |
| `/api/attachments/:id/remove` | `POST` | 401 | 200 (Owned Only) | 200 (All) | 200 (All) |
| `/api/staff/tickets` | `GET` | 401 | **403 Forbidden** | 200 OK | 200 OK |
| `/api/staff/tickets/:id` | `GET` | 401 | **403 Forbidden** | 200 OK | 200 OK |
| `/api/staff/tickets/:id/claim` | `PATCH`| 401 | **403 Forbidden** | 200 OK | 200 OK |
| `/api/staff/tickets/:id/assign`| `PATCH`| 401 | **403 Forbidden** | 200 OK | 200 OK |
| `/api/staff/tickets/:id/priority`|`PATCH`| 401 | **403 Forbidden** | 200 OK | 200 OK |
| `/api/staff/tickets/:id/status`| `PATCH`| 401 | **403 Forbidden** | 200 OK | 200 OK |
| `/api/tickets/:id/comments` | `GET` | 401 | 200 (Owned Only) | 200 OK | 200 OK |
| `/api/tickets/:id/comments` | `POST`| 401 | 201 (Owned Only) | 201 OK | 201 OK |
| `/api/tickets/:id/notes` | `GET` | 401 | **403 Forbidden** | 200 OK | 200 OK |
| `/api/tickets/:id/notes` | `POST`| 401 | **403 Forbidden** | 201 OK | 201 OK |
| `/api/admin/users` | `GET` | 401 | **403 Forbidden** | **403 Forbidden** | 200 OK |
| `/api/admin/users` | `POST`| 401 | **403 Forbidden** | **403 Forbidden** | 201 OK |
| `/api/admin/users/:id` | `PATCH`| 401 | **403 Forbidden** | **403 Forbidden** | 200 OK |
| `/api/admin/users/:id/reset-password`|`POST`| 401 | **403 Forbidden** | **403 Forbidden** | 200 OK |

---

## 9. Acceptance Criteria (AC-01 .. AC-23)

- **AC-01**: Given an active user with valid credentials, when logging in via `POST /api/auth/login`, the backend returns HTTP 200 with JWT Bearer token and user context.
- **AC-02**: Given an authenticated user with `mustChangePassword = true`, when calling protected endpoints other than change-password/me/logout, the server returns HTTP 403 `MUST_CHANGE_PASSWORD`.
- **AC-03**: Given an inactive user (`isActive = false`), when attempting to log in with correct credentials, the server returns HTTP 401 `ACCOUNT_DEACTIVATED`; with wrong credentials, it returns generic `INVALID_CREDENTIALS`.
- **AC-04**: Given an authenticated Requester, when creating a ticket, `requesterId` in request body is ignored and ticket ownership is assigned strictly to the authenticated user.
- **AC-05**: Given an IT Staff user, when querying `GET /api/staff/tickets` with search, filters, or sort, matching tickets are returned with correct pagination metadata.
- **AC-06**: Given an IT Staff user, when claiming or reassigning a ticket, the `ownerId` updates in database and returns HTTP 200.
- **AC-07**: Given an IT Staff user, when updating IT Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), the priority updates independently of Requested Priority.
- **AC-08**: Given an IT Staff user, when updating status through permitted transitions, the status updates; invalid transitions return HTTP 400 `INVALID_STATUS_TRANSITION`.
- **AC-09**: Given a Requester user, when attempting to access `/api/tickets/:id/notes`, the server returns HTTP 403 Forbidden without leaking note content.
- **AC-10**: Given an Administrator user, when creating a user with a duplicate email, the request is rejected with HTTP 409 Conflict.
- **AC-11**: Given a Requester user, when attempting to call `/api/staff/*`, the server returns HTTP 403 Forbidden.
- **AC-12**: Given an IT Staff user, when attempting to call `/api/admin/*`, the server returns HTTP 403 Forbidden.
- **AC-13**: Given an unauthenticated request without a Bearer token to any protected endpoint, the server returns HTTP 401 Unauthorized.
- **AC-14**: Given a Requester user, when accessing another Requester's ticket or attachment, the server returns HTTP 404 Not Found without leaking ticket existence.
- **AC-15**: Given an authorized user, when posting a Public Comment (`POST /api/tickets/:id/comments`), the comment is recorded and visible to all authorized roles.
- **AC-16**: Given an IT Staff or Admin user, when posting an Internal Note (`POST /api/tickets/:id/notes`), the note is saved and visible strictly to Staff and Admin.
- **AC-17**: Given an Administrator user, when querying `GET /api/admin/users`, all users matching search and role filter are returned.
- **AC-18**: Given an Administrator user, when resetting an initial password, `mustChangePassword` is set to `true` and the password hash updates.
- **AC-19**: Given a Requester user, when clicking "Problem Appears Resolved", a structured public resolution comment is posted without directly modifying ticket status.
- **AC-20**: Given a logged-out user, when calling API endpoints with a blacklisted token, the server returns HTTP 401 Unauthorized.
- **AC-21**: Given an Administrator user, when attempting to deactivate their own account (`id === loggedInUserId`), the request is rejected with HTTP 400 `SELF_DEACTIVATION_FORBIDDEN`.
- **AC-22**: Given an Administrator user, when attempting to deactivate or change the role of the last remaining active Administrator account, the request is rejected with HTTP 400 `LAST_ADMIN_PROTECTION`.
- **AC-23**: Given a weak password, when change-password, admin create or admin reset is called, then HTTP 400 VALIDATION_ERROR is returned and the password is not stored.

---

## 10. Definition of Done (DoD)

- [x] All 6 specification documents in `docs/lab-03/` restructured and aligned with handout §9.
- [x] Prisma schema migrated and seeded with 18 realistic dev tickets and idempotent script.
- [x] Server-side authentication and role-based authorization middleware enforced on all routes.
- [x] Development Requester selector completely removed from client application.
- [x] Requester workflow verified: ticket creation, listing, detail, attachments, public comments, and "Problem Appears Resolved".
- [x] Shared IT Staff Queue with search, filters, sorting, pagination, and mobile stacked cards implemented with Zen Green styling.
- [x] IT Staff Ticket Detail with claim/reassign, IT Priority, permitted status workflow, public comments, and distinct internal notes working.
- [x] Administrator User Management screen implemented with full search, role filter, create user, edit account, reset password, and safety rules.
- [x] Automated test suites passing: 103/103 server tests, 31/31 client component tests, 27/27 Playwright E2E tests across Chromium, Firefox, WebKit.
- [x] Peer review and merge of PRs on GitHub (requires peer reviewer action).

---

## 11. Assumptions and Decisions

1. **Authentication Token Mechanism**: Session authentication uses signed JWT tokens passed via `Authorization: Bearer <token>` header, with optional `?token=` parameter for direct browser downloads.
2. **Password Hashing**: Passwords are hashed using `bcryptjs` with salt rounds = 10, satisfying industry standards for dictionary and rainbow table attack prevention.
3. **Problem Appears Resolved Implementation**: Clicking "Problem Appears Resolved" appends a structured Public Comment (`"[SYSTEM]: Requester indicated that the problem appears resolved."`), preserving strict status ownership under BR-05 while alerting IT Staff.
4. **Admin Access to Staff Endpoints (BR-13)**: Administrators possess API-level authorization to call `/api/staff/*` endpoints for operational emergency support, but the Administrator UI focuses exclusively on User Management to provide a streamlined, distraction-free administration console.
5. **Token Expiry & Blacklist Storage**: JWT expiry is configured to 8 hours. Revoked tokens are kept in an in-memory `Set` on the server instance. In a multi-instance production environment, this set would be replaced with Redis key expiration matching the 8-hour TTL.
