# Academicore Backend

Express.js REST API for the Academicore academic management system.

## Overview

The backend provides REST endpoints for all academic management features: user authentication, enrollment, grading, certification, and administrative operations. It's built with Express, Prisma ORM, Zod validation, and JWT authentication.

## Tech Stack

- **Framework**: Express 4
- **Database**: PostgreSQL 16 (via Prisma 5 ORM)
- **Validation**: Zod 3
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **File Storage**: AWS S3 + local filesystem
- **Other**: Helmet (security), CORS, Multer (uploads), Puppeteer (PDF generation)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 16+ (or Docker)

### Installation

From the monorepo root:
```bash
npm install
npm run prisma:migrate
cd apps/backend && npm run prisma:seed
npm run dev:backend
```

Server listens on `http://localhost:3000/api`

### Environment Setup

Copy `.env.example` from the root to `.env` and configure:

```env
DATABASE_URL=postgresql://academicore:academicore_pass@localhost:5432/academicore
JWT_SECRET=change-this-to-a-long-random-secret
JWT_REFRESH_SECRET=change-this-to-another-long-random-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

## Project Structure

```
src/
├── main.ts                     # Server entry point
├── app.ts                      # Express app setup, middleware mounting
├── config/
│   └── env.ts                  # Zod validation of environment variables
├── middleware/
│   ├── auth.middleware.ts      # authenticate & authorize middleware
│   ├── error.middleware.ts     # Centralized error handling
│   └── ...
├── modules/                    # Feature modules (each follows 5-file pattern)
│   ├── auth/
│   │   ├── auth.router.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.dto.ts
│   │   └── index.ts
│   ├── students/
│   ├── teachers/
│   ├── enrollments/
│   ├── grades/
│   ├── certifications/
│   └── ...
├── shared/
│   ├── http-error.ts           # HttpError class
│   ├── prisma.client.ts        # Singleton Prisma client
│   └── seed.ts                 # Reusable seed logic
└── migrations/
    └── 001_trigger_and_sp.sql  # SQL triggers & stored procedures

prisma/
├── schema.prisma               # Database schema
├── migrations/                 # Auto-generated migrations
└── seed.ts                     # Seed data entry point
```

## Module Pattern

Every feature module follows a consistent 5-file structure:

### `<module>.router.ts` — Route definitions
```typescript
const router = express.Router();

router.get('/', authenticate, authorize('ADMIN', 'TEACHER'), studentController.list);
router.post('/', authenticate, authorize('ADMIN'), studentController.create);
// ...
export { router as studentRouter };
```

### `<module>.controller.ts` — Request handlers
```typescript
export const studentController = {
  list: async (req, res, next) => {
    try {
      const students = await studentService.list();
      res.json(students);
    } catch (err) {
      next(err);
    }
  },
  // ...
};
```

### `<module>.service.ts` — Business logic & database queries
```typescript
export const studentService = {
  list: async () => {
    return prisma.student.findMany({
      where: { deletedAt: null },
      include: { user: true }
    });
  },
  // Throw HttpError for validation/not-found errors
  create: async (data) => {
    // validate, check duplicates, then create
  }
};
```

### `<module>.dto.ts` — Zod schemas & types
```typescript
const createStudentSchema = z.object({
  userId: z.string().uuid(),
  cardinality: z.string(),
});

export type CreateStudentDto = z.infer<typeof createStudentSchema>;
```

### `index.ts` — Re-exports
```typescript
export { studentRouter } from './student.router';
export { studentService } from './student.service';
```

## Authentication & Authorization

JWT-based authentication with access + refresh tokens.

### `authenticate` middleware
Verifies Bearer token; attaches `user` to `req`:
```typescript
req.user = { sub, email, roles, userType }
```

### `authorize` middleware
Checks user roles:
```typescript
router.post('/', authenticate, authorize('ADMIN'), ...)
```

### User Types
- `ADMIN` — Full system access
- `TEACHER` — Class and grade management
- `STUDENT` — View own grades, content

### JWT Payload
```typescript
{
  sub: string;        // User ID
  email: string;
  roles: string[];
  userType: 'ADMIN' | 'TEACHER' | 'STUDENT';
}
```

## Database Schema

Defined in `prisma/schema.prisma`. Key models:

**Users & Access**
- `User` — Base user (email, password, roles, soft-delete)
- `Student` → extends User
- `Teacher` → extends User
- `AuditLog` — Append-only change log

**Academic Structure**
- `Career` — Degree program
- `Subject` — Course with prerequisites
- `AcademicPeriod` — Semester/year
- `Group` — Class (teacher + subject + period)

**Enrollment & Grades**
- `Enrollment` → `EnrollmentSubject` — Student in subject
- `EvaluationType` — Exam, assignment, etc.
- `Evaluation` → `Grade` — Individual grades
- `AcademicRecord` — Final grade per subject (trigger-generated)

**Other**
- `Certification` — Certificate (with QR code verification)
- `SystemSettings` — App configuration

**Naming Convention**: Table names in DB use `@@map("snake_case")` while Prisma models use PascalCase.

### Triggers & Stored Procedures
SQL triggers in `src/migrations/001_trigger_and_sp.sql` **must be manually applied** after migrations:
```bash
psql -U $POSTGRES_USER -d $POSTGRES_DB -f src/migrations/001_trigger_and_sp.sql
```

These implement:
- Automatic `AcademicRecord` generation when grades are finalized
- Timestamp management (created_at, updated_at)
- Data consistency checks

## API Endpoints

All endpoints prefixed with `/api`. Authentication required unless noted.

### Auth (Public)
- `POST /api/auth/login` — Login with email/password
- `POST /api/auth/register` — Register new user
- `POST /api/auth/refresh` — Refresh access token
- `GET /api/auth/verify/:code` — Verify email

### Students
- `GET /api/estudiantes` — List students (admin/teacher)
- `POST /api/estudiantes` — Create student (admin)
- `GET /api/estudiantes/:id` — Get student (admin/teacher/own)
- `PUT /api/estudiantes/:id` — Update student (admin)
- `DELETE /api/estudiantes/:id` — Soft-delete student (admin)

### Teachers
- Similar REST structure as students

### Enrollments
- `GET /api/matriculas` — List enrollments
- `POST /api/matriculas` — Enroll student
- `PUT /api/matriculas/:id` — Update enrollment
- `DELETE /api/matriculas/:id` — Remove enrollment

### Grades
- `GET /api/calificaciones` — List grades
- `POST /api/calificaciones` — Record grade
- `PUT /api/calificaciones/:id` — Update grade

### Certifications
- `GET /api/certificaciones` — List certificates
- `POST /api/certificaciones` — Generate certificate
- `GET /api/certificaciones/:code/verify` — Verify certificate by QR code

### System
- `GET /api/system-settings` — Get system config (admin)
- `PUT /api/system-settings` — Update config (admin)

**Full endpoint list:** See individual module routers in `src/modules/`.

## Error Handling

Centralized in `src/middleware/error.middleware.ts` (must be last middleware):

- **ZodError** → 400 Bad Request with field details
- **HttpError** → Custom status code + message
- **Other** → 500 Internal Server Error

Example usage:
```typescript
// In service
if (!student) {
  throw new HttpError(404, 'Student not found');
}

