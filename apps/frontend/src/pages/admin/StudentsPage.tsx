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
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { studentsService } from "../../services/students.service";
import { usersService } from "../../services/users.service";

interface StudentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface StudentCareer {
  name: string;
}

interface StudentItem {
  id: string;
  studentCode: string;
  academicStatus: string;
  enrollmentDate: string;
  user: StudentUser;
  career: StudentCareer;
}

type AcademicStatus =
  | "ACTIVE"
  | "AT_RISK"
  | "SUSPENDED"
  | "GRADUATED"
  | "WITHDRAWN"
  | "ELIGIBLE_FOR_GRADUATION";

const ACADEMIC_STATUS_LABELS: Record<AcademicStatus, string> = {
  ACTIVE: "Activo",
  AT_RISK: "En riesgo",
  SUSPENDED: "Suspendido",
  GRADUATED: "Graduado",
  WITHDRAWN: "Retirado",
  ELIGIBLE_FOR_GRADUATION: "Elegible para graduación",
};

const ACADEMIC_STATUS_COLORS: Record<
  AcademicStatus,
  "success" | "warning" | "error" | "primary" | "default" | "secondary"
> = {
  ACTIVE: "success",
  AT_RISK: "warning",
  SUSPENDED: "error",
  GRADUATED: "primary",
  WITHDRAWN: "default",
  ELIGIBLE_FOR_GRADUATION: "secondary",
};

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
  academicStatus: AcademicStatus;
}

export default function StudentsPage() {
  const [items, setItems] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StudentItem | null>(null);
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
    academicStatus: "ACTIVE",
  });
  const { toast, showToast, clearToast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const data = await studentsService.getAll();
      setItems(data);
    } catch {
      showToast("Error al cargar estudiantes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setCreateForm({ firstName: "", lastName: "", email: "", password: "" });
    setDialogOpen(true);
  };

  const openEdit = (item: StudentItem) => {
    setEditTarget(item);
    setEditForm({
      firstName: item.user.firstName,
      lastName: item.user.lastName,
      email: item.user.email,
      academicStatus: item.academicStatus as AcademicStatus,
    });
    setDialogOpen(true);
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
          studentsService.update(editTarget.id, {
            academicStatus: editForm.academicStatus,
          }),
        ]);
        showToast("Estudiante actualizado exitosamente");
      } else {
        await usersService.create({ ...createForm, userType: "STUDENT" });
        showToast("Estudiante creado exitosamente");
      }
      setDialogOpen(false);
      load();
    } catch {
      showToast("Error al guardar estudiante", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Está seguro de eliminar este estudiante?")) return;
    try {
      await studentsService.delete(id);
      showToast("Estudiante eliminado exitosamente");
      load();
    } catch {
      showToast("Error al eliminar estudiante", "error");
    }
  };

  const columns: Column<StudentItem>[] = [
    {
      key: "studentCode",
      label: "Código",
    },
    {
      key: "name",
      label: "Nombre",
      render: (row) => `${row.user.firstName} ${row.user.lastName}`,
    },
    {
      key: "career",
      label: "Carrera",
      render: (row) => row.career?.name ?? "—",
    },
    {
      key: "academicStatus",
      label: "Estado",
      render: (row) => {
        const status = row.academicStatus as AcademicStatus;
        return (
          <Chip
            label={ACADEMIC_STATUS_LABELS[status] ?? row.academicStatus}
            color={ACADEMIC_STATUS_COLORS[status] ?? "default"}
            size="small"
          />
        );
      },
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
        <Typography variant="h5">Estudiantes</Typography>
        <Button variant="contained" onClick={openCreate}>
          Nuevo Estudiante
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
          {editTarget ? "Editar Estudiante" : "Nuevo Estudiante"}
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
                value="Estudiante"
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
                label="Código de estudiante"
                value={editTarget.studentCode}
                disabled
                fullWidth
                margin="dense"
                helperText="El código no puede modificarse"
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Estado académico</InputLabel>
                <Select
                  label="Estado académico"
                  value={editForm.academicStatus}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      academicStatus: e.target.value as AcademicStatus,
                    })
                  }
                >
                  {(
                    Object.keys(ACADEMIC_STATUS_LABELS) as AcademicStatus[]
                  ).map((key) => (
                    <MenuItem key={key} value={key}>
                      {ACADEMIC_STATUS_LABELS[key]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
