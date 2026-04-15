import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { paymentsService } from "../../services/payments.service";
import { useStudentNav } from "../../store/student-nav.context";
import {
  feeStatusChipColor,
  feeStatusLabel,
} from "../../lib/fee-status";

interface StudentFee {
  id: string;
  amount: string;
  dueDate: string;
  status: string;
  feeConcept: { name: string };
  period: { name: string };
}

export default function StudentPaymentsPage() {
  const { refresh: refreshStudentNav } = useStudentNav();
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedFee, setSelectedFee] = useState<StudentFee | null>(null);
  const [method, setMethod] = useState("CARD");
  const { toast, showToast, clearToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      setFees(await paymentsService.getStudentFees());
    } catch {
      showToast("Error al cargar cargos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handlePay = async () => {
    if (!selectedFee) return;
    setPaying(true);
    try {
      await paymentsService.pay(selectedFee.id, { method });
      showToast("Pago procesado exitosamente");
      setSelectedFee(null);
      await load();
      await refreshStudentNav();
    } catch {
      showToast("Error al procesar pago", "error");
    } finally {
      setPaying(false);
    }
  };

  const columns: Column<StudentFee>[] = [
    { key: "concept", label: "Concepto", render: (r) => r.feeConcept.name },
    { key: "period", label: "Período", render: (r) => r.period.name },
    {
      key: "amount",
      label: "Monto",
      render: (r) => `$${Number(r.amount).toFixed(2)}`,
    },
    {
      key: "dueDate",
      label: "Vencimiento",
      render: (r) => new Date(r.dueDate).toLocaleDateString("es-MX"),
    },
    {
      key: "status",
      label: "Estado",
      render: (r) => (
        <Chip
          label={feeStatusLabel(r.status)}
          color={feeStatusChipColor(r.status)}
          size="small"
        />
      ),
    },
    {
      key: "actions",
      label: "",
      render: (r) =>
        r.status === "PENDING" ? (
          <Button
            size="small"
            variant="contained"
            onClick={() => setSelectedFee(r)}
          >
            Pagar
          </Button>
        ) : null,
    },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Mis Pagos
      </Typography>
      <DataTable
        columns={columns}
        rows={fees}
        loading={loading}
        getRowKey={(r) => r.id}
      />

      <Dialog
        open={!!selectedFee}
        onClose={() => !paying && setSelectedFee(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmar Pago</DialogTitle>
        <DialogContent>
          {selectedFee && (
            <Box className="flex flex-col gap-3 pt-2">
              <Typography>
                <strong>Concepto:</strong> {selectedFee.feeConcept.name}
              </Typography>
              <Typography>
                <strong>Monto:</strong> ${Number(selectedFee.amount).toFixed(2)}
              </Typography>
              <TextField
                select
                label="Método de Pago"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                fullWidth
                margin="dense"
              >
                <MenuItem value="CARD">Tarjeta</MenuItem>
                <MenuItem value="TRANSFER">Transferencia</MenuItem>
                <MenuItem value="CASH">Efectivo</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedFee(null)} disabled={paying}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handlePay} disabled={paying}>
            {paying ? <CircularProgress size={20} /> : "Confirmar Pago"}
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
