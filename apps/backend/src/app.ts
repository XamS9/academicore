import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { errorMiddleware } from "./middleware/error.middleware";

// Module routers
import { authRouter } from "./modules/auth/auth.router";
import { usersRouter } from "./modules/users/users.router";
import { studentsRouter } from "./modules/students/students.router";
import { teachersRouter } from "./modules/teachers/teachers.router";
import { careersRouter } from "./modules/careers/careers.router";
import { subjectsRouter } from "./modules/subjects/subjects.router";
import { academicPeriodsRouter } from "./modules/academic-periods/academic-periods.router";
import { classroomsRouter } from "./modules/classrooms/classrooms.router";
import { groupsRouter } from "./modules/groups/groups.router";
import { enrollmentsRouter } from "./modules/enrollments/enrollments.router";
import { evaluationsRouter } from "./modules/evaluations/evaluations.router";
import { gradesRouter } from "./modules/grades/grades.router";
import { academicRecordsRouter } from "./modules/academic-records/academic-records.router";
import { certificationsRouter } from "./modules/certifications/certifications.router";
import { auditLogsRouter } from "./modules/audit-logs/audit-logs.router";
import { evaluationTypesRouter } from "./modules/evaluation-types/evaluation-types.router";
import { topicsRouter } from "./modules/topics/topics.router";
import { contentItemsRouter } from "./modules/content-items/content-items.router";
import { systemSettingsRouter } from "./modules/system-settings/system-settings.router";
import { notificationsRouter } from "./modules/notifications/notifications.router";
import { calendarEventsRouter } from "./modules/calendar-events/calendar-events.router";
import { announcementsRouter } from "./modules/announcements/announcements.router";
import { paymentsRouter } from "./modules/payments/payments.router";
import { reportsRouter } from "./modules/reports/reports.router";
import { departmentsRouter } from "./modules/departments/departments.router";
import { studentSubmissionsRouter } from "./modules/student-submissions/student-submissions.router";
import { uploadsRouter } from "./modules/uploads/uploads.router";

const app = express();

// Global middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Serve locally uploaded files (only active when STORAGE_PROVIDER=local or unset)
if (!process.env.STORAGE_PROVIDER || process.env.STORAGE_PROVIDER === "local") {
  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));
  app.use("/api/files", express.static(uploadDir));
}

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// API routes
const api = express.Router();
api.use("/auth", authRouter);
api.use("/users", usersRouter);
api.use("/students", studentsRouter);
api.use("/teachers", teachersRouter);
api.use("/careers", careersRouter);
api.use("/subjects", subjectsRouter);
api.use("/academic-periods", academicPeriodsRouter);
api.use("/classrooms", classroomsRouter);
api.use("/groups", groupsRouter);
api.use("/enrollments", enrollmentsRouter);
api.use("/evaluations", evaluationsRouter);
api.use("/grades", gradesRouter);
api.use("/academic-records", academicRecordsRouter);
api.use("/certifications", certificationsRouter);
api.use("/audit-logs", auditLogsRouter);
api.use("/evaluation-types", evaluationTypesRouter);
api.use("/topics", topicsRouter);
api.use("/content-items", contentItemsRouter);
api.use("/configuracion", systemSettingsRouter);
api.use("/notifications", notificationsRouter);
api.use("/calendar-events", calendarEventsRouter);
api.use("/announcements", announcementsRouter);
api.use("/payments", paymentsRouter);
api.use("/reports", reportsRouter);
api.use("/departments", departmentsRouter);
api.use("/student-submissions", studentSubmissionsRouter);
api.use("/uploads", uploadsRouter);

app.use("/api", api);

// Global error handler (must be last)
app.use(errorMiddleware);

export { app };
