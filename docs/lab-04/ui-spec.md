# Lab 4 UI & Design System Specification
## TokTickIT: Actions Taken, Dashboards, and UI Hardening

---

## 1. Design Philosophy & Design System Continuity

Lab 4 maintains and enhances the **Zen Green** enterprise design language established across Labs 2 and 3. All screens, dashboard metric cards, forms, modals, tables, badges, and typography strictly follow the unified visual tokens. The frontend is built using **Bootstrap 5 + Custom CSS Tokens** (Tailwind CSS is omitted).

### 1.1 Zen Green Token Palette
- **Brand Primary Green (`--color-primary`)**: `#006B3C` (Header navbar, primary action buttons, key metrics, active tab indicators). Contrast ratio against white: **8.4:1** (exceeds WCAG AAA).
- **Secondary Accent Green (`--color-accent`)**: `#008751` (Hover states, active card borders, success badges).
- **Surface Pastel Mint (`--color-surface-mint`)**: `#e8f5e9` (Dashboard metric card backgrounds, highlight banners, soft accents).
- **Dark Slate Text (`--color-text-primary`)**: `#1e293b` (Primary headings, data table contents, form labels).
- **Muted Slate Text (`--color-text-secondary`)**: `#64748b` (Timestamps, helper instructions, secondary metadata).
- **Border Neutral (`--color-border`)**: `#e2e8f0` (Card borders, dividers, form input borders).
- **Background Slate (`--color-bg-body`)**: `#f8fafc` (Page background for optimal readability).
- **Attention Amber (`--color-warning`)**: `#f59e0b` (Background `#fef3c7`, text `#92400e` for `WAITING_FOR_REQUESTER` alert banners).
- **Urgent Crimson (`--color-danger`)**: `#dc2626` (Background `#fee2e2`, text `#991b1b` for urgent priority badges and conflict warnings).

### 1.2 Status & Priority Badges (CSS Token Classes)
Rounded pill badges (`.tkt-pill`, `.badge.rounded-pill`) provide high visual recognition:

| Class | Entity Value | Background / Text | Semantic Meaning |
|---|---|---|---|
| `.tkt-pill-status-new` | `NEW` | `#dbeafe` / `#1e40af` (Soft Blue) | Newly created ticket |
| `.tkt-pill-status-open` | `OPEN` | `#e0f2fe` / `#0369a1` (Sky Blue) | Acknowledged by IT Staff |
| `.tkt-pill-status-in-progress` | `IN_PROGRESS` | `#fef3c7` / `#92400e` (Amber Gold) | Active investigation/remediation |
| `.tkt-pill-status-waiting` | `WAITING_FOR_REQUESTER` | `#f3e8ff` / `#6b21a8` (Lavender Purple) | Awaiting requester reply |
| `.tkt-pill-status-resolved` | `RESOLVED` | `#dcfce7` / `#166534` (Soft Mint) | Work completed, awaiting confirmation |
| `.tkt-pill-status-closed` | `CLOSED` | `#f1f5f9` / `#475569` (Cool Slate) | Formally closed |
| `.tkt-pill-status-reopened` | `REOPENED` | `#fee2e2` / `#991b1b` (Muted Red) | Reopened for rework |
| `.tkt-pill-status-cancelled` | `CANCELLED` | `#f1f5f9` / `#64748b` (Neutral Gray) | Withdrawn/cancelled |

**Priority Badges**:
- **Low** (`.tkt-pill-priority-low`): `#f1f5f9` / `#475569`
- **Medium** (`.tkt-pill-priority-medium`): `#e0f2fe` / `#0369a1`
- **High** (`.tkt-pill-priority-high`): `#fef3c7` / `#92400e`
- **Urgent** (`.tkt-pill-priority-urgent`): `#fee2e2` / `#991b1b`

---

## 2. Navigation Architecture & Role Isolation

