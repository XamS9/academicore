import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./store/auth.context";
import { StudentNavProvider } from "./store/student-nav.context";
import PrivateRoute from "./components/auth/PrivateRoute";
import StudentRouteGate from "./components/auth/StudentRouteGate";
import AppLayout from "./components/layout/AppLayout";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AcademicHistoryPage from "./pages/academic-history/AcademicHistoryPage";
import CertificationsPage from "./pages/certifications/CertificationsPage";
import ValidateCertPage from "./pages/certifications/ValidateCertPage";
import UIStandardsPage from "./pages/UIStandardsPage";
import UsersPage from "./pages/admin/UsersPage";
import SignupRequestsPage from "./pages/admin/SignupRequestsPage";
import CareersPage from "./pages/admin/CareersPage";
import SubjectsPage from "./pages/admin/SubjectsPage";
import AcademicPeriodsPage from "./pages/admin/AcademicPeriodsPage";
import ClassroomsPage from "./pages/admin/ClassroomsPage";
import GroupsPage from "./pages/admin/GroupsPage";
import EnrollmentsPage from "./pages/admin/EnrollmentsPage";
import EvaluationsPage from "./pages/admin/EvaluationsPage";
import GradesPage from "./pages/admin/GradesPage";
import AuditLogsPage from "./pages/admin/AuditLogsPage";
import TeacherGroupsPage from "./pages/teacher/TeacherGroupsPage";
import TeacherGroupDetailPage from "./pages/teacher/TeacherGroupDetailPage";
import StudentEnrollmentPage from "./pages/student/StudentEnrollmentPage";
import StudentGradesPage from "./pages/student/StudentGradesPage";
import ContentPage from "./pages/admin/ContentPage";
import StudentContentPage from "./pages/student/StudentContentPage";
import SystemSettingsPage from "./pages/admin/SystemSettingsPage";
import CalendarEventsPage from "./pages/admin/CalendarEventsPage";
import AnnouncementsPage from "./pages/admin/AnnouncementsPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import ReportsPage from "./pages/admin/ReportsPage";
import StudentPaymentsPage from "./pages/student/StudentPaymentsPage";
import StudentSelfEnrollPage from "./pages/student/StudentSelfEnrollPage";
import StudentGradesHistoryPage from "./pages/student/StudentGradesHistoryPage";
import StudentCareerPage from "./pages/student/StudentCareerPage";

export default function App() {
  return (
    <AuthProvider>
      <StudentNavProvider>
      <Routes>
        {/* Public — no auth, no layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
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
            <Route path="solicitudes-registro" element={<SignupRequestsPage />} />
            <Route path="estudiantes" element={<Navigate to="/usuarios" replace />} />
            <Route path="profesores" element={<Navigate to="/usuarios" replace />} />
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
            {/* Admin + Teacher + Student (read-only for students) */}
            <Route path="anuncios" element={<AnnouncementsPage />} />
            {/* Teacher */}
            <Route path="mis-grupos" element={<TeacherGroupsPage />} />
            <Route path="mis-grupos/:groupId" element={<TeacherGroupDetailPage />} />
            {/* Student */}
            <Route
              path="mi-inscripcion"
              element={
                <StudentRouteGate gate="inscription">
                  <StudentEnrollmentPage />
                </StudentRouteGate>
              }
            />
            <Route
              path="inscribir-materias"
              element={
                <StudentRouteGate gate="inscribir">
                  <StudentSelfEnrollPage />
                </StudentRouteGate>
              }
            />
            <Route
              path="mis-calificaciones"
              element={
                <StudentRouteGate gate="grades">
                  <StudentGradesPage />
                </StudentRouteGate>
              }
            />
            <Route path="historial-calificaciones" element={<StudentGradesHistoryPage />} />
            <Route
              path="mi-contenido"
              element={
                <StudentRouteGate gate="content">
                  <StudentContentPage />
                </StudentRouteGate>
              }
            />
            <Route path="mis-pagos" element={<StudentPaymentsPage />} />
            <Route path="mi-carrera" element={<StudentCareerPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
      </StudentNavProvider>
    </AuthProvider>
  );
}
