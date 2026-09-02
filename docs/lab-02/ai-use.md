# Lab 2 — AI Use and Reflection

**LLM / AI Tool Used:** Google Antigravity (AGY) powered by Gemini 3.6 Flash.

## Selected Key Prompts

| # | Prompt Name | Actual Prompt Text |
| :--- | :--- | :--- |
| 1 | Lab 2 Spec Verification | "https://github.com/ploychanokimsu-lgtm/toktickit/pull/22/changes ช่วยเข้าไปดูงานเพื่อนและรีวิวให้หน่อยจริงนะเข้าไปดูจริงๆ" |
| 2 | Implementation Planning | "เรามาทำแล็บสองตามไฟล์ PDF ที่ส่งมาแล้วก็สี่ไฟล์นี้ที่ฉันทำมาแล้ว" |
| 3 | Prisma Models & Seed | "Extend Prisma schema for Lab 2 models (Requester, Category, RelatedSystem, Ticket, Attachment) and update seed script for idempotent execution." |
| 4 | Express REST APIs | "Implement Express backend endpoints for Lab 2: /api/requesters, /api/related-systems, /api/tickets (CRUD, search, filter, sort, pagination), attachment upload, download, and soft removal." |
| 5 | Zen Green Theme & UI | "Build Zen Green design system tokens and responsive React components (DevRequesterSelect, Navbar, MyTickets, CreateTicket, TicketDetail) adhering to ui-spec.md." |
| 6 | API & Integration Testing | "Write backend Supertest integration tests for Lab 2 endpoints and verify ownership protection and attachment handling." |
| 7 | UI Testing Suite | "Write frontend Vitest integration tests for Development Requester switching, ticket list filtering, and form state transitions." |
| 8 | Screenshot Directories Setup | "Create artifacts/lab-02/screenshots/create-ticket/, my-tickets/, and ticket-detail/ with .gitkeep files for Git tracking per Section 12." |
| 9 | Playwright E2E Testing | "Set up Playwright for E2E testing in e2e/lab-02/requester-ticket-flow.spec.ts covering inactive requester exclusion, requester selection, ticket creation, and My Tickets verification." |

## My Reflection

Using Google Antigravity with Gemini 3.6 Flash significantly accelerated the Lab 2 sprint. The AI helped interpret complex engineering specifications, generate clean Prisma schema models, set up Express middleware for requester header validation and file uploads, and build responsive Zen Green UI components.

**Key Learnings & Experience:**
- **Strict Ownership Protection:** Working with the AI reinforced the importance of backend-level ownership validation for tickets and attachments rather than relying solely on frontend UI filtering.
- **Idempotent Seeding & Migration Safety:** Updating Prisma schema and writing idempotent `upsert` seed scripts ensured database setup remains reliable and repeatable across environments.
- **Responsive UI & Test Traceability:** Implementing dual desktop table / mobile card views while keeping Vitest test assertions precise proved to be a valuable lesson in full-stack testing discipline.
