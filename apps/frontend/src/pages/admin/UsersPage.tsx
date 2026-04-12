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
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import EditIcon from "@mui/icons-material/Edit";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { usersService } from "../../services/users.service";
import { studentsService } from "../../services/students.service";
import { teachersService } from "../../services/teachers.service";
import {
  departmentsService,
  type Department,
} from "../../services/departments.service";
import { careersService } from "../../services/careers.service";
import { api } from "../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type RoleFilter = "ALL" | "ADMIN" | "TEACHER" | "STUDENT";

interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: "ADMIN" | "TEACHER" | "STUDENT";
  isActive: boolean;
}

interface StudentItem {
  id: string;
  studentCode: string;
  careerId: string;
  academicStatus: string;
  enrollmentDate: string;
  user: { id: string; firstName: string; lastName: string; email: string; isActive: boolean };
  career: { id: string; name: string } | null;
}

interface TeacherItem {
  id: string;
  employeeCode: string;
  department: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}

// ─── Static maps ─────────────────────────────────────────────────────────────

const USER_TYPE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  TEACHER: "Docente",
  STUDENT: "Estudiante",
};

const USER_TYPE_COLORS: Record<string, "primary" | "success" | "warning"> = {
  ADMIN: "primary",
  TEACHER: "success",
  STUDENT: "warning",
};

type AcademicStatus =
  | "PENDING"
  | "ACTIVE"
  | "AT_RISK"
  | "SUSPENDED"
  | "GRADUATED"
  | "WITHDRAWN"
  | "ELIGIBLE_FOR_GRADUATION";

const ACADEMIC_STATUS_LABELS: Record<AcademicStatus, string> = {
  PENDING: "Pendiente",
  ACTIVE: "Activo",
  AT_RISK: "En riesgo",
  SUSPENDED: "Suspendido",
  GRADUATED: "Graduado",
  WITHDRAWN: "Retirado",
  ELIGIBLE_FOR_GRADUATION: "Elegible para graduación",
};

const ACADEMIC_STATUS_COLORS: Record<
  AcademicStatus,
  "success" | "warning" | "error" | "primary" | "default" | "secondary" | "info"
> = {
  PENDING: "info",
  ACTIVE: "success",
  AT_RISK: "warning",
  SUSPENDED: "error",
  GRADUATED: "primary",
  WITHDRAWN: "default",
  ELIGIBLE_FOR_GRADUATION: "secondary",
};

// ─── Form shapes ──────────────────────────────────────────────────────────────

interface CreateForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: "ADMIN" | "TEACHER" | "STUDENT";
}

interface StudentEditForm {
  firstName: string;
  lastName: string;
  email: string;
  academicStatus: AcademicStatus;
  careerId: string;
  careerLocked: boolean;
}

interface TeacherEditForm {
  firstName: string;
  lastName: string;
  email: string;
  employeeCode: string;
  department: string;
}

interface GenericEditForm {
  firstName: string;
  lastName: string;
  email: string;
  userType: "ADMIN" | "TEACHER" | "STUDENT";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { toast, showToast, clearToast } = useToast();

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");

