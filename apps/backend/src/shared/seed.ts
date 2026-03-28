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
      data: { groupId, evaluationTypeId, name, weight, maxScore: 10 },
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

  // ── 15. GRADES ───────────────────────────────────────────────────────────────
  // 2024-2 · MAT101 (Cálculo Diferencial) → avg 8.0 → PASSED
  await Promise.all([
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2024Mat101.exam.id,     studentId: student.id } }, update: {}, create: { evaluationId: evals2024Mat101.exam.id,     studentId: student.id, score: 8.0, gradedBy: teacherUser.id } }),
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2024Mat101.practice.id, studentId: student.id } }, update: {}, create: { evaluationId: evals2024Mat101.practice.id, studentId: student.id, score: 7.5, gradedBy: teacherUser.id } }),
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2024Mat101.project.id,  studentId: student.id } }, update: {}, create: { evaluationId: evals2024Mat101.project.id,  studentId: student.id, score: 8.5, gradedBy: teacherUser.id } }),
  ]);

  // 2024-2 · MAT102 (Álgebra Lineal) → avg 5.45 → FAILED
  await Promise.all([
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2024Mat102.exam.id,     studentId: student.id } }, update: {}, create: { evaluationId: evals2024Mat102.exam.id,     studentId: student.id, score: 5.0, gradedBy: teacherUser.id } }),
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2024Mat102.practice.id, studentId: student.id } }, update: {}, create: { evaluationId: evals2024Mat102.practice.id, studentId: student.id, score: 5.5, gradedBy: teacherUser.id } }),
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2024Mat102.project.id,  studentId: student.id } }, update: {}, create: { evaluationId: evals2024Mat102.project.id,  studentId: student.id, score: 6.0, gradedBy: teacherUser.id } }),
  ]);

  // 2024-2 · PRG101 (Fundamentos de Programación) → avg 9.09 → PASSED
  await Promise.all([
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2024Prg101.exam.id,     studentId: student.id } }, update: {}, create: { evaluationId: evals2024Prg101.exam.id,     studentId: student.id, score: 9.0, gradedBy: teacherUser.id } }),
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2024Prg101.practice.id, studentId: student.id } }, update: {}, create: { evaluationId: evals2024Prg101.practice.id, studentId: student.id, score: 8.8, gradedBy: teacherUser.id } }),
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2024Prg101.project.id,  studentId: student.id } }, update: {}, create: { evaluationId: evals2024Prg101.project.id,  studentId: student.id, score: 9.5, gradedBy: teacherUser.id } }),
  ]);

  // 2025-1 · BD101 (Base de Datos) → avg 7.77 → PASSED
  await Promise.all([
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2025Bd101.exam.id,     studentId: student.id } }, update: {}, create: { evaluationId: evals2025Bd101.exam.id,     studentId: student.id, score: 7.8, gradedBy: teacherUser.id } }),
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2025Bd101.practice.id, studentId: student.id } }, update: {}, create: { evaluationId: evals2025Bd101.practice.id, studentId: student.id, score: 8.0, gradedBy: teacherUser.id } }),
    prisma.grade.upsert({ where: { evaluationId_studentId: { evaluationId: evals2025Bd101.project.id,  studentId: student.id } }, update: {}, create: { evaluationId: evals2025Bd101.project.id,  studentId: student.id, score: 7.5, gradedBy: teacherUser.id } }),
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
        finalGrade: 8.00,
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
        finalGrade: 5.45,
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
        finalGrade: 9.09,
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
        finalGrade: 7.77,
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
      create: { certificationType: 'DEGREE', careerId: career.id, minGrade: 7.0, validityMonths: 60, minCredits: 200, requireAllMandatory: true, description: 'Título de licenciatura — promedio mínimo 7.0, todas las materias obligatorias aprobadas' },
    }),
  ]);

  // Criteria with null careerId — upsert doesn't support null in composite keys, use findFirst + create
  for (const criteria of [
    { certificationType: 'TRANSCRIPT' as const, minGrade: 6.0, validityMonths: 12, description: 'Historial académico oficial' },
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
