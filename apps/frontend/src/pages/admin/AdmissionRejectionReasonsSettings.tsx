import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { admissionDocumentsService, AdmissionRejectionReasonRow } from "../../services/admission-documents.service";
import { getApiErrorMessage } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import NumericTextField from "../../components/ui/NumericTextField";

const emptyForm = {
  label: "",
  code: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdmissionRejectionReasonsSettings() {
  const [rows, setRows] = useState<AdmissionRejectionReasonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast, showToast, clearToast } = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await admissionDocumentsService.listRejectionReasonsForManagement();
      setRows(data);
    } catch (e) {
      showToast(getApiErrorMessage(e, "Error al cargar los motivos"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sortOrder: rows.length > 0 ? Math.max(...rows.map((r) => r.sortOrder)) + 1 : 0 });
    setDialogOpen(true);
  };

  const openEdit = (r: AdmissionRejectionReasonRow) => {
    setEditingId(r.id);
    setForm({
      label: r.label,
      code: r.code ?? "",
      sortOrder: r.sortOrder,
      isActive: r.isActive,
    });
    setDialogOpen(true);
  };

  const handleSaveDialog = async () => {
    const label = form.label.trim();
    if (!label) {
      showToast("Indica el texto del motivo", "error");
      return;
    }
    try {
      setSaving(true);
      if (editingId == null) {
        await admissionDocumentsService.createRejectionReason({
          label,
          code: form.code.trim() || null,
          sortOrder: form.sortOrder,
          isActive: form.isActive,
        });
        showToast("Motivo creado");
      } else {
        await admissionDocumentsService.updateRejectionReason(editingId, {
          label,
          code: form.code.trim() || null,
          sortOrder: form.sortOrder,
          isActive: form.isActive,
        });
        showToast("Motivo actualizado");
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      showToast(getApiErrorMessage(e, "Error al guardar"), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        Cargando motivos de rechazo…
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
        Motivos de rechazo
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Textos que el administrador puede elegir al rechazar un documento de admisión. Los inactivos no aparecen
        al revisar documentos, pero se conservan en el historial.
      </Typography>

      <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ mb: 2 }}>
        Nuevo motivo
      </Button>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={72}>Orden</TableCell>
              <TableCell width={200}>Código</TableCell>
              <TableCell>Etiqueta</TableCell>
              <TableCell width={100} align="center">
                Activo
              </TableCell>
              <TableCell width={72} align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.sortOrder}</TableCell>
                <TableCell sx={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8rem" }}>
                  {r.code ?? "—"}
                </TableCell>
                <TableCell>{r.label}</TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    label={r.isActive ? "Sí" : "No"}
                    color={r.isActive ? "success" : "default"}
                    variant={r.isActive ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    aria-label="Editar"
                    onClick={() => openEdit(r)}
                    color="primary"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId == null ? "Nuevo motivo de rechazo" : "Editar motivo de rechazo"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            label="Texto mostrado"
            fullWidth
            required
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            helperText="Se muestra al estudiante y en las solicitudes de registro."
          />
          <TextField
            margin="normal"
            label="Código interno (opcional)"
            fullWidth
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            helperText="Mayúsculas y guion bajo; ej. FALTANTE_LEGIBLE. El código «OTHER» hace obligatorio un comentario al rechazar."
            placeholder="EJ: OTRO"
          />
          <NumericTextField
            label="Orden de lista"
            value={form.sortOrder}
            onValueChange={(sortOrder) => setForm((f) => ({ ...f, sortOrder }))}
            min={0}
            max={9999}
            integer
            fullWidth
            margin="normal"
            helperText="Menor primero al elegir motivo y en tablas."
          />
          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Switch
                checked={form.isActive}
                onChange={(_, isActive) => setForm((f) => ({ ...f, isActive }))}
              />
            }
            label="Activo (visible al rechazar documentos)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSaveDialog} variant="contained" disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
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
