import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';

// Icons
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupsIcon from '@mui/icons-material/Groups';
import VerifiedIcon from '@mui/icons-material/Verified';
import HistoryIcon from '@mui/icons-material/History';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import PaletteIcon from '@mui/icons-material/Palette';
import ListAltIcon from '@mui/icons-material/ListAlt';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth.context';
import { api } from '../services/api';
import { studentsService } from '../services/students.service';
import { teachersService } from '../services/teachers.service';
import { academicPeriodsService } from '../services/academic-periods.service';
import { groupsService } from '../services/groups.service';
import { enrollmentsService } from '../services/enrollments.service';
import { academicRecordsService } from '../services/academic-records.service';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  createdAt: string;
  user: { firstName: string; lastName: string } | null;
}

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

interface QuickAction {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: Array<'ADMIN' | 'TEACHER' | 'STUDENT'>;
}

const quickActions: QuickAction[] = [
  { label: 'Historial Académico', path: '/academic-history', icon: <ListAltIcon />, roles: ['STUDENT', 'ADMIN'] },
  { label: 'Certificaciones', path: '/certifications', icon: <VerifiedIcon />, roles: ['STUDENT', 'ADMIN'] },
  { label: 'Auditoría', path: '/auditoria', icon: <HistoryIcon />, roles: ['ADMIN'] },
  { label: 'Calificaciones', path: '/calificaciones', icon: <StarIcon />, roles: ['TEACHER', 'ADMIN'] },
  { label: 'Estándar UI', path: '/ui-standards', icon: <PaletteIcon />, roles: ['ADMIN'] },
];

const actionColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
  '/academic-history': 'primary',
  '/certifications': 'success',
  '/auditoria': 'error',
  '/calificaciones': 'warning',
  '/ui-standards': 'secondary',
};

const auditActionLabels: Record<string, string> = {
  CREATED: 'Creado',
  UPDATED: 'Actualizado',
  DELETED: 'Eliminado',
  REVOKED: 'Revocado',
  ISSUED: 'Emitido',
  ENROLLED: 'Inscrito',
  DROPPED: 'Baja',
  STATUS_CHANGE: 'Cambio de estado',
};

const academicStatusLabels: Record<string, string> = {
  ACTIVE: 'Activo',
  AT_RISK: 'En riesgo',
  ELIGIBLE_FOR_GRADUATION: 'Apto para graduación',
  SUSPENDED: 'Suspendido',
  GRADUATED: 'Graduado',
  WITHDRAWN: 'Retirado',
};

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

async function loadAdminStats(): Promise<StatCard[]> {
  const [students, teachers, periods] = await Promise.all([
    studentsService.getAll(),
    teachersService.getAll(),
    academicPeriodsService.getAll(),
  ]);

  const activePeriods = (periods as { isActive: boolean }[]).filter((p) => p.isActive);

  return [
    { label: 'Total Estudiantes', value: students.length, icon: <SchoolIcon sx={{ fontSize: 36 }} />, color: '#1976d2' },
    { label: 'Profesores', value: teachers.length, icon: <PersonIcon sx={{ fontSize: 36 }} />, color: '#9c27b0' },
    { label: 'Períodos Activos', value: activePeriods.length, icon: <EventIcon sx={{ fontSize: 36 }} />, color: '#2e7d32' },
  ];
}

async function loadTeacherStats(userId: string): Promise<StatCard[]> {
  const teacher = await api.get(`/teachers/by-user/${userId}`).then((r) => r.data);
  const groups = await groupsService.getByTeacher(teacher.id);

  const totalStudents = (groups as { currentStudents: number }[]).reduce(
    (sum, g) => sum + g.currentStudents, 0,
  );

  return [
    { label: 'Grupos Asignados', value: groups.length, icon: <GroupsIcon sx={{ fontSize: 36 }} />, color: '#1976d2' },
    { label: 'Estudiantes Totales', value: totalStudents, icon: <PeopleIcon sx={{ fontSize: 36 }} />, color: '#9c27b0' },
  ];
}

