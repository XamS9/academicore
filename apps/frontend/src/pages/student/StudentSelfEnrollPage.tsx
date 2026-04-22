import { useEffect, useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import LinearProgress from "@mui/material/LinearProgress";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LockIcon from "@mui/icons-material/Lock";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { enrollmentsService } from "../../services/enrollments.service";
import { useStudentNav } from "../../store/student-nav.context";
import TextField from "@mui/material/TextField";
import { academicPeriodsService } from "../../services/academic-periods.service";
import { getApiErrorMessage } from "../../services/api";
import {
  SubjectPrerequisitesCaption,
  formatPrerequisitesLine,
  listPrerequisiteSubjects,
} from "../../components/SubjectPrerequisitesCaption";

interface Prerequisite {
  id: string;
  name: string;
  code: string;
  met: boolean;
}

interface AvailableGroup {
  id: string;
  groupCode: string;
  maxStudents: number;
  currentStudents: number;
  prerequisitesMet: boolean;
  computedTuition: number;
  groupClassrooms: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    classroom: { name: string; building: string | null };
  }>;
  subject: {
    id: string;
    name: string;
    code: string;
    credits: number;
    prerequisites: Prerequisite[];
  };
  teacher: { user: { firstName: string; lastName: string } };
}

interface TuitionOptionGroup extends AvailableGroup {
  minStudentsRequired: number;
  /** True when the student is already enrolled in this group and it stayed below the minimum after enrollment closed. */
  isMyEnrolledGroup?: boolean;
}

const dayLabels: Record<number, string> = {
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
  7: "Dom",
};

const formatClock = (raw: string): string => {
  if (!raw) return "--:--";
  if (raw.includes("T")) return raw.slice(11, 16);
  return raw.slice(0, 5);
};

interface EnrolledSubjectRow {
  id: string;
  status: string;
  group: {
    id: string;
    groupCode: string;
    subject: {
      id: string;
      name: string;
      code: string;
      credits: number;
      prerequisites?: Array<{
        prerequisite: { id: string; code: string; name: string };
      }>;
    };
    teacher: { user: { firstName: string; lastName: string } };
  };
}

