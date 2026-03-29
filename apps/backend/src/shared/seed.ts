/**
 * Academicore — Database seed
 *
 * Creates a full demo dataset: roles, users (1 per role), career, subjects,
 * academic periods, classroom, groups, enrollment, evaluations, grades,
 * academic records, certification criteria, a sample certification, and
 * audit log entries.
 *
 * Called automatically on startup when NODE_ENV !== 'production' and the DB
 * is empty. Can also be run manually via `npm run prisma:seed`.
 *
 * All grades are on a 0–10 scale.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export async function runSeed(prisma: PrismaClient): Promise<void> {
  console.log('🌱  Seeding database…');

  const hash = (pw: string) => bcrypt.hash(pw, 10);

  // ── 1. ROLES ────────────────────────────────────────────────────────────────
  const [adminRole, teacherRole, studentRole] = await Promise.all([
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', description: 'Administrador del sistema' },
    }),
    prisma.role.upsert({
      where: { name: 'TEACHER' },
      update: {},
      create: { name: 'TEACHER', description: 'Profesor' },
    }),
    prisma.role.upsert({
      where: { name: 'STUDENT' },
      update: {},
      create: { name: 'STUDENT', description: 'Estudiante' },
    }),
  ]);

  // ── 2. USERS ────────────────────────────────────────────────────────────────
  const [adminUser, teacherUser, studentUser] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@academicore.mx' },
      update: {},
      create: {
        userType: 'ADMIN',
        firstName: 'Carlos',
        lastName: 'Administrador',
        email: 'admin@academicore.mx',
        passwordHash: await hash('admin123'),
      },
    }),
    prisma.user.upsert({
      where: { email: 'prof.garcia@academicore.mx' },
      update: {},
      create: {
        userType: 'TEACHER',
        firstName: 'Roberto',
        lastName: 'García',
        email: 'prof.garcia@academicore.mx',
        passwordHash: await hash('teacher123'),
      },
    }),
    prisma.user.upsert({
      where: { email: 'ana.garcia@academicore.mx' },
      update: {},
      create: {
        userType: 'STUDENT',
        firstName: 'Ana',
        lastName: 'García',
        email: 'ana.garcia@academicore.mx',
        passwordHash: await hash('student123'),
      },
    }),
  ]);

  // ── 3. USER_ROLES ────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
      update: {},
      create: { userId: adminUser.id, roleId: adminRole.id },
    }),
    prisma.userRole.upsert({
      where: { userId_roleId: { userId: teacherUser.id, roleId: teacherRole.id } },
      update: {},
      create: { userId: teacherUser.id, roleId: teacherRole.id },
    }),
    prisma.userRole.upsert({
      where: { userId_roleId: { userId: studentUser.id, roleId: studentRole.id } },
      update: {},
      create: { userId: studentUser.id, roleId: studentRole.id },
    }),
  ]);

  // ── 4. CAREER ────────────────────────────────────────────────────────────────
  const career = await prisma.career.upsert({
    where: { code: 'ISC' },
    update: {},
    create: {
      name: 'Ingeniería en Sistemas Computacionales',
      code: 'ISC',
      totalSemesters: 9,
    },
  });

  // ── 5. TEACHER & STUDENT SUB-TYPES ───────────────────────────────────────────
  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      employeeCode: 'DOC-001',
      department: 'Ciencias Computacionales',
    },
  });

  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      studentCode: 'EST-2021-001',
      careerId: career.id,
      academicStatus: 'ACTIVE',
      enrollmentDate: new Date('2021-08-16'),
    },
  });

  // ── 6. SUBJECTS ──────────────────────────────────────────────────────────────
  const [mat101, mat102, prg101, prg201, bd101, red101] = await Promise.all([
    prisma.subject.upsert({ where: { code: 'MAT101' }, update: {}, create: { name: 'Cálculo Diferencial',                  code: 'MAT101', credits: 6 } }),
    prisma.subject.upsert({ where: { code: 'MAT102' }, update: {}, create: { name: 'Álgebra Lineal',                       code: 'MAT102', credits: 5 } }),
    prisma.subject.upsert({ where: { code: 'PRG101' }, update: {}, create: { name: 'Fundamentos de Programación',          code: 'PRG101', credits: 5 } }),
    prisma.subject.upsert({ where: { code: 'PRG201' }, update: {}, create: { name: 'Programación Orientada a Objetos',     code: 'PRG201', credits: 6 } }),
    prisma.subject.upsert({ where: { code: 'BD101'  }, update: {}, create: { name: 'Base de Datos',                       code: 'BD101',  credits: 6 } }),
    prisma.subject.upsert({ where: { code: 'RED101' }, update: {}, create: { name: 'Redes de Computadoras',                code: 'RED101', credits: 5 } }),
  ]);

  // ── 7. CAREER_SUBJECTS ───────────────────────────────────────────────────────
  const subjectList = [mat101, mat102, prg101, prg201, bd101, red101];
  for (let i = 0; i < subjectList.length; i++) {
    await prisma.careerSubject.upsert({
      where: { careerId_subjectId: { careerId: career.id, subjectId: subjectList[i].id } },
      update: {},
      create: {
        careerId: career.id,
        subjectId: subjectList[i].id,
        semesterNumber: Math.floor(i / 2) + 1,
        isMandatory: true,
      },
    });
  }

  // ── 8. CLASSROOM ─────────────────────────────────────────────────────────────
  await prisma.classroom.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      name: 'Aula A-101',
      building: 'Edificio A',
      capacity: 35,
    },
  });

  // ── 9. ACADEMIC PERIODS ──────────────────────────────────────────────────────
  const period2024 = await prisma.academicPeriod.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: '2024-2',
      startDate: new Date('2024-08-12'),
      endDate: new Date('2024-12-20'),
      enrollmentOpen: false,
      isActive: false,
    },
  });

  const period2025 = await prisma.academicPeriod.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: '2025-1',
      startDate: new Date('2025-01-20'),
      endDate: new Date('2025-06-15'),
      enrollmentOpen: true,
      isActive: true,
    },
  });

  // ── 10. EVALUATION TYPES ─────────────────────────────────────────────────────
  const [examType, practiceType, projectType] = await Promise.all([
    prisma.evaluationType.upsert({ where: { name: 'Examen'   }, update: {}, create: { name: 'Examen',   description: 'Evaluación escrita' } }),
    prisma.evaluationType.upsert({ where: { name: 'Práctica' }, update: {}, create: { name: 'Práctica', description: 'Ejercicios prácticos' } }),
    prisma.evaluationType.upsert({ where: { name: 'Proyecto' }, update: {}, create: { name: 'Proyecto', description: 'Trabajo final de proyecto' } }),
  ]);

  // ── 11. GROUPS ───────────────────────────────────────────────────────────────
  // Period 2024-2 — 3 groups
  const [grpMat101, grpMat102, grpPrg101] = await Promise.all([
    prisma.group.upsert({
      where: { subjectId_academicPeriodId_groupCode: { subjectId: mat101.id, academicPeriodId: period2024.id, groupCode: 'MAT101-A' } },
      update: {},
      create: { subjectId: mat101.id, academicPeriodId: period2024.id, teacherId: teacher.id, groupCode: 'MAT101-A', maxStudents: 30, currentStudents: 1 },
    }),
    prisma.group.upsert({
      where: { subjectId_academicPeriodId_groupCode: { subjectId: mat102.id, academicPeriodId: period2024.id, groupCode: 'MAT102-A' } },
      update: {},
      create: { subjectId: mat102.id, academicPeriodId: period2024.id, teacherId: teacher.id, groupCode: 'MAT102-A', maxStudents: 30, currentStudents: 1 },
    }),
    prisma.group.upsert({
      where: { subjectId_academicPeriodId_groupCode: { subjectId: prg101.id, academicPeriodId: period2024.id, groupCode: 'PRG101-A' } },
      update: {},
      create: { subjectId: prg101.id, academicPeriodId: period2024.id, teacherId: teacher.id, groupCode: 'PRG101-A', maxStudents: 30, currentStudents: 1 },
    }),
  ]);

  // Period 2025-1 — 3 groups
  const [grpPrg201, grpBd101, grpRed101] = await Promise.all([
    prisma.group.upsert({
      where: { subjectId_academicPeriodId_groupCode: { subjectId: prg201.id, academicPeriodId: period2025.id, groupCode: 'PRG201-A' } },
      update: {},
      create: { subjectId: prg201.id, academicPeriodId: period2025.id, teacherId: teacher.id, groupCode: 'PRG201-A', maxStudents: 30, currentStudents: 1 },
    }),
    prisma.group.upsert({
      where: { subjectId_academicPeriodId_groupCode: { subjectId: bd101.id, academicPeriodId: period2025.id, groupCode: 'BD101-A' } },
      update: {},
      create: { subjectId: bd101.id, academicPeriodId: period2025.id, teacherId: teacher.id, groupCode: 'BD101-A', maxStudents: 30, currentStudents: 1 },
    }),
    prisma.group.upsert({
      where: { subjectId_academicPeriodId_groupCode: { subjectId: red101.id, academicPeriodId: period2025.id, groupCode: 'RED101-A' } },
      update: {},
      create: { subjectId: red101.id, academicPeriodId: period2025.id, teacherId: teacher.id, groupCode: 'RED101-A', maxStudents: 30, currentStudents: 1 },
    }),
  ]);

  // ── 12. ENROLLMENTS ──────────────────────────────────────────────────────────
  const enrollment2024 = await prisma.enrollment.upsert({
    where: { studentId_academicPeriodId: { studentId: student.id, academicPeriodId: period2024.id } },
    update: {},
    create: { studentId: student.id, academicPeriodId: period2024.id, status: 'CLOSED' },
  });

  const enrollment2025 = await prisma.enrollment.upsert({
    where: { studentId_academicPeriodId: { studentId: student.id, academicPeriodId: period2025.id } },
    update: {},
    create: { studentId: student.id, academicPeriodId: period2025.id, status: 'ACTIVE' },
  });

  // ── 13. ENROLLMENT_SUBJECTS ──────────────────────────────────────────────────
  // 2024-2 subjects — all completed
  await Promise.all([
    prisma.enrollmentSubject.upsert({
      where: { enrollmentId_groupId: { enrollmentId: enrollment2024.id, groupId: grpMat101.id } },
      update: {},
      create: { enrollmentId: enrollment2024.id, groupId: grpMat101.id, status: 'COMPLETED' },
    }),
    prisma.enrollmentSubject.upsert({
      where: { enrollmentId_groupId: { enrollmentId: enrollment2024.id, groupId: grpMat102.id } },
      update: {},
      create: { enrollmentId: enrollment2024.id, groupId: grpMat102.id, status: 'FAILED' },
    }),
    prisma.enrollmentSubject.upsert({
      where: { enrollmentId_groupId: { enrollmentId: enrollment2024.id, groupId: grpPrg101.id } },
      update: {},
      create: { enrollmentId: enrollment2024.id, groupId: grpPrg101.id, status: 'COMPLETED' },
    }),
  ]);

  // 2025-1 subjects — active
  await Promise.all([
    prisma.enrollmentSubject.upsert({
      where: { enrollmentId_groupId: { enrollmentId: enrollment2025.id, groupId: grpPrg201.id } },
      update: {},
      create: { enrollmentId: enrollment2025.id, groupId: grpPrg201.id, status: 'ENROLLED' },
    }),
    prisma.enrollmentSubject.upsert({
      where: { enrollmentId_groupId: { enrollmentId: enrollment2025.id, groupId: grpBd101.id } },
      update: {},
      create: { enrollmentId: enrollment2025.id, groupId: grpBd101.id, status: 'ENROLLED' },
    }),
    prisma.enrollmentSubject.upsert({
      where: { enrollmentId_groupId: { enrollmentId: enrollment2025.id, groupId: grpRed101.id } },
      update: {},
      create: { enrollmentId: enrollment2025.id, groupId: grpRed101.id, status: 'ENROLLED' },
    }),
  ]);

  // ── 14. EVALUATIONS (3 per group, weights sum to 100) ────────────────────────
  // Helper: find existing evaluation by group+name or create it
  const findOrCreateEval = async (groupId: string, name: string, evaluationTypeId: string, weight: number) => {
    const existing = await prisma.evaluation.findFirst({ where: { groupId, name } });
    if (existing) return existing;
    return prisma.evaluation.create({
      data: { groupId, evaluationTypeId, name, weight, maxScore: 100 },
    });
  };

  const ensureEvals = async (groupId: string) => {
    const [exam, practice, project] = await Promise.all([
      findOrCreateEval(groupId, 'Examen Parcial', examType.id,    40),
      findOrCreateEval(groupId, 'Prácticas',      practiceType.id, 30),
      findOrCreateEval(groupId, 'Proyecto Final', projectType.id,  30),
    ]);
    return { exam, practice, project };
  };

  const evals2024Mat101 = await ensureEvals(grpMat101.id);
  const evals2024Mat102 = await ensureEvals(grpMat102.id);
  const evals2024Prg101 = await ensureEvals(grpPrg101.id);
  const evals2025Bd101  = await ensureEvals(grpBd101.id);

  // ── 15. GRADES (0–100 scale) ──────────────────────────────────────────────────
  // 2024-2 · MAT101 (Cálculo Diferencial) → avg 80 → PASSED
  await Promise.all([
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2024Mat101.exam.id,     studentId: student.id } }, update: {}, create: { evaluationId: evals2024Mat101.exam.id,     studentId: student.id, score: 80, gradedBy: teacherUser.id } }),
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2024Mat101.practice.id, studentId: student.id } }, update: {}, create: { evaluationId: evals2024Mat101.practice.id, studentId: student.id, score: 75, gradedBy: teacherUser.id } }),
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2024Mat101.project.id,  studentId: student.id } }, update: {}, create: { evaluationId: evals2024Mat101.project.id,  studentId: student.id, score: 85, gradedBy: teacherUser.id } }),
  ]);

  // 2024-2 · MAT102 (Álgebra Lineal) → avg 54.5 → FAILED
  await Promise.all([
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2024Mat102.exam.id,     studentId: student.id } }, update: {}, create: { evaluationId: evals2024Mat102.exam.id,     studentId: student.id, score: 50, gradedBy: teacherUser.id } }),
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2024Mat102.practice.id, studentId: student.id } }, update: {}, create: { evaluationId: evals2024Mat102.practice.id, studentId: student.id, score: 55, gradedBy: teacherUser.id } }),
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2024Mat102.project.id,  studentId: student.id } }, update: {}, create: { evaluationId: evals2024Mat102.project.id,  studentId: student.id, score: 60, gradedBy: teacherUser.id } }),
  ]);

  // 2024-2 · PRG101 (Fundamentos de Programación) → avg 90.9 → PASSED
  await Promise.all([
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2024Prg101.exam.id,     studentId: student.id } }, update: {}, create: { evaluationId: evals2024Prg101.exam.id,     studentId: student.id, score: 90, gradedBy: teacherUser.id } }),
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2024Prg101.practice.id, studentId: student.id } }, update: {}, create: { evaluationId: evals2024Prg101.practice.id, studentId: student.id, score: 88, gradedBy: teacherUser.id } }),
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2024Prg101.project.id,  studentId: student.id } }, update: {}, create: { evaluationId: evals2024Prg101.project.id,  studentId: student.id, score: 95, gradedBy: teacherUser.id } }),
  ]);

  // 2025-1 · BD101 (Base de Datos) → avg 77.7 → PASSED
  await Promise.all([
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2025Bd101.exam.id,     studentId: student.id } }, update: {}, create: { evaluationId: evals2025Bd101.exam.id,     studentId: student.id, score: 78, gradedBy: teacherUser.id } }),
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2025Bd101.practice.id, studentId: student.id } }, update: {}, create: { evaluationId: evals2025Bd101.practice.id, studentId: student.id, score: 80, gradedBy: teacherUser.id } }),
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2025Bd101.project.id,  studentId: student.id } }, update: {}, create: { evaluationId: evals2025Bd101.project.id,  studentId: student.id, score: 75, gradedBy: teacherUser.id } }),
  ]);

  // ── 16. ACADEMIC RECORDS ─────────────────────────────────────────────────────
  // Created directly (trigger requires the SP SQL to be installed separately)
  await Promise.all([
    prisma.academicRecord.upsert({
      where: { studentId_groupId: { studentId: student.id, groupId: grpMat101.id } },
      update: {},
      create: {
        studentId: student.id,
        groupId: grpMat101.id,
        academicPeriodId: period2024.id,
        finalGrade: 80.00,
        passed: true,
        attemptNumber: 1,
      },
    }),
    prisma.academicRecord.upsert({
      where: { studentId_groupId: { studentId: student.id, groupId: grpMat102.id } },
      update: {},
      create: {
        studentId: student.id,
        groupId: grpMat102.id,
        academicPeriodId: period2024.id,
        finalGrade: 54.50,
        passed: false,
        attemptNumber: 1,
      },
    }),
    prisma.academicRecord.upsert({
      where: { studentId_groupId: { studentId: student.id, groupId: grpPrg101.id } },
      update: {},
      create: {
        studentId: student.id,
        groupId: grpPrg101.id,
        academicPeriodId: period2024.id,
        finalGrade: 90.90,
        passed: true,
        attemptNumber: 1,
      },
    }),
    prisma.academicRecord.upsert({
      where: { studentId_groupId: { studentId: student.id, groupId: grpBd101.id } },
      update: {},
      create: {
        studentId: student.id,
        groupId: grpBd101.id,
        academicPeriodId: period2025.id,
        finalGrade: 77.70,
        passed: true,
        attemptNumber: 1,
      },
    }),
  ]);

  // ── 17. CERTIFICATION CRITERIA ───────────────────────────────────────────────
  await Promise.all([
    prisma.certificationCriteria.upsert({
      where: { certificationType_careerId: { certificationType: 'DEGREE', careerId: career.id } },
      update: {},
      create: { certificationType: 'DEGREE', careerId: career.id, minGrade: 70, validityMonths: 60, minCredits: 200, requireAllMandatory: true, description: 'Título de licenciatura — promedio mínimo 70, todas las materias obligatorias aprobadas' },
    }),
  ]);

  // Criteria with null careerId — upsert doesn't support null in composite keys, use findFirst + create
  for (const criteria of [
    { certificationType: 'TRANSCRIPT' as const, minGrade: 60, validityMonths: 12, description: 'Historial académico oficial' },
    { certificationType: 'ENROLLMENT_PROOF' as const, minGrade: 0.0, validityMonths: 6, description: 'Constancia de inscripción vigente' },
  ]) {
    const exists = await prisma.certificationCriteria.findFirst({
      where: { certificationType: criteria.certificationType, careerId: null },
    });
    if (!exists) {
      await prisma.certificationCriteria.create({
        data: { ...criteria, careerId: null },
      });
    }
  }

  // ── 18. SAMPLE CERTIFICATION ─────────────────────────────────────────────────
  const verificationCode = '00000000-seed-cert-0000-000000000001';
  const documentHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ studentId: student.id, type: 'TRANSCRIPT', issuedAt: '2025-01-20' }))
    .digest('hex');

  await prisma.certification.upsert({
    where: { verificationCode },
    update: {},
    create: {
      studentId: student.id,
      careerId: career.id,
      certificationType: 'TRANSCRIPT',
      status: 'ACTIVE',
      verificationCode,
      documentHash,
      issuedBy: adminUser.id,
      issuedAt: new Date('2025-01-20'),
      expiresAt: new Date('2026-01-20'),
    },
  });

  // ── 19. AUDIT LOGS ───────────────────────────────────────────────────────────
  const auditEntries = [
    { entityType: 'user',          entityId: studentUser.id, action: 'CREATED'     as const, performedBy: adminUser.id,   newValues: { email: studentUser.email, role: 'STUDENT' } },
    { entityType: 'user',          entityId: teacherUser.id, action: 'CREATED'     as const, performedBy: adminUser.id,   newValues: { email: teacherUser.email, role: 'TEACHER' } },
    { entityType: 'enrollment',    entityId: enrollment2025.id, action: 'ENROLLED' as const, performedBy: adminUser.id,   newValues: { period: '2025-1', student: 'EST-2021-001' } },
    { entityType: 'enrollment',    entityId: enrollment2024.id, action: 'ENROLLED' as const, performedBy: adminUser.id,   newValues: { period: '2024-2', student: 'EST-2021-001' } },
    { entityType: 'certification', entityId: student.id,     action: 'ISSUED'      as const, performedBy: adminUser.id,   newValues: { type: 'TRANSCRIPT', code: verificationCode } },
    { entityType: 'student',       entityId: student.id,     action: 'STATUS_CHANGE' as const, performedBy: adminUser.id, newValues: { status: 'ACTIVE' } },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({ data: entry }).catch(() => { /* skip duplicates */ });
  }

  // ── 20. TOPICS & CONTENT ITEMS ───────────────────────────────────────────
  // PRG201 — Programación Orientada a Objetos (2025-1)
  const topicPrg1 = await prisma.topic.upsert({
    where: { groupId_sortOrder: { groupId: grpPrg201.id, sortOrder: 1 } },
    update: {},
    create: { groupId: grpPrg201.id, title: 'Introducción a POO', description: 'Conceptos fundamentales de la programación orientada a objetos', sortOrder: 1 },
  });
  const topicPrg2 = await prisma.topic.upsert({
    where: { groupId_sortOrder: { groupId: grpPrg201.id, sortOrder: 2 } },
    update: {},
    create: { groupId: grpPrg201.id, title: 'Clases y Objetos', description: 'Definición de clases, atributos, métodos y constructores', sortOrder: 2 },
  });
  const topicPrg3 = await prisma.topic.upsert({
    where: { groupId_sortOrder: { groupId: grpPrg201.id, sortOrder: 3 } },
    update: {},
    create: { groupId: grpPrg201.id, title: 'Herencia y Polimorfismo', description: 'Herencia, clases abstractas, interfaces y polimorfismo', sortOrder: 3 },
  });

  // BD101 — Base de Datos (2025-1)
  const topicBd1 = await prisma.topic.upsert({
    where: { groupId_sortOrder: { groupId: grpBd101.id, sortOrder: 1 } },
    update: {},
    create: { groupId: grpBd101.id, title: 'Modelo Relacional', description: 'Fundamentos del modelo relacional: tablas, columnas, claves primarias y foráneas', sortOrder: 1 },
  });
  const topicBd2 = await prisma.topic.upsert({
    where: { groupId_sortOrder: { groupId: grpBd101.id, sortOrder: 2 } },
    update: {},
    create: { groupId: grpBd101.id, title: 'SQL Básico', description: 'SELECT, INSERT, UPDATE, DELETE y filtrado con WHERE', sortOrder: 2 },
  });

  // Content items — PRG201
  for (const item of [
    { topicId: topicPrg1.id, title: 'Notas de clase', type: 'TEXT' as const, content: 'La POO es un paradigma de programación basado en el concepto de objetos, que contienen datos y código.', sortOrder: 1 },
    { topicId: topicPrg1.id, title: 'Tutorial oficial de Java', type: 'LINK' as const, content: 'https://docs.oracle.com/javase/tutorial/java/concepts/', sortOrder: 2 },
    { topicId: topicPrg2.id, title: 'Guía de clases en Java', type: 'LINK' as const, content: 'https://www.w3schools.com/java/java_classes.asp', sortOrder: 1 },
    { topicId: topicPrg2.id, title: 'Ejemplo práctico', type: 'TEXT' as const, content: 'Crear una clase Vehiculo con atributos marca, modelo y año. Implementar constructor y métodos getter/setter.', sortOrder: 2 },
    { topicId: topicPrg3.id, title: 'Resumen de herencia', type: 'TEXT' as const, content: 'La herencia permite crear nuevas clases a partir de clases existentes, heredando sus atributos y métodos.', sortOrder: 1 },
  ]) {
    await prisma.contentItem.upsert({
      where: { topicId_sortOrder: { topicId: item.topicId, sortOrder: item.sortOrder } },
      update: {},
      create: item,
    });
  }

  // Content items — BD101
  for (const item of [
    { topicId: topicBd1.id, title: 'Notas de clase', type: 'TEXT' as const, content: 'El modelo relacional organiza datos en tablas (relaciones), donde cada tabla tiene filas (tuplas) y columnas (atributos).', sortOrder: 1 },
    { topicId: topicBd1.id, title: 'Tutorial de PostgreSQL', type: 'LINK' as const, content: 'https://www.postgresql.org/docs/current/tutorial.html', sortOrder: 2 },
    { topicId: topicBd2.id, title: 'Referencia SQL', type: 'LINK' as const, content: 'https://www.w3schools.com/sql/', sortOrder: 1 },
    { topicId: topicBd2.id, title: 'Ejercicios SQL (PDF)', type: 'FILE_REF' as const, content: 'https://drive.google.com/ejemplo-ejercicios-sql.pdf', sortOrder: 2 },
  ]) {
    await prisma.contentItem.upsert({
      where: { topicId_sortOrder: { topicId: item.topicId, sortOrder: item.sortOrder } },
      update: {},
      create: item,
    });
  }

  // ── 21. SYSTEM SETTINGS ───────────────────────────────────────────────────
  const existingSettings = await prisma.systemSettings.findFirst();
  if (!existingSettings) {
    await prisma.systemSettings.create({
      data: {
        passingGrade: 60,
        maxSubjectsPerEnrollment: 7,
        maxEvaluationWeight: 100,
        atRiskThreshold: 3,
        updatedBy: adminUser.id,
      },
    });
  }

  console.log('');
  console.log('✅  Seed complete');
  console.log('');
  console.log('   Demo credentials:');
  console.log('   Admin:    admin@academicore.mx          / admin123');
  console.log('   Teacher:  prof.garcia@academicore.mx   / teacher123');
  console.log('   Student:  ana.garcia@academicore.mx    / student123');
  console.log('');
  console.log('   Verification code (public): 00000000-seed-cert-0000-000000000001');
}
