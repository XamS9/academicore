import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Drawer from "@mui/material/Drawer";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LockClockIcon from "@mui/icons-material/LockClock";
import LockIcon from "@mui/icons-material/Lock";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { academicPeriodsService } from "../../services/academic-periods.service";
import { api, getApiErrorMessage } from "../../services/api";

type PeriodStatus = "OPEN" | "GRADING" | "CLOSED";

interface AcademicPeriodItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  enrollmentOpen: boolean;
  enrollmentOpenEffective?: boolean;
  enrollmentPhaseStartDate?: string | null;
  enrollmentPhaseEndDate?: string | null;
  isActive: boolean;
  status: PeriodStatus;
}

interface GroupProgress {
  groupId: string;
  groupCode: string;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  totalStudents: number;
  totalEvals: number;
  gradedSlots: number;
  totalSlots: number;
  complete: boolean;
}

interface PeriodProgress {
  periodId: string;
  periodName: string;
  status: PeriodStatus;
  totalGroups: number;
  completedGroups: number;
  overallPct: number;
  groups: GroupProgress[];
}

const statusLabel: Record<PeriodStatus, string> = {
  OPEN: "Abierto",
  GRADING: "En Calificación",
  CLOSED: "Cerrado",
};
const statusColor: Record<PeriodStatus, "info" | "warning" | "default"> = {
  OPEN: "info",
  GRADING: "warning",
  CLOSED: "default",
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export default function AcademicPeriodsPage() {
  const [items, setItems] = useState<AcademicPeriodItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AcademicPeriodItem | null>(null);
  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    enrollmentPhaseStartDate: "",
    enrollmentPhaseEndDate: "",
    enrollmentOpen: false,
  });

  // Progress drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [progress, setProgress] = useState<PeriodProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [drawerPeriod, setDrawerPeriod] = useState<AcademicPeriodItem | null>(null);

  // Close dialog
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [forceClose, setForceClose] = useState(false);
  const [closing, setClosing] = useState(false);

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

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({
      name: "",
      startDate: "",
      endDate: "",
      enrollmentPhaseStartDate: "",
      enrollmentPhaseEndDate: "",
      enrollmentOpen: false,
    });
    setDialogOpen(true);
  };

  const openEdit = (item: AcademicPeriodItem) => {
    setEditTarget(item);
    setForm({
      name: item.name,
      startDate: item.startDate ? item.startDate.split("T")[0] : "",
      endDate: item.endDate ? item.endDate.split("T")[0] : "",
      enrollmentPhaseStartDate: item.enrollmentPhaseStartDate
        ? item.enrollmentPhaseStartDate.split("T")[0]
        : "",
      enrollmentPhaseEndDate: item.enrollmentPhaseEndDate
        ? item.enrollmentPhaseEndDate.split("T")[0]
        : "",
      enrollmentOpen: item.enrollmentOpen,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editTarget) {
        await academicPeriodsService.update(editTarget.id, form);
        showToast("Período actualizado exitosamente");
      } else {
        await academicPeriodsService.create(form);
        showToast("Período creado exitosamente");
      }
      setDialogOpen(false);
      load();
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Error al guardar período"), "error");
    }
  };

  const handleToggleEnrollment = async (item: AcademicPeriodItem) => {
    try {
      await api.patch(`/academic-periods/${item.id}/toggle-enrollment`);
      showToast(
        `Inscripciones ${item.enrollmentOpen ? "cerradas" : "abiertas"} exitosamente`
      );
      load();
    } catch (err: unknown) {
      showToast(
        getApiErrorMessage(err, "Error al cambiar estado de inscripciones"),
        "error",
      );
    }
  };

  const handleStartGrading = async (item: AcademicPeriodItem) => {
    try {
      await academicPeriodsService.startGrading(item.id);
      showToast(`Período "${item.name}" pasó a fase de calificación`);
      load();
    } catch (err: any) {
      showToast(
        getApiErrorMessage(err, "Error al iniciar calificación"),
        "error",
      );
    }
  };

  const loadProgress = async (periodId: string) => {
    setProgressLoading(true);
    try {
      const data = await academicPeriodsService.getProgress(periodId);
      setProgress(data);
    } catch {
      showToast("Error al cargar progreso", "error");
    } finally {
      setProgressLoading(false);
    }
  };

  const openProgressDrawer = async (item: AcademicPeriodItem) => {
    setDrawerPeriod(item);
    setProgress(null);
    setDrawerOpen(true);
    await loadProgress(item.id);
  };

  const openCloseDialog = (item: AcademicPeriodItem) => {
    setDrawerPeriod(item);
    setForceClose(false);
    setCloseDialogOpen(true);
  };

  const handleClosePeriod = async () => {
    if (!drawerPeriod) return;
    setClosing(true);
    try {
      await academicPeriodsService.closePeriod(drawerPeriod.id, forceClose);
      showToast(`Período "${drawerPeriod.name}" cerrado exitosamente`);
      setCloseDialogOpen(false);
      setDrawerOpen(false);
      load();
    } catch (err: any) {
      showToast(
        getApiErrorMessage(err, "Error al cerrar período"),
        "error",
      );
    } finally {
      setClosing(false);
    }
  };

  const columns: Column<AcademicPeriodItem>[] = [
    { key: "name", label: "Nombre" },
    { key: "startDate", label: "Inicio", render: (row) => formatDate(row.startDate) },
    { key: "endDate", label: "Fin", render: (row) => formatDate(row.endDate) },
    {
      key: "status",
      label: "Fase",
      render: (row) => (
        <Chip
          label={statusLabel[row.status] ?? row.status}
          color={statusColor[row.status] ?? "default"}
          size="small"
        />
      ),
    },
    {
      key: "enrollmentOpen",
      label: "Inscripciones",
      render: (row) => {
        const effective = row.enrollmentOpenEffective ?? row.enrollmentOpen;
        const outOfWindow = row.enrollmentOpen && !effective;
        return (
          <Tooltip
            title={
              row.enrollmentPhaseStartDate || row.enrollmentPhaseEndDate
                ? `Ventana: ${formatDate(row.enrollmentPhaseStartDate ?? "") || "—"} → ${formatDate(row.enrollmentPhaseEndDate ?? "") || "—"}`
                : "Sin fechas de ventana (solo interruptor manual)"
            }
          >
            <Chip
              label={
                outOfWindow
                  ? "Fuera de ventana"
                  : row.enrollmentOpen
                    ? "Abierta"
                    : "Cerrada"
              }
              color={effective ? "success" : "default"}
              size="small"
            />
          </Tooltip>
        );
      },
    },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {row.status !== "CLOSED" && (
            <IconButton size="small" onClick={() => openEdit(row)} title="Editar">
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {row.status === "OPEN" && (
            <>
              <Tooltip title={row.enrollmentOpen ? "Cerrar inscripciones" : "Abrir inscripciones"}>
                <IconButton
                  size="small"
                  color={row.enrollmentOpen ? "warning" : "success"}
                  onClick={() => handleToggleEnrollment(row)}
                >
                  <EventAvailableIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Iniciar fase de calificación">
                <IconButton
                  size="small"
                  color="info"
                  onClick={() => handleStartGrading(row)}
                >
                  <LockClockIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          {row.status === "GRADING" && (
            <>
              <Tooltip title="Ver progreso de calificación">
                <IconButton
                  size="small"
                  color="info"
                  onClick={() => openProgressDrawer(row)}
                >
                  <AssessmentIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cerrar período">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => openCloseDialog(row)}
                >
                  <LockIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      ),
    },
  ];

  const incompleteGroups = progress?.groups.filter((g) => !g.complete) ?? [];

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5">Períodos Académicos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nuevo Período
        </Button>
      </Box>

      <DataTable columns={columns} rows={items} loading={loading} getRowKey={(r) => r.id} />

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
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
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
            Ventana de inscripción automática (opcional)
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Si defines la fecha de cierre, el sistema cerrará inscripciones al iniciar el día
            siguiente (UTC). La fecha de inicio evita inscribirse antes de ese día aunque el
            interruptor esté activo.
          </Typography>
          <TextField
            label="Inscripciones desde"
            type="date"
            value={form.enrollmentPhaseStartDate}
            onChange={(e) =>
              setForm({ ...form, enrollmentPhaseStartDate: e.target.value })
            }
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Inscripciones hasta (inclusive)"
            type="date"
            value={form.enrollmentPhaseEndDate}
            onChange={(e) =>
              setForm({ ...form, enrollmentPhaseEndDate: e.target.value })
            }
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.enrollmentOpen}
                disabled={editTarget?.status === "GRADING"}
                onChange={(e) => setForm({ ...form, enrollmentOpen: e.target.checked })}
              />
            }
            label="Inscripciones abiertas"
          />
          {editTarget?.status === "GRADING" && (
            <Typography variant="caption" color="text.secondary" display="block">
              En fase de calificación las inscripciones permanecen cerradas hasta cerrar el
              período.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Progress drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 500 }, p: 3 } }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">Progreso de Calificación</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Actualizar">
              <IconButton
                size="small"
                onClick={() => drawerPeriod && loadProgress(drawerPeriod.id)}
                disabled={progressLoading}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {progressLoading && <LinearProgress sx={{ mb: 2 }} />}

        {progress && (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {progress.periodName}
            </Typography>

            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2">
                  {progress.completedGroups} / {progress.totalGroups} grupos completados
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {progress.overallPct}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress.overallPct}
                color={progress.overallPct === 100 ? "success" : "primary"}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="none" sx={{ pb: 1 }}></TableCell>
                  <TableCell sx={{ pb: 1 }}>Grupo / Materia</TableCell>
                  <TableCell sx={{ pb: 1 }}>Profesor</TableCell>
                  <TableCell align="right" sx={{ pb: 1 }}>Calificados</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {progress.groups.map((g) => (
                  <TableRow key={g.groupId}>
                    <TableCell padding="none">
                      {g.complete ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <WarningIcon color="warning" fontSize="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {g.subjectCode} {g.groupCode}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {g.subjectName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{g.teacherName}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption">
                        {g.totalSlots === 0 ? "—" : `${g.gradedSlots}/${g.totalSlots}`}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Divider sx={{ my: 2 }} />

            <Button
              variant="contained"
              color="error"
              fullWidth
              startIcon={<LockIcon />}
              onClick={() => {
                setCloseDialogOpen(true);
                setForceClose(false);
              }}
            >
              Cerrar Período
            </Button>
          </>
        )}
      </Drawer>

      {/* Close period confirmation dialog */}
      <Dialog
        open={closeDialogOpen}
        onClose={() => setCloseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cerrar Período Académico</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta acción es <strong>irreversible</strong>. Una vez cerrado, no se
            podrán modificar calificaciones ni inscripciones.
          </Alert>

          {incompleteGroups.length > 0 && (
            <>
              <Alert severity="error" sx={{ mb: 2 }}>
                Hay <strong>{incompleteGroups.length}</strong> grupo(s) sin
                calificaciones completas:
                <ul style={{ margin: "4px 0 0 0", paddingLeft: 20 }}>
                  {incompleteGroups.slice(0, 5).map((g) => (
                    <li key={g.groupId}>
                      <Typography variant="caption">
                        {g.subjectCode} {g.groupCode} — {g.teacherName} (
                        {g.gradedSlots}/{g.totalSlots})
                      </Typography>
                    </li>
                  ))}
                  {incompleteGroups.length > 5 && (
                    <li>
                      <Typography variant="caption">
                        ...y {incompleteGroups.length - 5} más
                      </Typography>
                    </li>
                  )}
                </ul>
              </Alert>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={forceClose}
                    onChange={(e) => setForceClose(e.target.checked)}
                  />
                }
                label="Forzar cierre — los estudiantes sin calificar recibirán nota 0"
              />
            </>
          )}

          {incompleteGroups.length === 0 && (
            <DialogContentText>
              Todos los grupos tienen calificaciones completas. ¿Confirmas cerrar
              el período <strong>{drawerPeriod?.name}</strong>?
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            disabled={
              closing ||
              (incompleteGroups.length > 0 && !forceClose)
            }
            onClick={handleClosePeriod}
          >
            {closing ? "Cerrando..." : "Confirmar Cierre"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
