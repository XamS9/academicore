import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GradeIcon from "@mui/icons-material/Grade";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../store/auth.context";
import { studentsService } from "../../services/students.service";
import { enrollmentsService } from "../../services/enrollments.service";
import { gradesService } from "../../services/grades.service";

interface GradeItem {
  id: string;
  score: number;
  evaluation: { name: string; weight: number; maxScore: number };
}

interface CourseCard {
  groupId: string;
  subjectName: string;
  subjectCode: string;
  groupCode: string;
  periodName: string;
  averageScore: number | null;
  gradedCount: number;
  totalWeight: number;
}

export default function StudentGradesPage() {
  const { currentUser } = useAuth();
  const { toast, showToast, clearToast } = useToast();
  const [searchParams] = useSearchParams();
  const targetGroupId = searchParams.get("groupId");

  const [studentId, setStudentId] = useState("");
  const [cards, setCards] = useState<CourseCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);

  const [selectedCard, setSelectedCard] = useState<CourseCard | null>(null);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // ─── Load current-period cards ───────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      try {
        setCardsLoading(true);
        const student = await studentsService.getByUserId(currentUser!.id);
        setStudentId(student.id);

        type ESItem = {
          groupId: string;
          status: string;
          group: {
            groupCode: string;
            subject: { name: string; code: string };
          };
        };
        type EnrollmentItem = {
          status: string;
          academicPeriod: { name: string };
          enrollmentSubjects: ESItem[];
        };

        const enrollments: EnrollmentItem[] =
          await enrollmentsService.getByStudent(student.id);

        // Only show groups from the active enrollment (current period)
        const currentGroups = enrollments
          .filter((e) => e.status === "ACTIVE")
          .flatMap((e) =>
            e.enrollmentSubjects
              .filter((es) => es.status === "ENROLLED")
              .map((es) => ({
                groupId: es.groupId,
                subjectName: es.group.subject.name,
                subjectCode: es.group.subject.code,
                groupCode: es.group.groupCode,
                periodName: e.academicPeriod.name,
              })),
          );

        // Load grades for all current groups in parallel
        const gradesByGroup = await Promise.all(
          currentGroups.map((g) =>
            gradesService
              .getByStudentAndGroup(student.id, g.groupId)
              .then((gs: GradeItem[]) => ({ groupId: g.groupId, grades: gs }))
              .catch(() => ({ groupId: g.groupId, grades: [] as GradeItem[] })),
          ),
        );
        const gradeMap = new Map(gradesByGroup.map((g) => [g.groupId, g.grades]));

        const builtCards: CourseCard[] = currentGroups.map((g) => {
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
          return {
            ...g,
            averageScore: weighted,
            gradedCount: gs.length,
            totalWeight: gs.reduce(
              (s, gr) => s + Number(gr.evaluation.weight),
              0,
            ),
          };
        });

        setCards(builtCards);
      } catch {
        showToast("Error al cargar calificaciones", "error");
      } finally {
        setCardsLoading(false);
      }
    };
    load();
  }, []);

  // ─── Auto-select card from query param (deep-link from notification) ─────────

  useEffect(() => {
    if (!targetGroupId || cardsLoading || selectedCard) return;
    const card = cards.find((c) => c.groupId === targetGroupId);
    if (card) handleSelectCard(card);
  }, [cards, cardsLoading, targetGroupId]);

  // ─── Select card → load full grade table ─────────────────────────────────────

  const handleSelectCard = async (card: CourseCard) => {
    setSelectedCard(card);
    setDetailLoading(true);
    try {
      const data = await gradesService.getByStudentAndGroup(
        studentId,
        card.groupId,
      );
      setGrades(data);
    } catch {
      showToast("Error al cargar calificaciones", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Grade score color ────────────────────────────────────────────────────────

  const scoreColor = (avg: number | null): "success" | "warning" | "error" | "default" => {
    if (avg === null) return "default";
    if (avg >= 70) return "success";
    if (avg >= 50) return "warning";
    return "error";
  };

  // ─── Columns ──────────────────────────────────────────────────────────────────

  const columns: Column<GradeItem>[] = [
    { key: "evaluation", label: "Evaluación", render: (r) => r.evaluation.name },
    { key: "weight", label: "Peso", render: (r) => `${Number(r.evaluation.weight)}%` },
    {
      key: "score",
      label: "Calificación",
      render: (r) => `${Number(r.score)} / ${Number(r.evaluation.maxScore)}`,
    },
    {
      key: "pct",
      label: "Porcentaje",
      render: (r) => {
        const pct = (Number(r.score) / Number(r.evaluation.maxScore)) * 100;
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

  // ─── Cards view ───────────────────────────────────────────────────────────────

  if (!selectedCard) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 4 }}>
          Mis Calificaciones
        </Typography>

        {cardsLoading ? (
          <Typography color="text.secondary">Cargando materias…</Typography>
        ) : cards.length === 0 ? (
          <Typography color="text.secondary">
            No tienes materias activas en el período actual.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {cards.map((card) => (
              <Grid item xs={12} sm={6} md={4} key={card.groupId}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    transition: "box-shadow 0.2s",
                    "&:hover": { boxShadow: 4 },
                  }}
                >
                  <CardActionArea
                    onClick={() => handleSelectCard(card)}
                    sx={{ height: "100%", alignItems: "flex-start" }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {card.subjectName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {card.subjectCode} · Grupo {card.groupCode}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {card.periodName}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {card.gradedCount === 0 ? (
                          <Chip
                            label="Sin calificaciones aún"
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <>
                            <Chip
                              icon={<GradeIcon />}
                              label={`Promedio: ${card.averageScore?.toFixed(1)}%`}
                              size="small"
                              color={scoreColor(card.averageScore)}
                            />
                            <Chip
                              label={`${card.gradedCount} evaluación${card.gradedCount !== 1 ? "es" : ""}`}
                              size="small"
                              variant="outlined"
                            />
                          </>
                        )}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
          <Alert severity={toast?.severity} onClose={clearToast}>
            {toast?.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  // ─── Detail view ──────────────────────────────────────────────────────────────

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => setSelectedCard(null)}
        sx={{ mb: 2 }}
      >
        Mis Calificaciones
      </Button>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        {selectedCard.subjectName}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {selectedCard.subjectCode} · Grupo {selectedCard.groupCode} ·{" "}
        {selectedCard.periodName}
      </Typography>

      <DataTable
        columns={columns}
        rows={grades}
        loading={detailLoading}
        getRowKey={(r) => r.id}
      />

      {!detailLoading && grades.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Aún no hay calificaciones registradas para esta materia.
        </Typography>
      )}

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