async function loadStudentStats(userId: string): Promise<StatCard[]> {
  const student = await api.get(`/students/by-user/${userId}`).then((r) => r.data);
  const [enrollments, passed, averages] = await Promise.all([
    enrollmentsService.getByStudent(student.id),
    academicRecordsService.getPassed(student.id),
    academicRecordsService.getAveragesByPeriod(student.id),
  ]);

  const currentSubjects = (enrollments as { enrollmentSubjects: { status: string }[] }[])
    .flatMap((e) => e.enrollmentSubjects)
    .filter((es) => es.status === 'ENROLLED').length;

  const overallAvg = averages.length > 0
    ? (averages as { average: number; totalCredits: number }[]).reduce(
        (sum, a) => sum + a.average * a.totalCredits, 0,
      ) / (averages as { totalCredits: number }[]).reduce((sum, a) => sum + a.totalCredits, 0)
    : 0;

  return [
    { label: 'Materias Inscritas', value: currentSubjects, icon: <AssignmentTurnedInIcon sx={{ fontSize: 36 }} />, color: '#1976d2' },
    { label: 'Promedio General', value: overallAvg > 0 ? overallAvg.toFixed(1) : '—', icon: <StarIcon sx={{ fontSize: 36 }} />, color: '#ed6c02' },
    { label: 'Materias Aprobadas', value: passed.length, icon: <CheckCircleIcon sx={{ fontSize: 36 }} />, color: '#2e7d32' },
    { label: 'Estado Académico', value: academicStatusLabels[student.academicStatus] ?? student.academicStatus, icon: <SchoolIcon sx={{ fontSize: 36 }} />, color: '#2e7d32' },
  ];
}

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const role = currentUser?.role ?? 'STUDENT';

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingStats(true);
        if (role === 'ADMIN') {
          setStats(await loadAdminStats());
        } else if (role === 'TEACHER') {
          setStats(await loadTeacherStats(currentUser!.id));
        } else {
          setStats(await loadStudentStats(currentUser!.id));
        }
      } catch {
        setStats([]);
      } finally {
        setLoadingStats(false);
      }
    };
    load();

    if (role === 'ADMIN') {
      api.get('/audit-logs?limit=5').then((r) => setAuditLogs(r.data)).catch(() => {});
    }
  }, [role]);

  const filteredActions = quickActions.filter((a) => a.roles.includes(role));

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <Box>
      {/* Welcome header */}
      <Box className="mb-6">
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Bienvenido, {currentUser?.name ?? 'Usuario'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
          {today}
        </Typography>
      </Box>

      {/* Stats cards */}
      {loadingStats ? (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} lg={3} key={i}>
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat) => (
            <Grid item xs={12} sm={6} lg={3} key={stat.label}>
              <Card sx={{ position: 'relative', overflow: 'hidden' }}>
                <CardContent sx={{ py: 2.5 }}>
                  <Box className="flex items-center justify-between">
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="h4" fontWeight={800} sx={{ color: stat.color }}>
                        {stat.value}
                      </Typography>
                    </Box>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${stat.color}14`,
                      color: stat.color,
                    }}>
                      {stat.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Quick actions */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Acciones Rapidas
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box className="flex flex-wrap gap-2">
              {filteredActions.map((action) => (
                <Button
                  key={action.path}
                  variant="outlined"
                  color={actionColors[action.path] ?? 'primary'}
                  startIcon={action.icon}
                  onClick={() => navigate(action.path)}
                  size="small"
                >
                  {action.label}
                </Button>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Recent activity — admin only */}
        {role === 'ADMIN' && (
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Actividad Reciente
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <List dense disablePadding>
                {auditLogs.length === 0 && (
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemText
                      primary="Sin actividad reciente"
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
                {auditLogs.map((log) => (
                  <ListItem key={log.id} disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <FiberManualRecordIcon sx={{ fontSize: 8, color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${auditActionLabels[log.action] ?? log.action} — ${log.entityType}`}
                      secondary={`${log.user ? `${log.user.firstName} ${log.user.lastName}` : '—'} · ${formatDate(log.createdAt)}`}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <Chip
                      label={auditActionLabels[log.action] ?? log.action}
                      size="small"
                      variant="outlined"
                      sx={{ ml: 1, fontSize: '0.65rem' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}

        {/* System description */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider', background: 'linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(139,92,246,0.04) 100%)' }}>
            <Box className="flex items-start gap-3">
              <Box sx={{ width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
                <SchoolIcon sx={{ color: '#fff', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="primary.main" gutterBottom>
                  Sistema de Gestión Académica Institucional — Academicore
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Academicore es una plataforma integral para la administración académica universitaria. Gestiona
                  estudiantes, profesores, inscripciones, evaluaciones, calificaciones y certificaciones digitales
                  con trazabilidad completa mediante registros de auditoría. El sistema implementa control de acceso
                  basado en roles (RBAC), procedimientos almacenados para inscripciones con validación de cadena
                  completa, y generación automática de registros académicos vía triggers de base de datos.
                </Typography>
                <Box className="flex flex-wrap gap-2 mt-2">
                  {['31 tablas', 'BCNF', 'JWT + RBAC', 'Trigger automatico', 'SP con validacion'].map((tag) => (
                    <Chip key={tag} label={tag} size="small" color="primary" variant="outlined" sx={{ borderColor: 'rgba(99,102,241,0.3)' }} />
                  ))}
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
