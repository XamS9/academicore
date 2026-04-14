import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { auditLogsService } from "../../services/audit-logs.service";

interface AuditLogItem {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValues: unknown;
  newValues: unknown;
  ipAddress: string | null;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

const actionLabels: Record<string, string> = {
  CREATED: "Creado",
  UPDATED: "Actualizado",
  DELETED: "Eliminado",
  REVOKED: "Revocado",
  ISSUED: "Emitido",
  ENROLLED: "Inscrito",
  DROPPED: "Baja",
  STATUS_CHANGE: "Cambio de estado",
};

const actionColors: Record<
  string,
  "success" | "warning" | "error" | "info" | "default"
> = {
  CREATED: "success",
  UPDATED: "info",
  DELETED: "error",
  REVOKED: "warning",
  ISSUED: "success",
  ENROLLED: "info",
  DROPPED: "warning",
  STATUS_CHANGE: "default",
};

const ENTITY_TYPES = [
  "user",
  "student",
  "teacher",
  "career",
  "subject",
  "group",
  "enrollment",
  "evaluation",
  "grade",
  "certification",
  "payment",
  "system_settings",
];

export default function AuditLogsPage() {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const { toast, showToast, clearToast } = useToast();

  const load = async (entityType?: string) => {
    try {
      setLoading(true);
      const data = await auditLogsService.getAll({
        entityType: entityType || undefined,
        limit: 100,
      });
      setItems(data);
    } catch {
      showToast("Error al cargar registros de auditoría", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    load(entityFilter);
  }, [entityFilter]);

  const columns: Column<AuditLogItem>[] = [
    {
      key: "createdAt",
      label: "Fecha",
      render: (row) => new Date(row.createdAt).toLocaleString("es"),
    },
    {
      key: "action",
      label: "Acción",
      render: (row) => (
        <Chip
          label={actionLabels[row.action] ?? row.action}
          color={actionColors[row.action] ?? "default"}
          size="small"
        />
      ),
    },
    {
      key: "entityType",
      label: "Entidad",
      render: (row) =>
        row.entityType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    },
    {
      key: "entityId",
      label: "ID Entidad",
      render: (row) => row.entityId.slice(0, 8) + "…",
    },
    {
      key: "user",
      label: "Realizado por",
      render: (row) =>
        row.user ? `${row.user.firstName} ${row.user.lastName}` : "—",
    },
    {
      key: "ipAddress",
      label: "IP",
      render: (row) => row.ipAddress ?? "—",
    },
  ];

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5">Auditoría</Typography>
      </Box>

      <TextField
        select
        label="Filtrar por Entidad"
        value={entityFilter}
        onChange={(e) => setEntityFilter(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
      >
        <MenuItem value="">— Todas —</MenuItem>
        {ENTITY_TYPES.map((t) => (
          <MenuItem key={t} value={t}>
            {t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </MenuItem>
        ))}
      </TextField>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        getRowKey={(r) => r.id}
      />

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
