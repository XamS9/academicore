import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InboxIcon from "@mui/icons-material/Inbox";
import SaveIcon from "@mui/icons-material/Save";
import LinkIcon from "@mui/icons-material/Link";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/HourglassEmpty";
import { DataTable, Column } from "../../../components/ui/DataTable";
import { useToast } from "../../../hooks/useToast";
import { evaluationsService } from "../../../services/evaluations.service";
import { evaluationTypesService } from "../../../services/evaluation-types.service";
import {
  studentSubmissionsService,
  type StudentSubmissionWithStudent,
} from "../../../services/student-submissions.service";
import { groupsService } from "../../../services/groups.service";
import { gradesService } from "../../../services/grades.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvalType {
  id: string;
  name: string;
}

interface EvaluationItem {
  id: string;
  name: string;
  weight: number;
  maxScore: number;
  dueDate: string | null;
  evaluationType: { id: string; name: string };
  groupId: string;
}

interface EvalForm {
  groupId: string;
  evaluationTypeId: string;
  name: string;
  weight: number;
  maxScore: number;
  dueDate: string;
}

interface EnrolledStudent {
  studentId: string;
  studentCode: string;
  firstName: string;
  lastName: string;
}

interface GradeRow {
  id: string;
  score: number;
  evaluationId: string;
  student: { id: string };
}

const emptyForm = (groupId: string): EvalForm => ({
  groupId,
  evaluationTypeId: "",
  name: "",
  weight: 0,
  maxScore: 100,
  dueDate: "",
});

const typeIcons: Record<string, React.ReactNode> = {
  LINK: <LinkIcon fontSize="small" />,
  TEXT: <DescriptionIcon fontSize="small" />,
  FILE_REF: <InsertDriveFileIcon fontSize="small" />,
};

const typeLabels: Record<string, string> = {
  LINK: "Enlace",
  TEXT: "Texto",
  FILE_REF: "Archivo",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  groupId: string;
}

