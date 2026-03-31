import type {
  AcademicStatus,
  CertificationStatus,
  CertificationType,
  EnrollmentSubjectStatus,
  UserType,
} from "../types";

// ─── Users ────────────────────────────────────────────────────────────────────

export interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  userType: UserType;
}

export const mockUsers: MockUser[] = [
  {
    id: "usr-001",
    name: "Ana García",
    email: "ana.garcia@instituto.edu.mx",
    password: "student123",
    role: "STUDENT",
    userType: "STUDENT",
  },
  {
    id: "usr-002",
    name: "Carlos Mendoza",
    email: "carlos.mendoza@instituto.edu.mx",
    password: "teacher123",
    role: "TEACHER",
    userType: "TEACHER",
  },
  {
    id: "usr-003",
    name: "Laura Rodríguez",
    email: "laura.rodriguez@instituto.edu.mx",
    password: "admin123",
    role: "ADMIN",
    userType: "ADMIN",
  },
];

export const mockStudent = {
  id: "est-001",
  userId: "usr-001",
  name: "Ana García",
  code: "EST-2021-001",
  career: "Ingeniería en Sistemas Computacionales",
  status: "ACTIVE" as AcademicStatus,
  email: "ana.garcia@instituto.edu.mx",
  enrollmentYear: 2021,
};

export const mockTeacher = {
  id: "tch-001",
  userId: "usr-002",
  name: "Carlos Mendoza",
  email: "carlos.mendoza@instituto.edu.mx",
  specialty: "Matemáticas y Programación",
};

export const mockAdmin = {
  id: "adm-001",
  userId: "usr-003",
  name: "Laura Rodríguez",
  email: "laura.rodriguez@instituto.edu.mx",
  department: "Servicios Escolares",
};

// ─── Subjects ─────────────────────────────────────────────────────────────────

export interface MockSubject {
  id: string;
  name: string;
  credits: number;
  code: string;
}

export const mockSubjects: MockSubject[] = [
  { id: "sub-001", name: "Cálculo I", credits: 8, code: "MAT-101" },
  { id: "sub-002", name: "Álgebra Lineal", credits: 6, code: "MAT-102" },
  {
    id: "sub-003",
    name: "Prog. Orientada a Objetos",
    credits: 8,
    code: "SIS-201",
  },
  { id: "sub-004", name: "Estructuras de Datos", credits: 8, code: "SIS-202" },
  { id: "sub-005", name: "Base de Datos", credits: 8, code: "SIS-301" },
  { id: "sub-006", name: "Redes", credits: 6, code: "SIS-302" },
];

// ─── Academic Records ─────────────────────────────────────────────────────────

export interface MockAcademicRecord {
  id: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectName: string;
  groupCode: string;
  period: string;
  finalGrade: number;
  status: EnrollmentSubjectStatus;
  attempt: number;
}

export const mockAcademicRecords: MockAcademicRecord[] = [
  {
    id: "rec-001",
    studentId: "est-001",
    studentName: "Ana García",
    subjectId: "sub-001",
    subjectName: "Cálculo I",
    groupCode: "MAT-101-A",
    period: "2024-1",
    finalGrade: 8.5,
    status: "COMPLETED",
    attempt: 1,
  },
  {
    id: "rec-002",
    studentId: "est-001",
    studentName: "Ana García",
    subjectId: "sub-002",
    subjectName: "Álgebra Lineal",
    groupCode: "MAT-102-A",
    period: "2024-1",
    finalGrade: 7.0,
    status: "COMPLETED",
    attempt: 1,
  },
  {
    id: "rec-003",
    studentId: "est-001",
    studentName: "Ana García",
    subjectId: "sub-003",
    subjectName: "Prog. Orientada a Objetos",
    groupCode: "SIS-201-B",
    period: "2024-1",
    finalGrade: 5.5,
    status: "FAILED",
    attempt: 1,
  },
  {
    id: "rec-004",
    studentId: "est-001",
    studentName: "Ana García",
    subjectId: "sub-003",
    subjectName: "Prog. Orientada a Objetos",
    groupCode: "SIS-201-A",
    period: "2024-2",
    finalGrade: 9.0,
    status: "COMPLETED",
    attempt: 2,
  },
  {
    id: "rec-005",
    studentId: "est-001",
    studentName: "Ana García",
    subjectId: "sub-004",
    subjectName: "Estructuras de Datos",
    groupCode: "SIS-202-A",
    period: "2024-2",
    finalGrade: 8.0,
    status: "COMPLETED",
    attempt: 1,
  },
  {
    id: "rec-006",
    studentId: "est-001",
    studentName: "Ana García",
    subjectId: "sub-005",
    subjectName: "Base de Datos",
    groupCode: "SIS-301-A",
    period: "2024-2",
    finalGrade: 7.5,
    status: "COMPLETED",
    attempt: 1,
  },
];