```
[TokTickIT Logo]
├── Requester Role
│   ├── "Dashboard" -> /requester/dashboard
│   ├── "My Tickets" -> /requester/tickets
│   └── "Create Ticket" -> /requester/tickets/new
├── IT Staff Role
│   ├── "Dashboard" -> /staff/dashboard
│   └── "Ticket Queue" -> /staff/queue
└── Administrator Role
    ├── "Dashboard" -> /staff/dashboard (with user account metrics)
    └── "User Management" -> /admin/users
[Right Side]: [User Full Name] [Role Badge] | [Logout Button]
```

- **Active State Indication**: Current navigation item features `aria-current="page"`, a solid `#006B3C` underline or pill highlight, and bold typography.
- **Breadcrumbs**: Clear hierarchical trails:
  - `Dashboard > Ticket Detail`
  - `Ticket Queue > Ticket Detail`
  - `My Tickets > Ticket Detail`

---

## 3. Screen Layout Specifications

### 3.1 IT Staff & Administrator Dashboard (`StaffDashboard.tsx`)

#### Layout Grid:
- **Header**: Greeting ("Welcome back, [Name]"), role badge, last-synced timestamp, and "🔄 Refresh Metrics" button.
- **Row 1 — Primary Operational Metric Cards (4-column grid on desktop, 2 on tablet, 1 on mobile)**:
  1. **Unassigned Queue**: Large count badge, "Tickets needing triage", drill-down button navigating to `/staff/queue?owner=unassigned`.
  2. **My Assigned Tickets**: Large count badge, "Active tickets assigned to you", drill-down button navigating to `/staff/queue?owner=me`.
  3. **High & Urgent Tickets**: Large count badge, "High & Urgent non-terminal", drill-down button navigating to `/staff/queue?priority=HIGH,URGENT`.
  4. **Open Total**: Overall active volume across the organization.
- **Row 2 — Two-Column Content Grid (Desktop 8:4 split, Mobile stacked)**:
  - **Left Column (Primary)**:
    - **Urgent Attention Queue**: Top 5 tickets with `itPriority = 'URGENT'`, displaying Ticket No, Summary, Requester, Time in Queue, and "Open Detail" action button.
    - **Status & Priority Distribution**: Visual breakdown of tickets by status with count pills. Clicking any status pill drills down to `/staff/queue?status=[STATUS]`.
  - **Right Column (Personal Activity & Actions)**:
    - **My Recent Actions Taken**: Card listing the 5 most recent actions performed by the logged-in user (`performedById = user.id`), showing action timestamp, Ticket No, brief description, and result pill.
    - **Administrator Panel (Rendered only for `ADMIN` role)**: User count breakdown (Total Users, Active Requesters, Active Staff, Active Admins) with quick link to `/admin/users`.
    - **Quick Actions Bar**: Fast links to "Go to Ticket Queue", "Create New Ticket", and "System Health".

### 3.2 Requester Dashboard (`RequesterDashboard.tsx`)

#### Layout Grid:
- **Header**: "My Support Dashboard", summary of account tickets, and "➕ Create Ticket" primary button (`.tkt-btn-action-primary`).
- **Attention Banner (Conditional)**: Renders prominently in soft amber (`#fef3c7`) if any tickets are in `WAITING_FOR_REQUESTER`, stating: *"You have [N] ticket(s) awaiting your feedback. Please review and reply to keep investigation moving."*
- **Row 1 — Metric Cards (4-column grid)**:
  1. **Total Open Tickets**: Non-terminal tickets (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `REOPENED`). Links to `/requester/tickets?status=open`.
  2. **Waiting for My Feedback**: Tickets in `WAITING_FOR_REQUESTER`. Links to `/requester/tickets?status=WAITING_FOR_REQUESTER`.
  3. **Recently Resolved (Last 30 Days)**: Resolved tickets awaiting verification. Links to `/requester/tickets?status=RESOLVED`.
  4. **Closed Tickets**: Lifetime closed tickets count.
