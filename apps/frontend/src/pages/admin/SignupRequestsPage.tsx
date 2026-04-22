import { useEffect, useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RefreshIcon from "@mui/icons-material/Refresh";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DescriptionIcon from "@mui/icons-material/Description";
import ErrorIcon from "@mui/icons-material/Error";
import PendingIcon from "@mui/icons-material/HourglassEmpty";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { studentsService } from "../../services/students.service";
import {
  admissionDocumentsService,
  type AdmissionDocument,
  type AdmissionRejectionReason,
} from "../../services/admission-documents.service";
import { getApiErrorMessage } from "../../services/api";

interface PendingStudent {
  id: string;
  studentCode: string;
  careerId: string;
  academicStatus: string;
  enrollmentDate: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
  };
  career: { id: string; name: string } | null;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  ID_CARD: "Documento de identidad",
  HIGH_SCHOOL_DIPLOMA: "Título de bachillerato",
  PHOTO: "Fotografía reciente",
  MEDICAL_CERT: "Certificado médico",
  OTHER: "Otro documento",
};

const statusChip = (status: string) => {
  switch (status) {
    case "APPROVED":
      return <Chip label="Aprobado" color="success" size="small" />;
    case "REJECTED":
      return <Chip label="Rechazado" color="error" size="small" />;
    default:
      return <Chip label="Pendiente" color="warning" size="small" />;
  }
};

const statusIcon = (status: string) => {
  switch (status) {
    case "APPROVED":
      return <CheckCircleIcon color="success" fontSize="small" />;
    case "REJECTED":
      return <ErrorIcon color="error" fontSize="small" />;
    default:
      return <PendingIcon color="warning" fontSize="small" />;
  }
};

/** Public file URL served by backend static `/api/files` (same-origin or VITE_API_URL host). */
function admissionFilePublicUrl(fileKey: string): string {
  const root =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    (typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : "http://localhost:3000");
  return `${root.replace(/\/$/, "")}/api/files/${fileKey}`;
}

function isImageAdmissionDoc(mime: string | null | undefined): boolean {
  return !!mime?.toLowerCase().startsWith("image/");
}

/** PDFs first, then other types, images last — easier to scan PDFs before previews. */
function compareAdmissionDocsByMime(a: AdmissionDocument, b: AdmissionDocument): number {
  const rank = (mime: string) => {
    const m = mime.toLowerCase();
    if (m === "application/pdf") return 0;
    if (m.startsWith("image/")) return 2;
    return 1;
  };
  return rank(a.fileMimeType) - rank(b.fileMimeType);
}

/** Texto mostrado al estudiante / admin (catálogo + detalle opcional, o solo texto legado). */
function formatAdmissionRejectionSummary(doc: AdmissionDocument): string | null {
  if (doc.standardRejectionReason) {
    const base = doc.standardRejectionReason.label;
    if (!doc.rejectionReason) return base;
    if (doc.standardRejectionReason.code === "OTHER") {
      return `${base}: ${doc.rejectionReason}`;
    }
    return `${base} — ${doc.rejectionReason}`;
  }
  return doc.rejectionReason ?? null;
}

