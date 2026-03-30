import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './store/auth.context';
import PrivateRoute from './components/auth/PrivateRoute';
import AppLayout from './components/layout/AppLayout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AcademicHistoryPage from './pages/academic-history/AcademicHistoryPage';
import CertificationsPage from './pages/certifications/CertificationsPage';
import ValidateCertPage from './pages/certifications/ValidateCertPage';
import UIStandardsPage from './pages/UIStandardsPage';
import UsersPage from './pages/admin/UsersPage';
import StudentsPage from './pages/admin/StudentsPage';
import TeachersPage from './pages/admin/TeachersPage';
import CareersPage from './pages/admin/CareersPage';
import SubjectsPage from './pages/admin/SubjectsPage';
import AcademicPeriodsPage from './pages/admin/AcademicPeriodsPage';
import ClassroomsPage from './pages/admin/ClassroomsPage';
import GroupsPage from './pages/admin/GroupsPage';
import EnrollmentsPage from './pages/admin/EnrollmentsPage';
import EvaluationsPage from './pages/admin/EvaluationsPage';
import GradesPage from './pages/admin/GradesPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import TeacherGroupsPage from './pages/teacher/TeacherGroupsPage';
import StudentEnrollmentPage from './pages/student/StudentEnrollmentPage';
import StudentGradesPage from './pages/student/StudentGradesPage';
import ContentPage from './pages/admin/ContentPage';
import StudentContentPage from './pages/student/StudentContentPage';
import SystemSettingsPage from './pages/admin/SystemSettingsPage';
import CalendarEventsPage from './pages/admin/CalendarEventsPage';
import AnnouncementsPage from './pages/admin/AnnouncementsPage';
import PaymentsPage from './pages/admin/PaymentsPage';
import ReportsPage from './pages/admin/ReportsPage';
import StudentPaymentsPage from './pages/student/StudentPaymentsPage';
import StudentSelfEnrollPage from './pages/student/StudentSelfEnrollPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public — no auth, no layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify/:code" element={<ValidateCertPage />} />
        <Route path="/verify" element={<ValidateCertPage />} />

        {/* Auth guard → App shell */}
        <Route element={<PrivateRoute />}>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="academic-history" element={<AcademicHistoryPage />} />
          <Route path="certifications" element={<CertificationsPage />} />
          <Route path="ui-standards" element={<UIStandardsPage />} />
          {/* Admin */}
          <Route path="usuarios" element={<UsersPage />} />
          <Route path="estudiantes" element={<StudentsPage />} />
          <Route path="profesores" element={<TeachersPage />} />
          <Route path="carreras" element={<CareersPage />} />
          <Route path="materias" element={<SubjectsPage />} />
          <Route path="periodos" element={<AcademicPeriodsPage />} />
          <Route path="aulas" element={<ClassroomsPage />} />
          <Route path="grupos" element={<GroupsPage />} />
          <Route path="inscripciones" element={<EnrollmentsPage />} />
          <Route path="evaluaciones" element={<EvaluationsPage />} />
          <Route path="calificaciones" element={<GradesPage />} />
          <Route path="auditoria" element={<AuditLogsPage />} />
          <Route path="configuracion" element={<SystemSettingsPage />} />
          <Route path="calendario" element={<CalendarEventsPage />} />
          <Route path="pagos" element={<PaymentsPage />} />
          <Route path="reportes" element={<ReportsPage />} />
          {/* Admin + Teacher */}
          <Route path="contenido" element={<ContentPage />} />
          <Route path="anuncios" element={<AnnouncementsPage />} />
          {/* Teacher */}
          <Route path="mis-grupos" element={<TeacherGroupsPage />} />
          {/* Student */}
          <Route path="mi-inscripcion" element={<StudentEnrollmentPage />} />
          <Route path="inscribir-materias" element={<StudentSelfEnrollPage />} />
          <Route path="mis-calificaciones" element={<StudentGradesPage />} />
          <Route path="mi-contenido" element={<StudentContentPage />} />
          <Route path="mis-pagos" element={<StudentPaymentsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
