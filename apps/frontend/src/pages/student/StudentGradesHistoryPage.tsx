import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Chip from "@mui/material/Chip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GradeIcon from "@mui/icons-material/Grade";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { enrollmentsService } from "../../services/enrollments.service";
import { gradesService } from "../../services/grades.service";

interface GradeItem {
  id: string;
  score: number;
  evaluation: { name: string; weight: number; maxScore: number };
}

interface CourseHistory {
  groupId: string;
  subjectName: string;
  subjectCode: string;
  groupCode: string;
  averageScore: number | null;
  gradedCount: number;
  grades: GradeItem[];
}

interface PeriodHistory {
  periodId: string;
  periodName: string;
  courses: CourseHistory[];
}

export default function StudentGradesHistoryPage() {
  const { toast, showToast, clearToast } = useToast();

  const [history, setHistory] = useState<PeriodHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        type ESItem = {
          groupId: string;
          status: string;
          group: {
            groupCode: string;
            subject: { name: string; code: string };
          };
        };
        type EnrollmentItem = {
          id: string;
          status: string;
          academicPeriod: { id: string; name: string };
          enrollmentSubjects: ESItem[];
        };

        const enrollments: EnrollmentItem[] =
          await enrollmentsService.getMine();

        // Only past (non-active) enrollments
        const pastEnrollments = enrollments.filter(
          (e) => e.status !== "ACTIVE",
        );

        if (pastEnrollments.length === 0) {
          setHistory([]);
          return;
        }

        // Collect all unique groups across past enrollments
        const allGroups = pastEnrollments.flatMap((e) =>
          e.enrollmentSubjects
            .filter((es) => es.status !== "DROPPED")
            .map((es) => ({
              groupId: es.groupId,
              subjectName: es.group.subject.name,
              subjectCode: es.group.subject.code,
              groupCode: es.group.groupCode,
              periodId: e.academicPeriod.id,
              periodName: e.academicPeriod.name,
            })),
        );

        // Load all grades in parallel
        const gradeResults = await Promise.all(
          allGroups.map((g) =>
            gradesService
              .getMineByGroup(g.groupId)
              .then((gs: GradeItem[]) => ({ groupId: g.groupId, grades: gs }))
              .catch(() => ({ groupId: g.groupId, grades: [] as GradeItem[] })),
          ),
        );
        const gradeMap = new Map(
          gradeResults.map((g) => [g.groupId, g.grades]),
        );

        // Build period → courses structure
        const periodMap = new Map<string, PeriodHistory>();
        for (const g of allGroups) {
          if (!periodMap.has(g.periodId)) {
            periodMap.set(g.periodId, {
              periodId: g.periodId,
              periodName: g.periodName,
              courses: [],
            });
          }
          const gs = gradeMap.get(g.groupId) ?? [];
          const weighted =
            gs.length > 0
              ? gs.reduce(
                  (sum, gr) =>
                    sum +
                    (Number(gr.score) / Number(gr.evaluation.maxScore)) *
                      Number(gr.evaluation.weight),
                  0,
                )
              : null;

          periodMap.get(g.periodId)!.courses.push({
            groupId: g.groupId,
            subjectName: g.subjectName,
            subjectCode: g.subjectCode,
            groupCode: g.groupCode,
            averageScore: weighted,
            gradedCount: gs.length,
            grades: gs,
          });
        }

        setHistory(Array.from(periodMap.values()));
      } catch {
        showToast("Error al cargar historial de calificaciones", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const scoreColor = (
    avg: number | null,
  ): "success" | "warning" | "error" | "default" => {
    if (avg === null) return "default";
    if (avg >= 70) return "success";
    if (avg >= 50) return "warning";
    return "error";
  };

  const columns: Column<GradeItem>[] = [
    { key: "evaluation", label: "Evaluación", render: (r) => r.evaluation.name },
    {
      key: "weight",
      label: "Peso",
      render: (r) => `${Number(r.evaluation.weight)}%`,
    },
    {
      key: "score",
      label: "Calificación",
      render: (r) => `${Number(r.score)} / ${Number(r.evaluation.maxScore)}`,
    },
    {
      key: "pct",
      label: "Porcentaje",
      render: (r) => {
        const pct =
          (Number(r.score) / Number(r.evaluation.maxScore)) * 100;
        return (
          <Chip
            label={`${pct.toFixed(1)}%`}
            size="small"
            color={pct >= 70 ? "success" : pct >= 50 ? "warning" : "error"}
            variant="outlined"
          />
        );
      },
    },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 4 }}>
        Historial de Calificaciones
      </Typography>

      {loading ? (
        <Typography color="text.secondary">Cargando historial…</Typography>
      ) : history.length === 0 ? (
        <Typography color="text.secondary">
          No hay períodos anteriores con calificaciones registradas.
        </Typography>
      ) : (
        history.map((period) => (
          <Box key={period.periodId} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              {period.periodName}
            </Typography>

            {period.courses.map((course) => (
              <Accordion key={course.groupId} variant="outlined" sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      flexWrap: "wrap",
                      width: "100%",
                      pr: 2,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {course.subjectName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {course.subjectCode} · Grupo {course.groupCode}
                      </Typography>
                    </Box>
                    {course.gradedCount === 0 ? (
                      <Chip
                        label="Sin calificaciones"
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        icon={<GradeIcon />}
                        label={`Promedio: ${course.averageScore?.toFixed(1)}%`}
                        size="small"
                        color={scoreColor(course.averageScore)}
                      />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  {course.grades.length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 1 }}
                    >
                      No hay calificaciones registradas.
                    </Typography>
                  ) : (
                    <DataTable
                      columns={columns}
                      rows={course.grades}
                      loading={false}
                      getRowKey={(r) => r.id}
                    />
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ))
      )}

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