export default function SignupRequestsPage() {
  const { toast, showToast, clearToast } = useToast();

  const [rows, setRows] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<PendingStudent | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Docs review state
  const [docsTarget, setDocsTarget] = useState<PendingStudent | null>(null);
  const [docs, setDocs] = useState<AdmissionDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [rejectDocTarget, setRejectDocTarget] = useState<AdmissionDocument | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<AdmissionRejectionReason[]>([]);
  const [rejectReasonId, setRejectReasonId] = useState<number | "">("");
  const [rejectDocDetail, setRejectDocDetail] = useState("");
  const [docCountCache, setDocCountCache] = useState<
    Record<string, { total: number; approved: number }>
  >({});

  useEffect(() => {
    void admissionDocumentsService
      .getRejectionReasons()
      .then(setRejectionReasons)
      .catch(() => setRejectionReasons([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all: PendingStudent[] = await studentsService.getAll();
      const pending = all.filter((s) => s.academicStatus === "PENDING");
      setRows(pending);

      // Load doc counts
      const counts: Record<string, { total: number; approved: number }> = {};
      await Promise.all(
        pending.map(async (s) => {
          try {
            const d = await admissionDocumentsService.listByStudent(s.id);
            counts[s.id] = {
              total: d.length,
              approved: d.filter((doc) => doc.status === "APPROVED").length,
            };
          } catch {
            counts[s.id] = { total: 0, approved: 0 };
          }
        }),
      );
      setDocCountCache(counts);
    } catch {
      showToast("Error al cargar solicitudes", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleApprove = async (student: PendingStudent) => {
    setActionLoading(student.id);
    try {
      await studentsService.approve(student.id);
      showToast(
        `${student.user.firstName} ${student.user.lastName} aprobado exitosamente`,
      );
      setRows((prev) => prev.filter((s) => s.id !== student.id));
    } catch (err: unknown) {
      showToast(
        getApiErrorMessage(
          err,
          "Error al aprobar. Verifica que todos los documentos estén aprobados.",
        ),
        "error",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.id);
    try {
      await studentsService.delete(rejectTarget.id);
      showToast(
        `Solicitud de ${rejectTarget.user.firstName} ${rejectTarget.user.lastName} rechazada`,
      );
      setRows((prev) => prev.filter((s) => s.id !== rejectTarget.id));
    } catch {
      showToast("Error al rechazar solicitud", "error");
    } finally {
      setActionLoading(null);
      setRejectTarget(null);
    }
  };

  // ─── Docs dialog ──────────────────────────────────────────────────────────

  const openDocsDialog = async (student: PendingStudent) => {
    setDocsTarget(student);
    setDocsLoading(true);
    try {
      const d = await admissionDocumentsService.listByStudent(student.id);
      setDocs(d);
    } catch {
      showToast("Error al cargar documentos", "error");
    } finally {
      setDocsLoading(false);
    }
  };

  const approveDoc = async (docId: string) => {
    try {
      const updated = await admissionDocumentsService.approve(docId);
      setDocs((prev) => prev.map((d) => (d.id === docId ? updated : d)));
      // Update cache
      if (docsTarget) {
        setDocCountCache((prev) => {
          const entry = prev[docsTarget.id] ?? { total: 0, approved: 0 };
          return {
            ...prev,
            [docsTarget.id]: { ...entry, approved: entry.approved + 1 },
          };
        });
      }
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Error al aprobar documento"), "error");
    }
  };

  const rejectDoc = async () => {
    if (!rejectDocTarget || rejectReasonId === "") return;
    const selected = rejectionReasons.find((r) => r.id === rejectReasonId);
    const detail = rejectDocDetail.trim();
    if (selected?.code === "OTHER" && !detail) return;
    try {
      const updated = await admissionDocumentsService.reject(rejectDocTarget.id, {
        reasonId: rejectReasonId,
        detail: detail || undefined,
      });
      setDocs((prev) =>
        prev.map((d) => (d.id === rejectDocTarget.id ? updated : d)),
      );
      setRejectDocTarget(null);
      setRejectReasonId("");
      setRejectDocDetail("");
    } catch (err: unknown) {
      showToast(
        getApiErrorMessage(err, "Error al rechazar documento"),
        "error",
      );
    }
  };

  const selectedRejectCatalog = rejectionReasons.find((r) => r.id === rejectReasonId);
  const rejectFormValid =
    rejectReasonId !== "" &&
    (selectedRejectCatalog?.code !== "OTHER" || rejectDocDetail.trim().length > 0);

  const allDocsApproved = docsTarget
    ? docs.length >= 3 && docs.every((d) => d.status === "APPROVED")
    : false;

  // ─── Columns ───────────────────────────────────────────────────────────────

  const columns: Column<PendingStudent>[] = [
    {
      key: "name",
      label: "Estudiante",
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {row.user.firstName} {row.user.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.user.email}
          </Typography>
        </Box>
      ),
    },
    {
      key: "career",
      label: "Carrera solicitada",
      render: (row) => row.career?.name ?? "—",
    },
    {
      key: "createdAt",
      label: "Fecha",
      render: (row) => {
        const d = new Date(row.enrollmentDate);
        return d.toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      },
    },
    {
      key: "docs",
      label: "Documentos",
      render: (row) => {
        const c = docCountCache[row.id];
        if (!c) return <Chip label="..." size="small" />;
        if (c.total === 0)
          return <Chip label="Sin docs" color="error" size="small" />;
        const allOk = c.approved >= 3;
        return (
          <Chip
            label={`${c.approved}/${c.total} aprobados`}
            color={allOk ? "success" : "warning"}
            size="small"
            onClick={() => openDocsDialog(row)}
            sx={{ cursor: "pointer" }}
          />
        );
      },
    },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => {
        const c = docCountCache[row.id];
        const canApprove = c && c.approved >= 3;
        return (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="Ver documentos">
              <IconButton
                size="small"
                onClick={() => openDocsDialog(row)}
              >
                <DescriptionIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={
                canApprove
                  ? "Aprobar solicitud"
                  : "Aprueba todos los documentos primero"
              }
            >
              <span>
                <IconButton
                  size="small"
                  color="success"
                  disabled={actionLoading === row.id || !canApprove}
                  onClick={() => handleApprove(row)}
                >
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Rechazar solicitud">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={actionLoading === row.id}
                  onClick={() => setRejectTarget(row)}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Solicitudes de Registro
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Estudiantes que se registraron y esperan aprobación para acceder al
            sistema. Mientras estén pendientes, puedes abrir sus documentos con
            el ícono de documento o el chip &quot;Documentos&quot; para ver
            archivos, aprobar o rechazar cada uno antes de aprobar la solicitud.
          </Typography>
        </Box>
        <Button
          startIcon={<RefreshIcon />}
          onClick={load}
          disabled={loading}
          variant="outlined"
          size="small"
        >
          Actualizar
        </Button>
      </Box>

      {/* Summary cards */}
      <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
        <Card variant="outlined" sx={{ minWidth: 180, flex: 1 }}>
          <CardContent
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              py: "16px !important",
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: "info.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.9,
              }}
            >
              <HourglassEmptyIcon sx={{ color: "white", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800} lineHeight={1}>
                {loading ? "—" : rows.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pendientes
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ minWidth: 180, flex: 1 }}>
          <CardContent
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              py: "16px !important",
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: "success.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.9,
              }}
            >
              <PersonAddIcon sx={{ color: "white", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                Flujo de aprobación
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Revisa documentos, luego aprueba o rechaza la solicitud
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Table */}
      {!loading && rows.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 10,
            color: "text.secondary",
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <CheckCircleIcon
            sx={{ fontSize: 48, color: "success.light", mb: 1 }}
          />
          <Typography variant="h6" fontWeight={600}>
            Sin solicitudes pendientes
          </Typography>
          <Typography variant="body2">
            Todas las solicitudes han sido procesadas.
          </Typography>
        </Box>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={(r) => r.id}
        />
      )}

      {/* Reject student dialog */}
      <Dialog
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Rechazar solicitud</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Rechazar la solicitud de{" "}
            <strong>
              {rejectTarget?.user.firstName} {rejectTarget?.user.lastName}
            </strong>{" "}
            para la carrera de <strong>{rejectTarget?.career?.name}</strong>?
            Esta acción eliminará su registro y no podrá iniciar sesión.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={!!actionLoading}
          >
            Rechazar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Documents review dialog */}
      <Dialog
        open={!!docsTarget}
        onClose={() => setDocsTarget(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Documentos de admisión —{" "}
          {docsTarget?.user.firstName} {docsTarget?.user.lastName}
        </DialogTitle>
        <DialogContent>
          {docsLoading ? (
            <Typography>Cargando...</Typography>
          ) : docs.length === 0 ? (
            <Alert severity="warning">
              El estudiante no ha subido ningún documento.
            </Alert>
          ) : (
            <List disablePadding>
              {[...docs].sort(compareAdmissionDocsByMime).map((doc) => {
                const fileHref = admissionFilePublicUrl(doc.fileKey);
                return (
                  <ListItem
                    key={doc.id}
                    alignItems="flex-start"
                    sx={{
                      flexDirection: "column",
                      alignItems: "stretch",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      mb: 1,
                      py: 1.5,
                      px: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1,
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36, mt: 0.25 }}>
                        {statusIcon(doc.status)}
                      </ListItemIcon>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography variant="body2" fontWeight={600}>
                            {DOC_TYPE_LABELS[doc.type] ?? doc.type}
                          </Typography>
                          {statusChip(doc.status)}
                        </Box>
                        <Typography
                          component="a"
                          href={fileHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="caption"
                          sx={{
                            display: "inline-block",
                            mt: 0.5,
                            color: "primary.main",
                          }}
                        >
                          {doc.fileName} ({(doc.fileSize / 1024).toFixed(1)}{" "}
                          KB) — abrir en pestaña nueva
                        </Typography>
                        {formatAdmissionRejectionSummary(doc) && (
                          <Typography
                            variant="caption"
                            color="error"
                            display="block"
                            sx={{ mt: 0.5 }}
                          >
                            Motivo: {formatAdmissionRejectionSummary(doc)}
                          </Typography>
                        )}
                        {isImageAdmissionDoc(doc.fileMimeType) ? (
                          <Box
                            component="img"
                            src={fileHref}
                            alt={doc.fileName}
                            sx={{
                              mt: 1.5,
                              maxWidth: "100%",
                              maxHeight: 320,
                              height: "auto",
                              borderRadius: 1,
                              border: "1px solid",
                              borderColor: "divider",
                              bgcolor: "action.hover",
                              objectFit: "contain",
                            }}
                          />
                        ) : null}
                      </Box>
                      {doc.status !== "APPROVED" && (
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.5,
                            flexShrink: 0,
                            alignSelf: "flex-start",
                          }}
                        >
                          <Tooltip title="Aprobar documento">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => approveDoc(doc.id)}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Rechazar documento">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setRejectDocTarget(doc);
                                setRejectReasonId("");
                                setRejectDocDetail("");
                              }}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          )}
          {!docsLoading && allDocsApproved && (
            <Alert severity="success" sx={{ mt: 1 }}>
              Todos los documentos aprobados. Puedes aprobar la solicitud.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocsTarget(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Reject doc reason dialog */}
      <Dialog
        open={!!rejectDocTarget}
        onClose={() => {
          setRejectDocTarget(null);
          setRejectReasonId("");
          setRejectDocDetail("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rechazar documento</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Selecciona el motivo estándar del rechazo para{" "}
            <strong>
              {DOC_TYPE_LABELS[rejectDocTarget?.type ?? ""] ??
                rejectDocTarget?.type}
            </strong>
            .
          </DialogContentText>
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="reject-reason-label">Motivo</InputLabel>
            <Select
              labelId="reject-reason-label"
              label="Motivo"
              value={rejectReasonId === "" ? "" : String(rejectReasonId)}
              onChange={(e) => {
                const v = e.target.value;
                setRejectReasonId(v === "" ? "" : Number(v));
              }}
            >
              <MenuItem value="">
                <em>Seleccionar…</em>
              </MenuItem>
              {rejectionReasons.map((r) => (
                <MenuItem key={r.id} value={String(r.id)}>
                  {r.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={
              selectedRejectCatalog?.code === "OTHER"
                ? "Describe el motivo (obligatorio)"
                : "Comentario adicional (opcional)"
            }
            value={rejectDocDetail}
            onChange={(e) => setRejectDocDetail(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            minRows={selectedRejectCatalog?.code === "OTHER" ? 3 : 2}
            required={selectedRejectCatalog?.code === "OTHER"}
            helperText={
              selectedRejectCatalog?.code === "OTHER"
                ? "Requerido cuando el motivo es «Otro»."
                : "Puedes añadir contexto junto al motivo seleccionado."
            }
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRejectDocTarget(null);
              setRejectReasonId("");
              setRejectDocDetail("");
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={rejectDoc}
            disabled={!rejectFormValid}
          >
            Rechazar
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
