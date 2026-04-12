import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import SaveIcon from "@mui/icons-material/Save";
import { useToast } from "../../../hooks/useToast";
import { evaluationsService } from "../../../services/evaluations.service";
import { gradesService } from "../../../services/grades.service";
import { groupsService } from "../../../services/groups.service";

interface EvalOption {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
}

interface StudentRow {
  studentId: string;
  studentCode: string;
  firstName: string;
  lastName: string;
}

interface GradeRow {
  id: string;
  score: number;
  evaluationId: string;
  studentId: string;
  student: { id: string; studentCode: string; user: { firstName: string; lastName: string } };
}

interface Props {
  groupId: string;
}

export default function GroupGradesPanel({ groupId }: Props) {
  const [evaluations, setEvaluations] = useState<EvalOption[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [scores, setScores] = useState<Record<string, number | "">>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [evals, enrolledStudents] = await Promise.all([
          evaluationsService.getByGroup(groupId),
          groupsService.getStudentsByGroup(groupId),
        ]);
        setEvaluations(evals);
        setStudents(
          (enrolledStudents as StudentRow[]).sort((a, b) =>
            a.studentCode.localeCompare(b.studentCode),
          ),
        );

        // Load existing grades for each evaluation
        const allGrades: GradeRow[][] = await Promise.all(
          evals.map((ev: EvalOption) => gradesService.getByEvaluation(ev.id)),
        );
        const scoreMap: Record<string, number | ""> = {};
        allGrades.forEach((gradeList) => {
          gradeList.forEach((g: GradeRow) => {
            scoreMap[`${g.student.id}:${g.evaluationId}`] = Number(g.score);
          });
        });
        setScores(scoreMap);
      } catch {
        showToast("Error al cargar datos", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [groupId]);

  const handleScoreChange = (studentId: string, evaluationId: string, value: string) => {
    const key = `${studentId}:${evaluationId}`;
    setScores((prev) => ({ ...prev, [key]: value === "" ? "" : Number(value) }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const gradesToSave = Object.entries(scores)
        .filter(([, v]) => v !== "")
        .map(([key, score]) => {
          const [studentId, evaluationId] = key.split(":");
          return { evaluationId, studentId, score: Number(score) };
        });
      await gradesService.bulkUpsert(gradesToSave);
      showToast("Calificaciones guardadas");
    } catch {
      showToast("Error al guardar calificaciones", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (evaluations.length === 0) {
    return (
      <Typography color="text.secondary">
        Crea al menos una evaluación antes de ingresar calificaciones.
      </Typography>
    );
  }

  if (students.length === 0) {
    return (
      <Typography color="text.secondary">
        No hay estudiantes inscritos en este grupo.
      </Typography>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<SaveIcon />}
          onClick={handleSaveAll}
          disabled={saving}
        >
          {saving ? "Guardando…" : "Guardar Todo"}
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Código</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Estudiante</TableCell>
              {evaluations.map((ev) => (
                <TableCell key={ev.id} sx={{ fontWeight: 700 }} align="center">
                  {ev.name}
                  <Typography variant="caption" display="block" color="text.secondary">
                    {Number(ev.weight)}% · máx {Number(ev.maxScore)}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((s) => (
              <TableRow key={s.studentId} hover>
                <TableCell>{s.studentCode}</TableCell>
                <TableCell>{s.firstName} {s.lastName}</TableCell>
                {evaluations.map((ev) => {
                  const key = `${s.studentId}:${ev.id}`;
                  return (
                    <TableCell key={ev.id} align="center">
                      <TextField
                        type="number" size="small"
                        value={scores[key] ?? ""}
                        onChange={(e) => handleScoreChange(s.studentId, ev.id, e.target.value)}
                        inputProps={{ min: 0, max: Number(ev.maxScore), step: 0.01 }}
                        sx={{ width: 90 }}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>{toast?.message}</Alert>
      </Snackbar>
    </Box>
  );
}
