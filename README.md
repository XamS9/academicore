# Academicore

A comprehensive academic management system for universities and colleges. Built as a modern full-stack application with an Express REST API backend and a React web frontend.

## Overview

Academicore provides institutions with tools to manage:
- **Academic Programs** — Careers, subjects, prerequisites, and course organization
- **Enrollment Management** — Student registration, enrollment tracking, and validation
- **Academic Periods** — Organize instruction by semester or academic year
- **Groups & Scheduling** — Create classes (groups) linking teachers, subjects, and periods
- **Grading System** — Multiple evaluation types, grade recording, and academic records
- **Student Certifications** — Generate and verify certificates with QR codes
- **Audit Logging** — Track all system changes for compliance and accountability
- **User Management** — Role-based access control (Admin, Teacher, Student)

**UI Language**: Spanish (routes, labels, and workflows)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + React Router + Material-UI 6 + Tailwind CSS |
| **Backend** | Express 4 + Prisma 5 + Zod |
| **Database** | PostgreSQL 16 |
| **Auth** | JWT (access + refresh tokens) + bcryptjs |
| **Deployment** | Docker & Docker Compose |

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm 10+ (optional: install or switch versions with **[nvm](https://github.com/nvm-sh/nvm)** — e.g. `nvm install 20` then `nvm use 20`)
- **PostgreSQL** 16+ (local or Docker)
- **Git**

### 1. Clone & Install

```bash
git clone <repository-url>
cd academicore
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secrets
```

For local PostgreSQL:
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/academicore"
```

For Docker ComposeComposeForFor Docker Compose (see steFor Docker Compose (see step 3):
 (see steFor Docker Compose (see step 3):
p For Docker Compose (see step 3):
3):
```env
DATABASE_URL="postgresql://academicore:academicore_pass@db:5432/academicore"
```

### 3. Setup Database

**Option A: Local PostgreSQL**
```bash
npm run prisma:migrate    # Run migrations
cd apps/backend
npm run prisma:seed       # Seed with sample data
npm run db:setup          # Reminder for manual SQL triggers
```

**Option B: Docker Compose (includes PostgreSQL)**
```bash
docker-compose up -d      # Start PostgreSQL in background
npm run prisma:migrate
cd apps/backend
npm run prisma:seed
```

### 4. Start Development Servers

```bash
npm run dev
```

This starts both backend (http://localhost:3000) and frontend (http://localhost:5173) concurrently.

**Or separately:**
```bash
npm run dev:backend       # Backend only
npm run dev:frontend      # Frontend only
```

### 5. Login

Visit http://localhost:5173 and log in with seed data credentials (check `apps/backend/prisma/seed.ts`).

## Project Structure

```
academicore/
├── apps/
│   ├── backend/          # Express REST API
│   │   ├── src/
│   │   │   ├── main.ts   # Server entry point
│   │   │   ├── app.ts    # Express app setup
│   │   │   ├── modules/  # Feature modules (auth, students, etc.)
│   │   │   ├── middleware/
│   │   │   └── shared/
│   │   ├── prisma/       # ORM schema & migrations
│   │   └── package.json
│   ├── frontend/         # React SPA
│   │   ├── src/
│   │   │   ├── pages/    # Route components
│   │   │   ├── components/
│   │   │   ├── services/ # API clients
│   │   │   ├── store/    # Context (auth, state)
│   │   │   ├── App.tsx   # Routing
│   │   │   └── main.tsx  # Entry point
│   │   └── package.json
├── docs/                 # Documentation
│   ├── processes.md      # Business process documentation
│   └── schema.dbml       # Database schema (DBML format)
├── docker-compose.yml    # PostgreSQL + backend containers
├── .env.example          # Environment template
└── package.json          # Workspace root
```

## Available Commands

### Development

```bash
npm run dev              # Start backend + frontend concurrently
npm run dev:backend      # Backend only (ts-node-dev with auto-reload)
npm run dev:frontend     # Frontend only (Vite dev server)
```

**From inside `apps/` (optional):** This repo uses npm workspaces. After `npm install` at the repository root, you can run the same scripts from each package directory—equivalent to the root shortcuts above:

```bash
cd apps/frontend && npm run dev   # same as: npm run dev:frontend (from root)
cd apps/backend && npm run dev    # same as: npm run dev:backend (from root)
cd apps/frontend && npm run build && npm run lint
cd apps/backend && npm run prisma:seed
```

### Build

```bash
npm run build:backend    # TypeScript → JavaScript
npm run build:frontend   # TypeScript → Vite bundle
```

### Database

```bash
npm run prisma:generate  # Regenerate Prisma client after schema changes
npm run prisma:migrate   # Run pending migrations (interactive)
npm run prisma:studio    # Open Prisma Studio GUI
```

From `apps/backend`:
```bash
npm run prisma:seed      # Seed database with sample data
npm run db:setup         # Migrate + seed + manual SQL trigger reminder
```

### Code Quality

```bash
cd apps/frontend && npm run lint   # ESLint check (frontend only)
```

**Note:** No test runner is currently configured.

## Architecture Overview

### Backend (Express + Prisma + Zod)

The backend follows a modular architecture with consistent patterns:

**Each module has 5 files:**
- `<module>.router.ts` — REST endpoint definitions with auth middleware
- `<module>.controller.ts` — Request handlers that parse DTOs and delegate to service
- `<module>.service.ts` — Business logic and Prisma queries
- `<module>.dto.ts` — Zod validation schemas + TypeScript types
- `index.ts` — Re-exports router and service

**Key Files:**
- `src/main.ts` — Server bootstrap; auto-seeds if DB is empty (non-prod only)
- `src/app.ts` — Mounts all module routers under `/api`
- `src/config/env.ts` — Zod validation of all env vars (fail-fast at startup)
- `src/middleware/auth.middleware.ts` — JWT validation and role-based authorization
- `src/middleware/error.middleware.ts` — Centralized error handling (ZodError → 400, HttpError → custom status)
- `src/shared/http-error.ts` — `HttpError` class for clean error handling
- `src/shared/prisma.client.ts` — Singleton Prisma client
- `src/shared/seed.ts` — Reusable seed logic

**Authentication:**
- JWT with access (15m default) + refresh (7d default) tokens
- Payload: `{ sub, email, roles[], userType }` (ADMIN, TEACHER, STUDENT)
- Soft deletes: Most entities use `deletedAt` field; services filter accordingly

**Database:**
- PostgreSQL 16 with Prisma ORM
- Schema: `apps/backend/prisma/schema.prisma`
- Triggers & stored procedures: `src/migrations/001_trigger_and_sp.sql` (must be applied manually)
- Key models: User → Student/Teacher, Career, Subject, AcademicPeriod, Group, Enrollment, Grade, AcademicRecord, Certification, AuditLog

### Frontend (React + Vite + Material-UI)

A modern single-page application with Spanish-language routes and user interface.

**Key Files:**
- `src/App.tsx` — Routing setup (public & authenticated routes)
- `src/main.tsx` — React entry point
- `src/services/api.ts` — Axios instance with JWT interceptor; auto-redirect to `/login` on 401
- `src/store/auth.context.tsx` — Auth state (React Context); token & user in localStorage
- `src/services/<module>.service.ts` — API client for each backend module
- `src/pages/` — Route components
- `src/components/layout/` — AppLayout, Sidebar, TopBar, NotificationBell

**Key Routes:**
- `/` — Dashboard (authenticated)
- `/login` — Login page (public)
- `/verify/:code` — Email verification (public)
- `/usuarios` — User management (admin)
- `/estudiantes` — Students (admin/teacher/student)
- `/profesores` — Teachers (admin)
- `/carreras` — Careers (admin)
- `/materias` — Subjects (admin)
- `/periodos` — Academic periods (admin)
- `/aulas` — Groups/Classes (teacher/admin)
- `/grupos` — Group management (teacher/admin)

## Documentation

- **`docs/processes.md`** — Business process workflows (enrollment, grading, certification, payments, etc.), validation rules, and role-based responsibilities. Includes **student UI locks vs academic cycle** (enrollment window, per-period inscription fee, next period). **Must be kept in sync with code changes.**
- **`docs/schema.dbml`** — Database schema in DBML format (all tables, enums, relationships, indexes). **Must be updated when Prisma schema changes.**
- **`docs/e2e-admin-playbook.md`**, **`docs/e2e-teacher-playbook.md`**, **`docs/e2e-student-playbook.md`** — End-to-end checklists for seeded E2E users (`admin.e2e`, `teacher.e2e`, `student.e2e`).
- **`CLAUDE.md`** — AI assistant guidance for working with this codebase.

**User manual (optional):** With both servers running (`npm run dev`), `npm run generate:manual` builds `manuals/user-manual.html` and `user-manual.pdf` from `apps/backend/scripts/generate-manual.js`.

## Environment Variables

Required variables (copy from `.env.example`):

```env
# Database
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/academicore

# JWT (min 32 chars each)
JWT_SECRET=your-long-random-secret-here
JWT_REFRESH_SECRET=another-long-random-secret-here

# Optional
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
VITE_API_URL=http://localhost:3000/api
```

## Docker Deployment

A `docker-compose.yml` is provided for containerized deployment:

```bash
docker-compose up       # Start PostgreSQL + backend
docker-compose down     # Stop services
```

Services:
- `db` — PostgreSQL 16 (port 5432, health-checked)
- `api` — Express backend (port 3000), built from `apps/backend/Dockerfile`

Frontend is typically served separately (e.g., static hosting, Docker image, or dev server).

## Development Workflow

1. **Feature Development**: Create a feature branch from `main`
2. **Schema Changes**: Modify `apps/backend/prisma/schema.prisma`, then:
   ```bash
   npm run prisma:generate    # Update Prisma client
   npm run prisma:migrate     # Create migration
   ```
3. **Add Features**: Create module files following the 5-file pattern
4. **Update Documentation**: Keep `docs/processes.md` and `docs/schema.dbml` in sync
5. **Test**: Run locally with `npm run dev`
6. **Commit**: Use conventional commits (feat, fix, refactor, docs, chore)
7. **Push & PR**: Create PR against `main`

## Performance & Security

- **Helmet** — HTTP security headers
- **CORS** — Configured for frontend origin
- **JWT** — Secure token-based auth with refresh rotation
- **bcryptjs** — Password hashing
- **Soft Deletes** — Preserve data integrity without hard deletions
- **Audit Logging** — Append-only log of all changes
- **Zod Validation** — Input validation at API boundaries

## Common Issues

### Database Connection Error
- Verify PostgreSQL is running: `psql -U postgres`
- Check `DATABASE_URL` in `.env`
- For Docker: Ensure Docker Compose is up: `docker-compose ps`

### Migration Fails
```bash
npm run prisma:migrate    # Resolve conflicts interactively
npm run prisma:generate   # Regenerate client
```

### Port Already in Use
- Backend (3000): `lsof -i :3000` and kill process, or change `PORT` in `.env`
- Frontend (5173): Vite will auto-increment port if unavailable

### Seed Data Not Appearing
Ensure the database is empty, or manually clear tables before seeding:
```bash
cd apps/backend && npm run prisma:seed
```

## License

[Add your license here]

## Support

For issues, feature requests, or contributions, please use the GitHub issue tracker.
