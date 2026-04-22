import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { reportsService } from "../../services/reports.service";
import { systemSettingsService } from "../../services/system-settings.service";

const COLORS = ["#4caf50", "#f44336", "#ff9800", "#2196f3"];

export default function ReportsPage() {
  const [enrollmentStats, setEnrollmentStats] = useState<any[]>([]);
  const [passFail, setPassFail] = useState<any[]>([]);
  const [gpaTrends, setGpaTrends] = useState<any[]>([]);
  const [atRisk, setAtRisk] = useState<{ count: number; students: any[] }>({
    count: 0,
    students: [],
  });
  const [atRiskThreshold, setAtRiskThreshold] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [e, pf, gpa, risk, settings] = await Promise.all([
          reportsService.getEnrollmentStats(),
          reportsService.getPassFail(),
          reportsService.getGpaTrends(),
          reportsService.getAtRisk(),
          systemSettingsService.get().catch(() => null),
        ]);
        if (cancelled) return;
        setEnrollmentStats(e);
        setPassFail(pf);
        setGpaTrends(gpa);
        setAtRisk(risk);
        if (settings && typeof settings.atRiskThreshold === "number") {
          setAtRiskThreshold(settings.atRiskThreshold);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Box className="flex justify-center py-12">
        <CircularProgress />
      </Box>
    );
  }

  const passFailTotals = passFail.reduce(
    (acc, p) => ({
      passed: acc.passed + p.passed,
      failed: acc.failed + p.failed,
    }),
    { passed: 0, failed: 0 },
  );
  const pieData = [
    { name: "Aprobados", value: passFailTotals.passed },
    { name: "Reprobados", value: passFailTotals.failed },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Reportes y Analíticas
      </Typography>

      <Grid container spacing={3}>
        {/* Enrollment Stats */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Inscripciones por Período
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={enrollmentStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#1976d2" name="Inscripciones" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Pass/Fail Pie */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Aprobados vs Reprobados
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({
                    name,
                    percent,
                  }: {
                    name?: string;
                    percent?: number;
                  }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* GPA Trends */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Tendencia de Promedio General
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={gpaTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodName" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="averageGpa"
                  stroke="#1976d2"
                  name="Promedio"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* At-Risk */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Estudiantes en riesgo académico
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, lineHeight: 1.6 }}
            >
              Aquí se listan alumnos con estatus{" "}
              <strong>En riesgo</strong> (AT_RISK): riesgo{" "}
              <strong>académico</strong>, no financiero. El sistema asigna ese
              estatus cuando el estudiante tiene al menos{" "}
              <strong>{atRiskThreshold}</strong> materias distintas cuya{" "}
              <strong>última calificación registrada es reprobatoria</strong> y
              no existe después un registro de aprobación en la misma materia.
              Ese umbral se ajusta en{" "}
              <Link component={RouterLink} to="/configuracion" underline="hover">
                Configuración del sistema
              </Link>
              .
            </Typography>
            <Typography
              variant="h2"
              color="error"
              fontWeight={700}
              sx={{ mb: 1 }}
            >
              {atRisk.count}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              estudiantes con este estatus en la base de datos
            </Typography>
            {atRisk.students.slice(0, 5).map((s: any) => (
              <Typography key={s.id} variant="body2">
                {s.name} ({s.studentCode}) — {s.career}
              </Typography>
            ))}
            {atRisk.students.length > 5 && (
              <Typography variant="caption" color="text.secondary">
                y {atRisk.students.length - 5} más...
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
