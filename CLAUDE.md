# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Academicore is a university/college academic management system. Monorepo with npm workspaces: Express REST API backend + React SPA frontend. The UI uses Spanish-language routes and labels.

## Commands

All commands run from the monorepo root.

```bash
# Development
npm run dev                # Both backend + frontend concurrently
npm run dev:backend        # Backend only (ts-node-dev, port 3000)
npm run dev:frontend       # Frontend only (Vite dev server)

# Build
npm run build:backend      # tsc
npm run build:frontend     # tsc && vite build

# Database
npm run prisma:generate    # Regenerate Prisma client after schema changes
npm run prisma:migrate     # Run migrations (prisma migrate dev)
npm run prisma:studio      # Open Prisma Studio GUI
cd apps/backend && npm run prisma:seed   # Seed database
cd apps/backend && npm run db:setup      # Migrate + seed + reminder for manual SQL

# Lint (no test runner configured)
cd apps/frontend && npm run lint         # eslint src --ext ts,tsx
```

**Manual SQL step**: After migrations, apply `apps/backend/src/migrations/001_trigger_and_sp.sql` for triggers and stored procedures.

## Architecture

```
/                           # Monorepo root (npm workspaces)
├── apps/backend/           # Express.js REST API (@academicore/backend)
├── apps/frontend/          # React SPA (@academicore/frontend)
└── docker-compose.yml      # PostgreSQL 16 + backend containers
```

### Backend (Express 4 + Prisma 5 + Zod 3)

- **Entry**: `src/main.ts` — bootstraps server, auto-seeds in non-production if DB is empty
- **App**: `src/app.ts` — mounts all module routers under `/api`
- **Env**: `src/config/env.ts` — Zod validation of all env vars at startup (fail-fast)

#### Module pattern (every module in `src/modules/<name>/`)

5 files per module:
| File | Role |
|------|------|
| `<name>.router.ts` | Express router with `authenticate`/`authorize` middleware |
| `<name>.controller.ts` | Arrow-function handlers, parses Zod DTOs, delegates to service, calls `next(err)` |
| `<name>.service.ts` | Prisma queries, throws `HttpError` for business errors |
| `<name>.dto.ts` | Zod schemas + inferred TS types (`CreateXDto`, `UpdateXDto`) |
| `index.ts` | Re-exports router and service |

#### Auth & authorization

- `src/middleware/auth.middleware.ts`: `authenticate` verifies Bearer JWT; `authorize(...roles)` checks role membership
- JWT payload: `{ sub, email, roles[], userType }` — three user types: `ADMIN`, `TEACHER`, `STUDENT`
- Soft deletes: most entities use `deletedAt` field; services filter with `where: { deletedAt: null }`

#### Shared utilities

- `src/shared/http-error.ts` — `HttpError(statusCode, message)`
- `src/shared/prisma.client.ts` — Singleton Prisma client
- `src/shared/seed.ts` — Seed logic (used by `prisma/seed.ts` and auto-seed in `main.ts`)

#### Error handling

`src/middleware/error.middleware.ts` (must be last middleware): ZodError → 400 with details, HttpError → custom status, anything else → 500.

#### Database schema

Prisma schema at `apps/backend/prisma/schema.prisma`. Key domain model: User (supertype) → Student/Teacher (subtypes), Career → CareerSubject → Subject (with prerequisites), AcademicPeriod, Group (subject+teacher+period), Enrollment → EnrollmentSubject, EvaluationType → Evaluation → Grade, AcademicRecord (trigger-generated final grades), Certification (with verification codes), AuditLog (append-only). All tables use `@@map("snake_case")` while Prisma models use PascalCase.

### Frontend (React 18 + Vite 5 + MUI 6 + Tailwind 3)

- **API client**: `src/services/api.ts` — Axios instance with JWT interceptor (auto-attaches token, redirects `/login` on 401)
- **Auth state**: `src/store/auth.context.tsx` — React Context (`AuthProvider`), stores token/user in localStorage
- **Routing**: `src/App.tsx` — Public: `/login`, `/verify/:code`. Authenticated routes wrapped in `AppLayout`
- **Service layer**: `src/services/<name>.service.ts` — one per backend module, uses shared Axios instance
- **Spanish paths**: `/usuarios`, `/estudiantes`, `/profesores`, `/carreras`, `/materias`, `/periodos`, `/aulas`, `/grupos`

## Environment Variables

Copy `.env.example` → `.env` at monorepo root. Key vars:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — min 32 chars each
- `VITE_API_URL` — frontend API base (default `http://localhost:3000/api`)

## Documentation

- **`docs/processes.md`** — Documents every business process the app handles (enrollment, grading, certification, etc.) including validation steps, actor roles, and automated triggers. **This file must be kept up to date whenever a business process is added, modified, or removed.**
- **`docs/schema.dbml`** — DBML representation of the full database schema (all tables, enums, relationships, indexes, and constraints). **This file must be kept in sync whenever the Prisma schema changes.**

## Docker

`docker-compose.yml` runs PostgreSQL 16 (`academicore_db`) and backend (`academicore_api`). Backend uses multi-stage Dockerfile at `apps/backend/Dockerfile`. DB healthcheck with `pg_isready`.
