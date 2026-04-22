import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import NumericTextField from "../../components/ui/NumericTextField";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
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

  const sortedPlanSubjects = (planDetail?.careerSubjects ?? [])
    .slice()
    .sort(
      (a, b) =>
        a.semesterNumber - b.semesterNumber ||
        a.subject.code.localeCompare(b.subject.code),
    );

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
          <NumericTextField
            label="Total de semestres"
            value={form.totalSemesters}
            onValueChange={(totalSemesters) =>
              setForm({ ...form, totalSemesters: Math.max(1, totalSemesters) })
            }
            min={1}
            integer
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
        maxWidth="lg"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            maxHeight: "min(92vh, 960px)",
            width: "100%",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <DialogTitle sx={{ flexShrink: 0, pr: 6 }}>
          Plan de estudios — {planCareer?.name ?? ""}
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            flex: "1 1 auto",
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            py: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Aquí se relacionan las materias que pertenecen a la carrera (por
            semestre). Esto alimenta requisitos de inscripción y trámites
            académicos.
          </Typography>
          {planLoading ? (
            <Typography color="text.secondary">Cargando…</Typography>
          ) : (
            <>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: "action.hover",
                  borderStyle: "dashed",
                  flexShrink: 0,
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
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
                    sx={{ minWidth: { xs: "100%", sm: 260 }, flex: "1 1 220px" }}
                    size="small"
                  >
                    <MenuItem value="">— Seleccione —</MenuItem>
                    {subjectChoices.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <NumericTextField
                    label="Semestre"
                    value={addSemester}
                    onValueChange={(n) => setAddSemester(Math.max(1, n))}
                    min={1}
                    integer
                    inputProps={{ min: 1 }}
                    size="small"
                    sx={{ width: { xs: "100%", sm: 100 } }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={addMandatory}
                        onChange={(e) => setAddMandatory(e.target.checked)}
                      />
                    }
                    label="Obligatoria"
                    sx={{ mr: "auto" }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddToPlan}
                    disabled={!addSubjectId}
                    sx={{ flexShrink: 0 }}
                  >
                    Agregar
                  </Button>
                </Box>
              </Paper>

              <Box sx={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography variant="subtitle2">
                    Materias del plan ({sortedPlanSubjects.length})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Desplácese para ver todas; la cabecera permanece fija.
                  </Typography>
                </Box>
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{
                    flex: "1 1 auto",
                    minHeight: 200,
                    maxHeight: { xs: "42vh", sm: "min(52vh, 520px)" },
                    overflow: "auto",
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "background.paper", minWidth: 88 }}>
                          Código
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "background.paper", minWidth: 160 }}>
                          Materia
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ fontWeight: 700, bgcolor: "background.paper", width: 72 }}
                        >
                          Sem.
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "background.paper", width: 120 }}>
                          Tipo
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 700, bgcolor: "background.paper", width: 56 }}
                        >
                          {" "}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedPlanSubjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                            No hay materias en el plan todavía. Use el formulario superior para agregarlas.
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {sortedPlanSubjects.map((cs) => (
                        <TableRow key={cs.id} hover>
                          <TableCell
                            sx={{
                              fontFamily: "ui-monospace, monospace",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {cs.subject.code}
                          </TableCell>
                          <TableCell sx={{ maxWidth: { xs: 200, sm: 360 } }}>
                            <Typography variant="body2" component="span" sx={{ wordBreak: "break-word" }}>
                              {cs.subject.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{cs.semesterNumber}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={cs.isMandatory ? "Obligatoria" : "Optativa"}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ verticalAlign: "middle" }}>
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ flexShrink: 0, px: 3, py: 2 }}>
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