- **Row 2 — Recent Tickets Table / Card List**:
  - Displays the 5 most recently updated tickets owned by the requester.
  - Columns / Card fields: Ticket Number, Summary, Current Status Pill, Updated Timestamp, Action link ("View Details").
  - Empty state when 0 tickets exist: Zen Green illustration with "No tickets submitted yet. Need help? Create your first ticket!"

---

### 3.3 Actions Taken Subsystem on Ticket Detail (`ActionsTakenSection.tsx`)

Located on the Ticket Detail screen directly below the ticket summary and above the Public Comments thread.

#### 1. Header & Controls:
- Section Heading: `🛠️ Actions Taken ([Count])`.
- IT Staff / Admin: "+ Add Action Taken" button (disabled if ticket is in `CLOSED` or `CANCELLED`).
- Requester: Displays count with informative subtitle: *"Chronological log of diagnostic and remediation actions performed by IT Staff."*

#### 2. Action Taken Card / Row Elements:
Each entry renders in a clean card (`.tkt-action-card`):
- **Card Header**:
  - Left: Status Badge (`⏳ Pending`, `⚙ In Progress`, `✓ Completed`, `✕ Cancelled`), Action Date/Time formatted in `Asia/Bangkok` (`YYYY-MM-DD HH:mm`), Performed by badge (Performer Name), Assignee badge (`👤 Assignee: [Name]`).
  - Right: Follow-up badge (`Follow-up Required` in amber), Terminal lock label (`(Terminal / Immutable)` for Completed and Cancelled actions), Quick Transition buttons (`Start Work`, `Complete`, `Cancel`), and Edit button (Staff/Admin only on non-terminal actions).
- **Card Body**:
  - **Action Description**: Clearly labeled technical action text.
  - **Action Result (Conditional)**: Clearly labeled outcome text in distinct bordered container (mandatory when transitioning to `COMPLETED`).
  - **Follow-up Note (Conditional)**: Shown if `followUpRequired = true`, highlighting pending follow-up items.
  - **Attachment Notes (Conditional)**: Shown if text is present, in monospace font or distinct callout container.
- **Audit Footer**: "Created [Timestamp] by [User]" • If edited: "Edited [Timestamp] by [User] (v[Version])".

#### 2.1 Ticket Status History Timeline Card (`StaffTicketDetail.tsx` & `TicketDetail.tsx`):
- **Card Title**: `📜 Ticket Status History ([Count])`
- **Audit Subtitle**: `Append-Only Audit Log`
- **Timeline Items**: Each row displays `[fromStatus] → [toStatus]`, changed by `[Performer Name] ([Role])`, and localized timestamp (`Asia/Bangkok`).
- **Read-Only / Isolation**: Requesters view status history for their own tickets in a dedicated tab without mutation controls.

#### 3. Create Mode Modal / Form:
- **Action Date & Time**: Native datetime-local input, initialized to current time. Cannot exceed `now() + 5 minutes` and cannot precede `Ticket.createdAt`.
- **Action Description**: Textarea (1–2000 chars), with live character counter.
- **Action Result**: Textarea (1–1000 chars), with live character counter.
- **Follow-up Required Checkbox**: Toggle input.
- **Follow-up Note**: Appears conditionally with smooth transition when checkbox is checked. Marked mandatory (`*`).
- **Attachment Notes**: Textarea (max 1000 chars), placeholder: *"Describe document, image, or log to look for (e.g. 'See router crash dump under /var/log/syslog on 2026-10-19')."*
- **Form Actions**: "Cancel" (resets form and closes) and "Save Action" (`.tkt-btn-action-primary`).
- **Pending Submission**: Button displays animated spinner and text "Saving...", disabled to prevent duplicate submission.

#### 4. Edit Mode & Concurrency Protection:
- Same fields as create mode, pre-populated with existing action values.
- Submits existing `version`.
- **Conflict Handling (409)**: If another user modified the action in the interim, the form stays open with entered data preserved, rendering a red warning banner:
  *"Conflict Detected: This action was updated by another staff member while you were editing. Please review the latest data before retrying."*
  with a secondary button *"Reload Latest Data"*.

---