// ─── Period Averages ──────────────────────────────────────────────────────────

export interface MockPeriodAverage {
  period: string;
  subjectCount: number;
  average: number;
  min: number;
  max: number;
}

export const mockPeriodAverages: MockPeriodAverage[] = [
  {
    period: "2024-1",
    subjectCount: 3,
    average: parseFloat(((8.5 + 7.0 + 5.5) / 3).toFixed(2)),
    min: 5.5,
    max: 8.5,
  },
  {
    period: "2024-2",
    subjectCount: 3,
    average: parseFloat(((9.0 + 8.0 + 7.5) / 3).toFixed(2)),
    min: 7.5,
    max: 9.0,
  },
];

// ─── Certifications ───────────────────────────────────────────────────────────

export interface MockCertification {
  id: string;
  studentId: string;
  studentName: string;
  type: CertificationType;
  status: CertificationStatus;
  verificationCode: string;
  documentHash: string;
  issuedBy: string;
  issuedAt: string;
  expiresAt: string;
  career: string;
}

export const mockCertifications: MockCertification[] = [
  {
    id: "cert-001",
    studentId: "est-001",
    studentName: "Ana García",
    type: "TRANSCRIPT",
    status: "ACTIVE",
    verificationCode: "ACAD-2024-A1B2C3D4",
    documentHash: "sha256-abc123def456...",
    issuedBy: "Laura Rodríguez",
    issuedAt: "2024-12-15T10:30:00Z",
    expiresAt: "2025-12-15T10:30:00Z",
    career: "Ingeniería en Sistemas Computacionales",
  },
  {
    id: "cert-002",
    studentId: "est-001",
    studentName: "Ana García",
    type: "ENROLLMENT_PROOF",
    status: "ACTIVE",
    verificationCode: "ACAD-2024-E5F6G7H8",
    documentHash: "sha256-xyz789uvw012...",
    issuedBy: "Laura Rodríguez",
    issuedAt: "2024-08-01T09:00:00Z",
    expiresAt: "2025-02-01T09:00:00Z",
    career: "Ingeniería en Sistemas Computacionales",
  },
];

// ─── Certification Criteria ───────────────────────────────────────────────────

export interface MockCertificationCriteria {
  id: string;
  type: CertificationType;
  career: string;
  minGrade: number;
  validityMonths: number;
  description: string;
}

export const mockCertificationCriteria: MockCertificationCriteria[] = [
  {
    id: "crit-001",
    type: "TRANSCRIPT",
    career: "Ingeniería en Sistemas Computacionales",
    minGrade: 6.0,
    validityMonths: 12,
    description:
      "Historial académico oficial con todas las materias cursadas y calificaciones finales.",
  },
  {
    id: "crit-002",
    type: "ENROLLMENT_PROOF",
    career: "Ingeniería en Sistemas Computacionales",
    minGrade: 6.0,
    validityMonths: 6,
    description:
      "Comprobante de inscripción vigente para el período académico actual.",
  },
  {
    id: "crit-003",
    type: "COMPLETION",
    career: "Ingeniería en Sistemas Computacionales",
    minGrade: 7.0,
    validityMonths: 24,
    description:
      "Certificado de terminación de estudios al completar todos los créditos.",
  },
];

// ─── Audit Log ────────────────────────────────────────────────────────────────

export interface MockAuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  performedBy: string;
  timestamp: string;
  details: string;
}

export const mockAuditLogs: MockAuditLog[] = [
  {
    id: "aud-001",
    action: "CREATE",
    entity: "certification",
    entityId: "cert-001",
    performedBy: "Laura Rodríguez",
    timestamp: "2024-12-15T10:30:00Z",
    details: "Certificado TRANSCRIPT emitido para Ana García",
  },
  {
    id: "aud-002",
    action: "CREATE",
    entity: "academic_record",
    entityId: "rec-006",
    performedBy: "Sistema (Trigger)",
    timestamp: "2024-12-10T16:00:00Z",
    details: "Registro académico generado automáticamente — Base de Datos",
  },
  {
    id: "aud-003",
    action: "UPDATE",
    entity: "grade",
    entityId: "grd-005",
    performedBy: "Carlos Mendoza",
    timestamp: "2024-12-08T11:15:00Z",
    details: "Calificación final actualizada — Estructuras de Datos",
  },
  {
    id: "aud-004",
    action: "CREATE",
    entity: "enrollment",
    entityId: "enr-002",
    performedBy: "Sistema (SP)",
    timestamp: "2024-08-05T09:00:00Z",
    details: "Inscripción período 2024-2 procesada via sp_enroll_student",
  },
  {
    id: "aud-005",
    action: "LOGIN",
    entity: "user",
    entityId: "usr-001",
    performedBy: "Ana García",
    timestamp: "2024-12-01T08:30:00Z",
    details: "Inicio de sesión exitoso",
  },
];
