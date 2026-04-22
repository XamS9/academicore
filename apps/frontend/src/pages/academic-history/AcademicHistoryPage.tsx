import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SchoolIcon from "@mui/icons-material/School";
import WarningIcon from "@mui/icons-material/Warning";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import BlockIcon from "@mui/icons-material/Block";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";

import { useAuth } from "../../store/auth.context";

const statusConfig: Record<
  string,
  {
    color: "success" | "warning" | "info" | "error";
    icon: React.ReactNode;
    label: string;
  }
> = {
  ACTIVE: { color: "success", icon: <CheckCircleIcon />, label: "ACTIVO" },
  AT_RISK: { color: "warning", icon: <WarningIcon />, label: "EN RIESGO" },
  ELIGIBLE_FOR_GRADUATION: {
    color: "info",
    icon: <EmojiEventsIcon />,
    label: "ELEGIBLE PARA GRADUACIÓN",
  },
  SUSPENDED: { color: "error", icon: <BlockIcon />, label: "SUSPENDIDO" },
  GRADUATED: { color: "success", icon: <SchoolIcon />, label: "GRADUADO" },
  WITHDRAWN: { color: "warning", icon: <ExitToAppIcon />, label: "BAJA" },
};
import { academicRecordsService } from "../../services/academic-records.service";
import { studentsService } from "../../services/students.service";

interface AcademicRecord {
  id: string;
  studentId: string;
  finalGrade: string | number;
  passed: boolean;
  academicPeriodId: string;
  group: {
    groupCode: string;
    subject: { name: string };
    academicPeriod: { name: string };
  };
  academicPeriod: { name: string };
}

interface PeriodAvg {
  periodId: string;
  periodName: string;
  average: number;
  count: number;
}

interface StudentItem {
  id: string;
  studentCode: string;
  academicStatus: string;
  user: { firstName: string; lastName: string; email: string };
  career: { name: string };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ py: 3 }}>
      {value === index && children}
    </Box>
  );
}

function StatusChip({ passed }: { passed: boolean }) {
  return passed ? (
    <Chip label="APROBADO" color="success" size="small" />
  ) : (
    <Chip label="REPROBADO" color="error" size="small" />
  );
}