### 3.4 Ticket Workflow Controls & Resolution Gate

Located in the Ticket Detail sidebar/action panel:

- **Status Transition Selector**: Displays a dropdown or action buttons showing **strictly permitted next statuses** according to the BR-12 transition matrix and user role.
- **Resolution Gate UX**:
  - When selecting `RESOLVED`, the UI checks:
    1. Is an owner assigned? If not, displays warning: *"Cannot resolve: Ticket must be claimed or assigned to an IT Staff member."*
    2. Does the ticket have at least one Action Taken with a result? If not, displays warning: *"Cannot resolve: At least one Action Taken with a documented result is required."*
    3. Are follow-up notes complete?
  - If gate passes, renders confirmation modal: *"Are you sure you want to resolve this ticket? Please verify that all troubleshooting steps and results are documented."*
- **Requester "Problem Appears Resolved" Button**:
  - Visible only to Requester on active tickets.
  - Displays descriptive label: *"Problem Appears Resolved"*.
  - Modal prompt: *"This will notify IT Staff that your issue appears resolved so they can review actions and formally close the ticket."*
  - Does NOT alter `currentStatus`. Appends system Public Comment.

---

## 4. UI States & Feedback Standards

| State | Visual Presentation | Behavior / Accessibility |
|---|---|---|
| **Loading** | Shimmer skeleton cards on dashboard; spinner on action save | `aria-busy="true"`, buttons disabled |
| **Empty State** | Centered Zen Green icon, friendly headline, instructional text, and primary call to action | Tab order maintained, guidance clear |
| **Form Validation Error** | Red outline on invalid field (`.is-invalid`), specific error message below field | Focus moves to first invalid field, `aria-invalid="true"` |
| **Conflict (409)** | Red alert banner with warning icon and "Reload Latest Data" action | Form inputs preserved so user does not lose input work |
| **Not Found (404)** | Error card: "Ticket or Action Taken not found." | Includes "← Back to Ticket Queue" link |
| **Forbidden (403)** | Red alert: "You do not have permission to perform this action." | Explains role requirement clearly |
| **Success Banner** | Soft green toast (`#dcfce7`, text `#166534`) | `aria-live="polite"`, auto-dismisses or dismissible via close button |

---

## 5. Responsive Breakpoint Rules

| Viewport | Width | Layout Rules | Overflow Prevention |
|---|---|---|---|
| **Desktop** | ≥ 1024px / 1280px | Full multi-column dashboard (4-card metric grid, 2-column detailed breakdown); multi-column Actions Taken table/cards. | Standard responsive container. |
| **Tablet** | 768px – 1023px | 2-column metric cards; stacked detailed widgets; compact Actions Taken cards. | Horizontal table scrolling prevented via column prioritization. |
| **Mobile** | 360px – 767px | Single-column metric cards; stacked Action Taken cards with wrapping text; minimum 44px tap targets; sticky quick action bar. | Strictly verified: `scrollWidth <= clientWidth` (zero page-level horizontal overflow). |

---

## 6. Accessibility & Compliance (WCAG 2.1 AA)

1. **Color Contrast**: All text elements meet or exceed WCAG AA ratio (4.5:1 for normal text, 3:1 for large text). Primary Green `#006B3C` achieves **8.4:1**.
2. **Keyboard Navigation**: All interactive elements (metric cards, buttons, dropdowns, form inputs, modal dialogs) are fully operable via Tab, Enter, Space, and Escape keys.
3. **Focus Indicators**: Visible focus outline (`2px solid #006B3C` with `2px offset`) on all focused elements.
4. **Modal Focus Trap**: Modals trap keyboard focus while open, close on Escape key, and return focus to the triggering element upon closure.
5. **Form Labels & ARIA**: Every input possesses an explicit `<label for="...">`, mandatory fields feature `aria-required="true"`, and validation errors link via `aria-describedby`.
6. **Non-Color Status Cues**: Status pills combine distinct background colors, explicit text labels, and semantic iconography (e.g., checkmark for Resolved, clock for Waiting).
