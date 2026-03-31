import { randomUUID } from "node:crypto";
import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { notificationsService } from "../notifications/notifications.service";
import type {
  CreateFeeConceptInput,
  UpdateFeeConceptInput,
  AssignStudentFeeInput,
  BulkAssignStudentFeeInput,
  PayStudentFeeInput,
} from "./payments.dto";

export class PaymentsService {
  // ── Fee Concepts ──────────────────────────────────────────────

  async findAllFeeConcepts() {
    return prisma.feeConcept.findMany({ orderBy: { name: "asc" } });
  }

  async createFeeConcept(data: CreateFeeConceptInput) {
    return prisma.feeConcept.create({ data });
  }

  async updateFeeConcept(id: string, data: UpdateFeeConceptInput) {
    const existing = await prisma.feeConcept.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Concepto de cobro no encontrado");
    return prisma.feeConcept.update({ where: { id }, data });
  }

  // ── Student Fees ──────────────────────────────────────────────

  async findStudentFees(filters?: {
    studentId?: string;
    periodId?: string;
    status?: string;
  }) {
    return prisma.studentFee.findMany({
      where: {
        ...(filters?.studentId ? { studentId: filters.studentId } : {}),
        ...(filters?.periodId ? { periodId: filters.periodId } : {}),
        ...(filters?.status ? { status: filters.status as any } : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            studentCode: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
        feeConcept: { select: { id: true, name: true } },
        period: { select: { id: true, name: true } },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findStudentFeesByUserId(userId: string) {
    const student = await prisma.student.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    if (!student) throw new HttpError(404, "Estudiante no encontrado");
    return this.findStudentFees({ studentId: student.id });
  }

  async assignFee(data: AssignStudentFeeInput) {
    const fee = await prisma.studentFee.create({ data });

    // Notify student
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      select: { userId: true },
    });
    if (student) {
      const concept = await prisma.feeConcept.findUnique({
        where: { id: data.feeConceptId },
        select: { name: true },
      });
      await notificationsService.create({
        userId: student.userId,
        title: "Nuevo cargo asignado",
        message: `Se te ha asignado el cargo: ${concept?.name ?? "Cargo"}`,
        type: "PAYMENT_DUE",
        relatedEntity: "studentFee",
        relatedEntityId: fee.id,
      });
    }

    return fee;
  }

  async bulkAssignFees(data: BulkAssignStudentFeeInput) {
    const { studentIds, ...rest } = data;
    const fees = await prisma.$transaction(
      studentIds.map((studentId) =>
        prisma.studentFee.create({ data: { studentId, ...rest } }),
      ),
    );

    // Notify all students
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { userId: true },
    });
    const concept = await prisma.feeConcept.findUnique({
      where: { id: rest.feeConceptId },
      select: { name: true },
    });
    await notificationsService.createBulk(
      students.map((s) => s.userId),
      {
        title: "Nuevo cargo asignado",
        message: `Se te ha asignado el cargo: ${concept?.name ?? "Cargo"}`,
        type: "PAYMENT_DUE",
      },
    );

    return fees;
  }

  // ── Simulated Payment ─────────────────────────────────────────

  async pay(studentFeeId: string, userId: string, data: PayStudentFeeInput) {
    const fee = await prisma.studentFee.findUnique({
      where: { id: studentFeeId },
      include: {
        student: { select: { userId: true } },
        feeConcept: { select: { name: true } },
      },
    });
    if (!fee) throw new HttpError(404, "Cargo no encontrado");
    if (fee.student.userId !== userId)
      throw new HttpError(403, "No puedes pagar este cargo");
    if (fee.status !== "PENDING")
      throw new HttpError(400, "Este cargo no está pendiente de pago");

    const referenceCode = `PAY-${randomUUID().slice(0, 8).toUpperCase()}`;

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          studentFeeId,
          amount: fee.amount,
          method: data.method,
          referenceCode,
        },
      }),
      prisma.studentFee.update({
        where: { id: studentFeeId },
        data: { status: "PAID" },
      }),
    ]);

    await notificationsService.create({
      userId,
      title: "Pago confirmado",
      message: `Tu pago de ${fee.feeConcept.name} ha sido procesado. Referencia: ${referenceCode}`,
      type: "PAYMENT_CONFIRMED",
      relatedEntity: "payment",
      relatedEntityId: payment.id,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: "payment",
        entityId: payment.id,
        action: "CREATED",
        performedBy: userId,
        newValues: {
          referenceCode,
          amount: Number(fee.amount),
          method: data.method,
        },
      },
    });

    return payment;
  }

  // ── Payment History ───────────────────────────────────────────

  async findPaymentHistory(userId: string) {
    const student = await prisma.student.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    if (!student) throw new HttpError(404, "Estudiante no encontrado");

    return prisma.payment.findMany({
      where: { studentFee: { studentId: student.id } },
      include: {
        studentFee: {
          select: {
            feeConcept: { select: { name: true } },
            period: { select: { name: true } },
          },
        },
      },
      orderBy: { paidAt: "desc" },
    });
  }
}

export const paymentsService = new PaymentsService();
