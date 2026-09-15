# Lab 3 REST API Specification

## 1. Authentication & Authorization Mechanism

### 1.1 Session Handling
- **Header**: `Authorization: Bearer <token>`
- **Token Format**: Signed JSON Web Token (JWT) or secure session token encoding `userId`, `email`, `role`, and `mustChangePassword`.
- **Error Response Format**: Standardized error envelope used across all endpoints:
```json
{
  "error": {
    "code": "UNAUTHORIZED | FORBIDDEN | VALIDATION_ERROR | NOT_FOUND | CONFLICT | INTERNAL_ERROR",
    "message": "Human-readable description of error.",
    "fields": {
      "fieldName": "Specific validation message"
    }
  }
}
```

---

## 2. API Endpoints Contract

### 2.1 Authentication Endpoints

#### `POST /api/auth/login`
- **Description**: Authenticate active user email and password.
- **Request Body**:
```json
{
  "email": "user@toktickit.com",
  "password": "Password123!"
}
```
- **Response 200 OK**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": 1,
    "name": "Jane Requester",
    "email": "user@toktickit.com",
    "role": "REQUESTER",
    "mustChangePassword": false,
    "isActive": true
  }
}
```
- **Errors**:
  - `400 Bad Request`: `VALIDATION_ERROR` (Missing email/password format)
  - `401 Unauthorized`: `INVALID_CREDENTIALS` (Email/password incorrect or user inactive)

#### `POST /api/auth/logout`
- **Description**: Log out current authenticated user session.
- **Header**: `Authorization: Bearer <token>`
- **Response 200 OK**:
```json
{
  "message": "Logged out successfully."
}
```

#### `GET /api/auth/me`
- **Description**: Retrieve current authenticated user profile.
- **Header**: `Authorization: Bearer <token>`
- **Response 200 OK**:
```json
{
  "user": {
    "id": 1,
    "name": "Jane Requester",
    "email": "user@toktickit.com",
    "role": "REQUESTER",
    "mustChangePassword": false,
    "isActive": true
  }
}
```
- **Error 401 Unauthorized**: Session invalid or expired.

#### `POST /api/auth/change-password`
- **Description**: Change user password (clears `mustChangePassword` to `false`).
- **Header**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "currentPassword": "InitialPassword123!",
  "newPassword": "NewStrongPassword123!"
}
```
- **Response 200 OK**:
```json
{
  "message": "Password changed successfully.",
  "mustChangePassword": false
}
```
- **Errors**:
  - `400 Bad Request`: Validation failure (password weak or current password invalid)

---

### 2.2 IT Staff Ticket Queue & Ticket Operations

#### `GET /api/staff/tickets`
- **Description**: Retrieve shared Ticket Queue for IT Staff & Administrators.
- **Authorization**: `STAFF`, `ADMIN`
- **Query Parameters**:
  - `search`: String (searches ticketNumber, summary, description)
  - `status`: String (NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CLOSED, REOPENED, CANCELLED)
  - `priority`: String (LOW, MEDIUM, HIGH, URGENT)
  - `categoryId`: Integer
  - `relatedSystemId`: Integer
  - `ownerId`: Integer or `"unassigned"`
  - `sort`: String (`createdAt_desc`, `createdAt_asc`, `updatedAt_desc`, `priority_desc`)
  - `page`: Integer (default 1)
  - `pageSize`: Integer (default 10)
- **Response 200 OK**:
```json
{
  "tickets": [
    {
      "id": 10,
      "ticketNumber": "TXT-2026-001234",
      "summary": "Laptop battery drains quickly",
      "description": "Battery loses charge within 30 minutes...",
      "requestedPriority": "MEDIUM",
      "itPriority": "MEDIUM",
      "currentStatus": "IN_PROGRESS",
      "createdAt": "2026-09-15T08:00:00.000Z",
      "updatedAt": "2026-09-15T09:30:00.000Z",
      "requester": { "id": 1, "name": "Jennifer Anderson", "email": "jennifer@toktickit.com" },
      "category": { "id": 2, "name": "Hardware" },
      "relatedSystem": { "id": 1, "name": "Corporate Laptop" },
      "owner": { "id": 5, "name": "Michael Brown", "email": "michael@toktickit.com" }
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "pageSize": 10,
    "totalPages": 5
  }
}
```
- **Error 403 Forbidden**: If requested by role `REQUESTER`.

#### `GET /api/staff/tickets/:id`
- **Description**: Retrieve full ticket detail for IT Staff operation.
- **Authorization**: `STAFF`, `ADMIN`
- **Response 200 OK**: Includes ticket details, requester, category, relatedSystem, owner, attachments, and comments/notes counts.

