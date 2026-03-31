import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../store/auth.context";
import { groupsService } from "../../services/groups.service";
import { evaluationsService } from "../../services/evaluations.service";
import { gradesService } from "../../services/grades.service";
import { teachersService } from "../../services/teachers.service";

interface GroupOption {
  id: string;
  groupCode: string;
  subject: { name: string; code: string };
  academicPeriod: { name: string };
}

interface EvalOption {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
}

interface GradeRow {
  id: string;
  score: number;
  evaluationId: string;
  studentId: string;
  student: {
    id: string;
    studentCode: string;
    user: { firstName: string; lastName: string };
  };
}

interface StudentRow {
  studentId: string;
  studentCode: string;
  firstName: string;
  lastName: string;
}

export default function GradesPage() {
  const { currentUser } = useAuth();
  const isTeacher = currentUser?.role === "TEACHER";

  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [evaluations, setEvaluations] = useState<EvalOption[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  // scores keyed by "studentId:evaluationId"
  const [scores, setScores] = useState<Record<string, number | "">>({});
  const [loading, setLoading] = useState(false);
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const groupList = isTeacher
          ? await teachersService
              .getByUserId(currentUser!.id)
              .then((t: { id: string }) => groupsService.getByTeacher(t.id))
          : await groupsService.getAll();
        setGroups(groupList);
      } catch {
        showToast("Error al cargar grupos", "error");
      }
    };
    loadGroups();
  }, []);

  useEffect(() => {
    setEvaluations([]);
    setStudents([]);
    setScores({});
    if (!selectedGroup) return;

    const loadGroupData = async () => {
      setLoading(true);
      try {
        const evals: EvalOption[] =
          await evaluationsService.getByGroup(selectedGroup);
        setEvaluations(evals);

        // Fetch grades for every evaluation in parallel
        const allGrades: GradeRow[][] = await Promise.all(
          evals.map((ev) => gradesService.getByEvaluation(ev.id)),
        );

        // Build unique student list and score map
        const studentMap = new Map<string, StudentRow>();
        const scoreMap: Record<string, number | ""> = {};

        allGrades.forEach((gradeList) => {
          gradeList.forEach((g: GradeRow) => {
            if (!studentMap.has(g.student.id)) {
              studentMap.set(g.student.id, {
                studentId: g.student.id,
                studentCode: g.student.studentCode,
                firstName: g.student.user.firstName,
                lastName: g.student.user.lastName,
              });
            }
            scoreMap[`${g.student.id}:${g.evaluationId}`] = Number(g.score);
          });
        });

        setStudents(
          Array.from(studentMap.values()).sort((a, b) =>
            a.studentCode.localeCompare(b.studentCode),
          ),
        );
        setScores(scoreMap);
      } catch {
        showToast("Error al cargar datos del grupo", "error");
      } finally {
        setLoading(false);
      }
    };
    loadGroupData();
  }, [selectedGroup]);

  const handleScoreChange = (
    studentId: string,
    evaluationId: string,
    value: string,
  ) => {
    const key = `${studentId}:${evaluationId}`;
    setScores((prev) => ({
      ...prev,
      [key]: value === "" ? "" : Number(value),
    }));
  };

  const handleSaveAll = async () => {
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
    }
  };

  const hasStudents = students.length > 0 && evaluations.length > 0;

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5">Calificaciones</Typography>
        {hasStudents && (
          <Button variant="contained" onClick={handleSaveAll}>
            Guardar Todo
          </Button>
        )}
      </Box>

      <TextField
        select
        label="Grupo"
        value={selectedGroup}
        onChange={(e) => setSelectedGroup(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
      >
        <MenuItem value="">— Seleccione un grupo —</MenuItem>
        {groups.map((g) => (
          <MenuItem key={g.id} value={g.id}>
            {g.subject.name} ({g.groupCode}) — {g.academicPeriod?.name}
          </MenuItem>
        ))}
      </TextField>

      {loading ? (
        <Box className="flex justify-center py-8">
          <CircularProgress />
        </Box>
      ) : hasStudents ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Código</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estudiante</TableCell>
                {evaluations.map((ev) => (
                  <TableCell
                    key={ev.id}
                    sx={{ fontWeight: 700 }}
                    align="center"
                  >
                    {ev.name}
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                    >
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
                  <TableCell>
                    {s.firstName} {s.lastName}
                  </TableCell>
                  {evaluations.map((ev) => {
                    const key = `${s.studentId}:${ev.id}`;
                    return (
                      <TableCell key={ev.id} align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={scores[key] ?? ""}
                          onChange={(e) =>
                            handleScoreChange(
                              s.studentId,
                              ev.id,
                              e.target.value,
                            )
                          }
                          inputProps={{
                            min: 0,
                            max: Number(ev.maxScore),
                            step: 0.01,
                          }}
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
      ) : selectedGroup && !loading ? (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No hay evaluaciones o estudiantes registrados en este grupo.
        </Typography>
      ) : null}

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
