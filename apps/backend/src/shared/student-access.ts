import type { JwtPayload } from "../middleware/auth.middleware";
import { prisma } from "./prisma.client";
import { HttpError } from "./http-error";

export async function getStudentIdForUser(userId: string): Promise<string | null> {
  const student = await prisma.student.findFirst({
    where: { userId, deletedAt: null },
    select: { id: true },
  });
  return student?.id ?? null;
}

/** Resolves DB student id for the authenticated student user, or throws. */
export async function requireStudentId(user: JwtPayload): Promise<string> {
  if (user.userType !== "STUDENT") {
    throw new HttpError(403, "Solo disponible para estudiantes");
  }
  const id = await getStudentIdForUser(user.sub);
  if (!id) throw new HttpError(404, "Estudiante no encontrado");
  return id;
}

/**
 * STUDENT may only access their own studentId. ADMIN and TEACHER may access any.
 */
export async function assertStudentResourceAccess(
  user: JwtPayload,
  targetStudentId: string,
): Promise<void> {
  if (user.userType === "ADMIN" || user.userType === "TEACHER") return;
  if (user.userType === "STUDENT") {
    const own = await getStudentIdForUser(user.sub);
    if (!own || own !== targetStudentId) {
      throw new HttpError(403, "No autorizado para acceder a estos datos");
    }
    return;
  }
  throw new HttpError(403, "No autorizado");
}

export async function assertStudentEnrolledInGroup(
  studentId: string,
  groupId: string,
): Promise<void> {
  const enrolled = await prisma.enrollmentSubject.findFirst({
    where: {
      groupId,
      status: "ENROLLED",
      enrollment: { studentId },
    },
  });
  if (!enrolled) {
    throw new HttpError(403, "No estás inscrito en este grupo");
  }
}

export async function assertStudentCanAccessTopic(
  studentId: string,
  topicId: string,
): Promise<void> {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { groupId: true },
  });
  if (!topic) throw new HttpError(404, "Tema no encontrado");
  await assertStudentEnrolledInGroup(studentId, topic.groupId);
}