#### `PATCH /api/staff/tickets/:id/claim`
- **Description**: Claim ticket ownership for logged-in IT Staff user.
- **Authorization**: `STAFF`, `ADMIN`
- **Response 200 OK**:
```json
{
  "ticket": {
    "id": 10,
    "ownerId": 5,
    "owner": { "id": 5, "name": "Michael Brown" }
  }
}
```

#### `PATCH /api/staff/tickets/:id/assign`
- **Description**: Assign or reassign ticket to specific IT Staff or Admin user ID.
- **Authorization**: `STAFF`, `ADMIN`
- **Request Body**:
```json
{
  "ownerId": 6
}
```
- **Response 200 OK**: Updated ticket with new owner.
- **Error 400 Bad Request**: If target `ownerId` is not an active Staff/Admin user.

#### `PATCH /api/staff/tickets/:id/priority`
- **Description**: Update IT Priority.
- **Authorization**: `STAFF`, `ADMIN`
- **Request Body**:
```json
{
  "itPriority": "HIGH"
}
```
- **Response 200 OK**: Updated ticket.

#### `PATCH /api/staff/tickets/:id/status`
- **Description**: Update ticket status following transition matrix.
- **Authorization**: `STAFF`, `ADMIN`
- **Request Body**:
```json
{
  "status": "RESOLVED"
}
```
- **Response 200 OK**: Updated ticket.
- **Error 400 Bad Request**: If status transition is invalid according to BR-10.

---

### 2.3 Public Comments & Internal Notes

#### `GET /api/tickets/:id/comments`
- **Authorization**: Requester (Ticket Owner), Staff, Admin
- **Response 200 OK**:
```json
{
  "comments": [
    {
      "id": 1,
      "ticketId": 10,
      "content": "We are investigating the issue on your device.",
      "createdAt": "2026-09-15T09:00:00.000Z",
      "author": { "id": 5, "name": "Michael Brown", "role": "STAFF" }
    }
  ]
}
```

#### `POST /api/tickets/:id/comments`
- **Authorization**: Requester (Ticket Owner), Staff, Admin
- **Request Body**:
```json
{
  "content": "Thank you for the update. Please let me know if you need any additional info."
}
```
- **Response 201 Created**: Returns created comment object.

#### `GET /api/tickets/:id/notes`
- **Authorization**: `STAFF`, `ADMIN` ONLY (Forbidden 403 for `REQUESTER`)
- **Response 200 OK**:
```json
{
  "notes": [
    {
      "id": 1,
      "ticketId": 10,
      "content": "Replaced battery module under warranty.",
      "createdAt": "2026-09-15T09:15:00.000Z",
      "author": { "id": 5, "name": "Michael Brown", "role": "STAFF" }
    }
  ]
}
```

#### `POST /api/tickets/:id/notes`
- **Authorization**: `STAFF`, `ADMIN` ONLY (Forbidden 403 for `REQUESTER`)
- **Request Body**:
```json
{
  "content": "Internal check complete. Scheduled diagnostic scan."
}
```
- **Response 201 Created**: Returns created internal note object.

---

### 2.4 Administrator User Management

#### `GET /api/admin/users`
- **Authorization**: `ADMIN` ONLY
- **Query Parameters**: `search` (name or email), `role` (`REQUESTER`, `STAFF`, `ADMIN`)
- **Response 200 OK**:
```json
{
  "users": [
    {
      "id": 1,
      "name": "Jennifer Anderson",
      "email": "jennifer@toktickit.com",
      "role": "REQUESTER",
      "isActive": true,
      "createdAt": "2026-09-15T08:00:00.000Z"
    }
  ]
}
```

#### `POST /api/admin/users`
- **Authorization**: `ADMIN` ONLY
- **Request Body**:
```json
{
  "name": "Alex Thompson",
  "email": "alex.thompson@toktickit.com",
  "role": "STAFF",
  "isActive": true,
  "initialPassword": "InitialPassword123!"
}
```
- **Response 201 Created**: Returns created user object (without password hash).
- **Error 409 Conflict**: If email already exists (BR-14).

#### `PATCH /api/admin/users/:id`
- **Authorization**: `ADMIN` ONLY
- **Request Body**:
```json
{
  "name": "Alex Thompson Updated",
  "role": "STAFF",
  "isActive": false
}
```
- **Response 200 OK**: Updated user object.
- **Errors**:
  - `400 Bad Request`: Attempting to deactivate own account (BR-15) or deactivating the last active Admin (BR-16).

#### `POST /api/admin/users/:id/reset-password`
- **Authorization**: `ADMIN` ONLY
- **Request Body**:
```json
{
  "initialPassword": "NewInitialPassword123!"
}
```
- **Response 200 OK**:
```json
{
  "message": "Initial password updated. User will be prompted to change password on next login."
}
```
