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

/**
 * Student completed or is taking this group (any enrollment_subject status except DROPPED).
 * Used to read grades for closed/completed enrollments (historial).
 */
export async function assertStudentTookGroup(
  studentId: string,
  groupId: string,
): Promise<void> {
  const row = await prisma.enrollmentSubject.findFirst({
    where: {
      groupId,
      status: { not: "DROPPED" },
      enrollment: { studentId },
    },
  });
  if (!row) {
    throw new HttpError(403, "No tienes registro de cursar este grupo");
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

/**
 * Students must have paid the inscription fee for the academic period of the group
 * before accessing course learning content (topics/evaluations/submissions).
 */
export async function assertStudentPaidInscriptionForGroup(
  studentId: string,
  groupId: string,
): Promise<void> {
  const enrollment = await prisma.enrollmentSubject.findFirst({
    where: {
      groupId,
      status: "ENROLLED",
      enrollment: { studentId },
    },
    select: {
      enrollment: { select: { academicPeriodId: true } },
    },
  });
  if (!enrollment) {
    throw new HttpError(403, "No estás inscrito en este grupo");
  }

  const inscriptionFee = await prisma.studentFee.findFirst({
    where: {
      studentId,
      periodId: enrollment.enrollment.academicPeriodId,
      feeConcept: {
        name: { contains: "inscripci", mode: "insensitive" },
      },
    },
    select: { status: true },
  });

  if (!inscriptionFee || inscriptionFee.status !== "PAID") {
    throw new HttpError(
      403,
      "Debes pagar la cuota de inscripción del período para acceder al contenido del curso",
    );
  }
}

export async function assertStudentPaidInscriptionForTopic(
  studentId: string,
  topicId: string,
): Promise<void> {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { groupId: true },
  });
  if (!topic) throw new HttpError(404, "Tema no encontrado");
  await assertStudentPaidInscriptionForGroup(studentId, topic.groupId);
}

export async function assertStudentPaidInscriptionForEvaluation(
  studentId: string,
  evaluationId: string,
): Promise<void> {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    select: { groupId: true },
  });
  if (!evaluation) throw new HttpError(404, "Evaluación no encontrada");
  await assertStudentPaidInscriptionForGroup(studentId, evaluation.groupId);
}
