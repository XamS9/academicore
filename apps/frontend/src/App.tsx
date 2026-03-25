import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './store/auth.context';
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

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public — no auth, no layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify/:code" element={<ValidateCertPage />} />
        <Route path="/verify" element={<ValidateCertPage />} />

        {/* App shell */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="academic-history" element={<AcademicHistoryPage />} />
          <Route path="certifications" element={<CertificationsPage />} />
          <Route path="ui-standards" element={<UIStandardsPage />} />
          <Route path="usuarios" element={<UsersPage />} />
          <Route path="estudiantes" element={<StudentsPage />} />
          <Route path="profesores" element={<TeachersPage />} />
          <Route path="carreras" element={<CareersPage />} />
          <Route path="materias" element={<SubjectsPage />} />
          <Route path="periodos" element={<AcademicPeriodsPage />} />
          <Route path="aulas" element={<ClassroomsPage />} />
          <Route path="grupos" element={<GroupsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
