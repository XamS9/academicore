import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
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
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { careersService } from "../../services/careers.service";
import { api } from "../../services/api";

interface CareerItem {
  id: string;
  name: string;
  code: string;
  totalSemesters: number;
  isActive: boolean;
}

interface CareerForm {
  name: string;
  code: string;
  totalSemesters: number;
}

export default function CareersPage() {
  const [items, setItems] = useState<CareerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CareerItem | null>(null);
  const [form, setForm] = useState<CareerForm>({
    name: "",
    code: "",
    totalSemesters: 1,
  });
  const { toast, showToast, clearToast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const data = await careersService.getAll();
      setItems(data);
    } catch {
      showToast("Error al cargar carreras", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: "", code: "", totalSemesters: 1 });
    setDialogOpen(true);
  };

  const openEdit = (item: CareerItem) => {
    setEditTarget(item);
    setForm({
      name: item.name,
      code: item.code,
      totalSemesters: item.totalSemesters,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editTarget) {
        await careersService.update(editTarget.id, form);
        showToast("Carrera actualizada exitosamente");
      } else {
        await careersService.create(form);
        showToast("Carrera creada exitosamente");
      }
      setDialogOpen(false);
      load();
    } catch {
      showToast("Error al guardar carrera", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Está seguro de eliminar esta carrera?")) return;
    try {
      await careersService.delete(id);
      showToast("Carrera eliminada exitosamente");
      load();
    } catch {
      showToast("Error al eliminar carrera", "error");
    }
  };

  const handleToggleActive = async (item: CareerItem) => {
    try {
      await api.patch(`/careers/${item.id}/toggle-active`);
      showToast(
        `Carrera ${item.isActive ? "desactivada" : "activada"} exitosamente`,
      );
      load();
    } catch {
      showToast("Error al cambiar estado de la carrera", "error");
    }
  };

  const columns: Column<CareerItem>[] = [
    {
      key: "code",
      label: "Código",
    },
    {
      key: "name",
      label: "Nombre",
    },
    {
      key: "totalSemesters",
      label: "Semestres",
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
            onClick={() => handleDelete(row.id)}
            title="Eliminar"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color={row.isActive ? "warning" : "success"}
            onClick={() => handleToggleActive(row)}
            title={row.isActive ? "Desactivar" : "Activar"}
          >
            <PowerSettingsNewIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5">Carreras</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          Nueva Carrera
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
          {editTarget ? "Editar Carrera" : "Nueva Carrera"}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <TextField
            label="Nombre de la carrera"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Código"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Total de semestres"
            type="number"
            value={form.totalSemesters}
            onChange={(e) =>
              setForm({
                ...form,
                totalSemesters: Math.max(1, parseInt(e.target.value, 10) || 1),
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

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
