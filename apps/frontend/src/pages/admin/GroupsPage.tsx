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
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import EditIcon from "@mui/icons-material/Edit";
import EventIcon from "@mui/icons-material/Event";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { groupsService } from "../../services/groups.service";
import { subjectsService } from "../../services/subjects.service";
import { academicPeriodsService } from "../../services/academic-periods.service";
import { teachersService } from "../../services/teachers.service";
import { classroomsService } from "../../services/classrooms.service";
import { getApiErrorMessage } from "../../services/api";

type GroupDeliveryMode = "ON_SITE" | "VIRTUAL" | "HYBRID";

const deliveryLabels: Record<GroupDeliveryMode, string> = {
  ON_SITE: "Presencial",
  VIRTUAL: "Virtual",
  HYBRID: "Mixto",
};

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
  deliveryMode?: GroupDeliveryMode;
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
  deliveryMode: GroupDeliveryMode;
}

interface EditForm {
  maxStudents: number;
  deliveryMode: GroupDeliveryMode;
}

interface ClassroomOption {
  id: string;
  name: string;
  building: string | null;
}

interface GroupClassroomSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  classroom: { id: string; name: string; building: string | null };
}

const DAY_LABELS: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

function formatTime(isoOrTime: string): string {
  if (!isoOrTime) return "—";
  const d = new Date(isoOrTime);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return isoOrTime.slice(0, 5);
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
    deliveryMode: "ON_SITE",
  });
  const [groupCodeUserEdited, setGroupCodeUserEdited] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    maxStudents: 30,
    deliveryMode: "ON_SITE",
  });
  const { toast, showToast, clearToast } = useToast();

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleGroup, setScheduleGroup] = useState<GroupItem | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [slots, setSlots] = useState<GroupClassroomSlot[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [slotForm, setSlotForm] = useState({
    classroomId: "",
    dayOfWeek: 1,
    startTime: "08:00",
    endTime: "10:00",
  });

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

  useEffect(() => {
    if (editTarget || !dialogOpen || groupCodeUserEdited) return;
    const { subjectId, academicPeriodId } = createForm;
    if (!subjectId || !academicPeriodId) {
      setCreateForm((cf) =>
        cf.groupCode === "" ? cf : { ...cf, groupCode: "" },
      );
      return;
    }
    const h = setTimeout(() => {
      groupsService
        .previewGroupCode(subjectId, academicPeriodId)
        .then(({ code }) =>
          setCreateForm((cf) => ({ ...cf, groupCode: code })),
        )
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(h);
  }, [
    createForm.subjectId,
    createForm.academicPeriodId,
    dialogOpen,
    editTarget,
    groupCodeUserEdited,
  ]);

  const refreshGroupCodePreview = async () => {
    const { subjectId, academicPeriodId } = createForm;
    if (!subjectId || !academicPeriodId) {
      showToast("Seleccione materia y período", "error");
      return;
    }
    try {
      const { code } = await groupsService.previewGroupCode(
        subjectId,
        academicPeriodId,
      );
      setCreateForm((cf) => ({ ...cf, groupCode: code }));
      setGroupCodeUserEdited(false);
    } catch (err: unknown) {
      showToast(
        getApiErrorMessage(err, "Error al previsualizar código"),
        "error",
      );
    }
  };

  const openCreate = () => {
    setEditTarget(null);
    setGroupCodeUserEdited(false);
    setCreateForm({
      subjectId: "",
      academicPeriodId: "",
      teacherId: "",
      groupCode: "",
      maxStudents: 30,
      deliveryMode: "ON_SITE",
    });
    setDialogOpen(true);
  };

  const openEdit = (item: GroupItem) => {
    setEditTarget(item);
    setEditForm({
      maxStudents: item.maxStudents,
      deliveryMode: item.deliveryMode ?? "ON_SITE",
    });
    setDialogOpen(true);
  };

  const openSchedule = async (item: GroupItem) => {
    setScheduleGroup(item);
    setScheduleOpen(true);
    setScheduleLoading(true);
    setSlotForm({
      classroomId: "",
      dayOfWeek: 1,
      startTime: "08:00",
      endTime: "10:00",
    });
    try {
      const [detail, roomList] = await Promise.all([
        groupsService.getById(item.id) as Promise<{
          groupClassrooms: GroupClassroomSlot[];
        }>,
        classroomsService.getAll() as Promise<ClassroomOption[]>,
      ]);
      setSlots(detail.groupClassrooms ?? []);
      setClassrooms(roomList.filter((c) => c.id));
    } catch {
      showToast("Error al cargar horarios", "error");
      setSlots([]);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleAddSlot = async () => {
    if (!scheduleGroup || !slotForm.classroomId) {
      showToast("Seleccione un aula", "error");
      return;
    }
    try {
      await groupsService.assignClassroom(scheduleGroup.id, {
        classroomId: slotForm.classroomId,
        dayOfWeek: slotForm.dayOfWeek,
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
      });
      showToast("Horario asignado");
      const detail = (await groupsService.getById(scheduleGroup.id)) as {
        groupClassrooms: GroupClassroomSlot[];
      };
      setSlots(detail.groupClassrooms ?? []);
    } catch (err: unknown) {
      showToast(
        getApiErrorMessage(err, "Error al asignar aula"),
        "error",
      );
    }
  };

  const handleSave = async () => {
    try {
      if (editTarget) {
        await groupsService.update(editTarget.id, editForm);
        showToast("Grupo actualizado exitosamente");
      } else {
        const payload: Record<string, unknown> = {
          subjectId: createForm.subjectId,
          academicPeriodId: createForm.academicPeriodId,
          teacherId: createForm.teacherId,
          maxStudents: createForm.maxStudents,
          deliveryMode: createForm.deliveryMode,
        };
        const trimmed = createForm.groupCode.trim();
        if (trimmed.length > 0) payload.groupCode = trimmed;
        await groupsService.create(payload);
        showToast("Grupo creado exitosamente");
      }
      setDialogOpen(false);
      load();
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Error al guardar grupo"), "error");
    }
  };

  const columns: Column<GroupItem>[] = [
    { key: "groupCode", label: "Código" },
    {
      key: "deliveryMode",
      label: "Modalidad",
      render: (row) => (
        <Chip
          label={deliveryLabels[row.deliveryMode ?? "ON_SITE"]}
          size="small"
          variant="outlined"
        />
      ),
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
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => openSchedule(row)}
            title="Aulas y horario"
            color="primary"
          >
            <EventIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => openEdit(row)} title="Editar">
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const showScheduleForm =
    scheduleGroup &&
    (scheduleGroup.deliveryMode ?? "ON_SITE") !== "VIRTUAL";

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
                onChange={(e) => {
                  setGroupCodeUserEdited(false);
                  setCreateForm((cf) => ({
                    ...cf,
                    subjectId: e.target.value,
                  }));
                }}
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
                onChange={(e) => {
                  setGroupCodeUserEdited(false);
                  setCreateForm((cf) => ({
                    ...cf,
                    academicPeriodId: e.target.value,
                  }));
                }}
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
                select
                label="Modalidad"
                value={createForm.deliveryMode}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    deliveryMode: e.target.value as GroupDeliveryMode,
                  })
                }
                fullWidth
                margin="dense"
                helperText="Virtual: sin aula física. Presencial/Mixto: asigne horario en «Aulas y horario»."
              >
                {(Object.keys(deliveryLabels) as GroupDeliveryMode[]).map(
                  (k) => (
                    <MenuItem key={k} value={k}>
                      {deliveryLabels[k]}
                    </MenuItem>
                  ),
                )}
              </TextField>
              <Box>
                <TextField
                  label="Código del grupo"
                  value={createForm.groupCode}
                  onChange={(e) => {
                    setGroupCodeUserEdited(true);
                    setCreateForm((cf) => ({
                      ...cf,
                      groupCode: e.target.value,
                    }));
                  }}
                  fullWidth
                  margin="dense"
                  placeholder="Previsualización; puede editar o borrar"
                  helperText="Vista previa del código que se usaría al guardar (misma regla que el servidor). Vacío al guardar = el servidor asigna uno. Si cambia materia o período, se actualiza la sugerencia salvo que haya editado el campo."
                />
                <Button
                  size="small"
                  variant="text"
                  onClick={refreshGroupCodePreview}
                  sx={{ mt: 0.5 }}
                >
                  Actualizar vista previa del código
                </Button>
              </Box>
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
            <>
              <TextField
                select
                label="Modalidad"
                value={editForm.deliveryMode}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    deliveryMode: e.target.value as GroupDeliveryMode,
                  })
                }
                fullWidth
                margin="dense"
              >
                {(Object.keys(deliveryLabels) as GroupDeliveryMode[]).map(
                  (k) => (
                    <MenuItem key={k} value={k}>
                      {deliveryLabels[k]}
                    </MenuItem>
                  ),
                )}
              </TextField>
              <TextField
                label="Máximo de estudiantes"
                type="number"
                value={editForm.maxStudents}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    maxStudents: Math.max(1, parseInt(e.target.value, 10) || 1),
                  })
                }
                inputProps={{ min: 1 }}
                fullWidth
                margin="dense"
              />
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

      <Dialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Aulas y horario
          {scheduleGroup
            ? ` — ${scheduleGroup.groupCode} (${scheduleGroup.subject?.code})`
            : ""}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-3 pt-2">
          {scheduleLoading ? (
            <Typography color="text.secondary">Cargando…</Typography>
          ) : (
            <>
              {(scheduleGroup?.deliveryMode ?? "ON_SITE") === "VIRTUAL" ? (
                <Alert severity="info" sx={{ mb: 1 }}>
                  Este grupo es <strong>virtual</strong>: no requiere aula ni
                  bloques en sede. Si es mixto, cambie la modalidad a «Mixto» y
                  agregue los horarios presenciales.
                </Alert>
              ) : null}

              <Typography variant="subtitle2" color="text.secondary">
                Horarios actuales
              </Typography>
              {slots.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Sin aulas asignadas.
                </Typography>
              ) : (
                <List dense disablePadding>
                  {slots.map((s) => (
                    <ListItem key={s.id} divider>
                      <ListItemText
                        primary={`${s.classroom.name}${s.classroom.building ? ` — ${s.classroom.building}` : ""}`}
                        secondary={`${DAY_LABELS[s.dayOfWeek] ?? s.dayOfWeek}: ${formatTime(s.startTime)} – ${formatTime(s.endTime)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}

              {showScheduleForm ? (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Asignar bloque
                  </Typography>
                  <TextField
                    select
                    label="Aula"
                    value={slotForm.classroomId}
                    onChange={(e) =>
                      setSlotForm({ ...slotForm, classroomId: e.target.value })
                    }
                    fullWidth
                    margin="dense"
                    size="small"
                  >
                    <MenuItem value="">— Seleccione —</MenuItem>
                    {classrooms.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                        {c.building ? ` (${c.building})` : ""}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Día"
                    value={slotForm.dayOfWeek}
                    onChange={(e) =>
                      setSlotForm({
                        ...slotForm,
                        dayOfWeek: Number(e.target.value),
                      })
                    }
                    fullWidth
                    margin="dense"
                    size="small"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                      <MenuItem key={d} value={d}>
                        {DAY_LABELS[d]}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Box display="flex" gap={2}>
                    <TextField
                      label="Inicio"
                      type="time"
                      value={slotForm.startTime}
                      onChange={(e) =>
                        setSlotForm({ ...slotForm, startTime: e.target.value })
                      }
                      fullWidth
                      margin="dense"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Fin"
                      type="time"
                      value={slotForm.endTime}
                      onChange={(e) =>
                        setSlotForm({ ...slotForm, endTime: e.target.value })
                      }
                      fullWidth
                      margin="dense"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                  <Button variant="outlined" onClick={handleAddSlot}>
                    Agregar horario
                  </Button>
                </>
              ) : null}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleOpen(false)}>Cerrar</Button>
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
