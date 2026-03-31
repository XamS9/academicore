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
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../store/auth.context";
import { groupsService } from "../../services/groups.service";
import { evaluationsService } from "../../services/evaluations.service";
import { evaluationTypesService } from "../../services/evaluation-types.service";
import { teachersService } from "../../services/teachers.service";

interface EvalType {
  id: string;
  name: string;
}

interface GroupOption {
  id: string;
  groupCode: string;
  subject: { name: string; code: string };
  academicPeriod: { name: string };
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

const emptyForm: EvalForm = {
  groupId: "",
  evaluationTypeId: "",
  name: "",
  weight: 0,
  maxScore: 100,
  dueDate: "",
};

export default function EvaluationsPage() {
  const { currentUser } = useAuth();
  const isTeacher = currentUser?.role === "TEACHER";

  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [evalTypes, setEvalTypes] = useState<EvalType[]>([]);
  const [items, setItems] = useState<EvaluationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EvaluationItem | null>(null);
  const [form, setForm] = useState<EvalForm>(emptyForm);
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [types, groupList] = await Promise.all([
          evaluationTypesService.getAll(),
          isTeacher
            ? teachersService
                .getByUserId(currentUser!.id)
                .then((t: { id: string }) => groupsService.getByTeacher(t.id))
            : groupsService.getAll(),
        ]);
        setEvalTypes(types);
        setGroups(groupList);
      } catch {
        showToast("Error al cargar datos iniciales", "error");
      }
    };
    loadInitial();
  }, []);

  useEffect(() => {
    if (!selectedGroup) {
      setItems([]);
      return;
    }
    const loadEvals = async () => {
      try {
        setLoading(true);
        const data = await evaluationsService.getByGroup(selectedGroup);
        setItems(data);
      } catch {
        showToast("Error al cargar evaluaciones", "error");
      } finally {
        setLoading(false);
      }
    };
    loadEvals();
  }, [selectedGroup]);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...emptyForm, groupId: selectedGroup });
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
      const payload = {
        ...form,
        dueDate: form.dueDate || undefined,
      };
      if (editTarget) {
        await evaluationsService.update(editTarget.id, payload);
        showToast("Evaluación actualizada");
      } else {
        await evaluationsService.create(payload);
        showToast("Evaluación creada");
      }
      setDialogOpen(false);
      const data = await evaluationsService.getByGroup(selectedGroup);
      setItems(data);
    } catch {
      showToast("Error al guardar evaluación", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await evaluationsService.delete(id);
      showToast("Evaluación eliminada");
      const data = await evaluationsService.getByGroup(selectedGroup);
      setItems(data);
    } catch {
      showToast("Error al eliminar evaluación", "error");
    }
  };

  const columns: Column<EvaluationItem>[] = [
    { key: "name", label: "Nombre" },
    {
      key: "evaluationType",
      label: "Tipo",
      render: (row) => row.evaluationType?.name ?? "—",
    },
    {
      key: "weight",
      label: "Peso (%)",
      render: (row) => `${Number(row.weight)}%`,
    },
    {
      key: "maxScore",
      label: "Puntaje Máx.",
      render: (row) => String(Number(row.maxScore)),
    },
    {
      key: "dueDate",
      label: "Fecha Límite",
      render: (row) =>
        row.dueDate ? new Date(row.dueDate).toLocaleDateString("es") : "—",
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
            onClick={() => handleDelete(row.id)}
            title="Eliminar"
            color="error"
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
        <Typography variant="h5">Evaluaciones</Typography>
        <Button
          variant="contained"
          onClick={openCreate}
          disabled={!selectedGroup}
        >
          Nueva Evaluación
        </Button>
      </Box>

      <TextField
        select
        label="Seleccionar Grupo"
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
          {editTarget ? "Editar Evaluación" : "Nueva Evaluación"}
        </DialogTitle>
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
            onChange={(e) =>
              setForm({ ...form, evaluationTypeId: e.target.value })
            }
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
              setForm({
                ...form,
                maxScore: Math.max(1, Number(e.target.value)),
              })
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
          <Button variant="contained" onClick={handleSave}>
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
