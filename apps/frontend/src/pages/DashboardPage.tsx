import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";

// Icons
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import EventIcon from "@mui/icons-material/Event";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import StarIcon from "@mui/icons-material/Star";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import GroupsIcon from "@mui/icons-material/Groups";
import VerifiedIcon from "@mui/icons-material/Verified";
import HistoryIcon from "@mui/icons-material/History";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ListAltIcon from "@mui/icons-material/ListAlt";
import UploadIcon from "@mui/icons-material/Upload";
import CampaignIcon from "@mui/icons-material/Campaign";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth.context";
import { useStudentNav } from "../store/student-nav.context";
import { api } from "../services/api";
import { studentsService } from "../services/students.service";
import { teachersService } from "../services/teachers.service";
import { academicPeriodsService } from "../services/academic-periods.service";
import { groupsService } from "../services/groups.service";
import { enrollmentsService } from "../services/enrollments.service";
import { academicRecordsService } from "../services/academic-records.service";
import { evaluationsService } from "../services/evaluations.service";
import { studentSubmissionsService } from "../services/student-submissions.service";
import { announcementsService } from "../services/announcements.service";

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
  roles: Array<"ADMIN" | "TEACHER" | "STUDENT">;
}

const quickActions: QuickAction[] = [
  {
    label: "Historial Académico",
    path: "/academic-history",
    icon: <ListAltIcon />,
    roles: ["STUDENT", "ADMIN"],
  },
  {
    label: "Certificaciones",
    path: "/certifications",
    icon: <VerifiedIcon />,
    roles: ["STUDENT", "ADMIN"],
  },
  {
    label: "Auditoría",
    path: "/auditoria",
    icon: <HistoryIcon />,
    roles: ["ADMIN"],
  },
  {
    label: "Calificaciones",
    path: "/calificaciones",
    icon: <StarIcon />,
    roles: ["ADMIN"],
  },
  {
    label: "Mis Grupos",
    path: "/mis-grupos",
    icon: <GroupsIcon />,
    roles: ["TEACHER"],
  },
  {
    label: "Anuncios",
    path: "/anuncios",
    icon: <CampaignIcon />,
    roles: ["TEACHER"],
  },
  {
    label: "Solicitudes de Registro",
    path: "/solicitudes-registro",
    icon: <PersonAddIcon />,
    roles: ["ADMIN"],
  },
];

const actionColors: Record<
  string,
  "primary" | "secondary" | "success" | "warning" | "error" | "info"
> = {
  "/academic-history": "primary",
  "/certifications": "success",
  "/auditoria": "error",
  "/calificaciones": "warning",
  "/mis-grupos": "primary",
  "/anuncios": "info",
  "/solicitudes-registro": "info",
};

const auditActionLabels: Record<string, string> = {
  CREATED: "Creado",
  UPDATED: "Actualizado",
  DELETED: "Eliminado",
  REVOKED: "Revocado",
  ISSUED: "Emitido",
  ENROLLED: "Inscrito",
  DROPPED: "Baja",
  STATUS_CHANGE: "Cambio de estado",
};

const academicStatusLabels: Record<string, string> = {
  ACTIVE: "Activo",
  AT_RISK: "En riesgo",
  ELIGIBLE_FOR_GRADUATION: "Apto para graduación",
  SUSPENDED: "Suspendido",
  GRADUATED: "Graduado",
  WITHDRAWN: "Retirado",
};

interface UpcomingDeadline {
  id: string;
  evaluationName: string;
  subjectName: string;
  dueDate: string;
  submitted: boolean;
  daysLeft: number;
}

interface RecentAnnouncement {
  id: string;
  title: string;
  body: string;
  audience: string;
  publishedAt: string;
  author: { firstName: string; lastName: string };
}