export default function GroupEvaluationsPanel({ groupId }: Props) {
  const [evalTypes, setEvalTypes] = useState<EvalType[]>([]);
  const [items, setItems] = useState<EvaluationItem[]>([]);
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Create / edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EvaluationItem | null>(null);
  const [form, setForm] = useState<EvalForm>(emptyForm(groupId));

  // Submissions viewer dialog
  const [viewEval, setViewEval] = useState<EvaluationItem | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmissionWithStudent[]>([]);
  // Inline grade entry inside the submissions dialog
  const [gradeScores, setGradeScores] = useState<Record<string, number | "">>({});
  const [savingGrades, setSavingGrades] = useState(false);

  const { toast, showToast, clearToast } = useToast();

  // ─── Load evaluations + submission counts ──────────────────────────────────

  const loadEvals = async () => {
    try {
      setLoading(true);
      const [types, data] = await Promise.all([
        evalTypes.length === 0 ? evaluationTypesService.getAll() : Promise.resolve(evalTypes),
        evaluationsService.getByGroup(groupId),
      ]);
      setEvalTypes(types);
      setItems(data);

      // Fetch submission counts in parallel
      const counts = await Promise.all(
        data.map((ev: EvaluationItem) =>
          studentSubmissionsService
            .getByEvaluation(ev.id)
            .then((subs) => ({ id: ev.id, count: subs.length }))
            .catch(() => ({ id: ev.id, count: 0 })),
        ),
      );
      setSubmissionCounts(Object.fromEntries(counts.map((c) => [c.id, c.count])));
    } catch {
      showToast("Error al cargar evaluaciones", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvals();
  }, [groupId]);

  // ─── Evaluation CRUD ───────────────────────────────────────────────────────

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm(groupId));
    setDialogOpen(true);
  };

  const openEdit = (item: EvaluationItem) => {
    setEditTarget(item);
    setForm({
      groupId: item.groupId,
      evaluationTypeId: item.evaluationType.id,
      name: item.name,
      weight: Number(item.weight),
      maxScore: Number(item.maxScore),
      dueDate: item.dueDate ? item.dueDate.slice(0, 10) : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, dueDate: form.dueDate || undefined };
      if (editTarget) {
        await evaluationsService.update(editTarget.id, payload);
        showToast("Evaluación actualizada");
      } else {
        await evaluationsService.create(payload);
        showToast("Evaluación creada");
      }
      setDialogOpen(false);
      loadEvals();
    } catch {
      showToast("Error al guardar evaluación", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await evaluationsService.delete(id);
      showToast("Evaluación eliminada");
      loadEvals();
    } catch {
      showToast("Error al eliminar evaluación", "error");
    }
  };

  // ─── Submissions viewer ────────────────────────────────────────────────────

  const openSubmissions = async (ev: EvaluationItem) => {
    setViewEval(ev);
    setViewLoading(true);
    setGradeScores({});
    try {
      const [students, subs, existingGrades] = await Promise.all([
        groupsService.getStudentsByGroup(groupId),
        studentSubmissionsService.getByEvaluation(ev.id),
        gradesService.getByEvaluation(ev.id),
      ]);
      setEnrolledStudents(
        (students as EnrolledStudent[]).sort((a, b) =>
          a.studentCode.localeCompare(b.studentCode),
        ),
      );
      setSubmissions(subs);

      // Pre-populate grade inputs with existing grades
      const scoreMap: Record<string, number | ""> = {};
      (existingGrades as GradeRow[]).forEach((g) => {
        scoreMap[g.student.id] = Number(g.score);
      });
      setGradeScores(scoreMap);
    } catch {
      showToast("Error al cargar entregas", "error");
    } finally {
      setViewLoading(false);
    }
  };

  const closeSubmissions = () => {
    setViewEval(null);
    setSubmissions([]);
    setEnrolledStudents([]);
    setGradeScores({});
  };

  const handleSaveGrades = async () => {
    if (!viewEval) return;
    setSavingGrades(true);
    try {
      const gradesToSave = Object.entries(gradeScores)
        .filter(([, v]) => v !== "")
        .map(([studentId, score]) => ({
          evaluationId: viewEval.id,
          studentId,
          score: Number(score),
        }));
      await gradesService.bulkUpsert(gradesToSave);
      showToast("Calificaciones guardadas");
    } catch {
      showToast("Error al guardar calificaciones", "error");
    } finally {
      setSavingGrades(false);
    }
  };

  const submissionByStudent = new Map(submissions.map((s) => [s.studentId, s]));

  // ─── Table columns ─────────────────────────────────────────────────────────

  const totalWeight = items.reduce((s, i) => s + Number(i.weight), 0);

  const columns: Column<EvaluationItem>[] = [
    { key: "name", label: "Nombre" },
    { key: "evaluationType", label: "Tipo", render: (r) => r.evaluationType?.name ?? "—" },
    { key: "weight", label: "Peso (%)", render: (r) => `${Number(r.weight)}%` },
    { key: "maxScore", label: "Puntaje Máx.", render: (r) => String(Number(r.maxScore)) },
    {
      key: "dueDate",
      label: "Fecha Límite",
      render: (r) =>
        r.dueDate ? new Date(r.dueDate).toLocaleDateString("es") : "—",
    },
    {
      key: "submissions",
      label: "Entregas",
      render: (r) => {
        const count = submissionCounts[r.id] ?? 0;
        return (
          <Chip
            label={count === 0 ? "Sin entregas" : `${count} entrega${count !== 1 ? "s" : ""}`}
            size="small"
            color={count === 0 ? "default" : "primary"}
            variant="outlined"
          />
        );
      },
    },
    {
      key: "actions",
      label: "Acciones",
      render: (r) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Ver entregas y calificar">
            <IconButton size="small" onClick={() => openSubmissions(r)}>
              <InboxIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => openEdit(r)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Box>
      <Box
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}
      >
        <Typography variant="body2" color="text.secondary">
          Peso total: <strong>{totalWeight.toFixed(1)}%</strong>
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          Nueva Evaluación
        </Button>
      </Box>

      <DataTable columns={columns} rows={items} loading={loading} getRowKey={(r) => r.id} />

      {!loading && items.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No hay evaluaciones creadas para este grupo.
        </Typography>
      )}

      {/* ── Create / Edit dialog ── */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editTarget ? "Editar Evaluación" : "Nueva Evaluación"}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <TextField
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            select
            label="Tipo de Evaluación"
            value={form.evaluationTypeId}
            onChange={(e) => setForm({ ...form, evaluationTypeId: e.target.value })}
            fullWidth
            margin="dense"
          >
            {evalTypes.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Peso (%)"
            type="number"
            value={form.weight}
            onChange={(e) =>
              setForm({ ...form, weight: Math.max(0, Number(e.target.value)) })
            }
            inputProps={{ min: 0, max: 100 }}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Puntaje Máximo"
            type="number"
            value={form.maxScore}
            onChange={(e) =>
              setForm({ ...form, maxScore: Math.max(1, Number(e.target.value)) })
            }
            inputProps={{ min: 1 }}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Fecha Límite"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.name || !form.evaluationTypeId}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Submissions viewer + grade entry dialog ── */}
      <Dialog
        open={!!viewEval}
        onClose={closeSubmissions}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { maxHeight: "85vh" } }}
      >
        <DialogTitle>
          <Box>
            <Typography variant="h6" component="div">
              Entregas — {viewEval?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {viewEval?.evaluationType?.name} · {Number(viewEval?.weight ?? 0)}% · Máx{" "}
              {Number(viewEval?.maxScore ?? 100)} pts ·{" "}
              {viewEval?.dueDate
                ? `Límite: ${new Date(viewEval.dueDate).toLocaleDateString("es")}`
                : "Sin fecha límite"}
            </Typography>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 0 }}>
          {viewLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : enrolledStudents.length === 0 ? (
            <Typography color="text.secondary" sx={{ p: 3 }}>
              No hay estudiantes inscritos en este grupo.
            </Typography>
          ) : (
            <>
              {/* Summary bar */}
              <Box
                sx={{ px: 3, py: 1.5, display: "flex", gap: 2, bgcolor: "action.hover" }}
              >
                <Chip
                  icon={<CheckCircleIcon />}
                  label={`${submissions.length} entregaron`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
                <Chip
                  icon={<PendingIcon />}
                  label={`${enrolledStudents.length - submissions.length} pendientes`}
                  size="small"
                  color={
                    enrolledStudents.length - submissions.length > 0 ? "warning" : "default"
                  }
                  variant="outlined"
                />
              </Box>
              <Divider />

              {/* Student rows */}
              {enrolledStudents.map((student) => {
                const sub = submissionByStudent.get(student.studentId);
                return (
                  <Box key={student.studentId}>
                    <Box sx={{ px: 3, py: 2 }}>
                      {/* Student header row */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 2,
                        }}
                      >
                        {/* Left: student info + submission */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              mb: sub ? 1 : 0,
                            }}
                          >
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {student.firstName} {student.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {student.studentCode}
                              </Typography>
                            </Box>
                            {sub ? (
                              <Chip
                                icon={<CheckCircleIcon />}
                                label="Entregado"
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            ) : (
                              <Chip
                                icon={<PendingIcon />}
                                label="Pendiente"
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            )}
                          </Box>

                          {/* Submission detail */}
                          {sub && (
                            <Box sx={{ pl: 0 }}>
                              <Box
                                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
                              >
                                {typeIcons[sub.type]}
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {sub.title}
                                </Typography>
                                <Chip
                                  label={typeLabels[sub.type]}
                                  size="small"
                                  variant="outlined"
                                  sx={{ ml: 0.5 }}
                                />
                              </Box>

                              {sub.type === "TEXT" ? (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ whiteSpace: "pre-wrap", pl: 3.5 }}
                                >
                                  {sub.content}
                                </Typography>
                              ) : (
                                <Box sx={{ pl: 3.5 }}>
                                  <a
                                    href={sub.content}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize: 13,
                                      color: "#1976d2",
                                      wordBreak: "break-all",
                                    }}
                                  >
                                    {sub.type === "FILE_REF" && sub.fileName
                                      ? sub.fileName
                                      : sub.content}
                                  </a>
                                  {sub.type === "FILE_REF" && sub.fileSize && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ ml: 1 }}
                                    >
                                      ({(sub.fileSize / 1024).toFixed(1)} KB)
                                    </Typography>
                                  )}
                                </Box>
                              )}

                              <Typography
                                variant="caption"
                                color="text.disabled"
                                sx={{ display: "block", mt: 0.5, pl: 3.5 }}
                              >
                                Enviado el{" "}
                                {new Date(sub.submittedAt).toLocaleDateString("es")}{" "}
                                {new Date(sub.submittedAt).toLocaleTimeString("es", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        {/* Right: grade input */}
                        <Box sx={{ flexShrink: 0, pt: 0.5 }}>
                          <TextField
                            label="Calificación"
                            type="number"
                            size="small"
                            value={gradeScores[student.studentId] ?? ""}
                            onChange={(e) =>
                              setGradeScores((prev) => ({
                                ...prev,
                                [student.studentId]:
                                  e.target.value === "" ? "" : Number(e.target.value),
                              }))
                            }
                            inputProps={{
                              min: 0,
                              max: Number(viewEval?.maxScore ?? 100),
                              step: 0.01,
                            }}
                            sx={{ width: 120 }}
                            helperText={`/ ${Number(viewEval?.maxScore ?? 100)}`}
                          />
                        </Box>
                      </Box>
                    </Box>
                    <Divider />
                  </Box>
                );
              })}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={closeSubmissions}>Cerrar</Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveGrades}
            disabled={savingGrades || viewLoading}
          >
            {savingGrades ? "Guardando…" : "Guardar Calificaciones"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
