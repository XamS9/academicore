# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Academicore is an academic management system (university/college) with a monorepo structure. The UI uses Spanish-language routes and labels. The working directory is `apps/` inside the monorepo root.

## Commands

All commands below assume you're in the monorepo root (`../` from `apps/`). The root uses npm workspaces.

### Development

```bash
npm run dev              # Start both backend and frontend concurrently
npm run dev:backend      # Backend only (ts-node-dev with auto-reload, port 3000)
npm run dev:frontend     # Frontend only (Vite dev server)
```

### Build

```bash
npm run build:backend    # tsc
npm run build:frontend   # tsc && vite build
```

### Database

```bash
npm run prisma:generate  # Generate Prisma client after schema changes
npm run prisma:migrate   # Run migrations (prisma migrate dev)
npm run prisma:studio    # Open Prisma Studio GUI
# From apps/backend:
npm run prisma:seed      # Seed database
npm run db:setup         # Migrate + seed + print reminder for manual SQL triggers
```

### Frontend Lint

```bash
cd apps/frontend && npm run lint   # eslint src --ext ts,tsx
```

### No test runner is configured.

## Architecture

### Monorepo Layout

```
/                        # Monorepo root (npm workspaces)
├── apps/backend/        # Express.js REST API (@academicore/backend)
├── apps/frontend/       # React SPA (@academicore/frontend)
└── docker-compose.yml   # PostgreSQL 16 + backend containers
```

### Backend (Express + Prisma + Zod)

- **Stack**: Express 4, Prisma ORM (PostgreSQL), Zod validation, JWT auth (access + refresh tokens), bcryptjs
- **Entry**: `src/main.ts` bootstraps the server, auto-seeds in non-production if DB is empty
- **App setup**: `src/app.ts` mounts all module routers under `/api`
- **Env validation**: `src/config/env.ts` validates all env vars with Zod at startup (fails fast)

#### Module Pattern (every module follows this)

Each module in `src/modules/<name>/` has 5 files:
- `<name>.router.ts` — Express router with `authenticate`/`authorize` middleware
- `<name>.controller.ts` — Class with arrow-function handlers, delegates to service, calls `next(err)` on failure
- `<name>.service.ts` — Class with Prisma queries, throws `HttpError` for 404s
- `<name>.dto.ts` — Zod schemas + inferred TypeScript types (e.g., `CreateXDto`, `UpdateXDto`)
- `index.ts` — Re-exports router and service

#### Auth & Authorization

- `src/middleware/auth.middleware.ts`: `authenticate` verifies Bearer JWT, `authorize(...roles)` checks role membership
- JWT payload (`JwtPayload`): `sub` (user id), `email`, `roles[]`, `userType`
- Three user types: `ADMIN`, `TEACHER`, `STUDENT`
- Soft deletes: most entities use `deletedAt` field, services filter with `where: { deletedAt: null }`

#### Shared Utilities

- `src/shared/http-error.ts` — `HttpError` class (statusCode + message)
- `src/shared/prisma.client.ts` — Singleton Prisma client
- `src/shared/seed.ts` — Seed logic (imported by both `prisma/seed.ts` and auto-seed in `main.ts`)

#### Database Schema

Prisma schema at `prisma/schema.prisma`. Key models: User (supertype) → Student/Teacher (subtypes), Career, Subject (with prerequisites), AcademicPeriod, Group, Enrollment → EnrollmentSubject, Evaluation → Grade, AcademicRecord, Certification, AuditLog. All tables use `@@map("snake_case")` for DB naming while Prisma models use PascalCase. SQL triggers/stored procedures in `src/migrations/001_trigger_and_sp.sql` must be applied manually.

### Frontend (React + Vite + MUI + Tailwind)

- **Stack**: React 18, React Router 6, MUI 6, Tailwind CSS 3, Axios
- **API client**: `src/services/api.ts` — Axios instance with JWT interceptor (auto-attaches token, redirects to `/login` on 401)
- **Auth state**: `src/store/auth.context.tsx` — React Context with `AuthProvider`, stores token and user in localStorage
- **Routing**: `src/App.tsx` — Public routes (`/login`, `/verify`), authenticated routes wrapped in `AppLayout`
- **Service layer**: `src/services/<name>.service.ts` — One service file per backend module, all use the shared Axios instance
- **Routes use Spanish paths**: `/usuarios`, `/estudiantes`, `/profesores`, `/carreras`, `/materias`, `/periodos`, `/aulas`, `/grupos`

## Environment Variables

Copy `.env.example` to `.env` at the monorepo root. Required vars:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — Min 32 chars each
- `VITE_API_URL` — Frontend API base URL (default: `http://localhost:3000/api`)