// In controller
try {
  const data = createStudentSchema.parse(req.body);
} catch (err) {
  next(err); // Middleware handles
}
```

## Database Commands

From monorepo root or `apps/backend`:

```bash
# Generate/update Prisma client after schema changes
npm run prisma:generate

# Run pending migrations (interactive)
npm run prisma:migrate

# View/edit data in GUI
npm run prisma:studio

# Seed database with sample data
npm run prisma:seed

# Full setup: migrate + seed + print SQL reminder
npm run db:setup
```

## Development

### Start Server
```bash
npm run dev              # From monorepo root
# or
cd apps/backend && npm run dev
```

Auto-reloads on file changes (ts-node-dev).

### Add a New Feature

1. **Update Prisma schema** (`prisma/schema.prisma`)
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

2. **Create module files** in `src/modules/<feature>/`:
   - `<feature>.dto.ts` — Zod schemas
   - `<feature>.service.ts` — Logic
   - `<feature>.controller.ts` — Handlers
   - `<feature>.router.ts` — Routes
   - `index.ts` — Exports

3. **Register router** in `src/app.ts`:
   ```typescript
   app.use('/api', featureRouter);
   ```

4. **Test** with curl, Postman, or frontend

### Prisma Studio

GUI tool to browse and edit data:
```bash
npm run prisma:studio
# Opens http://localhost:5555
```

## Security

- **Helmet** — HTTP security headers (HSTS, CSP, X-Frame-Options, etc.)
- **CORS** — Configured for frontend origin
- **bcryptjs** — Password hashing (12 rounds)
- **JWT** — Token-based auth, no session storage
- **Soft Deletes** — Logical deletion preserves audit trail
- **AuditLog** — All changes logged
- **Input Validation** — Zod at every API boundary
- **SQL Injection Prevention** — Prisma parameterized queries

## File Uploads

Multipart form data via Multer:
- Local storage: `uploads/` directory
- S3 storage: Configured via `@aws-sdk/client-s3`

Toggle in `src/shared/storage/` — `StorageProvider` interface with `LocalProvider` and `S3Provider` implementations.

## Seeding

`prisma/seed.ts` creates sample data for development:
- Admin, teacher, student users
- Career and subjects
- Academic periods and groups
- Enrollment and grades

**Runs automatically** on startup if DB is empty (non-production only).

Run manually:
```bash
cd apps/backend && npm run prisma:seed
```

## Deployment

### Build
```bash
npm run build:backend
# Outputs: dist/main.js
```

### Run
```bash
node dist/main.js
```

### Docker
```bash
docker build -t academicore-api apps/backend/
docker run -e DATABASE_URL=... -e JWT_SECRET=... -p 3000:3000 academicore-api
```

Or with Docker Compose (from root):
```bash
docker-compose up
```

## Troubleshooting

### Port 3000 already in use
```bash
lsof -i :3000          # Find process
kill -9 <PID>          # Kill it
# Or change PORT in .env
```

### Database connection failed
```bash
# Check PostgreSQL is running
psql -U postgres

# Verify DATABASE_URL format
postgresql://user:password@host:5432/database
```

### Prisma client not found
```bash
npm run prisma:generate
npm install
```

### Type errors in controllers/services
```bash
npm run build
```

## References

- [Express.js Docs](https://expressjs.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Zod Validation](https://zod.dev/)
- [JWT.io](https://jwt.io/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## License

[Add your license]
