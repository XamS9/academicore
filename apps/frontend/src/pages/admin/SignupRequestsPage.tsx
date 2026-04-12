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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RefreshIcon from "@mui/icons-material/Refresh";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { studentsService } from "../../services/students.service";

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

export default function SignupRequestsPage() {
  const { toast, showToast, clearToast } = useToast();

  const [rows, setRows] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<PendingStudent | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // studentId

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all: PendingStudent[] = await studentsService.getAll();
      setRows(all.filter((s) => s.academicStatus === "PENDING"));
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
      showToast(`${student.user.firstName} ${student.user.lastName} aprobado exitosamente`);
      setRows((prev) => prev.filter((s) => s.id !== student.id));
    } catch {
      showToast("Error al aprobar solicitud", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.id);
    try {
      await studentsService.delete(rejectTarget.id);
      showToast(`Solicitud de ${rejectTarget.user.firstName} ${rejectTarget.user.lastName} rechazada`);
      setRows((prev) => prev.filter((s) => s.id !== rejectTarget.id));
    } catch {
      showToast("Error al rechazar solicitud", "error");
    } finally {
      setActionLoading(null);
      setRejectTarget(null);
    }
  };

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
      label: "Fecha de solicitud",
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
      key: "status",
      label: "Estado",
      render: () => (
        <Chip label="Pendiente" color="info" size="small" />
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Aprobar solicitud">
            <span>
              <IconButton
                size="small"
                color="success"
                disabled={actionLoading === row.id}
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
      ),
    },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Solicitudes de Registro
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Estudiantes que se registraron y esperan aprobación para acceder al sistema.
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
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: "16px !important" }}>
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
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: "16px !important" }}>
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
                Aprobar activa el acceso · Rechazar elimina la solicitud
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
          <CheckCircleIcon sx={{ fontSize: 48, color: "success.light", mb: 1 }} />
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

      {/* Reject confirmation dialog */}
      <Dialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} maxWidth="xs" fullWidth>
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

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
