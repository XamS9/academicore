// Shared frontend types — mirror backend DTOs

export type UserType = 'STUDENT' | 'TEACHER' | 'ADMIN';

export type AcademicStatus =
  | 'ACTIVE'
  | 'AT_RISK'
  | 'ELIGIBLE_FOR_GRADUATION'
  | 'SUSPENDED'
  | 'GRADUATED'
  | 'WITHDRAWN';

export type EnrollmentStatus = 'ACTIVE' | 'CLOSED' | 'CANCELLED';

export type EnrollmentSubjectStatus = 'ENROLLED' | 'DROPPED' | 'COMPLETED' | 'FAILED';

export type CertificationType = 'DEGREE' | 'TRANSCRIPT' | 'ENROLLMENT_PROOF' | 'COMPLETION';

export type CertificationStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}
