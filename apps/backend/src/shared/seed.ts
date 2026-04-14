/**
 * Academicore — Database seed
 *
 * Demo dataset covering major entities and enum values for QA: roles (ADMIN,
 * TEACHER, STUDENT), users (active/inactive), two teachers + E2E trio (admin,
 * teacher, student), many students
 * (every AcademicStatus), two active careers + one inactive career, active and
 * inactive subjects, prerequisites, periods (OPEN / GRADING / CLOSED),
 * groups (ON_SITE / VIRTUAL / HYBRID, active/inactive), enrollments (ACTIVE /
 * CLOSED / CANCELLED), enrollment subjects (ENROLLED / DROPPED / COMPLETED /
 * FAILED), evaluations, grades, submissions, academic records, certification
 * types/statuses, fee/payment states, calendar event types, announcements
 * (ALL / CAREER / GROUP), notifications (all NotificationType values), audit
 * actions, and system settings with signatures.
 *
 * E2E: `teacher.e2e` imparte `ETH101-E2E` (2026-1) con temas, materiales y
 * evaluaciones; `student.e2e` tiene cargo de inscripción PENDIENTE para ese
 * período (flujo pago → contenido). El resto de grupos 2026-1 incluyen temas
 * donde aplica el dataset demo.
 *
 * Called automatically on startup when NODE_ENV !== 'production' and the DB
 * is empty. Can also be run manually via `npm run prisma:seed`.
 *
 * Grades use the same 0–100 scale as the rest of the app.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import {
  SIGNATURE_1_BASE64,
  SIGNATURE_2_BASE64,
} from "./signature-seeds";

export async function runSeed(prisma: PrismaClient): Promise<void> {
  console.log("🌱  Seeding database…");

  const hash = (pw: string) => bcrypt.hash(pw, 10);

  // ── 0. DEPARTMENTS ───────────────────────────────────────────────────────────
  const departmentNames = [
    "Ciencias Computacionales",
    "Ingeniería en Sistemas",
    "Matemáticas",
    "Física",
    "Química",
    "Biología",
    "Ingeniería Civil",
    "Ingeniería Mecánica",
    "Ingeniería Eléctrica",
    "Administración de Empresas",
    "Contabilidad",
    "Derecho",
    "Medicina",
    "Enfermería",
    "Psicología",
    "Arquitectura",
    "Diseño Gráfico",
    "Comunicación",
    "Idiomas",
    "Humanidades",
    "Educación",
  ];
  await Promise.all(
    departmentNames.map((name) =>
      prisma.department.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  // ── 1. ROLES ────────────────────────────────────────────────────────────────
  const [adminRole, teacherRole, studentRole] = await Promise.all([
    prisma.role.upsert({
      where: { name: "ADMIN" },
      update: {},
      create: { name: "ADMIN", description: "Administrador del sistema" },
    }),
    prisma.role.upsert({
      where: { name: "TEACHER" },
      update: {},
      create: { name: "TEACHER", description: "Profesor" },
    }),
    prisma.role.upsert({
      where: { name: "STUDENT" },
      update: {},
      create: { name: "STUDENT", description: "Estudiante" },
    }),
  ]);

  // ── 2. USERS ────────────────────────────────────────────────────────────────
  const [
    adminUser,
    teacherUser,
    studentUser,
    adminE2EUser,
    teacherE2EUser,
    studentE2EUser,
  ] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@academicore.com" },
      update: {},
      create: {
        userType: "ADMIN",
        firstName: "Carlos",
        lastName: "Administrador",
        email: "admin@academicore.com",
        passwordHash: await hash("admin123"),
      },
    }),
    prisma.user.upsert({
      where: { email: "prof.garcia@academicore.com" },
      update: {},
      create: {
        userType: "TEACHER",
        firstName: "Roberto",
        lastName: "García",
        email: "prof.garcia@academicore.com",
        passwordHash: await hash("teacher123"),
      },
    }),
    prisma.user.upsert({
      where: { email: "ana.garcia@academicore.com" },
      update: {},
      create: {
        userType: "STUDENT",
        firstName: "Ana",
        lastName: "García",
        email: "ana.garcia@academicore.com",
        passwordHash: await hash("student123"),
      },
    }),
    prisma.user.upsert({
      where: { email: "admin.e2e@academicore.com" },
      update: {
        isActive: true,
        deletedAt: null,
      },
      create: {
        userType: "ADMIN",
        firstName: "Admin",
        lastName: "E2E",
        email: "admin.e2e@academicore.com",
        passwordHash: await hash("AdminE2E#2026"),
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "teacher.e2e@academicore.com" },
      update: {
        isActive: true,
        deletedAt: null,
      },
      create: {
        userType: "TEACHER",
        firstName: "Teacher",
        lastName: "E2E",
        email: "teacher.e2e@academicore.com",
        passwordHash: await hash("TeacherE2E#2026"),
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "student.e2e@academicore.com" },
      update: {
        isActive: true,
        deletedAt: null,
      },
      create: {
        userType: "STUDENT",
        firstName: "Student",
        lastName: "E2E",
        email: "student.e2e@academicore.com",
        passwordHash: await hash("StudentE2E#2026"),
        isActive: true,
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
      where: {
        userId_roleId: { userId: teacherUser.id, roleId: teacherRole.id },
      },
      update: {},
      create: { userId: teacherUser.id, roleId: teacherRole.id },
    }),
    prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: studentUser.id, roleId: studentRole.id },
      },
      update: {},
      create: { userId: studentUser.id, roleId: studentRole.id },
    }),
    prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: adminE2EUser.id, roleId: adminRole.id },
      },
      update: {},
      create: { userId: adminE2EUser.id, roleId: adminRole.id },
    }),
    prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: teacherE2EUser.id, roleId: teacherRole.id },
      },
      update: {},
      create: { userId: teacherE2EUser.id, roleId: teacherRole.id },
    }),
    prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: studentE2EUser.id, roleId: studentRole.id },
      },
      update: {},
      create: { userId: studentE2EUser.id, roleId: studentRole.id },
    }),
  ]);

  // ── 4. CAREERS ───────────────────────────────────────────────────────────────
  const career = await prisma.career.upsert({
    where: { code: "ISC" },
    update: { isActive: true },
    create: {
      name: "Ingeniería en Sistemas Computacionales",
      code: "ISC",
      totalSemesters: 9,
      isActive: true,
    },
  });

  const careerAdm = await prisma.career.upsert({
    where: { code: "LAE" },
    update: { isActive: true },
    create: {
      name: "Licenciatura En Administración (demo)",
      code: "LAE",
      totalSemesters: 8,
      isActive: true,
    },
  });

  const careerArc = await prisma.career.upsert({
    where: { code: "ARC" },
    update: {},
    create: {
      name: "Carrera archivada (inactiva)",
      code: "ARC",
      totalSemesters: 6,
      isActive: false,
    },
  });

  // ── 5. TEACHER & STUDENT SUB-TYPES ───────────────────────────────────────────
  const teacher = await prisma.teacher.upsert({
    where: { employeeCode: "DOC-001" },
    update: {
      userId: teacherUser.id,
      department: "Ciencias Computacionales",
      deletedAt: null,
    },
    create: {
      userId: teacherUser.id,
      employeeCode: "DOC-001",
      department: "Ciencias Computacionales",
    },
  });

  const student = await prisma.student.upsert({
    where: { studentCode: "EST-2021-001" },
    update: {
      userId: studentUser.id,
      careerId: career.id,
      academicStatus: "ACTIVE",
      enrollmentDate: new Date("2021-08-16"),
      deletedAt: null,
    },
    create: {
      userId: studentUser.id,
      studentCode: "EST-2021-001",
      careerId: career.id,
      academicStatus: "ACTIVE",
      enrollmentDate: new Date("2021-08-16"),
    },
  });

  const teacherE2E = await prisma.teacher.upsert({
    where: { employeeCode: "DOC-E2E-001" },
    update: {
      userId: teacherE2EUser.id,
      department: "Ciencias Computacionales",
      deletedAt: null,
    },
    create: {
      userId: teacherE2EUser.id,
      employeeCode: "DOC-E2E-001",
      department: "Ciencias Computacionales",
    },
  });

  const studentE2E = await prisma.student.upsert({
    where: { studentCode: "EST-E2E-001" },
    update: {
      userId: studentE2EUser.id,
      careerId: career.id,
      academicStatus: "ACTIVE",
      enrollmentDate: new Date("2026-01-15"),
      deletedAt: null,
    },
    create: {
      userId: studentE2EUser.id,
      studentCode: "EST-E2E-001",
      careerId: career.id,
      academicStatus: "ACTIVE",
      enrollmentDate: new Date("2026-01-15"),
    },
  });

  const teacher2User = await prisma.user.upsert({
    where: { email: "prof.lopez@academicore.com" },
    update: {},
    create: {
      userType: "TEACHER",
      firstName: "Laura",
      lastName: "López",
      email: "prof.lopez@academicore.com",
      passwordHash: await hash("teacher123"),
    },
  });
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: teacher2User.id, roleId: teacherRole.id },
    },
    update: {},
    create: { userId: teacher2User.id, roleId: teacherRole.id },
  });
  const teacher2 = await prisma.teacher.upsert({
    where: { employeeCode: "DOC-002" },
    update: {
      userId: teacher2User.id,
      department: "Matemáticas",
      deletedAt: null,
    },
    create: {
      userId: teacher2User.id,
      employeeCode: "DOC-002",
      department: "Matemáticas",
    },
  });

  const inactiveStudentUser = await prisma.user.upsert({
    where: { email: "inactivo.est@academicore.com" },
    update: { isActive: false },
    create: {
      userType: "STUDENT",
      firstName: "Usuario",
      lastName: "Inactivo",
      email: "inactivo.est@academicore.com",
      passwordHash: await hash("student123"),
      isActive: false,
    },
  });
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: inactiveStudentUser.id,
        roleId: studentRole.id,
      },
    },
    update: {},
    create: { userId: inactiveStudentUser.id, roleId: studentRole.id },
  });
  await prisma.student.upsert({
    where: { studentCode: "EST-INACTIVE-01" },
    update: {
      userId: inactiveStudentUser.id,
      careerId: career.id,
      academicStatus: "WITHDRAWN",
      deletedAt: null,
    },
    create: {
      userId: inactiveStudentUser.id,
      studentCode: "EST-INACTIVE-01",
      careerId: career.id,
      academicStatus: "WITHDRAWN",
      enrollmentDate: new Date("2020-08-16"),
    },
  });

  type AcademicStatusT =
    | "PENDING"
    | "ACTIVE"
    | "AT_RISK"
    | "ELIGIBLE_FOR_GRADUATION"
    | "SUSPENDED"
    | "GRADUATED"
    | "WITHDRAWN";

  const extraStudentSeeds: Array<{
    email: string;
    firstName: string;
    lastName: string;
    studentCode: string;
    careerId: string;
    academicStatus: AcademicStatusT;
  }> = [
    {
      email: "luis.pendiente@academicore.com",
      firstName: "Luis",
      lastName: "Pendiente",
      studentCode: "EST-2024-PEND",
      careerId: career.id,
      academicStatus: "PENDING",
    },
    {
      email: "maria.riesgo@academicore.com",
      firstName: "María",
      lastName: "EnRiesgo",
      studentCode: "EST-2023-RISK",
      careerId: career.id,
      academicStatus: "AT_RISK",
    },
    {
      email: "pedro.elegible@academicore.com",
      firstName: "Pedro",
      lastName: "Elegible",
      studentCode: "EST-2022-ELIG",
      careerId: career.id,
      academicStatus: "ELIGIBLE_FOR_GRADUATION",
    },
    {
      email: "laura.suspendida@academicore.com",
      firstName: "Laura",
      lastName: "Suspendida",
      studentCode: "EST-2022-SUSP",
      careerId: career.id,
      academicStatus: "SUSPENDED",
    },
    {
      email: "jorge.graduado@academicore.com",
      firstName: "Jorge",
      lastName: "Graduado",
      studentCode: "EST-2019-GRAD",
      careerId: career.id,
      academicStatus: "GRADUATED",
    },
    {
      email: "carla.retirada@academicore.com",
      firstName: "Carla",
      lastName: "Retirada",
      studentCode: "EST-2021-WDR",
      careerId: career.id,
      academicStatus: "WITHDRAWN",
    },
    {
      email: "diana.baja@academicore.com",
      firstName: "Diana",
      lastName: "ConBaja",
      studentCode: "EST-2026-DROP",
      careerId: career.id,
      academicStatus: "ACTIVE",
    },
    {
      email: "enrique.cancel@academicore.com",
      firstName: "Enrique",
      lastName: "Cancelado",
      studentCode: "EST-2026-CAN",
      careerId: careerAdm.id,
      academicStatus: "ACTIVE",
    },
    {
      email: "sofia.adm@academicore.com",
      firstName: "Sofía",
      lastName: "Administración",
      studentCode: "EST-LAE-001",
      careerId: careerAdm.id,
      academicStatus: "ACTIVE",
    },
  ];

  const extraStudents: { userId: string; id: string; email: string }[] = [];
  for (const es of extraStudentSeeds) {
    const u = await prisma.user.upsert({
      where: { email: es.email },
      update: {},
      create: {
        userType: "STUDENT",
        firstName: es.firstName,
        lastName: es.lastName,
        email: es.email,
        passwordHash: await hash("student123"),
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: u.id, roleId: studentRole.id } },
      update: {},
      create: { userId: u.id, roleId: studentRole.id },
    });
    const st = await prisma.student.upsert({
      where: { studentCode: es.studentCode },
      update: {
        userId: u.id,
        academicStatus: es.academicStatus,
        careerId: es.careerId,
        deletedAt: null,
      },
      create: {
        userId: u.id,
        studentCode: es.studentCode,
        careerId: es.careerId,
        academicStatus: es.academicStatus,
        enrollmentDate: new Date("2023-08-16"),
      },
    });
    extraStudents.push({ userId: u.id, id: st.id, email: es.email });
  }

  const studentDiana = extraStudents.find((s) => s.email === "diana.baja@academicore.com")!;
  const studentEnrique = extraStudents.find((s) => s.email === "enrique.cancel@academicore.com")!;
  const studentSofia = extraStudents.find((s) => s.email === "sofia.adm@academicore.com")!;
  const studentMaria = extraStudents.find((s) => s.email === "maria.riesgo@academicore.com")!;
  const studentJorge = extraStudents.find((s) => s.email === "jorge.graduado@academicore.com")!;
  const studentPedro = extraStudents.find(
    (s) => s.email === "pedro.elegible@academicore.com",
  )!;

  // ── 6. SUBJECTS ──────────────────────────────────────────────────────────────
  const [
    mat101,
    mat102,
    prg101,
    prg201,
    bd101,
    red101,
    eth101,
    mat099,
    adm110,
  ] = await Promise.all([
    prisma.subject.upsert({
      where: { code: "MAT101" },
      update: { isActive: true },
      create: { name: "Cálculo Diferencial", code: "MAT101", credits: 6 },
    }),
    prisma.subject.upsert({
      where: { code: "MAT102" },
      update: { isActive: true },
      create: { name: "Álgebra Lineal", code: "MAT102", credits: 5 },
    }),
    prisma.subject.upsert({
      where: { code: "PRG101" },
      update: { isActive: true },
      create: {
        name: "Fundamentos de Programación",
        code: "PRG101",
        credits: 5,
      },
    }),
    prisma.subject.upsert({
      where: { code: "PRG201" },
      update: { isActive: true },
      create: {
        name: "Programación Orientada a Objetos",
        code: "PRG201",
        credits: 6,
      },
    }),
    prisma.subject.upsert({
      where: { code: "BD101" },
      update: { isActive: true },
      create: { name: "Base de Datos", code: "BD101", credits: 6 },
    }),
    prisma.subject.upsert({
      where: { code: "RED101" },
      update: { isActive: true },
      create: { name: "Redes de Computadoras", code: "RED101", credits: 5 },
    }),
    prisma.subject.upsert({
      where: { code: "ETH101" },
      update: { isActive: true },
      create: {
        name: "Ética Profesional",
        code: "ETH101",
        credits: 3,
      },
    }),
    prisma.subject.upsert({
      where: { code: "MAT099" },
      update: { isActive: false },
      create: {
        name: "Materia descontinuada (demo inactiva)",
        code: "MAT099",
        credits: 1,
        isActive: false,
      },
    }),
    prisma.subject.upsert({
      where: { code: "ADM110" },
      update: { isActive: true },
      create: {
        name: "Introducción a la Administración",
        code: "ADM110",
        credits: 4,
      },
    }),
  ]);

  // ── 7. CAREER_SUBJECTS ───────────────────────────────────────────────────────
  const subjectList = [mat101, mat102, prg101, prg201, bd101, red101];
  for (let i = 0; i < subjectList.length; i++) {
    await prisma.careerSubject.upsert({
      where: {
        careerId_subjectId: {
          careerId: career.id,
          subjectId: subjectList[i].id,
        },
      },
      update: {},
      create: {
        careerId: career.id,
        subjectId: subjectList[i].id,
        semesterNumber: Math.floor(i / 2) + 1,
        isMandatory: true,
      },
    });
  }

  await prisma.careerSubject.upsert({
    where: {
      careerId_subjectId: { careerId: career.id, subjectId: eth101.id },
    },
    update: { isMandatory: false },
    create: {
      careerId: career.id,
      subjectId: eth101.id,
      semesterNumber: 1,
      isMandatory: false,
    },
  });

  for (const [subj, sem, mand] of [
    [adm110, 1, true],
    [eth101, 1, true],
    [mat101, 2, true],
  ] as const) {
    await prisma.careerSubject.upsert({
      where: {
        careerId_subjectId: { careerId: careerAdm.id, subjectId: subj.id },
      },
      update: {},
      create: {
        careerId: careerAdm.id,
        subjectId: subj.id,
        semesterNumber: sem,
        isMandatory: mand,
      },
    });
  }

  // ── 7b. SUBJECT PREREQUISITES ─────────────────────────────────────────────────
  // PRG201 (POO) requires PRG101 (Fundamentos de Programación)
  // BD101 (Base de Datos) requires MAT101 (Cálculo Diferencial)
  for (const prereq of [
    { subjectId: prg201.id, prerequisiteId: prg101.id },
    { subjectId: bd101.id, prerequisiteId: mat101.id },
  ]) {
    const exists = await prisma.subjectPrerequisite.findFirst({
      where: {
        subjectId: prereq.subjectId,
        prerequisiteId: prereq.prerequisiteId,
      },
    });
    if (!exists) {
      await prisma.subjectPrerequisite.create({ data: prereq });
    }
  }

  // ── 8. CLASSROOMS ───────────────────────────────────────────────────────────
  const [classroomA101, classroomB201, _classroomInactive] = await Promise.all([
    prisma.classroom.upsert({
      where: { id: "00000000-0000-0000-0000-000000000010" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000010",
        name: "Aula A-101",
        building: "Edificio A",
        capacity: 35,
      },
    }),
    prisma.classroom.upsert({
      where: { id: "00000000-0000-0000-0000-000000000011" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000011",
        name: "Lab B-201",
        building: "Edificio B",
        capacity: 25,
      },
    }),
    prisma.classroom.upsert({
      where: { id: "00000000-0000-0000-0000-000000000012" },
      update: { isActive: false },
      create: {
        id: "00000000-0000-0000-0000-000000000012",
        name: "Aula C-999 (inactiva)",
        building: "Edificio C",
        capacity: 20,
        isActive: false,
      },
    }),
  ]);

  // ── 9. ACADEMIC PERIODS ──────────────────────────────────────────────────────
  const period2023 = await prisma.academicPeriod.upsert({
    where: { id: "00000000-0000-0000-0000-000000000014" },
    update: {
      status: "CLOSED",
      enrollmentOpen: false,
      isActive: false,
      name: "2024-2",
      startDate: new Date("2024-08-12"),
      endDate: new Date("2024-12-20"),
    },
    create: {
      id: "00000000-0000-0000-0000-000000000014",
      name: "2024-2",
      startDate: new Date("2024-08-12"),
      endDate: new Date("2024-12-20"),
      enrollmentOpen: false,
      isActive: false,
      status: "CLOSED",
    },
  });

  const period2024 = await prisma.academicPeriod.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {
      status: "GRADING",
      enrollmentOpen: false,
      isActive: false,
      name: "2025-2",
      startDate: new Date("2025-08-11"),
      endDate: new Date("2025-12-19"),
    },
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "2025-2",
      startDate: new Date("2025-08-11"),
      endDate: new Date("2025-12-19"),
      enrollmentOpen: false,
      isActive: false,
      status: "GRADING",
    },
  });

  const period2025 = await prisma.academicPeriod.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {
      status: "OPEN",
      enrollmentOpen: true,
      isActive: true,
      name: "2026-1",
      startDate: new Date("2026-01-20"),
      endDate: new Date("2026-06-15"),
    },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "2026-1",
      startDate: new Date("2026-01-20"),
      endDate: new Date("2026-06-15"),
      enrollmentOpen: true,
      isActive: true,
      status: "OPEN",
    },
  });

  // ── 10. EVALUATION TYPES ─────────────────────────────────────────────────────
  const [examType, practiceType, projectType] = await Promise.all([
    prisma.evaluationType.upsert({
      where: { name: "Examen" },
      update: {},
      create: { name: "Examen", description: "Evaluación escrita" },
    }),
    prisma.evaluationType.upsert({
      where: { name: "Práctica" },
      update: {},
      create: { name: "Práctica", description: "Ejercicios prácticos" },
    }),
    prisma.evaluationType.upsert({
      where: { name: "Proyecto" },
      update: {},
      create: { name: "Proyecto", description: "Trabajo final de proyecto" },
    }),
  ]);

  // ── 11. GROUPS ───────────────────────────────────────────────────────────────
  // Period 2025-2 (grading) — 3 groups
  const [grpMat101, grpMat102, grpPrg101] = await Promise.all([
    prisma.group.upsert({
      where: {
        subjectId_academicPeriodId_groupCode: {
          subjectId: mat101.id,
          academicPeriodId: period2024.id,
          groupCode: "MAT101-A",
        },
      },
      update: {},
      create: {
        subjectId: mat101.id,
        academicPeriodId: period2024.id,
        teacherId: teacher.id,
        groupCode: "MAT101-A",
        maxStudents: 30,
        currentStudents: 1,
      },
    }),
    prisma.group.upsert({
      where: {
        subjectId_academicPeriodId_groupCode: {
          subjectId: mat102.id,
          academicPeriodId: period2024.id,
          groupCode: "MAT102-A",
        },
      },
      update: {},
      create: {
        subjectId: mat102.id,
        academicPeriodId: period2024.id,
        teacherId: teacher.id,
        groupCode: "MAT102-A",
        maxStudents: 30,
        currentStudents: 1,
      },
    }),
    prisma.group.upsert({
      where: {
        subjectId_academicPeriodId_groupCode: {
          subjectId: prg101.id,
          academicPeriodId: period2024.id,
          groupCode: "PRG101-A",
        },
      },
      update: {},
      create: {
        subjectId: prg101.id,
        academicPeriodId: period2024.id,
        teacherId: teacher.id,
        groupCode: "PRG101-A",
        maxStudents: 30,
        currentStudents: 1,
      },
    }),
  ]);

  // Period 2026-1 (current) — 3 groups + extra sections / modalidades
  const [grpPrg201, grpBd101, grpRed101] = await Promise.all([
    prisma.group.upsert({
      where: {
        subjectId_academicPeriodId_groupCode: {
          subjectId: prg201.id,
          academicPeriodId: period2025.id,
          groupCode: "PRG201-A",
        },
      },
      update: {},
      create: {
        subjectId: prg201.id,
        academicPeriodId: period2025.id,
        teacherId: teacher.id,
        groupCode: "PRG201-A",
        maxStudents: 30,
        currentStudents: 1,
      },
    }),
    prisma.group.upsert({
      where: {
        subjectId_academicPeriodId_groupCode: {
          subjectId: bd101.id,
          academicPeriodId: period2025.id,
          groupCode: "BD101-A",
        },
      },
      update: {},
      create: {
        subjectId: bd101.id,
        academicPeriodId: period2025.id,
        teacherId: teacher.id,
        groupCode: "BD101-A",
        maxStudents: 30,
        currentStudents: 1,
      },
    }),
    prisma.group.upsert({
      where: {
        subjectId_academicPeriodId_groupCode: {
          subjectId: red101.id,
          academicPeriodId: period2025.id,
          groupCode: "RED101-A",
        },
      },
      update: {},
      create: {
        subjectId: red101.id,
        academicPeriodId: period2025.id,
        teacherId: teacher.id,
        groupCode: "RED101-A",
        maxStudents: 30,
        currentStudents: 1,
      },
    }),
  ]);

  const [
    grpRed101V,
    grpRed101H,
    grpBd101Inactive,
    grpPrg201B,
    grpADM110A,
  ] = await Promise.all([
    prisma.group.upsert({
      where: {
        subjectId_academicPeriodId_groupCode: {
          subjectId: red101.id,
          academicPeriodId: period2025.id,
          groupCode: "RED101-V",
        },
      },
      update: { deliveryMode: "VIRTUAL", isActive: true },
      create: {
        subjectId: red101.id,
        academicPeriodId: period2025.id,
        teacherId: teacher2.id,
        groupCode: "RED101-V",
        deliveryMode: "VIRTUAL",
        maxStudents: 40,
        currentStudents: 0,
      },
    }),
    prisma.group.upsert({
      where: {
        subjectId_academicPeriodId_groupCode: {
          subjectId: red101.id,
          academicPeriodId: period2025.id,
          groupCode: "RED101-H",
        },
      },
      update: { deliveryMode: "HYBRID" },
      create: {
        subjectId: red101.id,
        academicPeriodId: period2025.id,
        teacherId: teacher.id,
        groupCode: "RED101-H",
        deliveryMode: "HYBRID",
        maxStudents: 25,
        currentStudents: 0,
      },
    }),
    prisma.group.upsert({
      where: {
        subjectId_academicPeriodId_groupCode: {
          subjectId: bd101.id,
          academicPeriodId: period2025.id,
          groupCode: "BD101-Z",
        },
      },
      update: { isActive: false },
      create: {
        subjectId: bd101.id,
        academicPeriodId: period2025.id,
        teacherId: teacher2.id,
        groupCode: "BD101-Z",
        deliveryMode: "ON_SITE",
        maxStudents: 30,
        currentStudents: 0,
        isActive: false,
      },
    }),
    prisma.group.upsert({
      where: {
        subjectId_academicPeriodId_groupCode: {
          subjectId: prg201.id,
          academicPeriodId: period2025.id,
          groupCode: "PRG201-B",
        },
      },
      update: {},
      create: {
        subjectId: prg201.id,
        academicPeriodId: period2025.id,
        teacherId: teacher2.id,
        groupCode: "PRG201-B",
        deliveryMode: "ON_SITE",
        maxStudents: 30,
        currentStudents: 1,
      },
    }),
    prisma.group.upsert({
      where: {
        subjectId_academicPeriodId_groupCode: {
          subjectId: adm110.id,
          academicPeriodId: period2025.id,
          groupCode: "ADM110-A",
        },
      },
      update: {},
      create: {
        subjectId: adm110.id,
        academicPeriodId: period2025.id,
        teacherId: teacher2.id,
        groupCode: "ADM110-A",
        deliveryMode: "ON_SITE",
        maxStudents: 35,
        currentStudents: 1,
      },
    }),
  ]);

  // Grupo dedicado E2E (2026-1): docente teacher.e2e — Ética; con cupo para inscripciones de prueba
  const grpEth101E2E = await prisma.group.upsert({
    where: {
      subjectId_academicPeriodId_groupCode: {
        subjectId: eth101.id,
        academicPeriodId: period2025.id,
        groupCode: "ETH101-E2E",
      },
    },
    update: {
      teacherId: teacherE2E.id,
      isActive: true,
    },
    create: {
      subjectId: eth101.id,
      academicPeriodId: period2025.id,
      teacherId: teacherE2E.id,
      groupCode: "ETH101-E2E",
      maxStudents: 45,
      currentStudents: 0,
    },
  });

  // ── 11b. GROUP_CLASSROOMS (schedules) ─────────────────────────────────────────
  // Helper to build a time-only Date (Prisma @db.Time)
  const time = (h: number, m: number) =>
    new Date(
      `1970-01-01T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`,
    );

  const schedules = [
    // 2025-2 (grading) groups
    {
      groupId: grpMat101.id,
      classroomId: classroomA101.id,
      dayOfWeek: 1,
      startTime: time(8, 0),
      endTime: time(10, 0),
    },
    {
      groupId: grpMat102.id,
      classroomId: classroomA101.id,
      dayOfWeek: 2,
      startTime: time(8, 0),
      endTime: time(10, 0),
    },
    {
      groupId: grpPrg101.id,
      classroomId: classroomB201.id,
      dayOfWeek: 3,
      startTime: time(10, 0),
      endTime: time(12, 0),
    },
    // 2026-1 (current) groups
    {
      groupId: grpPrg201.id,
      classroomId: classroomB201.id,
      dayOfWeek: 1,
      startTime: time(10, 0),
      endTime: time(12, 0),
    },
    {
      groupId: grpBd101.id,
      classroomId: classroomB201.id,
      dayOfWeek: 2,
      startTime: time(14, 0),
      endTime: time(16, 0),
    },
    {
      groupId: grpRed101.id,
      classroomId: classroomA101.id,
      dayOfWeek: 4,
      startTime: time(8, 0),
      endTime: time(10, 0),
    },
    {
      groupId: grpRed101H.id,
      classroomId: classroomA101.id,
      dayOfWeek: 5,
      startTime: time(8, 0),
      endTime: time(10, 0),
    },
    {
      groupId: grpPrg201B.id,
      classroomId: classroomA101.id,
      dayOfWeek: 3,
      startTime: time(14, 0),
      endTime: time(16, 0),
    },
    {
      groupId: grpADM110A.id,
      classroomId: classroomA101.id,
      dayOfWeek: 2,
      startTime: time(7, 0),
      endTime: time(8, 30),
    },
    {
      groupId: grpEth101E2E.id,
      classroomId: classroomB201.id,
      dayOfWeek: 6,
      startTime: time(10, 0),
      endTime: time(12, 0),
    },
  ];

  for (const s of schedules) {
    const exists = await prisma.groupClassroom.findFirst({
      where: {
        classroomId: s.classroomId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      },
    });
    if (!exists) {
      await prisma.groupClassroom.create({ data: s });
    }
  }

  // ── 12. ENROLLMENTS ──────────────────────────────────────────────────────────
  const enrollment2024 = await prisma.enrollment.upsert({
    where: {
      studentId_academicPeriodId: {
        studentId: student.id,
        academicPeriodId: period2024.id,
      },
    },
    update: {},
    create: {
      studentId: student.id,
      academicPeriodId: period2024.id,
      status: "CLOSED",
    },
  });

  const enrollment2025 = await prisma.enrollment.upsert({
    where: {
      studentId_academicPeriodId: {
        studentId: student.id,
        academicPeriodId: period2025.id,
      },
    },
    update: {},
    create: {
      studentId: student.id,
      academicPeriodId: period2025.id,
      status: "ACTIVE",
    },
  });

  const enrollMaria2025 = await prisma.enrollment.upsert({
    where: {
      studentId_academicPeriodId: {
        studentId: studentMaria.id,
        academicPeriodId: period2025.id,
      },
    },
    update: {},
    create: {
      studentId: studentMaria.id,
      academicPeriodId: period2025.id,
      status: "ACTIVE",
    },
  });

  const enrollDiana2025 = await prisma.enrollment.upsert({
    where: {
      studentId_academicPeriodId: {
        studentId: studentDiana.id,
        academicPeriodId: period2025.id,
      },
    },
    update: {},
    create: {
      studentId: studentDiana.id,
      academicPeriodId: period2025.id,
      status: "ACTIVE",
    },
  });

  const enrollEnrique2025 = await prisma.enrollment.upsert({
    where: {
      studentId_academicPeriodId: {
        studentId: studentEnrique.id,
        academicPeriodId: period2025.id,
      },
    },
    update: { status: "CANCELLED" },
    create: {
      studentId: studentEnrique.id,
      academicPeriodId: period2025.id,
      status: "CANCELLED",
    },
  });

  const enrollSofia2025 = await prisma.enrollment.upsert({
    where: {
      studentId_academicPeriodId: {
        studentId: studentSofia.id,
        academicPeriodId: period2025.id,
      },
    },
    update: {},
    create: {
      studentId: studentSofia.id,
      academicPeriodId: period2025.id,
      status: "ACTIVE",
    },
  });

  const enrollmentPedro2024 = await prisma.enrollment.upsert({
    where: {
      studentId_academicPeriodId: {
        studentId: studentPedro.id,
        academicPeriodId: period2024.id,
      },
    },
    update: { status: "CLOSED" },
    create: {
      studentId: studentPedro.id,
      academicPeriodId: period2024.id,
      status: "CLOSED",
    },
  });

  const enrollmentPedro2025 = await prisma.enrollment.upsert({
    where: {
      studentId_academicPeriodId: {
        studentId: studentPedro.id,
        academicPeriodId: period2025.id,
      },
    },
    update: { status: "CLOSED" },
    create: {
      studentId: studentPedro.id,
      academicPeriodId: period2025.id,
      status: "CLOSED",
    },
  });

  // ── 13. ENROLLMENT_SUBJECTS ──────────────────────────────────────────────────
  // 2025-2 subjects — all completed
  await Promise.all([
    prisma.enrollmentSubject.upsert({
      where: {
        enrollmentId_groupId: {
          enrollmentId: enrollment2024.id,
          groupId: grpMat101.id,
        },
      },
      update: {},
      create: {
        enrollmentId: enrollment2024.id,
        groupId: grpMat101.id,
        status: "COMPLETED",
      },
    }),
    prisma.enrollmentSubject.upsert({
      where: {
        enrollmentId_groupId: {
          enrollmentId: enrollment2024.id,
          groupId: grpMat102.id,
        },
      },
      update: {},
      create: {
        enrollmentId: enrollment2024.id,
        groupId: grpMat102.id,
        status: "FAILED",
      },
    }),
    prisma.enrollmentSubject.upsert({
      where: {
        enrollmentId_groupId: {
          enrollmentId: enrollment2024.id,
          groupId: grpPrg101.id,
        },
      },
      update: {},
      create: {
        enrollmentId: enrollment2024.id,
        groupId: grpPrg101.id,
        status: "COMPLETED",
      },
    }),
  ]);

  // 2026-1 subjects — active
  await Promise.all([
    prisma.enrollmentSubject.upsert({
      where: {
        enrollmentId_groupId: {
          enrollmentId: enrollment2025.id,
          groupId: grpPrg201.id,
        },
      },
      update: {},
      create: {
        enrollmentId: enrollment2025.id,
        groupId: grpPrg201.id,
        status: "ENROLLED",
      },
    }),
    prisma.enrollmentSubject.upsert({
      where: {
        enrollmentId_groupId: {
          enrollmentId: enrollment2025.id,
          groupId: grpBd101.id,
        },
      },
      update: {},
      create: {
        enrollmentId: enrollment2025.id,
        groupId: grpBd101.id,
        status: "ENROLLED",
      },
    }),
    prisma.enrollmentSubject.upsert({
      where: {
        enrollmentId_groupId: {
          enrollmentId: enrollment2025.id,
          groupId: grpRed101.id,
        },
      },
      update: {},
      create: {
        enrollmentId: enrollment2025.id,
        groupId: grpRed101.id,
        status: "ENROLLED",
      },
    }),
  ]);

  // Pedro Elegible — ISC: all mandatory subjects completed with passing grades
  // (matches ELIGIBLE_FOR_GRADUATION / trigger logic: every mandatory career subject passed)
  await Promise.all([
    prisma.enrollmentSubject.upsert({
      where: {
        enrollmentId_groupId: {
          enrollmentId: enrollmentPedro2024.id,
          groupId: grpMat101.id,
        },
      },
      update: { status: "COMPLETED" },
      create: {
        enrollmentId: enrollmentPedro2024.id,
        groupId: grpMat101.id,
        status: "COMPLETED",
      },
    }),
    prisma.enrollmentSubject.upsert({
      where: {
        enrollmentId_groupId: {
          enrollmentId: enrollmentPedro2024.id,
          groupId: grpMat102.id,
        },
      },
      update: { status: "COMPLETED" },
      create: {
        enrollmentId: enrollmentPedro2024.id,
        groupId: grpMat102.id,
        status: "COMPLETED",
      },
    }),
    prisma.enrollmentSubject.upsert({
      where: {
        enrollmentId_groupId: {
          enrollmentId: enrollmentPedro2024.id,
          groupId: grpPrg101.id,
        },
      },
      update: { status: "COMPLETED" },
      create: {
        enrollmentId: enrollmentPedro2024.id,
        groupId: grpPrg101.id,
        status: "COMPLETED",
      },
    }),
  ]);
  await Promise.all([
    prisma.enrollmentSubject.upsert({
      where: {
        enrollmentId_groupId: {
          enrollmentId: enrollmentPedro2025.id,
          groupId: grpPrg201.id,
        },
      },
      update: { status: "COMPLETED" },
      create: {
        enrollmentId: enrollmentPedro2025.id,
        groupId: grpPrg201.id,
        status: "COMPLETED",
      },
    }),
    prisma.enrollmentSubject.upsert({
      where: {
        enrollmentId_groupId: {
          enrollmentId: enrollmentPedro2025.id,
          groupId: grpBd101.id,
        },
      },
      update: { status: "COMPLETED" },
      create: {
        enrollmentId: enrollmentPedro2025.id,
        groupId: grpBd101.id,
        status: "COMPLETED",
      },
    }),
    prisma.enrollmentSubject.upsert({
      where: {
        enrollmentId_groupId: {
          enrollmentId: enrollmentPedro2025.id,
          groupId: grpRed101.id,
        },
      },
      update: { status: "COMPLETED" },
      create: {
        enrollmentId: enrollmentPedro2025.id,
        groupId: grpRed101.id,
        status: "COMPLETED",
      },
    }),
  ]);

  await Promise.all([
    prisma.enrollmentSubject.upsert({
      where: {
        enrollmentId_groupId: {
          enrollmentId: enrollMaria2025.id,
          groupId: grpPrg201B.id,
        },
      },
      update: {},
      create: {
        enrollmentId: enrollMaria2025.id,
        groupId: grpPrg201B.id,
        status: "ENROLLED",
      },
    }),
    prisma.enrollmentSubject.upsert({
      where: {
        enrollmentId_groupId: {
          enrollmentId: enrollDiana2025.id,
          groupId: grpBd101.id,
        },
      },
      update: {},
      create: {
        enrollmentId: enrollDiana2025.id,
        groupId: grpBd101.id,
        status: "DROPPED",
      },
    }),
    prisma.enrollmentSubject.upsert({
      where: {
        enrollmentId_groupId: {
          enrollmentId: enrollDiana2025.id,
          groupId: grpRed101.id,
        },
      },
      update: {},
      create: {
        enrollmentId: enrollDiana2025.id,
        groupId: grpRed101.id,
        status: "ENROLLED",
      },
    }),
    prisma.enrollmentSubject.upsert({
      where: {
        enrollmentId_groupId: {
          enrollmentId: enrollSofia2025.id,
          groupId: grpADM110A.id,
        },
      },
      update: {},
      create: {
        enrollmentId: enrollSofia2025.id,
        groupId: grpADM110A.id,
        status: "ENROLLED",
      },
    }),
  ]);

  await Promise.all([
    prisma.group.update({
      where: { id: grpMat101.id },
      data: { currentStudents: 2 },
    }),
    prisma.group.update({
      where: { id: grpMat102.id },
      data: { currentStudents: 2 },
    }),
    prisma.group.update({
      where: { id: grpPrg101.id },
      data: { currentStudents: 2 },
    }),
    prisma.group.update({
      where: { id: grpPrg201.id },
      data: { currentStudents: 2 },
    }),
    prisma.group.update({
      where: { id: grpBd101.id },
      data: { currentStudents: 2 },
    }),
    prisma.group.update({
      where: { id: grpRed101.id },
      data: { currentStudents: 3 },
    }),
  ]);

  // ── 14. EVALUATIONS (3 per group, weights sum to 100) ────────────────────────
  // Helper: find existing evaluation by group+name or create it
  const findOrCreateEval = async (
    groupId: string,
    name: string,
    evaluationTypeId: string,
    weight: number,
  ) => {
    const existing = await prisma.evaluation.findFirst({
      where: { groupId, name },
    });
    if (existing) return existing;
    return prisma.evaluation.create({
      data: { groupId, evaluationTypeId, name, weight, maxScore: 100 },
    });
  };

  const ensureEvals = async (groupId: string) => {
    const [exam, practice, project] = await Promise.all([
      findOrCreateEval(groupId, "Examen Parcial", examType.id, 40),
      findOrCreateEval(groupId, "Prácticas", practiceType.id, 30),
      findOrCreateEval(groupId, "Proyecto Final", projectType.id, 30),
    ]);
    return { exam, practice, project };
  };

  const evals2024Mat101 = await ensureEvals(grpMat101.id);
  const evals2024Mat102 = await ensureEvals(grpMat102.id);
  const evals2024Prg101 = await ensureEvals(grpPrg101.id);
  const evals2025Bd101 = await ensureEvals(grpBd101.id);
  const evals2025Prg201 = await ensureEvals(grpPrg201.id);
  const evals2025Red101 = await ensureEvals(grpRed101.id);
  await ensureEvals(grpPrg201B.id);
  await ensureEvals(grpADM110A.id);
  await ensureEvals(grpEth101E2E.id);

  await prisma.studentSubmission.upsert({
    where: {
      studentId_evaluationId: {
        studentId: student.id,
        evaluationId: evals2025Prg201.practice.id,
      },
    },
    update: {},
    create: {
      studentId: student.id,
      evaluationId: evals2025Prg201.practice.id,
      title: "Entrega demo — enlace",
      type: "LINK",
      content: "https://example.com/entregas/seed-demo",
    },
  });

  // ── 15. GRADES (0–100 scale) ──────────────────────────────────────────────────
  // 2025-2 · MAT101 (Cálculo Diferencial) → avg 80 → PASSED
  await Promise.all([
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2024Mat101.exam.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2024Mat101.exam.id,
        studentId: student.id,
        score: 80,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2024Mat101.practice.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2024Mat101.practice.id,
        studentId: student.id,
        score: 75,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2024Mat101.project.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2024Mat101.project.id,
        studentId: student.id,
        score: 85,
        gradedBy: teacherUser.id,
      },
    }),
  ]);

  // 2025-2 · MAT102 (Álgebra Lineal) → avg 54.5 → FAILED
  await Promise.all([
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2024Mat102.exam.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2024Mat102.exam.id,
        studentId: student.id,
        score: 50,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2024Mat102.practice.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2024Mat102.practice.id,
        studentId: student.id,
        score: 55,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2024Mat102.project.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2024Mat102.project.id,
        studentId: student.id,
        score: 60,
        gradedBy: teacherUser.id,
      },
    }),
  ]);

  // 2025-2 · PRG101 (Fundamentos de Programación) → avg 90.9 → PASSED
  await Promise.all([
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2024Prg101.exam.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2024Prg101.exam.id,
        studentId: student.id,
        score: 90,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2024Prg101.practice.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2024Prg101.practice.id,
        studentId: student.id,
        score: 88,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2024Prg101.project.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2024Prg101.project.id,
        studentId: student.id,
        score: 95,
        gradedBy: teacherUser.id,
      },
    }),
  ]);

  // 2026-1 · BD101 (Base de Datos) → avg 77.7 → PASSED
  await Promise.all([
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2025Bd101.exam.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2025Bd101.exam.id,
        studentId: student.id,
        score: 78,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2025Bd101.practice.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2025Bd101.practice.id,
        studentId: student.id,
        score: 80,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2025Bd101.project.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2025Bd101.project.id,
        studentId: student.id,
        score: 75,
        gradedBy: teacherUser.id,
      },
    }),
  ]);

  // 2026-1 · PRG201 (Programación II) → weighted avg 85.0 → PASSED
  await Promise.all([
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2025Prg201.exam.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2025Prg201.exam.id,
        studentId: student.id,
        score: 85,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2025Prg201.practice.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2025Prg201.practice.id,
        studentId: student.id,
        score: 82,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2025Prg201.project.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2025Prg201.project.id,
        studentId: student.id,
        score: 88,
        gradedBy: teacherUser.id,
      },
    }),
  ]);

  // 2026-1 · RED101 (Redes) → weighted avg 72.3 → PASSED
  await Promise.all([
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2025Red101.exam.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2025Red101.exam.id,
        studentId: student.id,
        score: 72,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2025Red101.practice.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2025Red101.practice.id,
        studentId: student.id,
        score: 70,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2025Red101.project.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2025Red101.project.id,
        studentId: student.id,
        score: 75,
        gradedBy: teacherUser.id,
      },
    }),
  ]);

  // Pedro Elegible — strong record on all 6 mandatory ISC subjects (all passed)
  await Promise.all([
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2024Mat101.exam.id,
          studentId: studentPedro.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2024Mat101.exam.id,
        studentId: studentPedro.id,
        score: 88,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2024Mat101.practice.id,
          studentId: studentPedro.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2024Mat101.practice.id,
        studentId: studentPedro.id,
        score: 90,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2024Mat101.project.id,
          studentId: studentPedro.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2024Mat101.project.id,
        studentId: studentPedro.id,
        score: 85,
        gradedBy: teacherUser.id,
      },
    }),
  ]);
  await Promise.all([
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2024Mat102.exam.id,
          studentId: studentPedro.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2024Mat102.exam.id,
        studentId: studentPedro.id,
        score: 72,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2024Mat102.practice.id,
          studentId: studentPedro.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2024Mat102.practice.id,
        studentId: studentPedro.id,
        score: 75,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2024Mat102.project.id,
          studentId: studentPedro.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2024Mat102.project.id,
        studentId: studentPedro.id,
        score: 78,
        gradedBy: teacherUser.id,
      },
    }),
  ]);
  await Promise.all([
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2024Prg101.exam.id,
          studentId: studentPedro.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2024Prg101.exam.id,
        studentId: studentPedro.id,
        score: 92,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2024Prg101.practice.id,
          studentId: studentPedro.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2024Prg101.practice.id,
        studentId: studentPedro.id,
        score: 90,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2024Prg101.project.id,
          studentId: studentPedro.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2024Prg101.project.id,
        studentId: studentPedro.id,
        score: 95,
        gradedBy: teacherUser.id,
      },
    }),
  ]);
  await Promise.all([
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2025Prg201.exam.id,
          studentId: studentPedro.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2025Prg201.exam.id,
        studentId: studentPedro.id,
        score: 88,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2025Prg201.practice.id,
          studentId: studentPedro.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2025Prg201.practice.id,
        studentId: studentPedro.id,
        score: 86,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2025Prg201.project.id,
          studentId: studentPedro.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2025Prg201.project.id,
        studentId: studentPedro.id,
        score: 90,
        gradedBy: teacherUser.id,
      },
    }),
  ]);
  await Promise.all([
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2025Bd101.exam.id,
          studentId: studentPedro.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2025Bd101.exam.id,
        studentId: studentPedro.id,
        score: 80,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2025Bd101.practice.id,
          studentId: studentPedro.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2025Bd101.practice.id,
        studentId: studentPedro.id,
        score: 82,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2025Bd101.project.id,
          studentId: studentPedro.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2025Bd101.project.id,
        studentId: studentPedro.id,
        score: 85,
        gradedBy: teacherUser.id,
      },
    }),
  ]);
  await Promise.all([
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2025Red101.exam.id,
          studentId: studentPedro.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2025Red101.exam.id,
        studentId: studentPedro.id,
        score: 75,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2025Red101.practice.id,
          studentId: studentPedro.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2025Red101.practice.id,
        studentId: studentPedro.id,
        score: 78,
        gradedBy: teacherUser.id,
      },
    }),
    prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: evals2025Red101.project.id,
          studentId: studentPedro.id,
        },
      },
      update: {},
      create: {
        evaluationId: evals2025Red101.project.id,
        studentId: studentPedro.id,
        score: 80,
        gradedBy: teacherUser.id,
      },
    }),
  ]);

  // ── 16. ACADEMIC RECORDS ─────────────────────────────────────────────────────
  // Created directly (trigger requires the SP SQL to be installed separately)
  await Promise.all([
    prisma.academicRecord.upsert({
      where: {
        studentId_groupId: { studentId: student.id, groupId: grpMat101.id },
      },
      update: {},
      create: {
        studentId: student.id,
        groupId: grpMat101.id,
        academicPeriodId: period2024.id,
        finalGrade: 80.0,
        passed: true,
        attemptNumber: 1,
      },
    }),
    prisma.academicRecord.upsert({
      where: {
        studentId_groupId: { studentId: student.id, groupId: grpMat102.id },
      },
      update: {},
      create: {
        studentId: student.id,
        groupId: grpMat102.id,
        academicPeriodId: period2024.id,
        finalGrade: 54.5,
        passed: false,
        attemptNumber: 1,
      },
    }),
    prisma.academicRecord.upsert({
      where: {
        studentId_groupId: { studentId: student.id, groupId: grpPrg101.id },
      },
      update: {},
      create: {
        studentId: student.id,
        groupId: grpPrg101.id,
        academicPeriodId: period2024.id,
        finalGrade: 90.9,
        passed: true,
        attemptNumber: 1,
      },
    }),
    prisma.academicRecord.upsert({
      where: {
        studentId_groupId: { studentId: student.id, groupId: grpBd101.id },
      },
      update: {},
      create: {
        studentId: student.id,
        groupId: grpBd101.id,
        academicPeriodId: period2025.id,
        finalGrade: 77.7,
        passed: true,
        attemptNumber: 1,
      },
    }),
    prisma.academicRecord.upsert({
      where: {
        studentId_groupId: { studentId: student.id, groupId: grpPrg201.id },
      },
      update: {},
      create: {
        studentId: student.id,
        groupId: grpPrg201.id,
        academicPeriodId: period2025.id,
        finalGrade: 85.0,
        passed: true,
        attemptNumber: 1,
      },
    }),
    prisma.academicRecord.upsert({
      where: {
        studentId_groupId: { studentId: student.id, groupId: grpRed101.id },
      },
      update: {},
      create: {
        studentId: student.id,
        groupId: grpRed101.id,
        academicPeriodId: period2025.id,
        finalGrade: 72.3,
        passed: true,
        attemptNumber: 1,
      },
    }),
  ]);

  await Promise.all([
    prisma.academicRecord.upsert({
      where: {
        studentId_groupId: { studentId: studentPedro.id, groupId: grpMat101.id },
      },
      update: {},
      create: {
        studentId: studentPedro.id,
        groupId: grpMat101.id,
        academicPeriodId: period2024.id,
        finalGrade: 87.7,
        passed: true,
        attemptNumber: 1,
      },
    }),
    prisma.academicRecord.upsert({
      where: {
        studentId_groupId: { studentId: studentPedro.id, groupId: grpMat102.id },
      },
      update: {},
      create: {
        studentId: studentPedro.id,
        groupId: grpMat102.id,
        academicPeriodId: period2024.id,
        finalGrade: 74.7,
        passed: true,
        attemptNumber: 1,
      },
    }),
    prisma.academicRecord.upsert({
      where: {
        studentId_groupId: { studentId: studentPedro.id, groupId: grpPrg101.id },
      },
      update: {},
      create: {
        studentId: studentPedro.id,
        groupId: grpPrg101.id,
        academicPeriodId: period2024.id,
        finalGrade: 92.3,
        passed: true,
        attemptNumber: 1,
      },
    }),
    prisma.academicRecord.upsert({
      where: {
        studentId_groupId: { studentId: studentPedro.id, groupId: grpPrg201.id },
      },
      update: {},
      create: {
        studentId: studentPedro.id,
        groupId: grpPrg201.id,
        academicPeriodId: period2025.id,
        finalGrade: 88.0,
        passed: true,
        attemptNumber: 1,
      },
    }),
    prisma.academicRecord.upsert({
      where: {
        studentId_groupId: { studentId: studentPedro.id, groupId: grpBd101.id },
      },
      update: {},
      create: {
        studentId: studentPedro.id,
        groupId: grpBd101.id,
        academicPeriodId: period2025.id,
        finalGrade: 82.1,
        passed: true,
        attemptNumber: 1,
      },
    }),
    prisma.academicRecord.upsert({
      where: {
        studentId_groupId: { studentId: studentPedro.id, groupId: grpRed101.id },
      },
      update: {},
      create: {
        studentId: studentPedro.id,
        groupId: grpRed101.id,
        academicPeriodId: period2025.id,
        finalGrade: 77.4,
        passed: true,
        attemptNumber: 1,
      },
    }),
  ]);

  // ── 17. CERTIFICATION CRITERIA ───────────────────────────────────────────────
  await Promise.all([
    prisma.certificationCriteria.upsert({
      where: {
        certificationType_careerId: {
          certificationType: "DEGREE",
          careerId: career.id,
        },
      },
      update: {},
      create: {
        certificationType: "DEGREE",
        careerId: career.id,
        minGrade: 70,
        validityMonths: 60,
        minCredits: 200,
        requireAllMandatory: true,
        description:
          "Título de licenciatura — promedio mínimo 70, todas las materias obligatorias aprobadas",
      },
    }),
    prisma.certificationCriteria.upsert({
      where: {
        certificationType_careerId: {
          certificationType: "COMPLETION",
          careerId: career.id,
        },
      },
      update: {},
      create: {
        certificationType: "COMPLETION",
        careerId: career.id,
        minGrade: 60,
        validityMonths: 24,
        minCredits: 120,
        requireAllMandatory: false,
        description: "Constancia de terminación de estudios (demo)",
      },
    }),
  ]);

  // Criteria with null careerId — upsert doesn't support null in composite keys, use findFirst + create
  for (const criteria of [
    {
      certificationType: "TRANSCRIPT" as const,
      minGrade: 60,
      validityMonths: 12,
      description: "Historial académico oficial",
    },
    {
      certificationType: "COMPLETION" as const,
      minGrade: 60,
      validityMonths: 12,
      description: "Finalización de programa (criterio global)",
    },
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
  const verificationCode = "00000000-seed-cert-0000-000000000001";
  const documentHash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        studentId: student.id,
        type: "TRANSCRIPT",
        issuedAt: "2026-01-20",
      }),
    )
    .digest("hex");

  await prisma.certification.upsert({
    where: { verificationCode },
    update: {},
    create: {
      studentId: student.id,
      careerId: career.id,
      certificationType: "TRANSCRIPT",
      status: "ACTIVE",
      verificationCode,
      documentHash,
      issuedBy: adminUser.id,
      issuedAt: new Date("2026-01-20"),
      expiresAt: new Date("2027-01-20"),
    },
  });

  const hashCert = (payload: unknown) =>
    crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");

  await prisma.certification.upsert({
    where: { verificationCode: "00000000-seed-cert-0000-000000000002" },
    update: {},
    create: {
      studentId: student.id,
      careerId: career.id,
      certificationType: "DEGREE",
      status: "ACTIVE",
      verificationCode: "00000000-seed-cert-0000-000000000002",
      documentHash: hashCert({ kind: "DEGREE", studentId: student.id }),
      issuedBy: adminUser.id,
      issuedAt: new Date("2024-06-01"),
    },
  });

  await prisma.certification.upsert({
    where: { verificationCode: "00000000-seed-cert-0000-000000000003" },
    update: {},
    create: {
      studentId: student.id,
      careerId: career.id,
      certificationType: "TRANSCRIPT",
      status: "REVOKED",
      verificationCode: "00000000-seed-cert-0000-000000000003",
      documentHash: hashCert({ kind: "REVOKED", studentId: student.id }),
      issuedBy: adminUser.id,
      issuedAt: new Date("2023-01-10"),
      revokedAt: new Date("2023-06-01"),
      revokedReason: "Demo: historial sustituido por versión corregida",
    },
  });

  await prisma.certification.upsert({
    where: { verificationCode: "00000000-seed-cert-0000-000000000004" },
    update: {},
    create: {
      studentId: student.id,
      careerId: null,
      certificationType: "COMPLETION",
      status: "EXPIRED",
      verificationCode: "00000000-seed-cert-0000-000000000004",
      documentHash: hashCert({ kind: "EXPIRED", studentId: student.id }),
      issuedBy: adminUser.id,
      issuedAt: new Date("2018-01-15"),
      expiresAt: new Date("2019-01-15"),
    },
  });

  // ── 19. AUDIT LOGS ───────────────────────────────────────────────────────────
  const auditEntries = [
    {
      entityType: "user",
      entityId: studentUser.id,
      action: "CREATED" as const,
      performedBy: adminUser.id,
      newValues: { email: studentUser.email, role: "STUDENT" },
    },
    {
      entityType: "user",
      entityId: teacherUser.id,
      action: "CREATED" as const,
      performedBy: adminUser.id,
      newValues: { email: teacherUser.email, role: "TEACHER" },
    },
    {
      entityType: "enrollment",
      entityId: enrollment2025.id,
      action: "ENROLLED" as const,
      performedBy: adminUser.id,
      newValues: { period: "2026-1", student: "EST-2021-001" },
    },
    {
      entityType: "enrollment",
      entityId: enrollment2024.id,
      action: "ENROLLED" as const,
      performedBy: adminUser.id,
      newValues: { period: "2025-2", student: "EST-2021-001" },
    },
    {
      entityType: "certification",
      entityId: student.id,
      action: "ISSUED" as const,
      performedBy: adminUser.id,
      newValues: { type: "TRANSCRIPT", code: verificationCode },
    },
    {
      entityType: "student",
      entityId: student.id,
      action: "STATUS_CHANGE" as const,
      performedBy: adminUser.id,
      newValues: { status: "ACTIVE" },
    },
    {
      entityType: "enrollment",
      entityId: enrollEnrique2025.id,
      action: "STATUS_CHANGE" as const,
      performedBy: adminUser.id,
      newValues: { status: "CANCELLED", studentCode: "EST-2026-CAN" },
    },
    {
      entityType: "certification",
      entityId: student.id,
      action: "REVOKED" as const,
      performedBy: adminUser.id,
      newValues: { verificationCode: "00000000-seed-cert-0000-000000000003" },
    },
    {
      entityType: "user",
      entityId: inactiveStudentUser.id,
      action: "UPDATED" as const,
      performedBy: adminUser.id,
      newValues: { isActive: false },
    },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({ data: entry }).catch(() => {
      /* skip duplicates */
    });
  }

  // ── 20. TOPICS & CONTENT ITEMS ───────────────────────────────────────────
  // PRG201 — Programación Orientada a Objetos (2026-1)
  const topicPrg1 = await prisma.topic.upsert({
    where: { groupId_sortOrder: { groupId: grpPrg201.id, sortOrder: 1 } },
    update: { weekNumber: 1 },
    create: {
      groupId: grpPrg201.id,
      title: "Introducción a POO",
      description:
        "Conceptos fundamentales de la programación orientada a objetos",
      sortOrder: 1,
      weekNumber: 1,
    },
  });
  const topicPrg2 = await prisma.topic.upsert({
    where: { groupId_sortOrder: { groupId: grpPrg201.id, sortOrder: 2 } },
    update: { weekNumber: 2 },
    create: {
      groupId: grpPrg201.id,
      title: "Clases y Objetos",
      description: "Definición de clases, atributos, métodos y constructores",
      sortOrder: 2,
      weekNumber: 2,
    },
  });
  const topicPrg3 = await prisma.topic.upsert({
    where: { groupId_sortOrder: { groupId: grpPrg201.id, sortOrder: 3 } },
    update: { weekNumber: 3 },
    create: {
      groupId: grpPrg201.id,
      title: "Herencia y Polimorfismo",
      description: "Herencia, clases abstractas, interfaces y polimorfismo",
      sortOrder: 3,
      weekNumber: 3,
    },
  });

  // BD101 — Base de Datos (2026-1)
  const topicBd1 = await prisma.topic.upsert({
    where: { groupId_sortOrder: { groupId: grpBd101.id, sortOrder: 1 } },
    update: { weekNumber: 1 },
    create: {
      groupId: grpBd101.id,
      title: "Modelo Relacional",
      description:
        "Fundamentos del modelo relacional: tablas, columnas, claves primarias y foráneas",
      sortOrder: 1,
      weekNumber: 1,
    },
  });
  const topicBd2 = await prisma.topic.upsert({
    where: { groupId_sortOrder: { groupId: grpBd101.id, sortOrder: 2 } },
    update: { weekNumber: 2 },
    create: {
      groupId: grpBd101.id,
      title: "SQL Básico",
      description: "SELECT, INSERT, UPDATE, DELETE y filtrado con WHERE",
      sortOrder: 2,
      weekNumber: 2,
    },
  });

  // Content items — PRG201
  for (const item of [
    {
      topicId: topicPrg1.id,
      title: "Notas de clase",
      type: "TEXT" as const,
      content:
        "La POO es un paradigma de programación basado en el concepto de objetos, que contienen datos y código.",
      sortOrder: 1,
    },
    {
      topicId: topicPrg1.id,
      title: "Tutorial oficial de Java",
      type: "LINK" as const,
      content: "https://docs.oracle.com/javase/tutorial/java/concepts/",
      sortOrder: 2,
    },
    {
      topicId: topicPrg2.id,
      title: "Guía de clases en Java",
      type: "LINK" as const,
      content: "https://www.w3schools.com/java/java_classes.asp",
      sortOrder: 1,
    },
    {
      topicId: topicPrg2.id,
      title: "Ejemplo práctico",
      type: "TEXT" as const,
      content:
        "Crear una clase Vehiculo con atributos marca, modelo y año. Implementar constructor y métodos getter/setter.",
      sortOrder: 2,
    },
    {
      topicId: topicPrg3.id,
      title: "Resumen de herencia",
      type: "TEXT" as const,
      content:
        "La herencia permite crear nuevas clases a partir de clases existentes, heredando sus atributos y métodos.",
      sortOrder: 1,
    },
  ]) {
    await prisma.contentItem.upsert({
      where: {
        topicId_sortOrder: { topicId: item.topicId, sortOrder: item.sortOrder },
      },
      update: {},
      create: item,
    });
  }

  // Content items — BD101
  for (const item of [
    {
      topicId: topicBd1.id,
      title: "Notas de clase",
      type: "TEXT" as const,
      content:
        "El modelo relacional organiza datos en tablas (relaciones), donde cada tabla tiene filas (tuplas) y columnas (atributos).",
      sortOrder: 1,
    },
    {
      topicId: topicBd1.id,
      title: "Tutorial de PostgreSQL",
      type: "LINK" as const,
      content: "https://www.postgresql.org/docs/current/tutorial.html",
      sortOrder: 2,
    },
    {
      topicId: topicBd2.id,
      title: "Referencia SQL",
      type: "LINK" as const,
      content: "https://www.w3schools.com/sql/",
      sortOrder: 1,
    },
    {
      topicId: topicBd2.id,
      title: "Ejercicios SQL (PDF)",
      type: "FILE_REF" as const,
      content: "https://drive.google.com/ejemplo-ejercicios-sql.pdf",
      sortOrder: 2,
    },
  ]) {
    await prisma.contentItem.upsert({
      where: {
        topicId_sortOrder: { topicId: item.topicId, sortOrder: item.sortOrder },
      },
      update: {},
      create: item,
    });
  }

  // RED101 — Redes (2026-1): presencial + virtual + híbrido (antes sin temas en seed)
  const topicRedA1 = await prisma.topic.upsert({
    where: { groupId_sortOrder: { groupId: grpRed101.id, sortOrder: 1 } },
    update: { weekNumber: 1 },
    create: {
      groupId: grpRed101.id,
      title: "Modelos de red y capas",
      description: "OSI, TCP/IP y encaminamiento básico",
      sortOrder: 1,
      weekNumber: 1,
    },
  });
  const topicRedA2 = await prisma.topic.upsert({
    where: { groupId_sortOrder: { groupId: grpRed101.id, sortOrder: 2 } },
    update: { weekNumber: 2 },
    create: {
      groupId: grpRed101.id,
      title: "Direccionamiento IP",
      description: "IPv4, máscaras y subredes",
      sortOrder: 2,
      weekNumber: 2,
    },
  });
  for (const item of [
    {
      topicId: topicRedA1.id,
      title: "Resumen OSI vs TCP/IP",
      type: "TEXT" as const,
      content:
        "El modelo OSI divide la comunicación en 7 capas; TCP/IP es el stack usado en Internet (4 capas lógicas).",
      sortOrder: 1,
    },
    {
      topicId: topicRedA1.id,
      title: "RFC y estándares IETF",
      type: "LINK" as const,
      content: "https://www.ietf.org/standards/",
      sortOrder: 2,
    },
    {
      topicId: topicRedA2.id,
      title: "Calculadora de subred (referencia)",
      type: "LINK" as const,
      content: "https://www.subnet-calculator.com/",
      sortOrder: 1,
    },
  ]) {
    await prisma.contentItem.upsert({
      where: {
        topicId_sortOrder: { topicId: item.topicId, sortOrder: item.sortOrder },
      },
      update: {},
      create: item,
    });
  }

  const topicRedV1 = await prisma.topic.upsert({
    where: { groupId_sortOrder: { groupId: grpRed101V.id, sortOrder: 1 } },
    update: { weekNumber: 1 },
    create: {
      groupId: grpRed101V.id,
      title: "Actividad en línea — redes",
      description: "Sección virtual (sin aula física)",
      sortOrder: 1,
      weekNumber: 1,
    },
  });
  await prisma.contentItem.upsert({
    where: {
      topicId_sortOrder: { topicId: topicRedV1.id, sortOrder: 1 },
    },
    update: {},
    create: {
      topicId: topicRedV1.id,
      title: "Bienvenida al grupo virtual",
      type: "TEXT",
      content:
        "Este grupo es 100% en línea. Revisa el foro y los enlaces de cada semana.",
      sortOrder: 1,
    },
  });

  const topicRedH1 = await prisma.topic.upsert({
    where: { groupId_sortOrder: { groupId: grpRed101H.id, sortOrder: 1 } },
    update: { weekNumber: 1 },
    create: {
      groupId: grpRed101H.id,
      title: "Combinación presencial / remoto",
      description: "Normas del grupo mixto",
      sortOrder: 1,
      weekNumber: 1,
    },
  });
  await prisma.contentItem.upsert({
    where: {
      topicId_sortOrder: { topicId: topicRedH1.id, sortOrder: 1 },
    },
    update: {},
    create: {
      topicId: topicRedH1.id,
      title: "Calendario de sesiones",
      type: "TEXT",
      content:
        "Las sesiones presenciales usan el aula asignada; las actividades en línea se publican por semana.",
      sortOrder: 1,
    },
  });

  // PRG201-B — misma materia que PRG201-A; contenido demo para la segunda sección
  const topicPrgB1 = await prisma.topic.upsert({
    where: { groupId_sortOrder: { groupId: grpPrg201B.id, sortOrder: 1 } },
    update: { weekNumber: 1 },
    create: {
      groupId: grpPrg201B.id,
      title: "Introducción a POO (sección B)",
      description: "Mismo programa que PRG201-A; material de apoyo",
      sortOrder: 1,
      weekNumber: 1,
    },
  });
  const topicPrgB2 = await prisma.topic.upsert({
    where: { groupId_sortOrder: { groupId: grpPrg201B.id, sortOrder: 2 } },
    update: { weekNumber: 2 },
    create: {
      groupId: grpPrg201B.id,
      title: "Práctica guiada",
      description: "Ejercicios para laboratorio",
      sortOrder: 2,
      weekNumber: 2,
    },
  });
  for (const item of [
    {
      topicId: topicPrgB1.id,
      title: "Notas de la sección B",
      type: "TEXT" as const,
      content:
        "Esta sección comparte el plan de la materia con PRG201-A. Usa estos temas como guía semanal.",
      sortOrder: 1,
    },
    {
      topicId: topicPrgB2.id,
      title: "Proyecto semanal",
      type: "TEXT" as const,
      content:
        "Implementa una jerarquía simple de clases (ej. Figura → Rectángulo/Círculo) y súbelo al espacio indicado por el docente.",
      sortOrder: 1,
    },
  ]) {
    await prisma.contentItem.upsert({
      where: {
        topicId_sortOrder: { topicId: item.topicId, sortOrder: item.sortOrder },
      },
      update: {},
      create: item,
    });
  }

  // ETH101-E2E — grupo del docente E2E (ética profesional, 2026-1)
  const topicEthE2E1 = await prisma.topic.upsert({
    where: { groupId_sortOrder: { groupId: grpEth101E2E.id, sortOrder: 1 } },
    update: { weekNumber: 1 },
    create: {
      groupId: grpEth101E2E.id,
      title: "Fundamentos y código de ética",
      description: "Valores, principios y marcos institucionales",
      sortOrder: 1,
      weekNumber: 1,
    },
  });
  const topicEthE2E2 = await prisma.topic.upsert({
    where: { groupId_sortOrder: { groupId: grpEth101E2E.id, sortOrder: 2 } },
    update: { weekNumber: 2 },
    create: {
      groupId: grpEth101E2E.id,
      title: "Ética en el ejercicio profesional",
      description: "Casos y responsabilidad social",
      sortOrder: 2,
      weekNumber: 2,
    },
  });
  for (const item of [
    {
      topicId: topicEthE2E1.id,
      title: "Lectura: definición de ética aplicada",
      type: "TEXT" as const,
      content:
        "La ética profesional orienta la conducta en el trabajo: integridad, transparencia y respeto a la normativa.",
      sortOrder: 1,
    },
    {
      topicId: topicEthE2E1.id,
      title: "Código ético (referencia)",
      type: "LINK" as const,
      content: "https://www.un.org/en/about-us/ethics-office",
      sortOrder: 2,
    },
    {
      topicId: topicEthE2E2.id,
      title: "Foro: dilemas en TI",
      type: "TEXT" as const,
      content:
        "Analiza un caso de uso de datos personales: identifica riesgos y medidas de mitigación.",
      sortOrder: 1,
    },
  ]) {
    await prisma.contentItem.upsert({
      where: {
        topicId_sortOrder: { topicId: item.topicId, sortOrder: item.sortOrder },
      },
      update: {},
      create: item,
    });
  }

  const topicAdm1 = await prisma.topic.upsert({
    where: { groupId_sortOrder: { groupId: grpADM110A.id, sortOrder: 1 } },
    update: { weekNumber: 1 },
    create: {
      groupId: grpADM110A.id,
      title: "Introducción a la administración",
      description: "Contenido demo para carrera LAE",
      sortOrder: 1,
      weekNumber: 1,
    },
  });
  await prisma.contentItem.upsert({
    where: {
      topicId_sortOrder: { topicId: topicAdm1.id, sortOrder: 1 },
    },
    update: {},
    create: {
      topicId: topicAdm1.id,
      title: "Lectura: funciones del administrador",
      type: "TEXT",
      content:
        "Planificación, organización, dirección y control como pilares básicos.",
      sortOrder: 1,
    },
  });

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
        signatureImage1: SIGNATURE_1_BASE64,
        signatureName1: "Rector/a",
        signatureTitle1: "Rectorado",
        signatureImage2: SIGNATURE_2_BASE64,
        signatureName2: "Director/a Académico/a",
        signatureTitle2: "Dirección Académica",
      },
    });
  } else if (!existingSettings.signatureImage1) {
    await prisma.systemSettings.update({
      where: { id: existingSettings.id },
      data: {
        signatureImage1: SIGNATURE_1_BASE64,
        signatureName1: existingSettings.signatureName1 ?? "Rector/a",
        signatureTitle1: existingSettings.signatureTitle1 ?? "Rectorado",
        signatureImage2: SIGNATURE_2_BASE64,
        signatureName2: existingSettings.signatureName2 ?? "Director/a Académico/a",
        signatureTitle2: existingSettings.signatureTitle2 ?? "Dirección Académica",
      },
    });
  }

  // ── 22. FEE CONCEPTS ───────────────────────────────────────────────────
  const [feeInscripcion, feeCredencial, feeLaboratorio] = await Promise.all([
    prisma.feeConcept.upsert({
      where: { id: "00000000-0000-0000-0000-fee000000001" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-fee000000001",
        name: "Inscripción semestral",
        amount: 5000,
        description: "Cuota de inscripción por semestre",
      },
    }),
    prisma.feeConcept.upsert({
      where: { id: "00000000-0000-0000-0000-fee000000002" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-fee000000002",
        name: "Credencial",
        amount: 150,
        description: "Expedición o reposición de credencial",
      },
    }),
    prisma.feeConcept.upsert({
      where: { id: "00000000-0000-0000-0000-fee000000003" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-fee000000003",
        name: "Laboratorio",
        amount: 800,
        description: "Cuota de uso de laboratorio",
      },
    }),
  ]);

  await prisma.feeConcept.upsert({
    where: { id: "00000000-0000-0000-0000-fee000000099" },
    update: { isActive: false },
    create: {
      id: "00000000-0000-0000-0000-fee000000099",
      name: "Concepto de cobro archivado (demo)",
      amount: 1,
      description: "Ya no se asigna a estudiantes",
      isActive: false,
    },
  });

  // ── 23. STUDENT FEES ─────────────────────────────────────────────────────
  const studentFeeInscripcion = await prisma.studentFee.upsert({
    where: { id: "550e8400-e29b-41d4-a716-446655440000" },
    update: {
      periodId: period2025.id,
      dueDate: new Date("2026-02-15"),
      amount: 5000,
      status: "PAID",
    },
    create: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      studentId: student.id,
      feeConceptId: feeInscripcion.id,
      periodId: period2025.id,
      amount: 5000,
      dueDate: new Date("2026-02-15"),
      status: "PAID",
    },
  });

  const studentFeeLab = await prisma.studentFee.upsert({
    where: { id: "550e8400-e29b-41d4-a716-446655440001" },
    update: {
      periodId: period2025.id,
      dueDate: new Date("2026-03-01"),
      amount: 800,
      status: "PENDING",
    },
    create: {
      id: "550e8400-e29b-41d4-a716-446655440001",
      studentId: student.id,
      feeConceptId: feeLaboratorio.id,
      periodId: period2025.id,
      amount: 800,
      dueDate: new Date("2026-03-01"),
      status: "PENDING",
    },
  });

  await prisma.studentFee.upsert({
    where: { id: "550e8400-e29b-41d4-a716-4466554400e2" },
    update: {
      studentId: studentE2E.id,
      periodId: period2025.id,
      feeConceptId: feeInscripcion.id,
      amount: 5000,
      dueDate: new Date("2026-02-15"),
      status: "PENDING",
    },
    create: {
      id: "550e8400-e29b-41d4-a716-4466554400e2",
      studentId: studentE2E.id,
      feeConceptId: feeInscripcion.id,
      periodId: period2025.id,
      amount: 5000,
      dueDate: new Date("2026-02-15"),
      status: "PENDING",
    },
  });

  // ── 24. SAMPLE PAYMENT ───────────────────────────────────────────────────
  await prisma.payment.upsert({
    where: { referenceCode: "PAY-SEED0001" },
    update: { paidAt: new Date("2026-01-22") },
    create: {
      studentFeeId: studentFeeInscripcion.id,
      amount: 5000,
      method: "CARD",
      referenceCode: "PAY-SEED0001",
      paidAt: new Date("2026-01-22"),
    },
  });

  await prisma.studentFee.upsert({
    where: { id: "550e8400-e29b-41d4-a716-446655440010" },
    update: {
      periodId: period2025.id,
      dueDate: new Date("2026-02-01"),
      status: "OVERDUE",
    },
    create: {
      id: "550e8400-e29b-41d4-a716-446655440010",
      studentId: student.id,
      feeConceptId: feeCredencial.id,
      periodId: period2025.id,
      amount: 150,
      dueDate: new Date("2026-02-01"),
      status: "OVERDUE",
    },
  });

  await prisma.studentFee.upsert({
    where: { id: "550e8400-e29b-41d4-a716-446655440011" },
    update: {
      periodId: period2025.id,
      dueDate: new Date("2026-04-01"),
      status: "CANCELLED",
    },
    create: {
      id: "550e8400-e29b-41d4-a716-446655440011",
      studentId: studentMaria.id,
      feeConceptId: feeCredencial.id,
      periodId: period2025.id,
      amount: 150,
      dueDate: new Date("2026-04-01"),
      status: "CANCELLED",
    },
  });

  const studentFeePaidCash = await prisma.studentFee.upsert({
    where: { id: "550e8400-e29b-41d4-a716-446655440012" },
    update: {
      periodId: period2025.id,
      dueDate: new Date("2026-01-18"),
      status: "PAID",
    },
    create: {
      id: "550e8400-e29b-41d4-a716-446655440012",
      studentId: student.id,
      feeConceptId: feeLaboratorio.id,
      periodId: period2025.id,
      amount: 400,
      dueDate: new Date("2026-01-18"),
      status: "PAID",
    },
  });

  const studentFeePaidTransfer = await prisma.studentFee.upsert({
    where: { id: "550e8400-e29b-41d4-a716-446655440013" },
    update: {
      periodId: period2024.id,
      dueDate: new Date("2025-08-20"),
      status: "PAID",
    },
    create: {
      id: "550e8400-e29b-41d4-a716-446655440013",
      studentId: studentJorge.id,
      feeConceptId: feeInscripcion.id,
      periodId: period2024.id,
      amount: 5000,
      dueDate: new Date("2025-08-20"),
      status: "PAID",
    },
  });

  await prisma.payment.upsert({
    where: { referenceCode: "PAY-SEED-CASH1" },
    update: { paidAt: new Date("2026-01-19") },
    create: {
      studentFeeId: studentFeePaidCash.id,
      amount: 400,
      method: "CASH",
      referenceCode: "PAY-SEED-CASH1",
      paidAt: new Date("2026-01-19"),
    },
  });

  await prisma.payment.upsert({
    where: { referenceCode: "PAY-SEED-TFR1" },
    update: { paidAt: new Date("2025-08-18") },
    create: {
      studentFeeId: studentFeePaidTransfer.id,
      amount: 5000,
      method: "TRANSFER",
      referenceCode: "PAY-SEED-TFR1",
      paidAt: new Date("2025-08-18"),
    },
  });

  // Pedro Elegible — cargos y pagos por los dos ciclos en que cursó (2025-2 y 2026-1)
  const pedroFeeIns2024 = await prisma.studentFee.upsert({
    where: { id: "770e8400-e29b-41d4-a716-446655440001" },
    update: {
      periodId: period2024.id,
      status: "PAID",
      amount: 5000,
      dueDate: new Date("2025-08-25"),
    },
    create: {
      id: "770e8400-e29b-41d4-a716-446655440001",
      studentId: studentPedro.id,
      feeConceptId: feeInscripcion.id,
      periodId: period2024.id,
      amount: 5000,
      dueDate: new Date("2025-08-25"),
      status: "PAID",
    },
  });
  const pedroFeeLab2024 = await prisma.studentFee.upsert({
    where: { id: "770e8400-e29b-41d4-a716-446655440002" },
    update: {
      periodId: period2024.id,
      status: "PAID",
      amount: 800,
      dueDate: new Date("2025-09-10"),
    },
    create: {
      id: "770e8400-e29b-41d4-a716-446655440002",
      studentId: studentPedro.id,
      feeConceptId: feeLaboratorio.id,
      periodId: period2024.id,
      amount: 800,
      dueDate: new Date("2025-09-10"),
      status: "PAID",
    },
  });
  const pedroFeeIns2025 = await prisma.studentFee.upsert({
    where: { id: "770e8400-e29b-41d4-a716-446655440003" },
    update: {
      periodId: period2025.id,
      status: "PAID",
      amount: 5000,
      dueDate: new Date("2026-02-10"),
    },
    create: {
      id: "770e8400-e29b-41d4-a716-446655440003",
      studentId: studentPedro.id,
      feeConceptId: feeInscripcion.id,
      periodId: period2025.id,
      amount: 5000,
      dueDate: new Date("2026-02-10"),
      status: "PAID",
    },
  });
  const pedroFeeLab2025 = await prisma.studentFee.upsert({
    where: { id: "770e8400-e29b-41d4-a716-446655440004" },
    update: {
      periodId: period2025.id,
      status: "PAID",
      amount: 800,
      dueDate: new Date("2026-02-28"),
    },
    create: {
      id: "770e8400-e29b-41d4-a716-446655440004",
      studentId: studentPedro.id,
      feeConceptId: feeLaboratorio.id,
      periodId: period2025.id,
      amount: 800,
      dueDate: new Date("2026-02-28"),
      status: "PAID",
    },
  });

  await prisma.payment.upsert({
    where: { referenceCode: "PAY-PEDRO-25-2-INS" },
    update: { paidAt: new Date("2025-08-20") },
    create: {
      studentFeeId: pedroFeeIns2024.id,
      amount: 5000,
      method: "TRANSFER",
      referenceCode: "PAY-PEDRO-25-2-INS",
      paidAt: new Date("2025-08-20"),
    },
  });
  await prisma.payment.upsert({
    where: { referenceCode: "PAY-PEDRO-25-2-LAB" },
    update: { paidAt: new Date("2025-09-05") },
    create: {
      studentFeeId: pedroFeeLab2024.id,
      amount: 800,
      method: "CASH",
      referenceCode: "PAY-PEDRO-25-2-LAB",
      paidAt: new Date("2025-09-05"),
    },
  });
  await prisma.payment.upsert({
    where: { referenceCode: "PAY-PEDRO-26-1-INS" },
    update: { paidAt: new Date("2026-01-25") },
    create: {
      studentFeeId: pedroFeeIns2025.id,
      amount: 5000,
      method: "CARD",
      referenceCode: "PAY-PEDRO-26-1-INS",
      paidAt: new Date("2026-01-25"),
    },
  });
  await prisma.payment.upsert({
    where: { referenceCode: "PAY-PEDRO-26-1-LAB" },
    update: { paidAt: new Date("2026-02-15") },
    create: {
      studentFeeId: pedroFeeLab2025.id,
      amount: 800,
      method: "TRANSFER",
      referenceCode: "PAY-PEDRO-26-1-LAB",
      paidAt: new Date("2026-02-15"),
    },
  });

  // ── 25. CALENDAR EVENTS ──────────────────────────────────────────────────
  for (const evt of [
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      title: "Inicio de clases",
      description: "Inicio del período 2026-1",
      eventType: "OTHER" as const,
      startDate: new Date("2026-01-20"),
      endDate: new Date("2026-01-20"),
      periodId: period2025.id,
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440003",
      title: "Semana de exámenes parciales",
      description: "Primera evaluación parcial",
      eventType: "EXAM_WEEK" as const,
      startDate: new Date("2026-03-17"),
      endDate: new Date("2026-03-21"),
      periodId: period2025.id,
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440004",
      title: "Día festivo — Batalla de Puebla",
      eventType: "HOLIDAY" as const,
      startDate: new Date("2026-05-05"),
      endDate: new Date("2026-05-05"),
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440005",
      title: "Entrega de proyectos finales",
      description: "Fecha límite para proyectos finales",
      eventType: "DEADLINE" as const,
      startDate: new Date("2026-06-06"),
      endDate: new Date("2026-06-06"),
      periodId: period2025.id,
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440009",
      title: "Cierre 2024-2",
      description: "Período cerrado (histórico)",
      eventType: "OTHER" as const,
      startDate: new Date("2024-12-20"),
      endDate: new Date("2024-12-20"),
      periodId: period2023.id,
    },
  ]) {
    const { id, ...fields } = evt;
    await prisma.calendarEvent.upsert({
      where: { id },
      update: fields,
      create: evt,
    });
  }

  // ── 26. ANNOUNCEMENTS ────────────────────────────────────────────────────
  for (const ann of [
    {
      id: "550e8400-e29b-41d4-a716-446655440006",
      authorId: adminUser.id,
      title: "Bienvenida al semestre 2026-1",
      body: "Damos la bienvenida a todos los estudiantes al nuevo semestre. Les recordamos revisar sus horarios y cumplir con los pagos pendientes.",
      audience: "ALL" as const,
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440007",
      authorId: teacherUser.id,
      title: "Material disponible — POO",
      body: "Se han publicado los materiales del tema 1 de Programación Orientada a Objetos. Favor de revisarlos antes de la próxima clase.",
      audience: "GROUP" as const,
      targetId: grpPrg201.id,
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440008",
      authorId: adminUser.id,
      title: "Aviso carrera ISC — trámites",
      body: "Estudiantes de Ingeniería en Sistemas: convocatoria de servicio social publicada en secretaría.",
      audience: "CAREER" as const,
      targetId: career.id,
    },
  ]) {
    const { id, ...fields } = ann;
    await prisma.announcement.upsert({
      where: { id },
      update: fields,
      create: ann,
    });
  }

  // ── 27. NOTIFICATIONS (sample for student) ───────────────────────────────
  for (const notif of [
    {
      userId: studentUser.id,
      title: "Inscripción confirmada",
      message:
        "Tu inscripción al período 2026-1 ha sido registrada exitosamente.",
      type: "ENROLLMENT_CONFIRMED" as const,
      relatedEntity: "enrollment",
      relatedEntityId: enrollment2025.id,
    },
    {
      userId: studentUser.id,
      title: "Pago confirmado",
      message:
        "Tu pago de Inscripción semestral por $5,000.00 ha sido procesado. Referencia: PAY-SEED0001",
      type: "PAYMENT_CONFIRMED" as const,
    },
    {
      userId: studentUser.id,
      title: "Nuevo anuncio",
      message: "Bienvenida al semestre 2026-1",
      type: "ANNOUNCEMENT" as const,
    },
    {
      userId: studentUser.id,
      title: "Calificación publicada",
      message: "Se registró calificación en Base de Datos (Examen Parcial).",
      type: "GRADE_POSTED" as const,
      relatedEntity: "grade",
      relatedEntityId: student.id,
    },
    {
      userId: studentUser.id,
      title: "Certificación emitida",
      message: "Historial académico disponible para descarga.",
      type: "CERTIFICATION_ISSUED" as const,
    },
    {
      userId: studentUser.id,
      title: "Pago pendiente",
      message: "Tienes un adeudo de credencial vencido. Regulariza en tesorería.",
      type: "PAYMENT_DUE" as const,
    },
    {
      userId: studentUser.id,
      title: "Recordatorio general",
      message: "Revisa el calendario académico en el portal.",
      type: "GENERAL" as const,
    },
  ]) {
    const exists = await prisma.notification.findFirst({
      where: { userId: notif.userId, title: notif.title, type: notif.type },
    });
    if (!exists) {
      await prisma.notification.create({ data: notif });
    }
  }

  console.log("");
  console.log("✅  Seed complete");
  console.log("");
  console.log("   Demo credentials:");
  console.log("   Admin:    admin@academicore.com          / admin123");
  console.log("   Teacher:  prof.garcia@academicore.com   / teacher123");
  console.log("   Student:  ana.garcia@academicore.com    / student123");
  console.log("");
  console.log("   E2E accounts (passwords with symbols as seeded):");
  console.log("   Admin:    admin.e2e@academicore.com    / AdminE2E#2026");
  console.log("   Teacher:  teacher.e2e@academicore.com   / TeacherE2E#2026  → grupo ETH101-E2E (2026-1), temas + evaluaciones");
  console.log("   Student:  student.e2e@academicore.com   / StudentE2E#2026  → inscripción ISC sin materias; cargo inscripción PENDIENTE 2026-1");
  console.log("");
  console.log("   More demo students (password student123):");
  console.log("   · Estados académicos: luis.pendiente@, maria.riesgo@, pedro.elegible@,");
  console.log("     (pedro.elegible@ tiene historial completo ISC + apto para graduación),");
  console.log("     laura.suspendida@, jorge.graduado@, carla.retirada@, diana.baja@,");
  console.log("     enrique.cancel@ (inscripción CANCELADA), sofia.adm@ (carrera LAE),");
  console.log("     inactivo.est@ (usuario inactivo)");
  console.log("   Second teacher: prof.lopez@academicore.com / teacher123");
  console.log("");
  console.log(
    "   Verification codes (público): 00000000-seed-cert-0000-000000000001 (activa),",
  );
  console.log(
    "   …000002 título, …000003 revocada, …000004 vencida",
  );
}
