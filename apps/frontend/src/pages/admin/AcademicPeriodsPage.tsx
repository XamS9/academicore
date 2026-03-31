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
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { academicPeriodsService } from "../../services/academic-periods.service";
import { api } from "../../services/api";

interface AcademicPeriodItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  enrollmentOpen: boolean;
  isActive: boolean;
}

interface AcademicPeriodForm {
  name: string;
  startDate: string;
  endDate: string;
  enrollmentOpen: boolean;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export default function AcademicPeriodsPage() {
  const [items, setItems] = useState<AcademicPeriodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AcademicPeriodItem | null>(null);
  const [form, setForm] = useState<AcademicPeriodForm>({
    name: "",
    startDate: "",
    endDate: "",
    enrollmentOpen: false,
  });
  const { toast, showToast, clearToast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const data = await academicPeriodsService.getAll();
      setItems(data);
    } catch {
      showToast("Error al cargar períodos académicos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: "", startDate: "", endDate: "", enrollmentOpen: false });
    setDialogOpen(true);
  };

  const openEdit = (item: AcademicPeriodItem) => {
    setEditTarget(item);
    setForm({
      name: item.name,
      startDate: item.startDate ? item.startDate.split("T")[0] : "",
      endDate: item.endDate ? item.endDate.split("T")[0] : "",
      enrollmentOpen: item.enrollmentOpen,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editTarget) {
        await academicPeriodsService.update(editTarget.id, form);
        showToast("Período académico actualizado exitosamente");
      } else {
        await academicPeriodsService.create(form);
        showToast("Período académico creado exitosamente");
      }
      setDialogOpen(false);
      load();
    } catch {
      showToast("Error al guardar período académico", "error");
    }
  };

  const handleToggleEnrollment = async (item: AcademicPeriodItem) => {
    try {
      await api.patch(`/academic-periods/${item.id}/toggle-enrollment`);
      showToast(
        `Inscripciones ${item.enrollmentOpen ? "cerradas" : "abiertas"} exitosamente`,
      );
      load();
    } catch {
      showToast("Error al cambiar estado de inscripciones", "error");
    }
  };

  const columns: Column<AcademicPeriodItem>[] = [
    {
      key: "name",
      label: "Nombre",
    },
    {
      key: "startDate",
      label: "Inicio",
      render: (row) => formatDate(row.startDate),
    },
    {
      key: "endDate",
      label: "Fin",
      render: (row) => formatDate(row.endDate),
    },
    {
      key: "enrollmentOpen",
      label: "Inscripciones",
      render: (row) => (
        <Chip
          label={row.enrollmentOpen ? "Abierta" : "Cerrada"}
          color={row.enrollmentOpen ? "success" : "default"}
          size="small"
        />
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
          <IconButton size="small" onClick={() => openEdit(row)} title="Editar">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color={row.enrollmentOpen ? "warning" : "success"}
            onClick={() => handleToggleEnrollment(row)}
            title={
              row.enrollmentOpen
                ? "Cerrar inscripciones"
                : "Abrir inscripciones"
            }
          >
            <EventAvailableIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5">Períodos Académicos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          Nuevo Período
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
          {editTarget ? "Editar Período Académico" : "Nuevo Período Académico"}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <TextField
            label="Nombre del período"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Fecha de inicio"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Fecha de fin"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.enrollmentOpen}
                onChange={(e) =>
                  setForm({ ...form, enrollmentOpen: e.target.checked })
                }
              />
            }
            label="Inscripciones abiertas"
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
