import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Navigate } from "react-router-dom";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../store/auth.context";
import {
  departmentsService,
  type Department,
} from "../../services/departments.service";
import { getApiErrorMessage } from "../../services/api";

export default function DepartmentsPage() {
  const { currentUser } = useAuth();
  const { toast, showToast, clearToast } = useToast();

  const [items, setItems] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setItems(await departmentsService.getAll());
    } catch {
      showToast("Error al cargar departamentos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (currentUser?.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  const openCreate = () => {
    setEditTarget(null);
    setName("");
    setDialogOpen(true);
  };

  const openEdit = (item: Department) => {
    setEditTarget(item);
    setName(item.name);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const n = name.trim();
    if (!n) {
      showToast("El nombre es obligatorio", "error");
      return;
    }
    try {
      if (editTarget) {
        await departmentsService.update(editTarget.id, { name: n });
        showToast("Departamento actualizado");
      } else {
        await departmentsService.create({ name: n });
        showToast("Departamento creado");
      }
      setDialogOpen(false);
      await load();
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Error al guardar"), "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await departmentsService.remove(deleteTarget.id);
      showToast("Departamento eliminado");
      setDeleteTarget(null);
      await load();
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "No se pudo eliminar"), "error");
    }
  };

  const columns: Column<Department>[] = [
    { key: "name", label: "Nombre" },
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
        <Typography variant="h5">Departamentos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nuevo Departamento
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Los departamentos aparecen al asignar docentes en Usuarios. Si elimina un
        departamento que aún tiene docentes asociados, deberá reasignarlos antes.
      </Typography>

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
          {editTarget ? "Editar departamento" : "Nuevo departamento"}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-2 pt-2">
          <TextField
            autoFocus
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
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

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Eliminar departamento</DialogTitle>
        <DialogContent>
          ¿Eliminar{" "}
          <strong>{deleteTarget?.name}</strong>? Esta acción no se puede deshacer.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
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
