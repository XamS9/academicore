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
import { useAuth } from "../../store/auth.context";
import { enrollmentsService } from "../../services/enrollments.service";
import { academicPeriodsService } from "../../services/academic-periods.service";

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
  subject: {
    id: string;
    name: string;
    code: string;
    credits: number;
    prerequisites: Prerequisite[];
  };
  teacher: { user: { firstName: string; lastName: string } };
}

interface EnrolledSubjectRow {
  id: string;
  status: string;
  group: {
    id: string;
    groupCode: string;
    subject: { id: string; name: string; code: string; credits: number };
    teacher: { user: { firstName: string; lastName: string } };
  };
}

export default function StudentSelfEnrollPage() {
  const { currentUser } = useAuth();
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

  useEffect(() => {
    const load = async () => {
      try {
        const periods = await academicPeriodsService.getAll();
        const activePeriod = periods.find((p: { isActive: boolean }) => p.isActive);

        if (activePeriod) {
          setActivePeriodId(activePeriod.id);
          setActivePeriodName(activePeriod.name);
          setEnrollmentOpen(activePeriod.enrollmentOpen);
          await loadEnrolled(activePeriod.id);
          if (activePeriod.enrollmentOpen) {
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
      showToast(err?.response?.data?.message ?? "Error al dar de baja la materia", "error");
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

  const addToCart = (group: AvailableGroup) => {
    if (cartSubjectIds.has(group.subject.id)) return;
    setCart((prev) => [...prev, group]);
  };

  const removeFromCart = (groupId: string) => {
    setCart((prev) => prev.filter((g) => g.id !== groupId));
  };

  const totalCredits = cart.reduce((sum, g) => sum + g.subject.credits, 0);

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
        errors.push(err?.response?.data?.message ?? `Error inscribiendo ${group.subject.name}`);
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
  };

  // ── Enrolled columns ────────────────────────────────────
  const enrolledColumns: Column<EnrolledSubjectRow>[] = [
    { key: "subject", label: "Materia", render: (r) => r.group.subject.name },
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
            <Alert severity="warning" icon={<LockIcon />}>
              El período de inscripción ha cerrado. No es posible agregar ni dar de baja materias.
            </Alert>
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
                        {cart.map((g, idx) => (
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
                        ))}

                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Total créditos
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {totalCredits}
                          </Typography>
                        </Box>

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
          <DialogContentText>
            ¿Confirmas dar de baja <strong>{dropTarget?.group.subject.name}</strong>?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDropTarget(null)}>Cancelar</Button>
          <Button color="error" variant="contained" disabled={dropping} onClick={handleDrop}>
            {dropping ? "Procesando..." : "Confirmar baja"}
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
            <Box key={g.id} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              {g.prerequisitesMet ? (
                <CheckCircleOutlineIcon color="success" fontSize="small" />
              ) : (
                <ErrorOutlineIcon color="warning" fontSize="small" />
              )}
              <Typography variant="body2">
                {g.subject.name} — {g.groupCode}
              </Typography>
            </Box>
          ))}
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
