/**
 * Database integration tests — opt-in: RUN_INTEGRATION=1 npm run test:integration
 * Requires migrated PostgreSQL and apps/backend/.env (DATABASE_URL, JWT_*, etc.).
 *
 * Maps to product capabilities:
 * 1. Prerequisites on courses + validation when enrolling in later courses
 * 2. Global credit cost (SystemSettings.creditCost)
 * 3. Credit-based tuition for enrollments/installments; Subject.tuitionAmount for tutoría requests + installments split
 * 4. Course syllabi + progress tracking by the assigned instructor
 * 5. Scanned admission documents (required types / approval gate)
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import {
  creditBasedTuitionForSubject,
  tuitionForSubject,
} from "../../shared/academic-pricing";
import { isAllRequiredAdmissionDocsApproved } from "../../shared/admission-docs-status";

const run = process.env.RUN_INTEGRATION === "1";

describe.skipIf(!run)("integration: product features (requirements)", () => {
  let prisma: import("@prisma/client").PrismaClient;
  let enrollmentsService: typeof import("../../modules/enrollments/enrollments.service").enrollmentsService;
  let syllabusService: typeof import("../../modules/syllabus/syllabus.service").syllabusService;

  const tag = `t${Date.now()}`;
  const ids: {
    careerId?: string;
    studentUserId?: string;
    teacherUserId?: string;
    studentId?: string;
    teacherId?: string;
    subjectAId?: string;
    subjectBId?: string;
    periodId?: string;
    groupAId?: string;
    groupBId?: string;
    topicId?: string;
  } = {};

  beforeAll(async () => {
    const pMod = await import("../../shared/prisma.client");
    prisma = pMod.prisma;
    const eMod = await import("../../modules/enrollments/enrollments.service");
    enrollmentsService = eMod.enrollmentsService;
    const sMod = await import("../../modules/syllabus/syllabus.service");
    syllabusService = sMod.syllabusService;

    const studentRole = await prisma.role.findFirstOrThrow({ where: { name: "STUDENT" } });
    const teacherRole = await prisma.role.findFirstOrThrow({ where: { name: "TEACHER" } });

    const career = await prisma.career.create({
      data: {
        name: `Career Int ${tag}`,
        code: `CINT${tag.slice(-6)}`,
        totalSemesters: 8,
      },
    });
    ids.careerId = career.id;

    const pwd = await bcrypt.hash("test-integration-9", 8);

    const teacherUser = await prisma.user.create({
      data: {
        userType: "TEACHER",
        firstName: "Int",
        lastName: "Teacher",
        email: `teacher-int-${tag}@academicore.test`,
        passwordHash: pwd,
      },
    });
    ids.teacherUserId = teacherUser.id;
    await prisma.userRole.create({
      data: { userId: teacherUser.id, roleId: teacherRole.id },
    });

    const teacher = await prisma.teacher.create({
      data: {
        userId: teacherUser.id,
        employeeCode: `EMP-INT-${tag}`,
      },
    });
    ids.teacherId = teacher.id;

    const studentUser = await prisma.user.create({
      data: {
        userType: "STUDENT",
        firstName: "Int",
        lastName: "Student",
        email: `student-int-${tag}@academicore.test`,
        passwordHash: pwd,
      },
    });
    ids.studentUserId = studentUser.id;
    await prisma.userRole.create({
      data: { userId: studentUser.id, roleId: studentRole.id },
    });

    const student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        studentCode: `ST-INT-${tag}`,
        careerId: career.id,
        academicStatus: "ACTIVE",
      },
    });
    ids.studentId = student.id;

    const subA = await prisma.subject.create({
      data: {
        name: `Integration Prereq A ${tag}`,
        code: `IPA${tag.slice(-4)}`,
        credits: 4,
      },
    });
    const subB = await prisma.subject.create({
      data: {
        name: `Integration Course B ${tag}`,
        code: `IPB${tag.slice(-4)}`,
        credits: 5,
        tuitionAmount: 2750,
      },
    });
    ids.subjectAId = subA.id;
    ids.subjectBId = subB.id;

    await prisma.careerSubject.createMany({
      data: [
        { careerId: career.id, subjectId: subA.id, semesterNumber: 1, isMandatory: true },
        { careerId: career.id, subjectId: subB.id, semesterNumber: 1, isMandatory: true },
      ],
    });

    await prisma.subjectPrerequisite.create({
      data: { subjectId: subB.id, prerequisiteId: subA.id },
    });

    const period = await prisma.academicPeriod.create({
      data: {
        name: `INT-PER-${tag}`,
        startDate: new Date("2027-01-15"),
        endDate: new Date("2027-06-30"),
        enrollmentOpen: true,
        isActive: true,
        status: "OPEN",
      },
    });
    ids.periodId = period.id;

    const groupA = await prisma.group.create({
      data: {
        subjectId: subA.id,
        academicPeriodId: period.id,
        teacherId: teacher.id,
        groupCode: `GA-${tag}`,
        maxStudents: 30,
        currentStudents: 0,
      },
    });
    const groupB = await prisma.group.create({
      data: {
        subjectId: subB.id,
        academicPeriodId: period.id,
        teacherId: teacher.id,
        groupCode: `GB-${tag}`,
        maxStudents: 30,
        currentStudents: 0,
      },
    });
    ids.groupAId = groupA.id;
    ids.groupBId = groupB.id;
  });

  afterAll(async () => {
    if (!run || !ids.studentId) return;
    const sid = ids.studentId!;
    const periodId = ids.periodId!;

    await prisma.admissionDocument.deleteMany({ where: { studentId: sid } });
    await prisma.payment.deleteMany({
      where: { studentFee: { studentId: sid, periodId } },
    });
    await prisma.studentFee.deleteMany({ where: { studentId: sid, periodId } });
    await prisma.tuitionGroupRequest.deleteMany({
      where: { studentId: sid, academicPeriodId: periodId },
    });
    await prisma.enrollmentSubject.deleteMany({
      where: { enrollment: { studentId: sid, academicPeriodId: periodId } },
    });
    await prisma.enrollment.deleteMany({
      where: { studentId: sid, academicPeriodId: periodId },
    });

    if (ids.groupBId) {
      await prisma.groupTopicProgress.deleteMany({ where: { groupId: ids.groupBId } });
    }
    if (ids.topicId) {
      await prisma.syllabusTopic.delete({ where: { id: ids.topicId } }).catch(() => {});
    }

    if (ids.groupAId) await prisma.group.delete({ where: { id: ids.groupAId } });
    if (ids.groupBId) await prisma.group.delete({ where: { id: ids.groupBId } });

    if (ids.subjectBId && ids.subjectAId) {
      await prisma.subjectPrerequisite.deleteMany({
        where: { subjectId: ids.subjectBId, prerequisiteId: ids.subjectAId },
      });
    }
    if (ids.careerId) {
      await prisma.careerSubject.deleteMany({ where: { careerId: ids.careerId } });
    }
    if (ids.subjectAId) await prisma.subject.delete({ where: { id: ids.subjectAId } });
    if (ids.subjectBId) await prisma.subject.delete({ where: { id: ids.subjectBId } });

    if (ids.periodId) await prisma.academicPeriod.delete({ where: { id: ids.periodId } });

    if (ids.studentId) await prisma.student.delete({ where: { id: ids.studentId } });
    if (ids.teacherId) await prisma.teacher.delete({ where: { id: ids.teacherId } });

    if (ids.studentUserId) {
      await prisma.notification.deleteMany({ where: { userId: ids.studentUserId } });
      await prisma.userRole.deleteMany({ where: { userId: ids.studentUserId } });
      await prisma.user.delete({ where: { id: ids.studentUserId } });
    }
    if (ids.teacherUserId) {
      await prisma.notification.deleteMany({ where: { userId: ids.teacherUserId } });
      await prisma.userRole.deleteMany({ where: { userId: ids.teacherUserId } });
      await prisma.user.delete({ where: { id: ids.teacherUserId } });
    }
    if (ids.careerId) await prisma.career.delete({ where: { id: ids.careerId } });
  });

  describe("1) Prerequisites on courses + enrollment validation", () => {
    it("blocks enrollment in a subsequent course when prerequisites are not met", async () => {
      await expect(
        enrollmentsService.enrollStudent({
          studentId: ids.studentId!,
          groupId: ids.groupBId!,
          periodId: ids.periodId!,
        }),
      ).rejects.toThrow(/prerrequisitos/i);
    });

    it("allows enrollment in the prerequisite course, then in the dependent course", async () => {
      await enrollmentsService.enrollStudent({
        studentId: ids.studentId!,
        groupId: ids.groupAId!,
        periodId: ids.periodId!,
      });

      await enrollmentsService.enrollStudent({
        studentId: ids.studentId!,
        groupId: ids.groupBId!,
        periodId: ids.periodId!,
      });

      const subs = await prisma.enrollmentSubject.count({
        where: {
          status: "ENROLLED",
          enrollment: { studentId: ids.studentId!, academicPeriodId: ids.periodId! },
        },
      });
      expect(subs).toBe(2);
    });
  });

  describe("2) Configure global cost per credit", () => {
    it("uses SystemSettings.creditCost × credits when the subject has no fixed tuition amount", async () => {
      const settings = await prisma.systemSettings.findFirst();
      expect(settings).toBeTruthy();
      const creditCost = Number(settings!.creditCost);
      const subA = await prisma.subject.findUniqueOrThrow({ where: { id: ids.subjectAId! } });
      expect(tuitionForSubject(subA, creditCost)).toBe(creditCost * subA.credits);
    });
  });

  describe("3) Per-course payment amount (catalog) + installments", () => {
    it("uses Subject.tuitionAmount for tutoría-style pricing helper, not for credit-only enrollment totals", async () => {
      const settings = await prisma.systemSettings.findFirstOrThrow();
      const creditCost = Number(settings.creditCost);
      const subB = await prisma.subject.findUniqueOrThrow({ where: { id: ids.subjectBId! } });
      expect(tuitionForSubject(subB, creditCost)).toBe(2750);
      expect(creditBasedTuitionForSubject(subB, creditCost)).toBe(
        Math.round(creditCost * subB.credits * 100) / 100,
      );
    });

    it("materializes monthly installments from enrolled courses using credits × credit cost only", async () => {
      const { syncMonthlyTuitionInstallments } = await import("../../shared/monthly-tuition");
      const settings = await prisma.systemSettings.findFirstOrThrow();
      const prevInscription = settings.inscriptionFee;
      await prisma.systemSettings.update({
        where: { id: settings.id },
        data: { inscriptionFee: 0 },
      });

      const creditCost = Number(settings.creditCost);
      const subA = await prisma.subject.findUniqueOrThrow({ where: { id: ids.subjectAId! } });
      const subB = await prisma.subject.findUniqueOrThrow({ where: { id: ids.subjectBId! } });
      const expectedTotal =
        Math.round(
          (creditBasedTuitionForSubject(subA, creditCost) +
            creditBasedTuitionForSubject(subB, creditCost)) *
            100,
        ) / 100;

      await syncMonthlyTuitionInstallments(prisma, ids.studentId!, ids.periodId!);

      const fees = await prisma.studentFee.findMany({
        where: {
          studentId: ids.studentId!,
          periodId: ids.periodId!,
          installmentNumber: { not: null },
        },
      });
      const sum = Math.round(fees.reduce((s, f) => s + Number(f.amount), 0) * 100) / 100;
      expect(sum).toBe(expectedTotal);

      await prisma.systemSettings.update({
        where: { id: settings.id },
        data: { inscriptionFee: prevInscription },
      });
    });

    it("uses Subject.tuitionAmount in installments for subjects with a pending tutoría request", async () => {
      const { syncMonthlyTuitionInstallments } = await import("../../shared/monthly-tuition");
      const settings = await prisma.systemSettings.findFirstOrThrow();
      const prevInscription = settings.inscriptionFee;
      await prisma.systemSettings.update({
        where: { id: settings.id },
        data: { inscriptionFee: 0 },
      });

      const creditCost = Number(settings.creditCost);
      const subA = await prisma.subject.findUniqueOrThrow({ where: { id: ids.subjectAId! } });
      const subB = await prisma.subject.findUniqueOrThrow({ where: { id: ids.subjectBId! } });

      await prisma.tuitionGroupRequest.create({
        data: {
          studentId: ids.studentId!,
          academicPeriodId: ids.periodId!,
          subjectId: ids.subjectBId!,
          groupId: ids.groupBId!,
          status: "PENDING",
        },
      });

      const expectedTotal =
        Math.round(
          (creditBasedTuitionForSubject(subA, creditCost) +
            tuitionForSubject(subB, creditCost)) *
            100,
        ) / 100;

      await syncMonthlyTuitionInstallments(prisma, ids.studentId!, ids.periodId!);

      const fees = await prisma.studentFee.findMany({
        where: {
          studentId: ids.studentId!,
          periodId: ids.periodId!,
          installmentNumber: { not: null },
        },
      });
      const sum = Math.round(fees.reduce((s, f) => s + Number(f.amount), 0) * 100) / 100;
      expect(sum).toBe(expectedTotal);

      await prisma.tuitionGroupRequest.deleteMany({
        where: { studentId: ids.studentId!, academicPeriodId: ids.periodId! },
      });
      await syncMonthlyTuitionInstallments(prisma, ids.studentId!, ids.periodId!);

      await prisma.systemSettings.update({
        where: { id: settings.id },
        data: { inscriptionFee: prevInscription },
      });
    });
  });

  describe("4) Course syllabi + instructor tracking", () => {
    it("lets the assigned instructor record syllabus topic progress for the group", async () => {
      const topic = await prisma.syllabusTopic.create({
        data: {
          subjectId: ids.subjectBId!,
          title: `Tema integración ${tag}`,
          sortOrder: 0,
        },
      });
      ids.topicId = topic.id;

      const row = await syllabusService.markProgress(ids.groupBId!, ids.teacherUserId!, {
        topicId: topic.id,
        weekNumber: 2,
        notes: "Sesión de integración",
      });

      expect(row.weekNumber).toBe(2);
      expect(row.teacherId).toBe(ids.teacherId!);

      const progress = await syllabusService.getGroupProgress(ids.groupBId!);
      const found = progress.find((p: { id: string }) => p.id === topic.id);
      expect(found?.progress).toBeTruthy();
    });
  });

  describe("5) Scanned admission documents", () => {
    it("requires approved uploads for each mandatory document type", async () => {
      await prisma.admissionDocument.createMany({
        data: [
          {
            studentId: ids.studentId!,
            type: "ID_CARD",
            fileKey: `test/${tag}/id.jpg`,
            fileName: "id.jpg",
            fileSize: 100,
            fileMimeType: "image/jpeg",
            status: "APPROVED",
          },
          {
            studentId: ids.studentId!,
            type: "HIGH_SCHOOL_DIPLOMA",
            fileKey: `test/${tag}/dip.pdf`,
            fileName: "dip.pdf",
            fileSize: 200,
            fileMimeType: "application/pdf",
            status: "APPROVED",
          },
          {
            studentId: ids.studentId!,
            type: "PHOTO",
            fileKey: `test/${tag}/ph.jpg`,
            fileName: "ph.jpg",
            fileSize: 50,
            fileMimeType: "image/jpeg",
            status: "APPROVED",
          },
        ],
      });

      const docs = await prisma.admissionDocument.findMany({
        where: { studentId: ids.studentId! },
        select: { type: true, status: true },
      });
      expect(isAllRequiredAdmissionDocsApproved(docs)).toBe(true);
    });
  });
});
