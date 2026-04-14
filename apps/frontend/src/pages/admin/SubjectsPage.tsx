import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../services/api";
import { subjectsService } from "../../services/subjects.service";

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  credits: number;
  isActive: boolean;
}

interface SubjectForm {
  name: string;
  code: string;
  credits: number;
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
  });
  const [codeUserEdited, setCodeUserEdited] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SubjectItem | null>(null);
  const { toast, showToast, clearToast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const data = await subjectsService.getAll();
      setItems(data);
    } catch {
      showToast("Error al cargar materias", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
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
    setForm({ name: "", code: "", credits: 1 });
    setDialogOpen(true);
  };

  const openEdit = (item: SubjectItem) => {
    setEditTarget(item);
    setForm({ name: item.name, code: item.code, credits: item.credits });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editTarget) {
        await subjectsService.update(editTarget.id, form);
        showToast("Materia actualizada exitosamente");
      } else {
        const trimmedCode = form.code.trim();
        await subjectsService.create({
          name: form.name,
          credits: form.credits,
          ...(trimmedCode.length > 0 ? { code: trimmedCode } : {}),
        });
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

  const columns: Column<SubjectItem>[] = [
    {
      key: "code",
      label: "Código",
    },
    {
      key: "name",
      label: "Nombre",
    },
    {
      key: "credits",
      label: "Créditos",
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
          <TextField
            label="Créditos"
            type="number"
            value={form.credits}
            onChange={(e) =>
              setForm({
                ...form,
                credits: Math.max(1, parseInt(e.target.value, 10) || 1),
              })
            }
            inputProps={{ min: 1 }}
            fullWidth
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

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

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
