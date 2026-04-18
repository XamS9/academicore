import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadIcon from "@mui/icons-material/Upload";
import { useToast } from "../../hooks/useToast";
import { systemSettingsService } from "../../services/system-settings.service";

interface SignatureBlock {
  image: string | null;
  name: string;
  title: string;
}

interface SettingsForm {
  passingGrade: number;
  maxSubjectsPerEnrollment: number;
  maxEvaluationWeight: number;
  atRiskThreshold: number;
  creditCost: number;
  inscriptionFee: number;
  cyclesPerYear: 1 | 2 | 3 | 4 | 6 | 12;
  maxCreditsPerSubject: number;
  sig1: SignatureBlock;
  sig2: SignatureBlock;
}

const defaultForm: SettingsForm = {
  passingGrade: 60,
  maxSubjectsPerEnrollment: 7,
  maxEvaluationWeight: 100,
  atRiskThreshold: 3,
  creditCost: 0,
  inscriptionFee: 5000,
  cyclesPerYear: 2,
  maxCreditsPerSubject: 24,
  sig1: { image: null, name: "", title: "" },
  sig2: { image: null, name: "", title: "" },
};

function SignatureUpload({
  label,
  value,
  onChange,
}: {
  label: string;
  value: SignatureBlock;
  onChange: (v: SignatureBlock) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange({ ...value, image: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        {label}
      </Typography>

      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
        <Box
          sx={{
            width: 200,
            height: 80,
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "grey.50",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {value.image ? (
            <img
              src={value.image}
              alt="Firma"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <Typography variant="caption" color="text.disabled">
              Sin imagen
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFile}
          />
          <Button
            size="small"
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => inputRef.current?.click()}
          >
            Subir imagen
          </Button>
          {value.image && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => onChange({ ...value, image: null })}
            >
              Quitar
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mt: 1.5 }}>
        <TextField
          label="Nombre"
          size="small"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          sx={{ flex: 1 }}
        />
        <TextField
          label="Cargo / Título"
          size="small"
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          sx={{ flex: 1 }}
        />
      </Box>
    </Box>
  );
}

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
          creditCost: Number(data.creditCost ?? 0),
          inscriptionFee: Number(data.inscriptionFee ?? 5000),
          cyclesPerYear: (data.cyclesPerYear ?? 2) as SettingsForm["cyclesPerYear"],
          maxCreditsPerSubject: Number(data.maxCreditsPerSubject ?? 24),
          sig1: {
            image: data.signatureImage1 ?? null,
            name: data.signatureName1 ?? "",
            title: data.signatureTitle1 ?? "",
          },
          sig2: {
            image: data.signatureImage2 ?? null,
            name: data.signatureName2 ?? "",
            title: data.signatureTitle2 ?? "",
          },
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
      const data = await systemSettingsService.update({
        passingGrade: form.passingGrade,
        maxSubjectsPerEnrollment: form.maxSubjectsPerEnrollment,
        maxEvaluationWeight: form.maxEvaluationWeight,
        atRiskThreshold: form.atRiskThreshold,
        creditCost: form.creditCost,
        inscriptionFee: form.inscriptionFee,
        cyclesPerYear: form.cyclesPerYear,
        maxCreditsPerSubject: form.maxCreditsPerSubject,
        signatureImage1: form.sig1.image,
        signatureName1: form.sig1.name || null,
        signatureTitle1: form.sig1.title || null,
        signatureImage2: form.sig2.image,
        signatureName2: form.sig2.name || null,
        signatureTitle2: form.sig2.title || null,
      });
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

      <Paper sx={{ p: 3 }}>
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
          Costos
        </Typography>

        <TextField
          label="Costo por crédito"
          type="number"
          value={form.creditCost}
          onChange={(e) =>
            setForm({
              ...form,
              creditCost: Math.max(0, Number(e.target.value)),
            })
          }
          inputProps={{ min: 0, step: "0.01" }}
          helperText="Tarifa global por crédito. Se multiplica por los créditos de cada materia para calcular la matrícula (salvo que la materia tenga un monto fijo)."
          fullWidth
          margin="normal"
        />

        <TextField
          label="Cuota de inscripción por período"
          type="number"
          value={form.inscriptionFee}
          onChange={(e) =>
            setForm({
              ...form,
              inscriptionFee: Math.max(0, Number(e.target.value)),
            })
          }
          inputProps={{ min: 0, step: "0.01" }}
          helperText="Monto del cargo automático cuando el estudiante se inscribe por primera vez a un grupo en un período académico (requiere un concepto de cobro activo cuyo nombre contenga «inscripci»). En 0 no se genera ese cargo."
          fullWidth
          margin="normal"
        />

        <TextField
          select
          label="Ciclos académicos por año"
          value={form.cyclesPerYear}
          onChange={(e) =>
            setForm({
              ...form,
              cyclesPerYear: Number(e.target.value) as SettingsForm["cyclesPerYear"],
            })
          }
          helperText="Define cuántas mensualidades tiene un período: 12 ÷ ciclos (ej. 2 ciclos → 6 meses por período). Las cuotas mensuales se generan después de pagar la inscripción (si aplica)."
          fullWidth
          margin="normal"
        >
          {([1, 2, 3, 4, 6, 12] as const).map((c) => (
            <MenuItem key={c} value={c}>
              {c} ({12 / c} meses por ciclo)
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Máx. créditos por materia"
          type="number"
          value={form.maxCreditsPerSubject}
          onChange={(e) =>
            setForm({
              ...form,
              maxCreditsPerSubject: Math.max(
                1,
                Math.min(99, Math.round(Number(e.target.value))),
              ),
            })
          }
          inputProps={{ min: 1, max: 99, step: 1 }}
          helperText="Cantidad máxima de créditos que puede tener una sola materia en el catálogo. No podrá bajar este valor si ya existen materias con más créditos."
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
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Firmas Digitales para Certificaciones
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Las imágenes aparecerán en el PDF de las certificaciones. Se recomienda usar imágenes con fondo transparente (PNG).
        </Typography>

        <SignatureUpload
          label="Firma 1 (Autoridad Emisora)"
          value={form.sig1}
          onChange={(v) => setForm({ ...form, sig1: v })}
        />

        <SignatureUpload
          label="Firma 2 (Director Académico)"
          value={form.sig2}
          onChange={(v) => setForm({ ...form, sig2: v })}
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