export default function StudentSelfEnrollPage() {
  const { refresh: refreshStudentNav, navState } = useStudentNav();
  const [loading, setLoading] = useState(true);
  const [activePeriodId, setActivePeriodId] = useState<string | null>(null);
  const [activePeriodName, setActivePeriodName] = useState<string>("");
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);

  // Currently enrolled subjects in active period
  const [enrolledSubjects, setEnrolledSubjects] = useState<EnrolledSubjectRow[]>([]);
  const [dropTarget, setDropTarget] = useState<EnrolledSubjectRow | null>(null);
  const [dropping, setDropping] = useState(false);

  // Available groups + cart
  const [groups, setGroups] = useState<AvailableGroup[]>([]);
  const [cart, setCart] = useState<AvailableGroup[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const [tuitionOptions, setTuitionOptions] = useState<TuitionOptionGroup[]>([]);
  const [tuitionLoading, setTuitionLoading] = useState(false);
  const [tuitionRequestTarget, setTuitionRequestTarget] = useState<TuitionOptionGroup | null>(
    null,
  );
  const [tuitionNote, setTuitionNote] = useState("");
  const [tuitionSubmitting, setTuitionSubmitting] = useState(false);

  const { toast, showToast, clearToast } = useToast();

  const loadEnrolled = useCallback(async (periodId: string) => {
    const enrollments = await enrollmentsService.getMine();
    const current = enrollments.find(
      (e: { academicPeriodId: string }) => e.academicPeriodId === periodId,
    );
    setEnrolledSubjects(
      current?.enrollmentSubjects.filter(
        (es: { status: string }) => es.status === "ENROLLED",
      ) ?? [],
    );
  }, []);

  const loadAvailable = useCallback(async () => {
    const available = await enrollmentsService.getAvailableGroups();
    setGroups(available);
  }, []);

  const loadTuitionOptions = useCallback(async () => {
    setTuitionLoading(true);
    try {
      const opts = await enrollmentsService.getTuitionRequestOptions();
      setTuitionOptions(opts as TuitionOptionGroup[]);
    } catch {
      showToast("Error al cargar opciones de tutoría", "error");
      setTuitionOptions([]);
    } finally {
      setTuitionLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const load = async () => {
      try {
        const periods = await academicPeriodsService.getAll();
        const activePeriod = periods.find((p: { isActive: boolean }) => p.isActive);

        if (activePeriod) {
          setActivePeriodId(activePeriod.id);
          setActivePeriodName(activePeriod.name);
          const open =
            (activePeriod as { enrollmentOpenEffective?: boolean }).enrollmentOpenEffective ??
            activePeriod.enrollmentOpen;
          setEnrollmentOpen(open);
          await loadEnrolled(activePeriod.id);
          if (open) {
            await loadAvailable();
          }
        }
      } catch {
        showToast("Error al cargar datos de inscripción", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  useEffect(() => {
    if (!activePeriodId || loading) return;
    if (enrollmentOpen) {
      setTuitionOptions([]);
      return;
    }
    if (navState?.tuitionRequestPhaseActive) {
      void loadTuitionOptions();
    } else {
      setTuitionOptions([]);
    }
  }, [
    activePeriodId,
    enrollmentOpen,
    loading,
    navState?.tuitionRequestPhaseActive,
    loadTuitionOptions,
  ]);

  // ── Drop ────────────────────────────────────────────────
  const handleDrop = async () => {
    if (!dropTarget || !activePeriodId) return;
    setDropping(true);
    try {
      await enrollmentsService.dropSubject(dropTarget.id);
      showToast("Materia dada de baja exitosamente");
      setDropTarget(null);
      await loadEnrolled(activePeriodId);
      await loadAvailable();
    } catch (err: any) {
      showToast(
        getApiErrorMessage(err, "Error al dar de baja la materia"),
        "error",
      );
    } finally {
      setDropping(false);
    }
  };

  // ── Cart ────────────────────────────────────────────────
  const cartSubjectIds = new Set(cart.map((g) => g.subject.id));

  // Subject IDs that the student can enroll in directly (prerequisites already met)
  const availableSubjectIds = new Set(
    groups.filter((g) => g.prerequisitesMet).map((g) => g.subject.id)
  );

  // Show a group if its prerequisites are met, OR if every unmet prerequisite is
  // itself available this period (co-requisite: e.g. lab + theory taken concurrently).
  const visibleGroups = groups.filter((g) => {
    if (g.prerequisitesMet) return true;
    const unmet = g.subject.prerequisites.filter((p) => !p.met);
    return unmet.length > 0 && unmet.every((p) => availableSubjectIds.has(p.id));
  });

  const tuitionAvailableSubjectIds = new Set(
    tuitionOptions.filter((g) => g.prerequisitesMet).map((g) => g.subject.id),
  );
  const visibleTuitionGroups = tuitionOptions.filter((g) => {
    if (g.prerequisitesMet) return true;
    const unmet = g.subject.prerequisites.filter((p) => !p.met);
    return unmet.length > 0 && unmet.every((p) => tuitionAvailableSubjectIds.has(p.id));
  });

  const addToCart = (group: AvailableGroup) => {
    if (cartSubjectIds.has(group.subject.id)) return;
    setCart((prev) => [...prev, group]);
  };

  const removeFromCart = (groupId: string) => {
    setCart((prev) => prev.filter((g) => g.id !== groupId));
  };

  const totalCredits = cart.reduce((sum, g) => sum + g.subject.credits, 0);
  const totalTuition = cart.reduce((sum, g) => sum + g.computedTuition, 0);
  const fmtMoney = (n: number) =>
    n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  const handleConfirmEnroll = async () => {
    if (!activePeriodId || cart.length === 0) return;
    setEnrolling(true);
    const errors: string[] = [];
    for (const group of cart) {
      try {
        await enrollmentsService.enroll({
          groupId: group.id,
          periodId: activePeriodId,
        });
      } catch (err: any) {
        errors.push(
          getApiErrorMessage(
            err,
            `Error inscribiendo ${group.subject.name}`,
          ),
        );
      }
    }
    setEnrolling(false);
    setConfirmOpen(false);

    if (errors.length === 0) {
      showToast(`${cart.length} materia(s) inscritas exitosamente`);
      setCart([]);
    } else if (errors.length < cart.length) {
      showToast(`Algunas inscripciones fallaron: ${errors.join("; ")}`, "warning");
      setCart([]);
    } else {
      showToast(errors[0], "error");
    }
    await loadEnrolled(activePeriodId);
    await loadAvailable();
    await refreshStudentNav();
  };

  const handleSubmitTuitionRequest = async () => {
    if (!tuitionRequestTarget) return;
    setTuitionSubmitting(true);
    try {
      await enrollmentsService.createTuitionRequest({
        subjectId: tuitionRequestTarget.subject.id,
        groupId: tuitionRequestTarget.id,
        studentNote: tuitionNote.trim() || undefined,
      });
      showToast("Solicitud enviada. La coordinación revisará tu petición.");
      setTuitionRequestTarget(null);
      setTuitionNote("");
      await loadTuitionOptions();
      await refreshStudentNav();
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "No se pudo enviar la solicitud"), "error");
    } finally {
      setTuitionSubmitting(false);
    }
  };

  // ── Enrolled columns ────────────────────────────────────
  const enrolledColumns: Column<EnrolledSubjectRow>[] = [
    {
      key: "subject",
      label: "Materia",
      render: (r) => (
        <Box>
          <Typography variant="body2">{r.group.subject.name}</Typography>
          <SubjectPrerequisitesCaption subject={r.group.subject} />
        </Box>
      ),
    },
    { key: "code", label: "Cód.", render: (r) => r.group.subject.code },
    { key: "group", label: "Grupo", render: (r) => r.group.groupCode },
    {
      key: "credits",
      label: "Créd.",
      render: (r) => r.group.subject.credits,
    },
    {
      key: "teacher",
      label: "Profesor",
      render: (r) => `${r.group.teacher.user.firstName} ${r.group.teacher.user.lastName}`,
    },
    {
      key: "actions",
      label: "",
      render: (r) =>
        enrollmentOpen ? (
          <Button
            size="small"
            color="error"
            variant="outlined"
            onClick={() => setDropTarget(r)}
          >
            Dar de baja
          </Button>
        ) : null,
    },
  ];

  // ── Available columns ───────────────────────────────────
  const availableColumns: Column<AvailableGroup>[] = [
    {
      key: "prereq",
      label: "",
      render: (r) =>
        r.prerequisitesMet ? (
          <Tooltip title="Requisitos cumplidos">
            <CheckCircleOutlineIcon color="success" fontSize="small" />
          </Tooltip>
        ) : (
          <Tooltip
            title={
              <Box>
                <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                  Requisitos pendientes:
                </Typography>
                {r.subject.prerequisites
                  .filter((p) => !p.met)
                  .map((p) => (
                    <Typography key={p.id} variant="caption" display="block">
                      • {p.name} ({p.code})
                    </Typography>
                  ))}
              </Box>
            }
          >
            <ErrorOutlineIcon color="warning" fontSize="small" />
          </Tooltip>
        ),
    },
    { key: "code", label: "Cód.", render: (r) => r.subject.code },
    { key: "name", label: "Materia", render: (r) => r.subject.name },
    { key: "group", label: "Grupo", render: (r) => r.groupCode },
    { key: "credits", label: "Créd.", render: (r) => r.subject.credits },
    {
      key: "teacher",
      label: "Profesor",
      render: (r) => `${r.teacher.user.firstName} ${r.teacher.user.lastName}`,
    },
    {
      key: "schedule",
      label: "Horario",
      render: (r) => {
        if (!r.groupClassrooms?.length) return "Sin horario asignado";
        return r.groupClassrooms
          .slice()
          .sort((a, b) =>
            a.dayOfWeek !== b.dayOfWeek
              ? a.dayOfWeek - b.dayOfWeek
              : formatClock(a.startTime).localeCompare(formatClock(b.startTime)),
          )
          .map(
            (gc) =>
              `${dayLabels[gc.dayOfWeek] ?? `Día ${gc.dayOfWeek}`} ${formatClock(gc.startTime)}-${formatClock(gc.endTime)}`,
          )
          .join(" | ");
      },
    },
    {
      key: "classrooms",
      label: "Aula(s)",
      render: (r) => {
        if (!r.groupClassrooms?.length) return "N/A";
        const uniqueRooms = Array.from(
          new Set(
            r.groupClassrooms.map((gc) =>
              gc.classroom.building
                ? `${gc.classroom.name} (${gc.classroom.building})`
                : gc.classroom.name,
            ),
          ),
        );
        return uniqueRooms.join(", ");
      },
    },
    {
      key: "capacity",
      label: "Cupo",
      render: (r) => (
        <Chip
          label={`${r.currentStudents}/${r.maxStudents}`}
          color={r.currentStudents < r.maxStudents ? "success" : "error"}
          size="small"
        />
      ),
    },
    {
      key: "actions",
      label: "",
      render: (r) => {
        const inCart = cartSubjectIds.has(r.subject.id);
        const full = r.currentStudents >= r.maxStudents;
        return (
          <Tooltip title={inCart ? "Ya en el carrito" : full ? "Sin cupo" : "Agregar al carrito"}>
            <span>
              <IconButton
                size="small"
                color="primary"
                disabled={inCart || full}
                onClick={() => addToCart(r)}
              >
                <AddShoppingCartIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        );
      },
    },
  ];

  const tuitionColumns: Column<TuitionOptionGroup>[] = [
    {
      key: "prereq",
      label: "",
      render: (r) =>
        r.prerequisitesMet ? (
          <Tooltip title="Requisitos cumplidos">
            <CheckCircleOutlineIcon color="success" fontSize="small" />
          </Tooltip>
        ) : (
          <Tooltip title="Requisitos pendientes o en co-inscripción">
            <ErrorOutlineIcon color="warning" fontSize="small" />
          </Tooltip>
        ),
    },
    { key: "code", label: "Cód.", render: (r) => r.subject.code },
    {
      key: "name",
      label: "Materia",
      render: (r) => (
        <Box>
          <Typography variant="body2">{r.subject.name}</Typography>
          {r.isMyEnrolledGroup && (
            <Chip label="Tu grupo (no abrió)" size="small" color="warning" sx={{ mt: 0.5 }} />
          )}
        </Box>
      ),
    },
    { key: "group", label: "Grupo", render: (r) => r.groupCode },
    {
      key: "min",
      label: "Inscritos / mín.",
      render: (r) => (
        <Chip
          label={`${r.currentStudents} / ${r.minStudentsRequired}`}
          color="warning"
          size="small"
        />
      ),
    },
    {
      key: "teacher",
      label: "Profesor",
      render: (r) => `${r.teacher.user.firstName} ${r.teacher.user.lastName}`,
    },
    {
      key: "tuition",
      label: "Costo de tutoría",
      render: (r) => (r.computedTuition > 0 ? fmtMoney(r.computedTuition) : "—"),
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            setTuitionNote("");
            setTuitionRequestTarget(r);
          }}
        >
          Solicitar tutoría
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Inscribir Materias
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Typography variant="h5" sx={{ flex: 1 }}>
          Inscribir Materias
        </Typography>
        {activePeriodName && (
          <Typography variant="body2" color="text.secondary">
            {activePeriodName}
          </Typography>
        )}
        <Chip
          icon={enrollmentOpen ? undefined : <LockIcon fontSize="small" />}
          label={enrollmentOpen ? "Inscripción abierta" : "Inscripción cerrada"}
          color={enrollmentOpen ? "success" : "default"}
          size="small"
        />
      </Box>

      {!activePeriodId && (
        <Alert severity="info">No hay un período académico activo en este momento.</Alert>
      )}

      {activePeriodId && (
        <>
          {/* Currently enrolled subjects */}
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            Materias inscritas en este período
          </Typography>

          {enrolledSubjects.length === 0 ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              No tienes materias inscritas en el período actual.
            </Alert>
          ) : (
            <Box sx={{ mb: 3 }}>
              <DataTable
                columns={enrolledColumns}
                rows={enrolledSubjects}
                getRowKey={(r) => r.id}
              />
            </Box>
          )}

          {/* Closed enrollment banner */}
          {!enrollmentOpen && (
            <Alert severity="warning" icon={<LockIcon />} sx={{ mb: 2 }}>
              El período de inscripción ha cerrado. No es posible agregar ni dar de baja materias.
            </Alert>
          )}

          {!enrollmentOpen && navState?.tuitionRequestPhaseActive && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Grupos no abiertos — solicitud de tutoría
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Estos grupos no alcanzaron el mínimo de estudiantes configurado por la institución
                tras cerrar inscripciones. Puedes solicitar cursar la materia en modalidad tutoría
                (seguimiento individual con el docente del grupo de referencia).
              </Typography>
              {tuitionLoading ? (
                <LinearProgress sx={{ mb: 2 }} />
              ) : visibleTuitionGroups.length === 0 ? (
                <Alert severity="info">
                  No hay grupos elegibles en tu carrera por debajo del mínimo, o ya tienes solicitud
                  pendiente / estás inscrito en esas materias.
                </Alert>
              ) : (
                <DataTable
                  columns={tuitionColumns}
                  rows={visibleTuitionGroups}
                  getRowKey={(r) => r.id}
                />
              )}
            </>
          )}

          {/* Add subjects section — only when enrollment is open */}
          {enrollmentOpen && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Agregar materias
              </Typography>

              <Grid container spacing={3}>
                {/* Available groups */}
                <Grid item xs={12} md={8}>
                  <DataTable
                    columns={availableColumns}
                    rows={visibleGroups}
                    loading={false}
                    getRowKey={(r) => r.id}
                  />
                  {visibleGroups.length === 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No hay materias disponibles para agregar.
                    </Alert>
                  )}
                </Grid>

                {/* Cart */}
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      <ShoppingCartIcon color="primary" />
                      <Typography variant="subtitle1" fontWeight={600}>
                        Mi selección
                      </Typography>
                      {cart.length > 0 && (
                        <Chip label={cart.length} size="small" color="primary" />
                      )}
                    </Box>

                    {cart.length === 0 ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: "center", py: 3 }}
                      >
                        Agrega materias desde la tabla para incluirlas en tu inscripción.
                      </Typography>
                    ) : (
                      <>
                        {cart.map((g, idx) => {
                          const cartPrereqLine = formatPrerequisitesLine(
                            listPrerequisiteSubjects(g.subject),
                          );
                          return (
                          <Box key={g.id}>
                            {idx > 0 && <Divider sx={{ my: 1 }} />}
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {g.subject.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {g.groupCode} · {g.subject.credits} créditos
                                </Typography>
                                {cartPrereqLine ? (
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Prerrequisitos: {cartPrereqLine}
                                  </Typography>
                                ) : null}
                                {g.computedTuition > 0 && (
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    Matrícula: {fmtMoney(g.computedTuition)}
                                  </Typography>
                                )}
                                {!g.prerequisitesMet && (
                                  <Box sx={{ mt: 0.5 }}>
                                    <Chip
                                      label="Requisitos pendientes"
                                      size="small"
                                      color="warning"
                                      variant="outlined"
                                    />
                                  </Box>
                                )}
                              </Box>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeFromCart(g.id)}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                          );
                        })}

                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Total créditos
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {totalCredits}
                          </Typography>
                        </Box>
                        {totalTuition > 0 && (
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Total matrícula
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color="primary.main">
                              {fmtMoney(totalTuition)}
                            </Typography>
                          </Box>
                        )}

                        {cart.some((g) => !g.prerequisitesMet) && (
                          <Alert severity="warning" sx={{ mb: 2 }}>
                            Las materias marcadas con ⚠ serán validadas al confirmar.
                          </Alert>
                        )}

                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => setConfirmOpen(true)}
                        >
                          Confirmar inscripción ({cart.length})
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          fullWidth
                          sx={{ mt: 1 }}
                          onClick={() => setCart([])}
                        >
                          Limpiar selección
                        </Button>
                      </>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </>
          )}
        </>
      )}

      {/* Drop confirm dialog */}
      <Dialog open={!!dropTarget} onClose={() => setDropTarget(null)}>
        <DialogTitle>Dar de baja materia</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            ¿Confirmas dar de baja <strong>{dropTarget?.group.subject.name}</strong>?
            Esta acción no se puede deshacer.
            {dropTarget ? (
              <SubjectPrerequisitesCaption subject={dropTarget.group.subject} sx={{ mt: 1 }} />
            ) : null}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDropTarget(null)}>Cancelar</Button>
          <Button color="error" variant="contained" disabled={dropping} onClick={handleDrop}>
            {dropping ? "Procesando..." : "Confirmar baja"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!tuitionRequestTarget}
        onClose={() => !tuitionSubmitting && setTuitionRequestTarget(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Solicitar tutoría</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }} component="div">
            <strong>{tuitionRequestTarget?.subject.name}</strong> —{" "}
            {tuitionRequestTarget?.groupCode}. El profesor de referencia es{" "}
            {tuitionRequestTarget &&
              `${tuitionRequestTarget.teacher.user.firstName} ${tuitionRequestTarget.teacher.user.lastName}`}
            .
            {tuitionRequestTarget ? (
              <SubjectPrerequisitesCaption subject={tuitionRequestTarget.subject} sx={{ mt: 1 }} />
            ) : null}
            {tuitionRequestTarget?.isMyEnrolledGroup && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Ya estás inscrito en este grupo; al no alcanzar el mínimo tras cerrar inscripciones,
                puedes solicitar que se considere la modalidad tutoría.
              </Typography>
            )}
          </DialogContentText>
          <TextField
            label="Comentario (opcional)"
            value={tuitionNote}
            onChange={(e) => setTuitionNote(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            placeholder="Horario preferido, etc."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTuitionRequestTarget(null)} disabled={tuitionSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={tuitionSubmitting}
            onClick={() => void handleSubmitTuitionRequest()}
          >
            {tuitionSubmitting ? "Enviando…" : "Enviar solicitud"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enroll confirm dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirmar inscripción</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Se inscribirán las siguientes {cart.length} materia(s) para{" "}
            <strong>{activePeriodName}</strong>:
          </DialogContentText>
          {cart.map((g) => (
            <Box key={g.id} sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1 }}>
              {g.prerequisitesMet ? (
                <CheckCircleOutlineIcon color="success" fontSize="small" sx={{ mt: 0.25 }} />
              ) : (
                <ErrorOutlineIcon color="warning" fontSize="small" sx={{ mt: 0.25 }} />
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2">
                  {g.subject.name} — {g.groupCode}
                </Typography>
                <SubjectPrerequisitesCaption subject={g.subject} />
              </Box>
              {g.computedTuition > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {fmtMoney(g.computedTuition)}
                </Typography>
              )}
            </Box>
          ))}
          {totalTuition > 0 && (
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1, pt: 1, borderTop: 1, borderColor: "divider" }}>
              <Typography variant="body2" fontWeight={600}>Total matrícula</Typography>
              <Typography variant="body2" fontWeight={600} color="primary.main">
                {fmtMoney(totalTuition)}
              </Typography>
            </Box>
          )}
          {cart.some((g) => !g.prerequisitesMet) && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Las materias marcadas con ⚠ serán validadas por el sistema al confirmar.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button variant="contained" disabled={enrolling} onClick={handleConfirmEnroll}>
            {enrolling ? "Inscribiendo..." : "Confirmar"}
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
