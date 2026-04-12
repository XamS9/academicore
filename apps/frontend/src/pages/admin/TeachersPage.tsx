import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { teachersService } from "../../services/teachers.service";
import { usersService } from "../../services/users.service";
import {
  departmentsService,
  type Department,
} from "../../services/departments.service";

interface TeacherUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface TeacherItem {
  id: string;
  employeeCode: string;
  department: string;
  user: TeacherUser;
}

interface CreateForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface EditForm {
  firstName: string;
  lastName: string;
  email: string;
  employeeCode: string;
  department: string;
}

export default function TeachersPage() {
  const [items, setItems] = useState<TeacherItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeacherItem | null>(null);
  const [createForm, setCreateForm] = useState<CreateForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [editForm, setEditForm] = useState<EditForm>({
    firstName: "",
    lastName: "",
    email: "",
    employeeCode: "",
    department: "",
  });
  const { toast, showToast, clearToast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const data = await teachersService.getAll();
      setItems(data);
    } catch {
      showToast("Error al cargar docentes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    departmentsService.getAll().then(setDepartments).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setCreateForm({ firstName: "", lastName: "", email: "", password: "" });
    setDialogOpen(true);
  };

  const openEdit = (item: TeacherItem) => {
    setEditTarget(item);
    setEditForm({
      firstName: item.user.firstName,
      lastName: item.user.lastName,
      email: item.user.email,
      employeeCode: item.employeeCode,
      department: item.department ?? "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Está seguro de eliminar este docente?")) return;
    try {
      await teachersService.delete(id);
      showToast("Docente eliminado exitosamente");
      load();
    } catch {
      showToast("Error al eliminar docente", "error");
    }
  };

  const handleSave = async () => {
    try {
      if (editTarget) {
        await Promise.all([
          usersService.update(editTarget.user.id, {
            firstName: editForm.firstName,
            lastName: editForm.lastName,
            email: editForm.email,
          }),
          teachersService.update(editTarget.id, {
            employeeCode: editForm.employeeCode,
            department: editForm.department,
          }),
        ]);
        showToast("Docente actualizado exitosamente");
      } else {
        await usersService.create({ ...createForm, userType: "TEACHER" });
        showToast("Docente creado exitosamente");
      }
      setDialogOpen(false);
      load();
    } catch {
      showToast("Error al guardar docente", "error");
    }
  };

  const columns: Column<TeacherItem>[] = [
    {
      key: "employeeCode",
      label: "Código",
    },
    {
      key: "name",
      label: "Nombre",
      render: (row) => `${row.user.firstName} ${row.user.lastName}`,
    },
    {
      key: "email",
      label: "Email",
      render: (row) => row.user.email,
    },
    {
      key: "department",
      label: "Departamento",
      render: (row) => row.department ?? "—",
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
        </>
      ),
    },
  ];

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5">Docentes</Typography>
        <Button variant="contained" onClick={openCreate}>
          Nuevo Docente
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
          {editTarget ? "Editar Docente" : "Nuevo Docente"}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          {!editTarget ? (
            <>
              <TextField
                label="Nombre"
                value={createForm.firstName}
                onChange={(e) =>
                  setCreateForm({ ...createForm, firstName: e.target.value })
                }
                fullWidth
                margin="dense"
              />
              <TextField
                label="Apellido"
                value={createForm.lastName}
                onChange={(e) =>
                  setCreateForm({ ...createForm, lastName: e.target.value })
                }
                fullWidth
                margin="dense"
              />
              <TextField
                label="Correo electrónico"
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm({ ...createForm, email: e.target.value })
                }
                fullWidth
                margin="dense"
              />
              <TextField
                label="Contraseña"
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm({ ...createForm, password: e.target.value })
                }
                fullWidth
                margin="dense"
              />
              <TextField
                label="Tipo de usuario"
                value="Docente"
                disabled
                fullWidth
                margin="dense"
              />
            </>
          ) : (
            <>
              <TextField
                label="Nombre"
                value={editForm.firstName}
                onChange={(e) =>
                  setEditForm({ ...editForm, firstName: e.target.value })
                }
                fullWidth
                margin="dense"
              />
              <TextField
                label="Apellido"
                value={editForm.lastName}
                onChange={(e) =>
                  setEditForm({ ...editForm, lastName: e.target.value })
                }
                fullWidth
                margin="dense"
              />
              <TextField
                label="Correo electrónico"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
                fullWidth
                margin="dense"
              />
              <TextField
                label="Código de empleado"
                value={editForm.employeeCode}
                onChange={(e) =>
                  setEditForm({ ...editForm, employeeCode: e.target.value })
                }
                fullWidth
                margin="dense"
              />
              <TextField
                select
                label="Departamento"
                value={editForm.department}
                onChange={(e) =>
                  setEditForm({ ...editForm, department: e.target.value })
                }
                fullWidth
                margin="dense"
              >
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.name}>
                    {d.name}
                  </MenuItem>
                ))}
              </TextField>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            {editTarget ? "Guardar" : "Crear"}
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
