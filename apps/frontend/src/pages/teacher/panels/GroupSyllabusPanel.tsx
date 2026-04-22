import { useEffect, useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import NumericTextField from "../../../components/ui/NumericTextField";
import LinearProgress from "@mui/material/LinearProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import UndoIcon from "@mui/icons-material/Undo";
import { useToast } from "../../../hooks/useToast";
import { getApiErrorMessage } from "../../../services/api";
import {
  syllabusService,
  TopicWithProgress,
} from "../../../services/syllabus.service";

interface Props {
  groupId: string;
}

export default function GroupSyllabusPanel({ groupId }: Props) {
  const [topics, setTopics] = useState<TopicWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, clearToast } = useToast();

  // Mark-progress dialog
  const [markTarget, setMarkTarget] = useState<TopicWithProgress | null>(null);
  const [weekNumber, setWeekNumber] = useState(1);
  const [coveredAt, setCoveredAt] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await syllabusService.getGroupProgress(groupId);
      setTopics(data);
    } catch {
      showToast("Error al cargar temario", "error");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  const covered = topics.filter((t) => t.progress !== null).length;
  const total = topics.length;
  const pct = total > 0 ? Math.round((covered / total) * 100) : 0;

  const openMark = (t: TopicWithProgress) => {
    setMarkTarget(t);
    if (t.progress) {
      setWeekNumber(t.progress.weekNumber);
      setCoveredAt(t.progress.coveredAt.slice(0, 10));
      setNotes(t.progress.notes ?? "");
    } else {
      setWeekNumber(covered + 1);
      setCoveredAt(new Date().toISOString().slice(0, 10));
      setNotes("");
    }
  };

  const handleMark = async () => {
    if (!markTarget) return;
    try {
      await syllabusService.markProgress(groupId, {
        topicId: markTarget.id,
        weekNumber,
        coveredAt: new Date(coveredAt).toISOString(),
        notes: notes.trim() || null,
      });
      showToast("Progreso registrado");
      setMarkTarget(null);
      load();
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Error al registrar progreso"), "error");
    }
  };

  const handleUndo = async (topicId: string) => {
    try {
      await syllabusService.removeProgress(groupId, topicId);
      showToast("Progreso eliminado");
      load();
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Error al eliminar progreso"), "error");
    }
  };

  if (loading) {
    return <Typography color="text.secondary">Cargando temario...</Typography>;
  }

  if (total === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography color="text.secondary">
          No hay temario definido para esta materia. El administrador puede
          configurarlo desde la sección de Materias.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Progress bar */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="subtitle2">
            Progreso del temario
          </Typography>
          <Chip
            label={`${covered}/${total} (${pct}%)`}
            size="small"
            color={pct === 100 ? "success" : "primary"}
            variant="outlined"
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      <List>
        {topics.map((t, idx) => {
          const done = !!t.progress;
          return (
            <ListItem
              key={t.id}
              secondaryAction={
                done ? (
                  <IconButton
                    size="small"
                    title="Desmarcar"
                    onClick={() => handleUndo(t.id)}
                  >
                    <UndoIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => openMark(t)}
                  >
                    Marcar como visto
                  </Button>
                )
              }
              sx={{
                bgcolor: done ? "action.hover" : "transparent",
                borderRadius: 1,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {done ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <RadioButtonUncheckedIcon color="disabled" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: done ? 600 : 400 }}
                    >
                      {idx + 1}. {t.title}
                    </Typography>
                    {done && t.progress && (
                      <Chip
                        label={`Sem. ${t.progress.weekNumber} · ${new Date(t.progress.coveredAt).toLocaleDateString("es-MX")}`}
                        size="small"
                        variant="outlined"
                        color="success"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <>
                    {t.description && (
                      <Typography variant="caption" color="text.secondary">
                        {t.description}
                      </Typography>
                    )}
                    {done && t.progress?.notes && (
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 0.5, fontStyle: "italic" }}
                      >
                        {t.progress.notes}
                      </Typography>
                    )}
                  </>
                }
              />
            </ListItem>
          );
        })}
      </List>

      {/* Mark progress dialog */}
      <Dialog
        open={!!markTarget}
        onClose={() => setMarkTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Registrar progreso — {markTarget?.title}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <NumericTextField
            label="Semana"
            value={weekNumber}
            onValueChange={(n) => setWeekNumber(Math.max(1, Math.min(52, n)))}
            min={1}
            max={52}
            integer
            inputProps={{ min: 1, max: 52 }}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Fecha"
            type="date"
            value={coveredAt}
            onChange={(e) => setCoveredAt(e.target.value)}
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Notas (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMarkTarget(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleMark}>
            Guardar
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
