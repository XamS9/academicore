import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
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

const COLORS = ["#4caf50", "#f44336", "#ff9800", "#2196f3"];

export default function ReportsPage() {
  const [enrollmentStats, setEnrollmentStats] = useState<any[]>([]);
  const [passFail, setPassFail] = useState<any[]>([]);
  const [gpaTrends, setGpaTrends] = useState<any[]>([]);
  const [atRisk, setAtRisk] = useState<{ count: number; students: any[] }>({
    count: 0,
    students: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportsService.getEnrollmentStats().then(setEnrollmentStats),
      reportsService.getPassFail().then(setPassFail),
      reportsService.getGpaTrends().then(setGpaTrends),
      reportsService.getAtRisk().then(setAtRisk),
    ]).finally(() => setLoading(false));
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
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Estudiantes en Riesgo
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
              estudiantes con estatus AT_RISK
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
