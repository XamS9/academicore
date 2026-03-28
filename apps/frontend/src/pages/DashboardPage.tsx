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

// Icons
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VerifiedIcon from '@mui/icons-material/Verified';
import HistoryIcon from '@mui/icons-material/History';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import PaletteIcon from '@mui/icons-material/Palette';
import ListAltIcon from '@mui/icons-material/ListAlt';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth.context';
import { api } from '../services/api';

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

const adminStats: StatCard[] = [
  { label: 'Total Estudiantes', value: 247, icon: <SchoolIcon sx={{ fontSize: 36 }} />, color: '#1976d2' },
  { label: 'Profesores', value: 34, icon: <PersonIcon sx={{ fontSize: 36 }} />, color: '#9c27b0' },
  { label: 'Períodos Activos', value: 1, icon: <EventIcon sx={{ fontSize: 36 }} />, color: '#2e7d32' },
  { label: 'Inscripciones Activas', value: 189, icon: <AssignmentTurnedInIcon sx={{ fontSize: 36 }} />, color: '#ed6c02' },
];

const studentStats: StatCard[] = [
  { label: 'Materias Inscritas', value: 3, icon: <AssignmentTurnedInIcon sx={{ fontSize: 36 }} />, color: '#1976d2' },
  { label: 'Promedio General', value: 8.1, icon: <StarIcon sx={{ fontSize: 36 }} />, color: '#ed6c02' },
  { label: 'Materias Aprobadas', value: 4, icon: <CheckCircleIcon sx={{ fontSize: 36 }} />, color: '#2e7d32' },
  { label: 'Estado Académico', value: 'ACTIVO', icon: <SchoolIcon sx={{ fontSize: 36 }} />, color: '#2e7d32' },
];

const teacherStats: StatCard[] = [
  { label: 'Grupos Asignados', value: 2, icon: <GroupsIcon sx={{ fontSize: 36 }} />, color: '#1976d2' },
  { label: 'Estudiantes Totales', value: 45, icon: <PeopleIcon sx={{ fontSize: 36 }} />, color: '#9c27b0' },
  { label: 'Evaluaciones Pendientes', value: 3, icon: <AssignmentIcon sx={{ fontSize: 36 }} />, color: '#ed6c02' },
];

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
  { label: 'Estándar UI', path: '/ui-standards', icon: <PaletteIcon />, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },


];

const actionColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
  '/academic-history': 'primary',
  '/certifications': 'success',
  '/auditoria': 'error',
  '/calificaciones': 'warning',
  '/ui-standards': 'secondary',

};

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    api.get('/audit-logs?limit=5').then((r) => setAuditLogs(r.data)).catch(() => {});
  }, []);

  const role = currentUser?.role ?? 'STUDENT';

  const stats =
    role === 'ADMIN' ? adminStats :
    role === 'TEACHER' ? teacherStats :
    studentStats;

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
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} lg={3} key={stat.label}>
            <Card elevation={2} sx={{ borderLeft: `4px solid ${stat.color}` }}>
              <CardContent>
                <Box className="flex items-center justify-between">
                  <Box>
                    <Typography variant="h4" fontWeight={700} color={stat.color}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                  <Box sx={{ color: stat.color, opacity: 0.8 }}>{stat.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Quick actions */}
        <Grid item xs={12} md={5}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Acciones Rápidas
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

        {/* Recent activity */}
        <Grid item xs={12} md={7}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
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
                    primary={`${log.action} — ${log.entityType}`}
                    secondary={`${log.user ? `${log.user.firstName} ${log.user.lastName}` : log.performedBy} · ${formatDate(log.createdAt)}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <Chip label={log.action} size="small" variant="outlined" sx={{ ml: 1, fontSize: '0.65rem' }} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* System description */}
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2, backgroundColor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
            <Box className="flex items-start gap-3">
              <SchoolIcon sx={{ color: 'primary.main', mt: 0.5 }} />
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
                  {['22 tablas', 'BCNF', 'JWT + RBAC', 'Trigger automático', 'SP con validación'].map((tag) => (
                    <Chip key={tag} label={tag} size="small" color="primary" variant="outlined" />
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
