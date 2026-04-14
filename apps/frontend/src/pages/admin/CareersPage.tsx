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
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { careersService } from "../../services/careers.service";
import { subjectsService } from "../../services/subjects.service";
import { api, getApiErrorMessage } from "../../services/api";

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

interface PlanSubject {
  id: string;
  semesterNumber: number;
  isMandatory: boolean;
  subject: {
    id: string;
    name: string;
    code: string;
    credits: number;
  };
}

interface CareerDetail {
  id: string;
  name: string;
  careerSubjects: PlanSubject[];
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
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
  /** When false, código se rellena con la sugerencia del servidor al escribir el nombre. */
  const [codeUserEdited, setCodeUserEdited] = useState(false);
  const { toast, showToast, clearToast } = useToast();

  const [planOpen, setPlanOpen] = useState(false);
  const [planCareer, setPlanCareer] = useState<CareerItem | null>(null);
  const [planDetail, setPlanDetail] = useState<CareerDetail | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [allSubjects, setAllSubjects] = useState<SubjectOption[]>([]);
  const [addSubjectId, setAddSubjectId] = useState("");
  const [addSemester, setAddSemester] = useState(1);
  const [addMandatory, setAddMandatory] = useState(true);
  const [deleteCareerTarget, setDeleteCareerTarget] = useState<CareerItem | null>(
    null,
  );
  const [removePlanSubjectTarget, setRemovePlanSubjectTarget] = useState<{
    subjectId: string;
    label: string;
  } | null>(null);

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