async function loadStudentWidgets() {
  type EnrollmentES = {
    groupId: string;
    status: string;
    group: { subject: { name: string } };
  };
  type EnrollmentItem = {
    status: string;
    enrollmentSubjects: EnrollmentES[];
  };

  const [enrollments, allSubmissions, announcements] = await Promise.all([
    enrollmentsService.getMine() as Promise<EnrollmentItem[]>,
    studentSubmissionsService.getMine(),
    announcementsService.getMy({ page: 1, pageSize: 5 }),
  ]);

  const activeGroups = enrollments
    .filter((e) => e.status === "ACTIVE")
    .flatMap((e) =>
      e.enrollmentSubjects
        .filter((es) => es.status === "ENROLLED")
        .map((es) => ({ groupId: es.groupId, subjectName: es.group.subject.name })),
    );

  type EvalItem = { id: string; name: string; dueDate: string | null };
  const evalsByGroup = await Promise.all(
    activeGroups.map((g) =>
      (evaluationsService.getByGroup(g.groupId) as Promise<EvalItem[]>)
        .then((evs) => evs.map((ev) => ({ ...ev, subjectName: g.subjectName })))
        .catch(() => [] as (EvalItem & { subjectName: string })[]),
    ),
  );

  const now = new Date();
  const cutoff = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const submittedEvalIds = new Set(allSubmissions.map((s) => s.evaluationId));

  const upcoming: UpcomingDeadline[] = evalsByGroup
    .flat()
    .filter((ev) => {
      if (!ev.dueDate) return false;
      const d = new Date(ev.dueDate);
      return d >= now && d <= cutoff;
    })
    .map((ev) => {
      const dueDate = new Date(ev.dueDate!);
      const daysLeft = Math.ceil(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        id: ev.id,
        evaluationName: ev.name,
        subjectName: ev.subjectName,
        dueDate: ev.dueDate!,
        submitted: submittedEvalIds.has(ev.id),
        daysLeft,
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return {
    upcoming,
    announcements: announcements.data as RecentAnnouncement[],
  };
}

interface TeacherGroupWidget {
  id: string;
  groupCode: string;
  currentStudents: number;
  maxStudents: number;
  isActive: boolean;
  subject: { name: string; code: string };
  academicPeriod: { name: string };
}

interface TeacherUpcomingEval {
  id: string;
  name: string;
  groupId: string;
  groupCode: string;
  subjectName: string;
  dueDate: string;
  daysLeft: number;
  submissionCount: number;
}

async function loadTeacherWidgets(userId: string) {
  const teacher = await api.get(`/teachers/by-user/${userId}`).then((r) => r.data);
  const groups: TeacherGroupWidget[] = await groupsService.getByTeacher(teacher.id);

  type EvalItem = { id: string; name: string; dueDate: string | null };
  const evalsByGroup = await Promise.all(
    groups.map((g) =>
      (evaluationsService.getByGroup(g.id) as Promise<EvalItem[]>)
        .then((evs) =>
          evs.map((ev) => ({
            ...ev,
            groupId: g.id,
            groupCode: g.groupCode,
            subjectName: g.subject.name,
          })),
        )
        .catch(() => [] as (EvalItem & { groupId: string; groupCode: string; subjectName: string })[]),
    ),
  );

  const now = new Date();
  const cutoff = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const upcomingFlat = evalsByGroup
    .flat()
    .filter((ev) => {
      if (!ev.dueDate) return false;
      const d = new Date(ev.dueDate);
      return d >= now && d <= cutoff;
    });

  const upcomingEvals: TeacherUpcomingEval[] = await Promise.all(
    upcomingFlat.map((ev) =>
      studentSubmissionsService
        .getByEvaluation(ev.id)
        .then((subs) => ({
          id: ev.id,
          name: ev.name,
          groupId: ev.groupId,
          groupCode: ev.groupCode,
          subjectName: ev.subjectName,
          dueDate: ev.dueDate!,
          daysLeft: Math.ceil(
            (new Date(ev.dueDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          ),
          submissionCount: subs.length,
        }))
        .catch(() => ({
          id: ev.id,
          name: ev.name,
          groupId: ev.groupId,
          groupCode: ev.groupCode,
          subjectName: ev.subjectName,
          dueDate: ev.dueDate!,
          daysLeft: 0,
          submissionCount: 0,
        })),
    ),
  );

  return {
    groups,
    upcomingEvals: upcomingEvals.sort((a, b) => a.daysLeft - b.daysLeft),
  };
}

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadAdminStats(): Promise<StatCard[]> {
  const [students, teachers, periods] = await Promise.all([
    studentsService.getAll(),
    teachersService.getAll(),
    academicPeriodsService.getAll(),
  ]);

  const activePeriods = (periods as { isActive: boolean }[]).filter(
    (p) => p.isActive,
  );

  return [
    {
      label: "Total Estudiantes",
      value: students.length,
      icon: <SchoolIcon sx={{ fontSize: 36 }} />,
      color: "#1976d2",
    },
    {
      label: "Profesores",
      value: teachers.length,
      icon: <PersonIcon sx={{ fontSize: 36 }} />,
      color: "#9c27b0",
    },
    {
      label: "Períodos Activos",
      value: activePeriods.length,
      icon: <EventIcon sx={{ fontSize: 36 }} />,
      color: "#2e7d32",
    },
  ];
}

async function loadTeacherStats(userId: string): Promise<StatCard[]> {
  const teacher = await api
    .get(`/teachers/by-user/${userId}`)
    .then((r) => r.data);
  const groups = await groupsService.getByTeacher(teacher.id);

  const totalStudents = (groups as { currentStudents: number }[]).reduce(
    (sum, g) => sum + g.currentStudents,
    0,
  );

  return [
    {
      label: "Grupos Asignados",
      value: groups.length,
      icon: <GroupsIcon sx={{ fontSize: 36 }} />,
      color: "#1976d2",
    },
    {
      label: "Estudiantes Totales",
      value: totalStudents,
      icon: <PeopleIcon sx={{ fontSize: 36 }} />,
      color: "#9c27b0",
    },
  ];
}

async function loadStudentStats(): Promise<StatCard[]> {
  const student = await studentsService.getMe();
  const [enrollments, passed, averages] = await Promise.all([
    enrollmentsService.getMine(),
    academicRecordsService.getMyPassed(),
    academicRecordsService.getMyAveragesByPeriod(),
  ]);

  const currentSubjects = (
    enrollments as { enrollmentSubjects: { status: string }[] }[]
  )
    .flatMap((e) => e.enrollmentSubjects)
    .filter((es) => es.status === "ENROLLED").length;

  const overallAvg =
    averages.length > 0
      ? (averages as { average: number; totalCredits: number }[]).reduce(
          (sum, a) => sum + a.average * a.totalCredits,
          0,
        ) /
        (averages as { totalCredits: number }[]).reduce(
          (sum, a) => sum + a.totalCredits,
          0,
        )
      : 0;

  return [
    {
      label: "Materias Inscritas",
      value: currentSubjects,
      icon: <AssignmentTurnedInIcon sx={{ fontSize: 36 }} />,
      color: "#1976d2",
    },
    {
      label: "Promedio General",
      value: overallAvg > 0 ? overallAvg.toFixed(1) : "—",
      icon: <StarIcon sx={{ fontSize: 36 }} />,
      color: "#ed6c02",
    },
    {
      label: "Materias Aprobadas",
      value: passed.length,
      icon: <CheckCircleIcon sx={{ fontSize: 36 }} />,
      color: "#2e7d32",
    },
    {
      label: "Estado Académico",
      value:
        academicStatusLabels[student.academicStatus] ?? student.academicStatus,
      icon: <SchoolIcon sx={{ fontSize: 36 }} />,
      color: "#2e7d32",
    },
  ];
}

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { showMiContenido, navState } = useStudentNav();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const role = currentUser?.role ?? "STUDENT";

  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<RecentAnnouncement[]>([]);
  const [loadingWidgets, setLoadingWidgets] = useState(false);

  const [teacherGroups, setTeacherGroups] = useState<TeacherGroupWidget[]>([]);
  const [teacherUpcomingEvals, setTeacherUpcomingEvals] = useState<TeacherUpcomingEval[]>([]);
  const [loadingTeacherWidgets, setLoadingTeacherWidgets] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingStats(true);
        if (role === "ADMIN") {
          setStats(await loadAdminStats());
        } else if (role === "TEACHER") {
          setStats(await loadTeacherStats(currentUser!.id));
        } else {
          setStats(await loadStudentStats());
        }
      } catch {
        setStats([]);
      } finally {
        setLoadingStats(false);
      }
    };
    load();

    if (role === "ADMIN") {
      api
        .get("/audit-logs?limit=5")
        .then((r) => setAuditLogs(r.data))
        .catch(() => {});
    }

    if (role === "STUDENT") {
      setLoadingWidgets(true);
      loadStudentWidgets()
        .then(({ upcoming, announcements }) => {
          setUpcomingDeadlines(upcoming);
          setRecentAnnouncements(announcements);
        })
        .catch(() => {})
        .finally(() => setLoadingWidgets(false));
    }

    if (role === "TEACHER") {
      setLoadingTeacherWidgets(true);
      loadTeacherWidgets(currentUser!.id)
        .then(({ groups, upcomingEvals }) => {
          setTeacherGroups(groups);
          setTeacherUpcomingEvals(upcomingEvals);
        })
        .catch(() => {})
        .finally(() => setLoadingTeacherWidgets(false));
    }
  }, [role]);

  const filteredActions = quickActions.filter((a) => a.roles.includes(role));

  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Box>
      {/* Welcome header */}
      <Box className="mb-6">
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Bienvenido, {currentUser?.name ?? "Usuario"}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textTransform: "capitalize" }}
        >
          {today}
        </Typography>
      </Box>

      {/* Stats cards */}
      {loadingStats ? (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} lg={3} key={i}>
              <Skeleton
                variant="rounded"
                height={120}
                sx={{ borderRadius: 3 }}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat) => (
            <Grid item xs={12} sm={6} lg={3} key={stat.label}>
              <Card sx={{ position: "relative", overflow: "hidden" }}>
                <CardContent sx={{ py: 2.5 }}>
                  <Box className="flex items-center justify-between">
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5, fontWeight: 500 }}
                      >
                        {stat.label}
                      </Typography>
                      <Typography
                        variant="h4"
                        fontWeight={800}
                        sx={{ color: stat.color }}
                      >
                        {stat.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: `${stat.color}14`,
                        color: stat.color,
                      }}
                    >
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

        {/* ── ADMIN layout ── */}
        {role === "ADMIN" && (
          <>
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Acciones Rápidas
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box className="flex flex-wrap gap-2">
                  {filteredActions.map((action) => (
                    <Button
                      key={action.path}
                      variant="outlined"
                      color={actionColors[action.path] ?? "primary"}
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

            <Grid item xs={12} md={7}>
              <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Actividad Reciente
                </Typography>
                <Divider sx={{ mb: 1 }} />
                <List dense disablePadding>
                  {auditLogs.length === 0 && (
                    <ListItem disablePadding sx={{ py: 1 }}>
                      <ListItemText
                        primary="Sin actividad reciente"
                        primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
                      />
                    </ListItem>
                  )}
                  {auditLogs.map((log) => (
                    <ListItem key={log.id} disablePadding sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <FiberManualRecordIcon sx={{ fontSize: 8, color: "primary.main" }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${auditActionLabels[log.action] ?? log.action} — ${log.entityType}`}
                        secondary={`${log.user ? `${log.user.firstName} ${log.user.lastName}` : "—"} · ${formatDate(log.createdAt)}`}
                        primaryTypographyProps={{ variant: "body2" }}
                        secondaryTypographyProps={{ variant: "caption" }}
                      />
                      <Chip
                        label={auditActionLabels[log.action] ?? log.action}
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1, fontSize: "0.65rem" }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </>
        )}

        {/* ── TEACHER layout ── */}
        {role === "TEACHER" && (
          <>
            {/* Row 1: Upcoming evals (wide) + Quick actions (narrow) */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Próximas Fechas Límite
                  </Typography>
                  <Chip label="14 días" size="small" variant="outlined" color="primary" />
                </Box>
                <Divider sx={{ mb: 2 }} />
                {loadingTeacherWidgets ? (
                  [1, 2, 3].map((i) => <Skeleton key={i} height={52} sx={{ mb: 1 }} />)
                ) : teacherUpcomingEvals.length === 0 ? (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 3, gap: 1 }}>
                    <CheckCircleIcon sx={{ color: "success.main", fontSize: 36 }} />
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Sin evaluaciones con fecha límite en los próximos 14 días
                    </Typography>
                  </Box>
                ) : (
                  <List dense disablePadding>
                    {teacherUpcomingEvals.map((ev) => {
                      const urgency =
                        ev.daysLeft <= 2 ? "error" : ev.daysLeft <= 5 ? "warning" : "default";
                      return (
                        <React.Fragment key={ev.id}>
                          <ListItem
                            disablePadding
                            sx={{ py: 1 }}
                            secondaryAction={
                              <Button
                                size="small"
                                variant="outlined"
                                color={urgency === "error" ? "error" : "primary"}
                                onClick={() => navigate(`/mis-grupos/${ev.groupId}`)}
                              >
                                Ver Grupo
                              </Button>
                            }
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <HourglassEmptyIcon sx={{ fontSize: 20, color: `${urgency}.main` }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                  <Typography variant="body2" fontWeight={600} component="span">
                                    {ev.name}
                                  </Typography>
                                  <Chip
                                    label={ev.daysLeft === 0 ? "Hoy" : `${ev.daysLeft}d`}
                                    size="small"
                                    color={urgency as "error" | "warning" | "default"}
                                  />
                                  <Chip
                                    label={`${ev.submissionCount} entrega${ev.submissionCount !== 1 ? "s" : ""}`}
                                    size="small"
                                    color={ev.submissionCount > 0 ? "primary" : "default"}
                                    variant="outlined"
                                  />
                                </Box>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {ev.subjectName} · Grupo {ev.groupCode} ·{" "}
                                  {new Date(ev.dueDate).toLocaleDateString("es", { day: "numeric", month: "short" })}
                                </Typography>
                              }
                            />
                          </ListItem>
                          <Divider component="li" />
                        </React.Fragment>
                      );
                    })}
                  </List>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Acciones Rápidas
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {filteredActions.map((action) => (
                    <Button
                      key={action.path}
                      variant="outlined"
                      color={actionColors[action.path] ?? "primary"}
                      startIcon={action.icon}
                      onClick={() => navigate(action.path)}
                      size="small"
                      fullWidth
                      sx={{ justifyContent: "flex-start" }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Box>
              </Paper>
            </Grid>

            {/* Row 2: Groups — full width with scroll cap */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Mis Grupos
                  </Typography>
                  <Button size="small" onClick={() => navigate("/mis-grupos")}>
                    Ver todos
                  </Button>
                </Box>
                <Divider sx={{ mb: 1 }} />
                {loadingTeacherWidgets ? (
                  <Box sx={{ display: "flex", gap: 2, pt: 1 }}>
                    {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={80} sx={{ flex: 1 }} />)}
                  </Box>
                ) : teacherGroups.length === 0 ? (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 3, gap: 1 }}>
                    <GroupsIcon sx={{ color: "text.disabled", fontSize: 36 }} />
                    <Typography variant="body2" color="text.secondary">
                      No tienes grupos asignados
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" },
                      gap: 1.5,
                      pt: 1,
                    }}
                  >
                    {teacherGroups.map((g) => (
                      <Box
                        key={g.id}
                        onClick={() => navigate(`/mis-grupos/${g.id}`)}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          cursor: "pointer",
                          transition: "border-color 0.15s, box-shadow 0.15s",
                          "&:hover": {
                            borderColor: "primary.main",
                            boxShadow: "0 0 0 1px rgba(99,102,241,0.3)",
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                            {g.subject.name}
                          </Typography>
                          <Chip
                            label={g.isActive ? "Activo" : "Inactivo"}
                            size="small"
                            color={g.isActive ? "success" : "default"}
                            sx={{ ml: 1, flexShrink: 0 }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          {g.subject.code} · Grupo {g.groupCode}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          {g.academicPeriod?.name}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                          <GroupsIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                          <Typography variant="caption" color="text.secondary">
                            {g.currentStudents}/{g.maxStudents} estudiantes
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>
            </Grid>
          </>
        )}

        {/* ── STUDENT layout ── */}
        {role === "STUDENT" && (
          <>
            {/* Upcoming deadlines */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider", height: "100%" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Próximas Entregas
                  </Typography>
                  {showMiContenido ? (
                    <Button size="small" onClick={() => navigate("/mi-contenido")}>
                      Ver materias
                    </Button>
                  ) : navState?.pendingInscriptionPayment ? (
                    <Button size="small" color="warning" variant="outlined" onClick={() => navigate("/mis-pagos")}>
                      Pagar inscripción
                    </Button>
                  ) : null}
                </Box>
                <Divider sx={{ mb: 2 }} />
                {loadingWidgets ? (
                  [1, 2, 3].map((i) => <Skeleton key={i} height={52} sx={{ mb: 1 }} />)
                ) : upcomingDeadlines.length === 0 ? (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 3, gap: 1 }}>
                    <CheckCircleIcon sx={{ color: "success.main", fontSize: 36 }} />
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Sin entregas pendientes en los próximos 14 días
                    </Typography>
                  </Box>
                ) : (
                  <List dense disablePadding>
                    {upcomingDeadlines.map((d) => {
                      const urgency =
                        d.daysLeft <= 2 ? "error" : d.daysLeft <= 5 ? "warning" : "default";
                      return (
                        <React.Fragment key={d.id}>
                          <ListItem
                            disablePadding
                            sx={{ py: 1 }}
                            secondaryAction={
                              !d.submitted &&
                              showMiContenido && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<UploadIcon />}
                                  onClick={() => navigate("/mi-contenido")}
                                  color={urgency === "error" ? "error" : "primary"}
                                >
                                  Entregar
                                </Button>
                              )
                            }
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              {d.submitted
                                ? <CheckCircleIcon sx={{ color: "success.main", fontSize: 20 }} />
                                : <HourglassEmptyIcon sx={{ color: `${urgency}.main`, fontSize: 20 }} />
                              }
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                  <Typography variant="body2" fontWeight={600} component="span">
                                    {d.evaluationName}
                                  </Typography>
                                  {d.submitted ? (
                                    <Chip label="Entregado" size="small" color="success" variant="outlined" />
                                  ) : (
                                    <Chip
                                      label={d.daysLeft === 0 ? "Hoy" : `${d.daysLeft}d`}
                                      size="small"
                                      color={urgency as "error" | "warning" | "default"}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {d.subjectName} · {new Date(d.dueDate).toLocaleDateString("es", { day: "numeric", month: "short" })}
                                </Typography>
                              }
                            />
                          </ListItem>
                          <Divider component="li" />
                        </React.Fragment>
                      );
                    })}
                  </List>
                )}
              </Paper>
            </Grid>

            {/* Recent announcements */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider", height: "100%" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Anuncios Recientes
                  </Typography>
                  <Button size="small" onClick={() => navigate("/anuncios")}>
                    Ver todos
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {loadingWidgets ? (
                  [1, 2, 3].map((i) => <Skeleton key={i} height={52} sx={{ mb: 1 }} />)
                ) : recentAnnouncements.length === 0 ? (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 3, gap: 1 }}>
                    <CampaignIcon sx={{ color: "text.disabled", fontSize: 36 }} />
                    <Typography variant="body2" color="text.secondary">
                      No hay anuncios recientes
                    </Typography>
                  </Box>
                ) : (
                  <List dense disablePadding>
                    {recentAnnouncements.map((a) => (
                      <React.Fragment key={a.id}>
                        <ListItem disablePadding sx={{ py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <CampaignIcon sx={{ fontSize: 20, color: "primary.main" }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" fontWeight={600}>
                                {a.title}
                              </Typography>
                            }
                            secondaryTypographyProps={{ component: "div" }}
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                  {a.body.length > 90 ? `${a.body.slice(0, 90)}…` : a.body}
                                </Typography>
                                <Typography variant="caption" color="text.disabled">
                                  {a.author.firstName} {a.author.lastName} ·{" "}
                                  {new Date(a.publishedAt).toLocaleDateString("es", { day: "numeric", month: "short" })}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>

            {/* Quick actions */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Acciones Rápidas
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box className="flex flex-wrap gap-2">
                  {filteredActions.map((action) => (
                    <Button
                      key={action.path}
                      variant="outlined"
                      color={actionColors[action.path] ?? "primary"}
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
          </>
        )}

      </Grid>
    </Box>
  );
}
