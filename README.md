# TokTickIT

TokTickIT (ตอกติ๊กกิต) is an IT service desk application for Account and Access, Hardware, Software,
and Network requests. This repository contains the Lab 1 full-stack foundation:

- **Frontend:** React + TypeScript + Vite + Bootstrap (`client/`)
- **Backend:** Node.js + Express + TypeScript (`server/`)
- **Database:** PostgreSQL accessed via Prisma ORM (`server/prisma/`)
- **Testing:** Vitest (frontend + backend unit/UI tests), Supertest (backend API tests)

> Lab 1 scope: this foundation does **not** implement any API endpoints or UI features yet.
> Those are added in later Issues (see `docs/lab-01/`).

## Prerequisites

- Node.js 18+ and npm
- A running PostgreSQL server (local install or Docker)

## Repository Structure

```
toktickit/
├── client/                # React + TypeScript + Vite + Bootstrap frontend
├── server/
│   ├── prisma/             # Prisma schema, migrations, seed script
│   ├── src/                # Express + TypeScript source
│   └── tests/lab-01/       # Supertest/Vitest backend tests for Lab 1
├── docs/lab-01/            # ai_use.md, reviewer.md, tests.md
├── .gitignore
└── README.md
```

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url> toktickit
cd toktickit

# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your local PostgreSQL credentials:

```bash
cd server
cp .env.example .env
# edit .env and set DATABASE_URL
```

`.env` is git-ignored and must never be committed. Only `.env.example` (with placeholder
values) is tracked.

### 3. Set up the database with Prisma

```bash
cd server
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Run the apps

```bash
# Terminal 1: backend (http://localhost:4000)
cd server
npm run dev

# Terminal 2: frontend (http://localhost:5173)
cd client
npm run dev
```

## Running Tests

```bash
# Frontend (Vitest)
cd client
npm run test

# Backend (Vitest + Supertest)
cd server
npm run test
```

## Tech Stack Constraints

Per the Lab 1 engineering contract, the technology stack below is fixed and must not be
substituted:

| Area         | Required choice                       |
|--------------|----------------------------------------|
| Frontend     | React + TypeScript + Vite + Bootstrap  |
| Backend      | Node.js + Express + TypeScript         |
| Database     | PostgreSQL + Prisma                    |
| Architecture | REST-style APIs                        |
| Testing      | Vitest and Supertest                   |

## Git Workflow

Work happens on feature branches, merged into `lab1-staging` via peer-reviewed Pull
Requests, and eventually into `main`. See `docs/lab-01/reviewer.md` for review records.
