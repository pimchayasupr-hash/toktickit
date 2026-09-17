# Lab 3 UI & Design System Specification

## 1. Design Philosophy & System Continuity

Lab 3 extends the **Zen Green** design language established in Lab 2. All screens, controls, cards, badges, modal dialogs, and typography adhere to the unified visual hierarchy and design tokens of TokTickIT.

### Primary Color Tokens
- **Primary Deep Green**: `#005a36` (Brand header, primary buttons, active state accents)
- **Medium Green Accent**: `#008751` (Hover states, secondary links, active tab borders)
- **Soft Light Accent**: `#e8f5e9` (Card highlight backgrounds, active filter pills)
- **Neutral Dark Slate**: `#1e293b` (Headings, primary body text)
- **Neutral Light Gray**: `#f8fafc` (Page background)
- **Border Gray**: `#e2e8f0` (Input borders, table grid lines)

### Status & Priority Badges
- **Status Badges**:
  - `NEW`: Soft Blue (`bg-blue-100 text-blue-800`)
  - `OPEN` / `IN_PROGRESS`: Soft Amber/Green (`bg-emerald-100 text-emerald-800`)
  - `WAITING_FOR_REQUESTER`: Soft Purple (`bg-purple-100 text-purple-800`)
  - `RESOLVED`: Soft Green (`bg-green-100 text-green-800`)
  - `CLOSED`: Gray (`bg-gray-100 text-gray-800`)
  - `REOPENED`: Orange (`bg-orange-100 text-orange-800`)
  - `CANCELLED`: Red (`bg-red-100 text-red-800`)
- **Priority Badges** (`LOW`, `MEDIUM`, `HIGH`, `URGENT`):
  - `LOW`: Light Gray (`bg-slate-100 text-slate-700`)
  - `MEDIUM`: Blue (`bg-sky-100 text-sky-800`)
  - `HIGH`: Amber (`bg-amber-100 text-amber-800`)
  - `URGENT`: Red (`bg-rose-100 text-rose-800`)

---

## 2. Screen Specifications

### 2.1 Login & Mandatory Password Change Screen
- **Login View**:
  - Centered Zen Green card on neutral gray background.
  - Header with TokTickIT logo and title "Sign in to your account".
  - Inputs for Email Address and Password with inline validation.
  - Submit button: "Sign In" (Deep Green `#005a36` with loading spinner during submission).
  - Error Feedback: Banner alert for invalid credentials or inactive accounts without revealing account existence secrets.
- **Mandatory Change Password View**:
  - Appears automatically when authenticated user has `mustChangePassword = true`.
  - Notice alert: *"You must change your initial password before continuing to the application."*
  - Inputs: Current (Temporary) Password, New Password, Confirm New Password.
  - Live Validation checklist: Minimum 8 characters, upper & lower case, number, special character.
  - Submit button: "Update Password & Continue".

### 2.2 Application Shell & Navigation Header
- **Replaces Development Requester Selector**:
  - Header shows logged-in User's Full Name and Role Badge (`Requester`, `IT Staff`, `Administrator`).
  - Dropdown or direct button for "Logout" which clears authenticated state and redirects to Login.
- **Role-Based Navigation Tabs**:
  - `Requester`: "My Tickets", "Create Ticket"
  - `IT Staff`: "Shared Ticket Queue"
  - `Administrator`: "User Management"

### 2.3 IT Staff Ticket Queue Screen
- **Header & Search/Filter Bar**:
  - Search input with magnifying glass icon: "Search by ticket number, summary..."
  - Filter Selects: Status, Category, Related System, Priority, Owner.
  - Sort Select: Created Date (desc/asc), Updated Date, Priority.
  - Results Counter: "Showing X of Y tickets".
- **Desktop Data Table**:
  - Columns: Ticket No, Created Date, Summary, Category, Requested Priority, IT Priority, Current Status, Owner, Actions.
  - Clickable row or "View Detail" button to open IT Staff Ticket Detail.
- **Mobile Responsive Card List**:
  - Card layout for screen width < 768px displaying summary, ticket number, status badge, IT priority badge, and owner.
- **Pagination Footer**:
  - Page number indicators, Previous / Next buttons, Page size dropdown (10, 25, 50).

### 2.4 IT Staff Ticket Detail Screen
- **Header Action Bar**:
  - Back to Queue button.
  - Ticket Number & Current Status Badge.
  - Owner Controls: "Claim Ticket" (if unassigned/assigned to someone else) or Reassign dropdown.
  - IT Priority Dropdown: Allows modifying IT Priority.
  - Status Workflow Dropdown: Permitted transitions based on current status.
- **Read-Only Ticket Info Panel**:
  - Requester Name, Email, Category, Related System, Requested Priority, Created Date, Description, Attachments list.
- **Communication Section (Visually Distinct Tabs or Side-by-Side Panels)**:
  - **Public Comments Tab**: Shared timeline with green accent borders, author name badge, creation timestamp. Public comment composer text area + "Post Comment" button.
  - **Internal Notes Tab**: Yellow/amber shaded background with private lock icon notice (*"Internal Notes - Visible only to IT Staff & Admins"*). Internal note composer text area + "Add Internal Note" button.

### 2.5 Requester Ticket Detail Updates
- **Public Comments Section**: Rendered below ticket description, showing all public comments. Includes text area to post new public comment.
- **"Problem Appears Resolved" Action**: Zen Green outlined button on Requester Ticket Detail. Clicking opens confirmation modal: *"Indicate that your issue is resolved? This will notify IT Staff."* On confirmation, posts a system public comment without breaking BR-05.

### 2.6 Administrator User Management Screen
- **Header Bar**: Title "User Management" + Primary Button "+ Create New User".
- **Search & Filter Controls**: Text input for searching Name/Email + Role Filter dropdown (`All Roles`, `Requester`, `IT Staff`, `Administrator`).
- **User Table**:
  - Columns: Name, Email, Role (Badge), Status (Active / Inactive Badge), Actions (Edit, Reset Password).
- **Create User Modal**:
  - Inputs: Full Name, Email Address, Role (Dropdown: Requester / IT Staff / Administrator), Active Status (Toggle Switch), Initial Password input.
  - Actions: "Save User", "Cancel".
- **Edit User Modal**:
  - Inputs: Full Name, Email, Role, Active Status (Toggle Switch).
  - Validation: Prevents disabling current Admin user or disabling last active Admin with inline alert.
- **Reset Initial Password Modal**:
  - Input: New Initial Password. Sets `mustChangePassword = true` for the user upon next sign-in.

---

## 3. Responsive & Accessibility Checklist

- **Responsive Breakpoints**:
  - Desktop: ≥ 1024px (Full data tables, multi-column forms)
  - Tablet: 768px – 1023px (Compact table margins, responsive filter grids)
  - Mobile: < 768px (Stacked cards for queue, full-width modal dialogs, drawer navigation)
- **Accessibility**:
  - High contrast text (`#1e293b` on light background).
  - All interactive elements have descriptive `aria-label` or visible label text.
  - Keyboard navigation: Tab indices, Esc key closes modals, Enter submits forms.
  - Form validation errors announced visually near input fields with distinct alert icons.
