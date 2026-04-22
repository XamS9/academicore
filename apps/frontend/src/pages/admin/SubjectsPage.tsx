import { useEffect, useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import NumericTextField from "../../components/ui/NumericTextField";
import Typography from "@mui/material/Typography";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Autocomplete from "@mui/material/Autocomplete";
import Tooltip from "@mui/material/Tooltip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../services/api";
import { subjectsService } from "../../services/subjects.service";
import { systemSettingsService } from "../../services/system-settings.service";
import {
  syllabusService,
  SyllabusTopic,
} from "../../services/syllabus.service";

interface PrereqInfo {
  id: string;
  name: string;
  code: string;
}

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  credits: number;
  tuitionAmount: number | null;
  isActive: boolean;
  prerequisites: {
    prerequisiteId: string;
    prerequisite: PrereqInfo;
  }[];
}

interface SubjectForm {
  name: string;
  code: string;
  credits: number;
  tuitionAmount: string;
  prerequisiteIds: string[];
}

export default function SubjectsPage() {
  const [items, setItems] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SubjectItem | null>(null);
  const [form, setForm] = useState<SubjectForm>({
    name: "",
    code: "",
    credits: 1,
    tuitionAmount: "",
    prerequisiteIds: [],
  });
  const [codeUserEdited, setCodeUserEdited] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SubjectItem | null>(null);
  const { toast, showToast, clearToast } = useToast();

  // Syllabus dialog
  const [syllabusSubject, setSyllabusSubject] = useState<SubjectItem | null>(
    null,
  );
  const [syllabusTopics, setSyllabusTopics] = useState<SyllabusTopic[]>([]);
  const [syllabusLoading, setSyllabusLoading] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [maxCreditsPerSubject, setMaxCreditsPerSubject] = useState(24);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await subjectsService.getAll();
      setItems(data);
    } catch {
      showToast("Error al cargar materias", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    systemSettingsService
      .get()
      .then((data: { maxCreditsPerSubject?: number }) =>
        setMaxCreditsPerSubject(
          Math.max(1, Math.min(99, Number(data.maxCreditsPerSubject ?? 24))),
        ),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (editTarget || !dialogOpen || codeUserEdited) return;
    const n = form.name.trim();
    if (n.length < 2) return;
    const h = setTimeout(() => {
      subjectsService
        .suggestCode(n)
        .then(({ code }) => setForm((f) => ({ ...f, code })))
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(h);
  }, [form.name, dialogOpen, editTarget, codeUserEdited]);

  const refreshSubjectCodeSuggestion = async () => {
    const n = form.name.trim();
    if (n.length < 2) {
      showToast("Escriba al menos 2 caracteres en el nombre", "error");
      return;
    }
    try {
      const { code } = await subjectsService.suggestCode(n);
      setForm((f) => ({ ...f, code }));
      setCodeUserEdited(false);
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Error al sugerir código"), "error");
    }
  };

  const openCreate = () => {
    setEditTarget(null);
    setCodeUserEdited(false);
    setForm({
      name: "",
      code: "",
      credits: 1,
      tuitionAmount: "",
      prerequisiteIds: [],
    });
    setDialogOpen(true);
  };

  const openEdit = (item: SubjectItem) => {
    setEditTarget(item);
    setForm({
      name: item.name,
      code: item.code,
      credits: item.credits,
      tuitionAmount: item.tuitionAmount != null ? String(item.tuitionAmount) : "",
      prerequisiteIds: item.prerequisites.map((p) => p.prerequisiteId),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        credits: form.credits,
        prerequisiteIds: form.prerequisiteIds,
        tuitionAmount:
          form.tuitionAmount.trim() === ""
            ? null
            : parseFloat(form.tuitionAmount),
      };
      if (editTarget) {
        await subjectsService.update(editTarget.id, payload);
        showToast("Materia actualizada exitosamente");
      } else {
        const trimmedCode = form.code.trim();
        if (trimmedCode.length > 0) payload.code = trimmedCode;
        await subjectsService.create(payload);
        showToast("Materia creada exitosamente");
      }
      setDialogOpen(false);
      load();
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Error al guardar materia"), "error");
    }
  };

  const confirmDeleteSubject = async () => {
    if (!deleteTarget) return;
    try {
      await subjectsService.delete(deleteTarget.id);
      showToast("Materia eliminada exitosamente");
      setDeleteTarget(null);
      load();
    } catch {
      showToast("Error al eliminar materia", "error");
    }
  };

  // Prerequisite options: exclude self and already-selected
  const prereqOptions = items.filter(
    (s) => s.isActive && (!editTarget || s.id !== editTarget.id),
  );
  const selectedPrereqItems = prereqOptions.filter((s) =>
    form.prerequisiteIds.includes(s.id),
  );

  // ──── Syllabus management ────
  const openSyllabus = async (item: SubjectItem) => {
    setSyllabusSubject(item);
    setSyllabusLoading(true);
    try {
      const topics = await syllabusService.listBySubject(item.id);
      setSyllabusTopics(topics);
    } catch {
      showToast("Error al cargar temario", "error");
    } finally {
      setSyllabusLoading(false);
    }
  };

  const addTopic = async () => {
    if (!syllabusSubject || !newTopicTitle.trim()) return;
    try {
      const topic = await syllabusService.createTopic(syllabusSubject.id, {
        title: newTopicTitle.trim(),
        description: newTopicDesc.trim() || null,
      });
      setSyllabusTopics((prev) => [...prev, topic]);
      setNewTopicTitle("");
      setNewTopicDesc("");
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Error al agregar tema"), "error");
    }
  };

  const removeTopic = async (topicId: string) => {
    try {
      await syllabusService.deleteTopic(topicId);
      setSyllabusTopics((prev) => prev.filter((t) => t.id !== topicId));
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Error al eliminar tema"), "error");
    }
  };

  const moveTopic = async (idx: number, dir: "up" | "down") => {
    const newTopics = [...syllabusTopics];
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newTopics.length) return;
    [newTopics[idx], newTopics[swapIdx]] = [newTopics[swapIdx], newTopics[idx]];
    setSyllabusTopics(newTopics);
    try {
      await syllabusService.reorderTopics(
        syllabusSubject!.id,
        newTopics.map((t) => t.id),
      );
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Error al reordenar"), "error");
      const topics = await syllabusService.listBySubject(syllabusSubject!.id);
      setSyllabusTopics(topics);
    }
  };

  const columns: Column<SubjectItem>[] = [
    { key: "code", label: "Código" },
    { key: "name", label: "Nombre" },
    { key: "credits", label: "Créditos" },
    {
      key: "prerequisites",
      label: "Prerrequisitos",
      render: (row) =>
        row.prerequisites.length > 0 ? (
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {row.prerequisites.map((p) => (
              <Chip
                key={p.prerequisiteId}
                label={p.prerequisite.code}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Ninguno
          </Typography>
        ),
    },
    {
      key: "isActive",
      label: "Estado",
      render: (row) => (
        <Chip
          label={row.isActive ? "Activo" : "Inactivo"}
          color={row.isActive ? "success" : "default"}
          size="small"
        />
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => (
        <>
          <Tooltip title="Temario">
            <span>
              <IconButton
                size="small"
                color="primary"
                onClick={() => openSyllabus(row)}
              >
                <MenuBookIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <IconButton size="small" onClick={() => openEdit(row)} title="Editar">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => setDeleteTarget(row)}
            title="Eliminar"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5">Materias</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          Nueva Materia
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        getRowKey={(r) => r.id}
      />

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editTarget ? "Editar Materia" : "Nueva Materia"}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <TextField
            label="Nombre de la materia"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
            margin="dense"
          />
          <Box>
            <TextField
              label="Código"
              value={form.code}
              onChange={(e) => {
                setCodeUserEdited(true);
                setForm({ ...form, code: e.target.value });
              }}
              fullWidth
              margin="dense"
              disabled={!!editTarget}
              helperText={
                editTarget
                  ? "El código no se puede cambiar desde aquí."
                  : "Sugerencia automática según el nombre (puede editarla). Vacío al guardar = el servidor asigna uno."
              }
            />
            {!editTarget && (
              <Button
                size="small"
                variant="text"
                onClick={refreshSubjectCodeSuggestion}
                sx={{ mt: 0.5 }}
              >
                Actualizar sugerencia de código
              </Button>
            )}
          </Box>
          <NumericTextField
            label="Créditos"
            value={form.credits}
            onValueChange={(credits) =>
              setForm({
                ...form,
                credits: Math.min(maxCreditsPerSubject, Math.max(1, credits)),
              })
            }
            min={1}
            max={maxCreditsPerSubject}
            integer
            inputProps={{ min: 1, max: maxCreditsPerSubject, step: 1 }}
            helperText={`Entre 1 y ${maxCreditsPerSubject} (Configuración → Máx. créditos por materia)`}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Monto por tutoría (opcional)"
            placeholder="Monto por tutoría"
            type="text"
            inputMode="decimal"
            value={form.tuitionAmount}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || /^\d*\.?\d*$/.test(v)) {
                setForm({ ...form, tuitionAmount: v });
              }
            }}
            fullWidth
            margin="dense"
            helperText="Vacío = se usa créditos × tarifa global de crédito"
            inputProps={{ min: 0, step: "0.01" }}
          />
          <Autocomplete
            multiple
            options={prereqOptions}
            value={selectedPrereqItems}
            onChange={(_e, val) =>
              setForm({ ...form, prerequisiteIds: val.map((v) => v.id) })
            }
            getOptionLabel={(opt) => `${opt.code} — ${opt.name}`}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            renderInput={(params) => (
              <TextField {...params} label="Prerrequisitos" margin="dense" />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.code}
                  size="small"
                  {...getTagProps({ index })}
                  key={option.id}
                />
              ))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Eliminar materia</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de eliminar la materia{" "}
            <strong>
              {deleteTarget?.code} — {deleteTarget?.name}
            </strong>
            ? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDeleteSubject}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Syllabus topics dialog */}
      <Dialog
        open={!!syllabusSubject}
        onClose={() => setSyllabusSubject(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Temario — {syllabusSubject?.code} {syllabusSubject?.name}
        </DialogTitle>
        <DialogContent>
          {syllabusLoading ? (
            <Typography>Cargando...</Typography>
          ) : (
            <>
              <List dense>
                {syllabusTopics.map((t, idx) => (
                  <ListItem
                    key={t.id}
                    secondaryAction={
                      <Box>
                        <IconButton
                          size="small"
                          disabled={idx === 0}
                          onClick={() => moveTopic(idx, "up")}
                        >
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={idx === syllabusTopics.length - 1}
                          onClick={() => moveTopic(idx, "down")}
                        >
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeTopic(t.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={`${idx + 1}. ${t.title}`}
                      secondary={t.description}
                    />
                  </ListItem>
                ))}
                {syllabusTopics.length === 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 2, textAlign: "center" }}
                  >
                    Sin temas definidos
                  </Typography>
                )}
              </List>
              <Box sx={{ display: "flex", gap: 1, mt: 2, flexDirection: "column" }}>
                <TextField
                  size="small"
                  label="Título del tema"
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  fullWidth
                />
                <TextField
                  size="small"
                  label="Descripción (opcional)"
                  value={newTopicDesc}
                  onChange={(e) => setNewTopicDesc(e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addTopic}
                  disabled={!newTopicTitle.trim()}
                >
                  Agregar tema
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyllabusSubject(null)}>Cerrar</Button>
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