  useEffect(() => {
    if (editTarget || !dialogOpen || codeUserEdited) return;
    const n = form.name.trim();
    if (n.length < 2) return;
    const h = setTimeout(() => {
      careersService
        .suggestCode(n)
        .then(({ code }) => setForm((f) => ({ ...f, code })))
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(h);
  }, [form.name, dialogOpen, editTarget, codeUserEdited]);

  const refreshCareerCodeSuggestion = async () => {
    const n = form.name.trim();
    if (n.length < 2) {
      showToast("Escriba al menos 2 caracteres en el nombre", "error");
      return;
    }
    try {
      const { code } = await careersService.suggestCode(n);
      setForm((f) => ({ ...f, code }));
      setCodeUserEdited(false);
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Error al sugerir código"), "error");
    }
  };

  useEffect(() => {
    if (!planOpen || !planCareer) return;
    setPlanLoading(true);
    careersService
      .getById(planCareer.id)
      .then((d) => setPlanDetail(d as CareerDetail))
      .catch(() => {
        showToast("Error al cargar plan de estudios", "error");
        setPlanDetail(null);
      })
      .finally(() => setPlanLoading(false));
    subjectsService
      .getAll()
      .then(setAllSubjects)
      .catch(() => {});
  }, [planOpen, planCareer?.id]);

  const openCreate = () => {
    setEditTarget(null);
    setCodeUserEdited(false);
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

  const openPlan = (item: CareerItem) => {
    setPlanCareer(item);
    setAddSubjectId("");
    setAddSemester(1);
    setAddMandatory(true);
    setPlanOpen(true);
  };

  const refreshPlan = async () => {
    if (!planCareer) return;
    const d = (await careersService.getById(planCareer.id)) as CareerDetail;
    setPlanDetail(d);
  };

  const handleAddToPlan = async () => {
    if (!planCareer || !addSubjectId) {
      showToast("Seleccione una materia", "error");
      return;
    }
    try {
      await careersService.addSubject(planCareer.id, {
        subjectId: addSubjectId,
        semesterNumber: addSemester,
        isMandatory: addMandatory,
      });
      showToast("Materia agregada al plan");
      setAddSubjectId("");
      await refreshPlan();
    } catch (err: unknown) {
      showToast(
        getApiErrorMessage(err, "Error al agregar materia"),
        "error",
      );
    }
  };

  const confirmRemoveFromPlan = async () => {
    if (!planCareer || !removePlanSubjectTarget) return;
    try {
      await careersService.removeSubject(
        planCareer.id,
        removePlanSubjectTarget.subjectId,
      );
      showToast("Materia quitada del plan");
      setRemovePlanSubjectTarget(null);
      await refreshPlan();
    } catch {
      showToast("Error al quitar materia", "error");
    }
  };

  const handleSave = async () => {
    try {
      if (editTarget) {
        await careersService.update(editTarget.id, form);
        showToast("Carrera actualizada exitosamente");
      } else {
        const trimmedCode = form.code.trim();
        await careersService.create({
          name: form.name,
          totalSemesters: form.totalSemesters,
          ...(trimmedCode.length > 0 ? { code: trimmedCode } : {}),
        });
        showToast("Carrera creada exitosamente");
      }
      setDialogOpen(false);
      load();
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Error al guardar carrera"), "error");
    }
  };

  const confirmDeleteCareer = async () => {
    if (!deleteCareerTarget) return;
    try {
      await careersService.delete(deleteCareerTarget.id);
      showToast("Carrera eliminada exitosamente");
      setDeleteCareerTarget(null);
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

  const inPlanIds = new Set(
    planDetail?.careerSubjects.map((cs) => cs.subject.id) ?? [],
  );
  const subjectChoices = allSubjects.filter((s) => !inPlanIds.has(s.id));

  const columns: Column<CareerItem>[] = [
    { key: "code", label: "Código" },
    { key: "name", label: "Nombre" },
    { key: "totalSemesters", label: "Semestres" },
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
          <IconButton
            size="small"
            onClick={() => openPlan(row)}
            title="Plan de estudios (materias)"
            color="primary"
          >
            <MenuBookIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => openEdit(row)} title="Editar">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => setDeleteCareerTarget(row)}
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
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
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
                onClick={refreshCareerCodeSuggestion}
                sx={{ mt: 0.5 }}
              >
                Actualizar sugerencia de código
              </Button>
            )}
          </Box>
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

      <Dialog
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Plan de estudios — {planCareer?.name ?? ""}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-3 pt-2">
          <Typography variant="body2" color="text.secondary">
            Aquí se relacionan las materias que pertenecen a la carrera (por
            semestre). Esto alimenta requisitos de inscripción y trámites
            académicos.
          </Typography>
          {planLoading ? (
            <Typography color="text.secondary">Cargando…</Typography>
          ) : (
            <>
              <Box sx={{ overflowX: "auto" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-600">
                      <th className="py-2 pr-2">Código</th>
                      <th className="py-2 pr-2">Materia</th>
                      <th className="py-2 pr-2">Sem.</th>
                      <th className="py-2 pr-2">Tipo</th>
                      <th className="py-2"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(planDetail?.careerSubjects ?? [])
                      .slice()
                      .sort(
                        (a, b) =>
                          a.semesterNumber - b.semesterNumber ||
                          a.subject.code.localeCompare(b.subject.code),
                      )
                      .map((cs) => (
                        <tr key={cs.id} className="border-b border-gray-100">
                          <td className="py-2 pr-2 font-mono">
                            {cs.subject.code}
                          </td>
                          <td className="py-2 pr-2">{cs.subject.name}</td>
                          <td className="py-2 pr-2">{cs.semesterNumber}</td>
                          <td className="py-2 pr-2">
                            <Chip
                              size="small"
                              label={cs.isMandatory ? "Obligatoria" : "Optativa"}
                              variant="outlined"
                            />
                          </td>
                          <td className="py-2 text-right">
                            <IconButton
                              size="small"
                              color="error"
                              title="Quitar del plan"
                              onClick={() =>
                                setRemovePlanSubjectTarget({
                                  subjectId: cs.subject.id,
                                  label: `${cs.subject.code} — ${cs.subject.name}`,
                                })
                              }
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </Box>

              <Typography variant="subtitle2" sx={{ mt: 2 }}>
                Agregar materia al plan
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  alignItems: "flex-end",
                }}
              >
                <TextField
                  select
                  label="Materia"
                  value={addSubjectId}
                  onChange={(e) => setAddSubjectId(e.target.value)}
                  sx={{ minWidth: 220 }}
                  size="small"
                >
                  <MenuItem value="">— Seleccione —</MenuItem>
                  {subjectChoices.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Semestre"
                  type="number"
                  value={addSemester}
                  onChange={(e) =>
                    setAddSemester(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  inputProps={{ min: 1 }}
                  size="small"
                  sx={{ width: 100 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={addMandatory}
                      onChange={(e) => setAddMandatory(e.target.checked)}
                    />
                  }
                  label="Obligatoria"
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddToPlan}
                  disabled={!addSubjectId}
                >
                  Agregar
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlanOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!deleteCareerTarget}
        onClose={() => setDeleteCareerTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Eliminar carrera</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de eliminar la carrera{" "}
            <strong>
              {deleteCareerTarget?.code} — {deleteCareerTarget?.name}
            </strong>
            ? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteCareerTarget(null)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDeleteCareer}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!removePlanSubjectTarget}
        onClose={() => setRemovePlanSubjectTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Quitar materia del plan</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Quitar <strong>{removePlanSubjectTarget?.label}</strong> del plan
            de la carrera <strong>{planCareer?.name}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemovePlanSubjectTarget(null)}>
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmRemoveFromPlan}
          >
            Quitar
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
