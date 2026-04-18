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
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
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
  const [rejectDocReason, setRejectDocReason] = useState("");
  const [docCountCache, setDocCountCache] = useState<
    Record<string, { total: number; approved: number }>
  >({});

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
    if (!rejectDocTarget || !rejectDocReason.trim()) return;
    try {
      const updated = await admissionDocumentsService.reject(
        rejectDocTarget.id,
        rejectDocReason.trim(),
      );
      setDocs((prev) =>
        prev.map((d) => (d.id === rejectDocTarget.id ? updated : d)),
      );
      setRejectDocTarget(null);
      setRejectDocReason("");
    } catch (err: unknown) {
      showToast(
        getApiErrorMessage(err, "Error al rechazar documento"),
        "error",
      );
    }
  };

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
            sistema.
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
        maxWidth="sm"
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
            <List>
              {docs.map((doc) => (
                <ListItem
                  key={doc.id}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {statusIcon(doc.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {DOC_TYPE_LABELS[doc.type] ?? doc.type}
                        </Typography>
                        {statusChip(doc.status)}
                      </Box>
                    }
                    secondary={
                      <>
                        <a
                          href={`${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000"}/api/files/${doc.fileKey}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 12, color: "#1976d2" }}
                        >
                          {doc.fileName} (
                          {(doc.fileSize / 1024).toFixed(1)} KB)
                        </a>
                        {doc.rejectionReason && (
                          <Typography
                            variant="caption"
                            color="error"
                            display="block"
                          >
                            Motivo: {doc.rejectionReason}
                          </Typography>
                        )}
                      </>
                    }
                  />
                  {doc.status !== "APPROVED" && (
                    <Box sx={{ display: "flex", gap: 0.5 }}>
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
                            setRejectDocReason("");
                          }}
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </ListItem>
              ))}
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
        onClose={() => setRejectDocTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Rechazar documento</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Indica el motivo del rechazo para{" "}
            <strong>
              {DOC_TYPE_LABELS[rejectDocTarget?.type ?? ""] ??
                rejectDocTarget?.type}
            </strong>
            .
          </DialogContentText>
          <TextField
            label="Motivo del rechazo"
            value={rejectDocReason}
            onChange={(e) => setRejectDocReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDocTarget(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={rejectDoc}
            disabled={!rejectDocReason.trim()}
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