  // Data per view
  const [users, setUsers] = useState<UserItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [careers, setCareers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state — null = create mode, non-null = edit mode
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStudentTarget, setEditStudentTarget] = useState<StudentItem | null>(null);
  const [editTeacherTarget, setEditTeacherTarget] = useState<TeacherItem | null>(null);
  const [editUserTarget, setEditUserTarget] = useState<UserItem | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState<CreateForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    userType: "STUDENT",
  });
  const [studentEditForm, setStudentEditForm] = useState<StudentEditForm>({
    firstName: "",
    lastName: "",
    email: "",
    academicStatus: "ACTIVE",
    careerId: "",
    careerLocked: true,
  });
  const [teacherEditForm, setTeacherEditForm] = useState<TeacherEditForm>({
    firstName: "",
    lastName: "",
    email: "",
    employeeCode: "",
    department: "",
  });
  const [genericEditForm, setGenericEditForm] = useState<GenericEditForm>({
    firstName: "",
    lastName: "",
    email: "",
    userType: "ADMIN",
  });

  // ─── Loaders ───────────────────────────────────────────────────────────────

  const loadUsers = async () => {
    setLoading(true);
    try {
      setUsers(await usersService.getAll());
    } catch {
      showToast("Error al cargar usuarios", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      setStudents(await studentsService.getAll());
    } catch {
      showToast("Error al cargar estudiantes", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    setLoading(true);
    try {
      setTeachers(await teachersService.getAll());
    } catch {
      showToast("Error al cargar docentes", "error");
    } finally {
      setLoading(false);
    }
  };

  const reloadCurrent = () => {
    if (roleFilter === "STUDENT") loadStudents();
    else if (roleFilter === "TEACHER") loadTeachers();
    else loadUsers();
  };

  useEffect(() => {
    reloadCurrent();
  }, [roleFilter]);

  useEffect(() => {
    departmentsService.getAll().then(setDepartments).catch(() => {});
    careersService.getAll().then(setCareers).catch(() => {});
  }, []);

  // ─── Derived rows ──────────────────────────────────────────────────────────

  const filteredUsers =
    roleFilter === "ADMIN"
      ? users.filter((u) => u.userType === "ADMIN")
      : users;

  // ─── Dialog openers ────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditUserTarget(null);
    setEditStudentTarget(null);
    setEditTeacherTarget(null);
    setCreateForm({ firstName: "", lastName: "", email: "", password: "", userType: "STUDENT" });
    setDialogOpen(true);
  };

  const openEditUser = (item: UserItem) => {
    setEditStudentTarget(null);
    setEditTeacherTarget(null);
    setEditUserTarget(item);
    setGenericEditForm({
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.email,
      userType: item.userType,
    });
    setDialogOpen(true);
  };

  const openEditStudent = (item: StudentItem) => {
    setEditUserTarget(null);
    setEditTeacherTarget(null);
    setEditStudentTarget(item);
    setStudentEditForm({
      firstName: item.user.firstName,
      lastName: item.user.lastName,
      email: item.user.email,
      academicStatus: item.academicStatus as AcademicStatus,
      careerId: item.careerId,
      careerLocked: true,
    });
    setDialogOpen(true);
  };

  const openEditTeacher = (item: TeacherItem) => {
    setEditUserTarget(null);
    setEditStudentTarget(null);
    setEditTeacherTarget(item);
    setTeacherEditForm({
      firstName: item.user.firstName,
      lastName: item.user.lastName,
      email: item.user.email,
      employeeCode: item.employeeCode,
      department: item.department ?? "",
    });
    setDialogOpen(true);
  };

  // ─── Save handler ──────────────────────────────────────────────────────────

  const isEditing = editUserTarget !== null || editStudentTarget !== null || editTeacherTarget !== null;

  const handleSave = async () => {
    try {
      if (!isEditing) {
        // ── Create: always use the unified form's userType ──
        await usersService.create(createForm);
        showToast("Usuario creado exitosamente");
        // Refresh whichever table matches the new user's role
        if (createForm.userType === "STUDENT") loadStudents();
        else if (createForm.userType === "TEACHER") loadTeachers();
        else loadUsers();
      } else if (editStudentTarget) {
        await Promise.all([
          usersService.update(editStudentTarget.user.id, {
            firstName: studentEditForm.firstName,
            lastName: studentEditForm.lastName,
            email: studentEditForm.email,
          }),
          studentsService.update(editStudentTarget.id, {
            academicStatus: studentEditForm.academicStatus,
            careerId: studentEditForm.careerId,
          }),
        ]);
        showToast("Estudiante actualizado exitosamente");
        reloadCurrent();
      } else if (editTeacherTarget) {
        await Promise.all([
          usersService.update(editTeacherTarget.user.id, {
            firstName: teacherEditForm.firstName,
            lastName: teacherEditForm.lastName,
            email: teacherEditForm.email,
          }),
          teachersService.update(editTeacherTarget.id, {
            employeeCode: teacherEditForm.employeeCode,
            department: teacherEditForm.department,
          }),
        ]);
        showToast("Docente actualizado exitosamente");
        reloadCurrent();
      } else if (editUserTarget) {
        await usersService.update(editUserTarget.id, {
          firstName: genericEditForm.firstName,
          lastName: genericEditForm.lastName,
          email: genericEditForm.email,
          userType: genericEditForm.userType,
        });
        showToast("Usuario actualizado exitosamente");
        reloadCurrent();
      }
      setDialogOpen(false);
    } catch {
      showToast("Error al guardar", "error");
    }
  };

  const handleToggleActive = async (item: UserItem) => {
    try {
      await api.patch(`/users/${item.id}/toggle-active`);
      showToast(`Usuario ${item.isActive ? "desactivado" : "activado"} exitosamente`);
      loadUsers();
    } catch {
      showToast("Error al cambiar estado del usuario", "error");
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm("¿Está seguro de eliminar este estudiante?")) return;
    try {
      await studentsService.delete(id);
      showToast("Estudiante eliminado exitosamente");
      loadStudents();
    } catch {
      showToast("Error al eliminar estudiante", "error");
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!window.confirm("¿Está seguro de eliminar este docente?")) return;
    try {
      await teachersService.delete(id);
      showToast("Docente eliminado exitosamente");
      loadTeachers();
    } catch {
      showToast("Error al eliminar docente", "error");
    }
  };

  const handleApproveStudent = async (id: string) => {
    try {
      await studentsService.approve(id);
      showToast("Estudiante aprobado y activado exitosamente");
      loadStudents();
    } catch {
      showToast("Error al aprobar estudiante", "error");
    }
  };

  // ─── Columns ───────────────────────────────────────────────────────────────

  const userColumns: Column<UserItem>[] = [
    { key: "name", label: "Nombre", render: (row) => `${row.firstName} ${row.lastName}` },
    { key: "email", label: "Email" },
    {
      key: "userType",
      label: "Rol",
      render: (row) => (
        <Chip
          label={USER_TYPE_LABELS[row.userType] ?? row.userType}
          color={USER_TYPE_COLORS[row.userType] ?? "default"}
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
          color={row.isActive ? "success" : "error"}
          size="small"
        />
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => (
        <>
          <IconButton size="small" onClick={() => openEditUser(row)} title="Editar">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color={row.isActive ? "error" : "success"}
            onClick={() => handleToggleActive(row)}
            title={row.isActive ? "Desactivar" : "Activar"}
          >
            <PowerSettingsNewIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  const studentColumns: Column<StudentItem>[] = [
    { key: "studentCode", label: "Código" },
    { key: "name", label: "Nombre", render: (row) => `${row.user.firstName} ${row.user.lastName}` },
    { key: "email", label: "Email", render: (row) => row.user.email },
    { key: "career", label: "Carrera", render: (row) => row.career?.name ?? "—" },
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
          {row.academicStatus === "PENDING" && (
            <IconButton
              size="small"
              color="success"
              onClick={() => handleApproveStudent(row.id)}
              title="Aprobar y activar"
            >
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" onClick={() => openEditStudent(row)} title="Editar">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDeleteStudent(row.id)} title="Eliminar">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  const teacherColumns: Column<TeacherItem>[] = [
    { key: "employeeCode", label: "Código" },
    { key: "name", label: "Nombre", render: (row) => `${row.user.firstName} ${row.user.lastName}` },
    { key: "email", label: "Email", render: (row) => row.user.email },
    { key: "department", label: "Departamento", render: (row) => row.department ?? "—" },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => (
        <>
          <IconButton size="small" onClick={() => openEditTeacher(row)} title="Editar">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDeleteTeacher(row.id)} title="Eliminar">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  // ─── Dialog title ──────────────────────────────────────────────────────────

  const dialogTitle = () => {
    if (!isEditing) return "Nuevo Usuario";
    if (editStudentTarget) return "Editar Estudiante";
    if (editTeacherTarget) return "Editar Docente";
    return "Editar Usuario";
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Box>
      <Box className="flex justify-between items-center mb-4">
        <Typography variant="h5">Usuarios</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nuevo Usuario
        </Button>
      </Box>

      {/* Role filter — only affects which data is displayed */}
      <ToggleButtonGroup
        value={roleFilter}
        exclusive
        onChange={(_, v) => { if (v) setRoleFilter(v); }}
        size="small"
        sx={{ mb: 3 }}
      >
        <ToggleButton value="ALL">Todos</ToggleButton>
        <ToggleButton value="ADMIN">Administradores</ToggleButton>
        <ToggleButton value="TEACHER">Docentes</ToggleButton>
        <ToggleButton value="STUDENT">Estudiantes</ToggleButton>
      </ToggleButtonGroup>

      {/* Table */}
      {roleFilter === "STUDENT" ? (
        <DataTable columns={studentColumns} rows={students} loading={loading} getRowKey={(r) => r.id} />
      ) : roleFilter === "TEACHER" ? (
        <DataTable columns={teacherColumns} rows={teachers} loading={loading} getRowKey={(r) => r.id} />
      ) : (
        <DataTable columns={userColumns} rows={filteredUsers} loading={loading} getRowKey={(r) => r.id} />
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogTitle()}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">

          {/* ── CREATE: unified form with role selector ── */}
          {!isEditing && (
            <>
              <TextField
                label="Nombre"
                value={createForm.firstName}
                onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                fullWidth margin="dense"
              />
              <TextField
                label="Apellido"
                value={createForm.lastName}
                onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                fullWidth margin="dense"
              />
              <TextField
                label="Correo electrónico"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                fullWidth margin="dense"
              />
              <TextField
                label="Contraseña"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                fullWidth margin="dense"
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Rol</InputLabel>
                <Select
                  label="Rol"
                  value={createForm.userType}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, userType: e.target.value as CreateForm["userType"] })
                  }
                >
                  <MenuItem value="ADMIN">Administrador</MenuItem>
                  <MenuItem value="TEACHER">Docente</MenuItem>
                  <MenuItem value="STUDENT">Estudiante</MenuItem>
                </Select>
              </FormControl>
            </>
          )}

          {/* ── EDIT: Generic user (admin/all view) ── */}
          {isEditing && editUserTarget && (
            <>
              <TextField
                label="Nombre"
                value={genericEditForm.firstName}
                onChange={(e) => setGenericEditForm({ ...genericEditForm, firstName: e.target.value })}
                fullWidth margin="dense"
              />
              <TextField
                label="Apellido"
                value={genericEditForm.lastName}
                onChange={(e) => setGenericEditForm({ ...genericEditForm, lastName: e.target.value })}
                fullWidth margin="dense"
              />
              <TextField
                label="Correo electrónico"
                type="email"
                value={genericEditForm.email}
                onChange={(e) => setGenericEditForm({ ...genericEditForm, email: e.target.value })}
                fullWidth margin="dense"
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Rol</InputLabel>
                <Select
                  label="Rol"
                  value={genericEditForm.userType}
                  onChange={(e) =>
                    setGenericEditForm({ ...genericEditForm, userType: e.target.value as GenericEditForm["userType"] })
                  }
                >
                  <MenuItem value="ADMIN">Administrador</MenuItem>
                  <MenuItem value="TEACHER">Docente</MenuItem>
                  <MenuItem value="STUDENT">Estudiante</MenuItem>
                </Select>
              </FormControl>
            </>
          )}

          {/* ── EDIT: Student ── */}
          {isEditing && editStudentTarget && (
            <>
              <TextField
                label="Nombre"
                value={studentEditForm.firstName}
                onChange={(e) => setStudentEditForm({ ...studentEditForm, firstName: e.target.value })}
                fullWidth margin="dense"
              />
              <TextField
                label="Apellido"
                value={studentEditForm.lastName}
                onChange={(e) => setStudentEditForm({ ...studentEditForm, lastName: e.target.value })}
                fullWidth margin="dense"
              />
              <TextField
                label="Correo electrónico"
                type="email"
                value={studentEditForm.email}
                onChange={(e) => setStudentEditForm({ ...studentEditForm, email: e.target.value })}
                fullWidth margin="dense"
              />
              <TextField
                label="Código de estudiante"
                value={editStudentTarget.studentCode}
                disabled fullWidth margin="dense"
                helperText="El código no puede modificarse"
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Estado académico</InputLabel>
                <Select
                  label="Estado académico"
                  value={studentEditForm.academicStatus}
                  onChange={(e) =>
                    setStudentEditForm({ ...studentEditForm, academicStatus: e.target.value as AcademicStatus })
                  }
                >
                  {(Object.keys(ACADEMIC_STATUS_LABELS) as AcademicStatus[]).map((key) => (
                    <MenuItem key={key} value={key}>{ACADEMIC_STATUS_LABELS[key]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {/* Career — locked by default, unlockable on request */}
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", mt: 0.5 }}>
                <FormControl fullWidth margin="dense" disabled={studentEditForm.careerLocked}>
                  <InputLabel>Carrera</InputLabel>
                  <Select
                    label="Carrera"
                    value={studentEditForm.careerId}
                    onChange={(e) =>
                      setStudentEditForm({ ...studentEditForm, careerId: e.target.value })
                    }
                  >
                    {careers.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <IconButton
                  sx={{ mt: 1.5 }}
                  size="small"
                  color={studentEditForm.careerLocked ? "default" : "warning"}
                  title={studentEditForm.careerLocked ? "Desbloquear cambio de carrera" : "Bloquear"}
                  onClick={() =>
                    setStudentEditForm({ ...studentEditForm, careerLocked: !studentEditForm.careerLocked })
                  }
                >
                  {studentEditForm.careerLocked ? <LockIcon /> : <LockOpenIcon />}
                </IconButton>
              </Box>
              {!studentEditForm.careerLocked && (
                <Typography variant="caption" color="warning.main" sx={{ mt: -1, display: "block" }}>
                  El cambio de carrera afecta el historial académico del estudiante.
                </Typography>
              )}
            </>
          )}

          {/* ── EDIT: Teacher ── */}
          {isEditing && editTeacherTarget && (
            <>
              <TextField
                label="Nombre"
                value={teacherEditForm.firstName}
                onChange={(e) => setTeacherEditForm({ ...teacherEditForm, firstName: e.target.value })}
                fullWidth margin="dense"
              />
              <TextField
                label="Apellido"
                value={teacherEditForm.lastName}
                onChange={(e) => setTeacherEditForm({ ...teacherEditForm, lastName: e.target.value })}
                fullWidth margin="dense"
              />
              <TextField
                label="Correo electrónico"
                type="email"
                value={teacherEditForm.email}
                onChange={(e) => setTeacherEditForm({ ...teacherEditForm, email: e.target.value })}
                fullWidth margin="dense"
              />
              <TextField
                label="Código de empleado"
                value={teacherEditForm.employeeCode}
                onChange={(e) => setTeacherEditForm({ ...teacherEditForm, employeeCode: e.target.value })}
                fullWidth margin="dense"
              />
              <TextField
                select
                label="Departamento"
                value={teacherEditForm.department}
                onChange={(e) => setTeacherEditForm({ ...teacherEditForm, department: e.target.value })}
                fullWidth margin="dense"
              >
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
                ))}
              </TextField>
            </>
          )}

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            {isEditing ? "Guardar" : "Crear"}
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
