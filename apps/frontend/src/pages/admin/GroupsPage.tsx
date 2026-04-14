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
import Chip from "@mui/material/Chip";
import EditIcon from "@mui/icons-material/Edit";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { groupsService } from "../../services/groups.service";
import { subjectsService } from "../../services/subjects.service";
import { academicPeriodsService } from "../../services/academic-periods.service";
import { teachersService } from "../../services/teachers.service";

interface GroupSubject {
  name: string;
  code: string;
}

interface GroupPeriod {
  name: string;
}

interface GroupTeacherUser {
  firstName: string;
  lastName: string;
}

interface GroupTeacher {
  user: GroupTeacherUser;
}

interface GroupItem {
  id: string;
  groupCode: string;
  maxStudents: number;
  currentStudents: number;
  isActive: boolean;
  subject: GroupSubject;
  academicPeriod: GroupPeriod;
  teacher: GroupTeacher;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

interface PeriodOption {
  id: string;
  name: string;
}

interface TeacherOption {
  id: string;
  user: { firstName: string; lastName: string };
}

interface CreateForm {
  subjectId: string;
  academicPeriodId: string;
  teacherId: string;
  groupCode: string;
  maxStudents: number;
}

interface EditForm {
  maxStudents: number;
}

export default function GroupsPage() {
  const [items, setItems] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GroupItem | null>(null);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [periods, setPeriods] = useState<PeriodOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [createForm, setCreateForm] = useState<CreateForm>({
    subjectId: "",
    academicPeriodId: "",
    teacherId: "",
    groupCode: "",
    maxStudents: 30,
  });
  const [editForm, setEditForm] = useState<EditForm>({ maxStudents: 30 });
  const { toast, showToast, clearToast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const data = await groupsService.getAll();
      setItems(data);
    } catch {
      showToast("Error al cargar grupos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    subjectsService.getAll().then(setSubjects).catch(() => {});
    academicPeriodsService.getAll().then(setPeriods).catch(() => {});
    teachersService.getAll().then(setTeachers).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setCreateForm({
      subjectId: "",
      academicPeriodId: "",
      teacherId: "",
      groupCode: "",
      maxStudents: 30,
    });
    setDialogOpen(true);
  };

  const openEdit = (item: GroupItem) => {
    setEditTarget(item);
    setEditForm({ maxStudents: item.maxStudents });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editTarget) {
        await groupsService.update(editTarget.id, editForm);
        showToast("Grupo actualizado exitosamente");
      } else {
        await groupsService.create(createForm);
        showToast("Grupo creado exitosamente");
      }
      setDialogOpen(false);
      load();
    } catch {
      showToast("Error al guardar grupo", "error");
    }
  };

  const columns: Column<GroupItem>[] = [
    {
      key: "groupCode",
      label: "Código",
    },
    {
      key: "subject",
      label: "Materia",
      render: (row) =>
        row.subject ? `${row.subject.name} (${row.subject.code})` : "—",
    },
    {
      key: "academicPeriod",
      label: "Período",
      render: (row) => row.academicPeriod?.name ?? "—",
    },
    {
      key: "teacher",
      label: "Docente",
      render: (row) =>
        row.teacher?.user
          ? `${row.teacher.user.firstName} ${row.teacher.user.lastName}`
          : "—",
    },
    {
      key: "cupos",
      label: "Cupos",
      render: (row) => `${row.currentStudents}/${row.maxStudents}`,
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
        <IconButton size="small" onClick={() => openEdit(row)} title="Editar">
          <EditIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5">Grupos</Typography>
        <Button variant="contained" onClick={openCreate}>
          Nuevo Grupo
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
        <DialogTitle>{editTarget ? "Editar Grupo" : "Nuevo Grupo"}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          {!editTarget ? (
            <>
              <TextField
                select
                label="Materia"
                value={createForm.subjectId}
                onChange={(e) =>
                  setCreateForm({ ...createForm, subjectId: e.target.value })
                }
                fullWidth
                margin="dense"
              >
                {subjects.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Período Académico"
                value={createForm.academicPeriodId}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    academicPeriodId: e.target.value,
                  })
                }
                fullWidth
                margin="dense"
              >
                {periods.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Docente"
                value={createForm.teacherId}
                onChange={(e) =>
                  setCreateForm({ ...createForm, teacherId: e.target.value })
                }
                fullWidth
                margin="dense"
              >
                {teachers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.user.firstName} {t.user.lastName}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Código del grupo"
                value={createForm.groupCode}
                onChange={(e) =>
                  setCreateForm({ ...createForm, groupCode: e.target.value })
                }
                fullWidth
                margin="dense"
              />
              <TextField
                label="Máximo de estudiantes"
                type="number"
                value={createForm.maxStudents}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    maxStudents: Math.max(1, parseInt(e.target.value, 10) || 1),
                  })
                }
                inputProps={{ min: 1 }}
                fullWidth
                margin="dense"
              />
            </>
          ) : (
            <TextField
              label="Máximo de estudiantes"
              type="number"
              value={editForm.maxStudents}
              onChange={(e) =>
                setEditForm({
                  maxStudents: Math.max(1, parseInt(e.target.value, 10) || 1),
                })
              }
              inputProps={{ min: 1 }}
              fullWidth
              margin="dense"
            />
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