export default function AcademicHistoryPage() {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState(0);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [periodAverages, setPeriodAverages] = useState<PeriodAvg[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser?.role === "STUDENT") {
      studentsService
        .getMe()
        .then((data: StudentItem) => {
          setStudents([data]);
          setSelectedStudentId(data.id);
        })
        .catch(console.error);
    } else {
      studentsService
        .getAll()
        .then((data: StudentItem[]) => {
          setStudents(data);
          if (data.length > 0) setSelectedStudentId(data[0].id);
        })
        .catch(console.error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!selectedStudentId) return;
    setLoading(true);
    const isOwnStudent = currentUser?.role === "STUDENT";
    const recordsPromise = isOwnStudent
      ? academicRecordsService.getMine()
      : academicRecordsService.getByStudent(selectedStudentId);
    const averagesPromise = isOwnStudent
      ? academicRecordsService.getMyAveragesByPeriod()
      : academicRecordsService.getAveragesByPeriod(selectedStudentId);
    Promise.all([recordsPromise, averagesPromise])
      .then(([recs, avgs]) => {
        setRecords(recs as AcademicRecord[]);
        setPeriodAverages(avgs as PeriodAvg[]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedStudentId, currentUser?.role]);

  const passed = records.filter((r) => r.passed);
  const failed = records.filter((r) => !r.passed);

  const overallAvg =
    records.length > 0
      ? parseFloat(
          (
            records.reduce((s, r) => s + Number(r.finalGrade), 0) /
            records.length
          ).toFixed(2),
        )
      : 0;

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Historial Académico
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Proceso extendido: Consulta y seguimiento del historial académico del
        estudiante
      </Typography>

      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <Tabs
          value={tab}
          onChange={(_e, v: number) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
        >
          <Tab label="1.1 Historial Académico" />
          <Tab label="1.2 Materias Cursadas" />
          <Tab label="1.3 Aprobadas / Reprobadas" />
          <Tab label="1.4 Promedios por Período" />
          <Tab label="1.5 Estado Académico" />
        </Tabs>

        <Box sx={{ px: 3 }}>
          {/* Tab 1 — Full history table */}
          <TabPanel value={tab} index={0}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Historial completo del estudiante
            </Typography>

            {currentUser?.role !== "STUDENT" && (
              <FormControl size="small" sx={{ minWidth: 280, mb: 3 }}>
                <InputLabel>Estudiante</InputLabel>
                <Select
                  value={selectedStudentId}
                  label="Estudiante"
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  {students.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.user.firstName} {s.user.lastName} — {s.studentCode}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {loading ? (
              <Box className="flex justify-center py-8">
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "grey.100" }}>
                        <TableCell sx={{ fontWeight: 700 }}>Materia</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Grupo</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Período</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">
                          Calificación Final
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">
                          Estado
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {records.map((rec) => (
                        <TableRow key={rec.id} hover>
                          <TableCell>{rec.group.subject.name}</TableCell>
                          <TableCell>{rec.group.groupCode}</TableCell>
                          <TableCell>{rec.academicPeriod.name}</TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              color={
                                Number(rec.finalGrade) >= 6
                                  ? "success.main"
                                  : "error.main"
                              }
                            >
                              {Number(rec.finalGrade).toFixed(1)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <StatusChip passed={rec.passed} />
                          </TableCell>
                        </TableRow>
                      ))}
                      {records.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ py: 2 }}
                            >
                              Sin registros académicos
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box className="flex items-center gap-2 mt-3">
                  <Chip
                    label={`${records.length} registros en total`}
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    label={`Promedio general: ${overallAvg}`}
                    color="primary"
                    size="small"
                  />
                </Box>
              </>
            )}
          </TabPanel>

          {/* Tab 2 — Completed subjects */}
          <TabPanel value={tab} index={1}>
            <Box className="flex items-center justify-between mb-3">
              <Typography variant="h6" fontWeight={600}>
                Materias Cursadas
              </Typography>
              <Chip
                label={`${passed.length} materias aprobadas`}
                color="primary"
                icon={<SchoolIcon />}
              />
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Mostrando únicamente materias con estado APROBADO (calificación ≥
              6.0)
            </Alert>

            {loading ? (
              <Box className="flex justify-center py-8">
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {passed.map((rec) => (
                  <Grid item xs={12} sm={6} md={4} key={rec.id}>
                    <Card
                      variant="outlined"
                      sx={{ borderColor: "success.light" }}
                    >
                      <CardContent sx={{ pb: "12px !important" }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight={700}
                          gutterBottom
                        >
                          {rec.group.subject.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {rec.group.groupCode} · {rec.academicPeriod.name}
                        </Typography>
                        <Box className="flex items-center justify-between mt-2">
                          <Typography
                            variant="h6"
                            color="success.main"
                            fontWeight={700}
                          >
                            {Number(rec.finalGrade).toFixed(1)}
                          </Typography>
                          <StatusChip passed={rec.passed} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                {passed.length === 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Sin materias aprobadas
                    </Typography>
                  </Grid>
                )}
              </Grid>
            )}
          </TabPanel>

          {/* Tab 3 — Passed / Failed */}
          <TabPanel value={tab} index={2}>
            <Box className="flex gap-2 mb-3">
              <Chip
                icon={<CheckCircleIcon />}
                label={`${passed.length} Aprobadas`}
                color="success"
              />
              <Chip
                icon={<CancelIcon />}
                label={`${failed.length} Reprobadas`}
                color="error"
              />
            </Box>

            {loading ? (
              <Box className="flex justify-center py-8">
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                {/* Passed */}
                <Grid item xs={12} md={6}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, borderColor: "success.main" }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      color="success.main"
                      gutterBottom
                    >
                      Materias Aprobadas
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {passed.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Sin materias aprobadas
                      </Typography>
                    ) : (
                      passed.map((rec) => (
                        <Box
                          key={rec.id}
                          className="flex items-center justify-between py-1"
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {rec.group.subject.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {rec.academicPeriod.name}
                            </Typography>
                          </Box>
                          <Typography
                            variant="h6"
                            color="success.main"
                            fontWeight={700}
                          >
                            {Number(rec.finalGrade).toFixed(1)}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Paper>
                </Grid>

                {/* Failed */}
                <Grid item xs={12} md={6}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, borderColor: "error.main" }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      color="error.main"
                      gutterBottom
                    >
                      Materias Reprobadas
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {failed.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Sin materias reprobadas
                      </Typography>
                    ) : (
                      failed.map((rec) => (
                        <Box
                          key={rec.id}
                          className="flex items-center justify-between py-1"
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {rec.group.subject.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {rec.academicPeriod.name}
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                              <Chip
                                label="Elegible para reinscripción"
                                size="small"
                                color="warning"
                                variant="outlined"
                                sx={{ fontSize: "0.65rem" }}
                              />
                            </Box>
                          </Box>
                          <Typography
                            variant="h6"
                            color="error.main"
                            fontWeight={700}
                          >
                            {Number(rec.finalGrade).toFixed(1)}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Paper>
                </Grid>
              </Grid>
            )}
          </TabPanel>

          {/* Tab 4 — Period averages */}
          <TabPanel value={tab} index={3}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Promedios por Período Académico
            </Typography>

            {loading ? (
              <Box className="flex justify-center py-8">
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer sx={{ mb: 4 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "grey.100" }}>
                        <TableCell sx={{ fontWeight: 700 }}>Período</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">
                          # Materias
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">
                          Promedio
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {periodAverages.map((p) => (
                        <TableRow key={p.periodId} hover>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {p.periodName}
                          </TableCell>
                          <TableCell align="center">{p.count}</TableCell>
                          <TableCell align="center">
                            <Typography fontWeight={700} color="primary.main">
                              {p.average.toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                      {periodAverages.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ py: 2 }}
                            >
                              Sin promedios calculados
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Visualización de promedios (escala 0–10)
                </Typography>
                <Box className="flex flex-col gap-4">
                  {periodAverages.map((p) => (
                    <Box key={p.periodId}>
                      <Box className="flex items-center justify-between mb-1">
                        <Typography variant="body2" fontWeight={600}>
                          {p.periodName}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="primary.main"
                          fontWeight={700}
                        >
                          {p.average.toFixed(2)} / 10
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(p.average * 10, 100)}
                        sx={{ height: 12, borderRadius: 6 }}
                        color={
                          p.average >= 7
                            ? "success"
                            : p.average >= 6
                              ? "warning"
                              : "error"
                        }
                      />
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </TabPanel>

          {/* Tab 5 — Academic status */}
          <TabPanel value={tab} index={4}>
            {loading ? (
              <Box className="flex justify-center py-8">
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                {/* Status card */}
                <Grid item xs={12} md={5}>
                  {(() => {
                    const st =
                      statusConfig[
                        selectedStudent?.academicStatus ?? "ACTIVE"
                      ] ?? statusConfig.ACTIVE;
                    return (
                      <Card
                        sx={{
                          border: "2px solid",
                          borderColor: `${st.color}.main`,
                        }}
                      >
                        <CardContent>
                          <Box className="flex items-center gap-2 mb-3">
                            <SchoolIcon
                              color={st.color}
                              sx={{ fontSize: 32 }}
                            />
                            <Box>
                              <Typography variant="h6" fontWeight={700}>
                                {selectedStudent
                                  ? `${selectedStudent.user.firstName} ${selectedStudent.user.lastName}`
                                  : "—"}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {selectedStudent?.studentCode ?? "—"}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            {selectedStudent?.career?.name ?? "—"}
                          </Typography>
                          <Box className="mt-3">
                            <Chip
                              label={st.label}
                              color={st.color}
                              icon={st.icon as React.ReactElement}
                              sx={{ fontWeight: 700 }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </Grid>

                {/* Criteria checklist */}
                <Grid item xs={12} md={7}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      gutterBottom
                    >
                      Criterios de Estado
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {[
                      {
                        label: "Tiene registros académicos",
                        detail: `${records.length} registros encontrados`,
                        ok: records.length > 0,
                      },
                      {
                        label: "Promedio mínimo cumplido (≥ 6.0)",
                        detail: `Promedio actual: ${overallAvg}`,
                        ok: overallAvg >= 6.0,
                      },
                      {
                        label: "Estado académico activo",
                        detail: selectedStudent?.academicStatus ?? "Sin datos",
                        ok: selectedStudent?.academicStatus === "ACTIVE",
                      },
                    ].map((c) => (
                      <Box
                        key={c.label}
                        className="flex items-center gap-3 py-2"
                      >
                        {c.ok ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <CancelIcon color="error" />
                        )}
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {c.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {c.detail}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Paper>

                  {/* Status flags */}
                  <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      gutterBottom
                    >
                      Indicadores de Estado
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box className="flex flex-wrap gap-2">
                      {Object.entries(statusConfig).map(([key, cfg]) => (
                        <Chip
                          key={key}
                          icon={cfg.icon as React.ReactElement}
                          label={cfg.label}
                          color={cfg.color}
                          variant={
                            selectedStudent?.academicStatus === key
                              ? "filled"
                              : "outlined"
                          }
                        />
                      ))}
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      Solo está activo el indicador correspondiente al estado
                      del estudiante seleccionado.
                    </Typography>
                  </Paper>
                </Grid>

                {/* Info note */}
                <Grid item xs={12}>
                  <Alert severity="info">
                    <strong>Nota:</strong> Este estado determina la elegibilidad
                    del estudiante para inscripción, emisión de certificaciones
                    y posible suspensión del sistema. Es calculado
                    automáticamente en función de créditos, promedio y materias
                    obligatorias pendientes.
                  </Alert>
                </Grid>
              </Grid>
            )}
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}
