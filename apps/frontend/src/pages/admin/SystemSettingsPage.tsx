import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import SaveIcon from "@mui/icons-material/Save";
import { useToast } from "../../hooks/useToast";
import { systemSettingsService } from "../../services/system-settings.service";

interface SettingsForm {
  passingGrade: number;
  maxSubjectsPerEnrollment: number;
  maxEvaluationWeight: number;
  atRiskThreshold: number;
}

const defaultForm: SettingsForm = {
  passingGrade: 60,
  maxSubjectsPerEnrollment: 7,
  maxEvaluationWeight: 100,
  atRiskThreshold: 3,
};

export default function SystemSettingsPage() {
  const [form, setForm] = useState<SettingsForm>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await systemSettingsService.get();
        setForm({
          passingGrade: Number(data.passingGrade),
          maxSubjectsPerEnrollment: data.maxSubjectsPerEnrollment,
          maxEvaluationWeight: Number(data.maxEvaluationWeight),
          atRiskThreshold: data.atRiskThreshold,
        });
        setUpdatedAt(data.updatedAt);
      } catch {
        showToast("Error al cargar configuración", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const data = await systemSettingsService.update(form);
      setUpdatedAt(data.updatedAt);
      showToast("Configuración guardada");
    } catch {
      showToast("Error al guardar configuración", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Configuración del Sistema
        </Typography>
        <Typography color="text.secondary">Cargando...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Configuración del Sistema
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Parámetros Académicos
        </Typography>

        <TextField
          label="Calificación aprobatoria"
          type="number"
          value={form.passingGrade}
          onChange={(e) =>
            setForm({
              ...form,
              passingGrade: Math.max(0, Math.min(100, Number(e.target.value))),
            })
          }
          inputProps={{ min: 0, max: 100, step: 1 }}
          helperText="Calificación mínima para aprobar una materia (escala 0–100)"
          fullWidth
          margin="normal"
        />

        <TextField
          label="Máx. materias por inscripción"
          type="number"
          value={form.maxSubjectsPerEnrollment}
          onChange={(e) =>
            setForm({
              ...form,
              maxSubjectsPerEnrollment: Math.max(
                1,
                Math.min(20, Math.round(Number(e.target.value))),
              ),
            })
          }
          inputProps={{ min: 1, max: 20, step: 1 }}
          helperText="Número máximo de materias que un estudiante puede inscribir por período"
          fullWidth
          margin="normal"
        />

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Parámetros de Evaluación
        </Typography>

        <TextField
          label="Peso máximo de evaluaciones"
          type="number"
          value={form.maxEvaluationWeight}
          onChange={(e) =>
            setForm({
              ...form,
              maxEvaluationWeight: Math.max(1, Number(e.target.value)),
            })
          }
          inputProps={{ min: 1, step: 1 }}
          helperText="Suma máxima de los pesos de evaluaciones por grupo"
          fullWidth
          margin="normal"
        />

        <TextField
          label="Umbral de riesgo académico"
          type="number"
          value={form.atRiskThreshold}
          onChange={(e) =>
            setForm({
              ...form,
              atRiskThreshold: Math.max(
                1,
                Math.min(20, Math.round(Number(e.target.value))),
              ),
            })
          }
          inputProps={{ min: 1, max: 20, step: 1 }}
          helperText="Cantidad de materias reprobadas para marcar al estudiante como EN RIESGO"
          fullWidth
          margin="normal"
        />

        <Divider sx={{ my: 2 }} />

        <Box className="flex justify-between items-center">
          <Box>
            {updatedAt && (
              <Typography variant="caption" color="text.secondary">
                Última actualización:{" "}
                {new Date(updatedAt).toLocaleString("es-MX")}
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </Box>
      </Paper>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
