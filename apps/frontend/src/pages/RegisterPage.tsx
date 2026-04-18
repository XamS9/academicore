import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SchoolIcon from "@mui/icons-material/School";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { careersService } from "../services/careers.service";
import { api, getApiErrorMessage } from "../services/api";
import {
  admissionDocumentsService,
  type RequiredDocType,
} from "../services/admission-documents.service";

interface Career {
  id: string;
  name: string;
  code: string;
  totalSemesters: number;
  isActive: boolean;
}

interface UploadedDoc {
  type: string;
  fileName: string;
}

const STEPS = [
  "Datos personales",
  "Seleccionar carrera",
  "Confirmar",
  "Subir documentos",
];

export default function RegisterPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [careers, setCareers] = useState<Career[]>([]);
  const [loadingCareers, setLoadingCareers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Form data
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);

  // Document upload step
  const [uploadToken, setUploadToken] = useState("");
  const [requiredTypes, setRequiredTypes] = useState<RequiredDocType[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    careersService
      .getAll()
      .then((data: Career[]) => setCareers(data.filter((c) => c.isActive)))
      .catch(() => setError("No se pudieron cargar las carreras."))
      .finally(() => setLoadingCareers(false));
  }, []);

  // ─── Step validation ────────────────────────────────────────────────────────

  const validateStep1 = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Nombre y apellido son requeridos.");
      return false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ingresa un correo electrónico válido.");
      return false;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError("");
    if (step === 0 && !validateStep1()) return;
    if (step === 1 && !selectedCareer) {
      setError("Por favor selecciona una carrera.");
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError("");
    setStep((s) => s - 1);
  };

  // ─── Submit registration & advance to docs ─────────────────────────────────

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/auth/register", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        careerId: selectedCareer!.id,
      });
      setUploadToken(res.data.uploadToken);

      // Load required doc types
      const types = await admissionDocumentsService.getRequiredTypes();
      setRequiredTypes(types);

      setStep(3);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err, "Error al registrarse. Intenta de nuevo."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Upload a document ──────────────────────────────────────────────────────

  const handleUploadDoc = async (
    docType: string,
    file: File,
  ) => {
    setError("");
    setUploading(true);
    try {
      const uploaded = await admissionDocumentsService.uploadFile(
        file,
        uploadToken,
      );
      await admissionDocumentsService.create(
        {
          type: docType,
          fileKey: uploaded.key,
          fileName: uploaded.originalName,
          fileSize: uploaded.size,
          fileMimeType: uploaded.mimeType,
        },
        uploadToken,
      );
      setUploadedDocs((prev) => [
        ...prev.filter((d) => d.type !== docType),
        { type: docType, fileName: uploaded.originalName },
      ]);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Error al subir documento"));
    } finally {
      setUploading(false);
    }
  };

  const allDocsUploaded = requiredTypes.every((rt) =>
    uploadedDocs.some((d) => d.type === rt.type),
  );

  // ─── Success screen ─────────────────────────────────────────────────────────

  if (done) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        }}
      >
        <Card sx={{ maxWidth: 480, width: "100%", mx: 2 }}>
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            <CheckCircleOutlineIcon
              sx={{ fontSize: 64, color: "success.main", mb: 2 }}
            />
            <Typography variant="h5" fontWeight={800} gutterBottom>
              ¡Registro exitoso!
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
              Tu solicitud y documentos han sido recibidos. Un administrador
              revisará tu cuenta y la activará en breve.
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              Recibirás una notificación cuando tu acceso esté habilitado.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate("/login")}
              sx={{ fontWeight: 700 }}
            >
              Volver al inicio de sesión
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // ─── Main form ──────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        py: 4,
      }}
    >
      <Card
        sx={{
          maxWidth: step === 1 ? 720 : step === 3 ? 560 : 480,
          width: "100%",
          mx: 2,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "14px",
                background:
                  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1.5,
                boxShadow: "0 8px 24px rgba(99,102,241,0.3)",
              }}
            >
              <SchoolIcon sx={{ fontSize: 28, color: "white" }} />
            </Box>
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{ letterSpacing: "-0.02em" }}
            >
              Crear cuenta
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Academicore — Registro de estudiante
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={step} sx={{ mb: 4 }}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          )}

          {/* ── Step 0: Personal info ── */}
          {step === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Nombre"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  fullWidth
                  margin="dense"
                  autoFocus
                />
                <TextField
                  label="Apellido"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  fullWidth
                  margin="dense"
                />
              </Box>
              <TextField
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                margin="dense"
              />
              <TextField
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                margin="dense"
                helperText="Mínimo 6 caracteres"
              />
              <TextField
                label="Confirmar contraseña"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                margin="dense"
              />
            </Box>
          )}

          {/* ── Step 1: Career selection ── */}
          {step === 1 && (
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Elige la carrera en la que deseas inscribirte.
              </Typography>
              {loadingCareers ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    py: 4,
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {careers.map((career) => {
                    const selected = selectedCareer?.id === career.id;
                    return (
                      <Grid item xs={12} sm={6} key={career.id}>
                        <Card
                          variant="outlined"
                          sx={{
                            border: selected
                              ? "2px solid #6366f1"
                              : "1px solid",
                            borderColor: selected ? "#6366f1" : "divider",
                            bgcolor: selected
                              ? "rgba(99,102,241,0.06)"
                              : "background.paper",
                            transition: "all 0.15s",
                          }}
                        >
                          <CardActionArea
                            onClick={() => setSelectedCareer(career)}
                            sx={{ p: 2 }}
                          >
                            <Typography
                              variant="subtitle2"
                              fontWeight={700}
                            >
                              {career.name}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                mt: 1,
                                flexWrap: "wrap",
                              }}
                            >
                              <Chip
                                label={career.code}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={`${career.totalSemesters} semestres`}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          </CardActionArea>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          )}

          {/* ── Step 2: Confirm ── */}
          {step === 2 && selectedCareer && (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              <Typography variant="body2" color="text.secondary">
                Revisa tus datos antes de enviar la solicitud.
              </Typography>
              <Box
                sx={{
                  bgcolor: "action.hover",
                  borderRadius: 2,
                  p: 2.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Nombre
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {firstName} {lastName}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Correo
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {email}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Carrera
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedCareer.name}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Duración
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedCareer.totalSemesters} semestres
                  </Typography>
                </Box>
              </Box>
              <Alert severity="info" icon={false}>
                Después de enviar tu solicitud, deberás{" "}
                <strong>subir tus documentos de admisión</strong>. Tu cuenta
                quedará pendiente de aprobación.
              </Alert>
            </Box>
          )}

          {/* ── Step 3: Upload documents ── */}
          {step === 3 && (
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Sube los documentos requeridos para completar tu registro.
                Todos son obligatorios.
              </Typography>
              <List>
                {requiredTypes.map((rt) => {
                  const uploaded = uploadedDocs.find(
                    (d) => d.type === rt.type,
                  );
                  return (
                    <ListItem key={rt.type} sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {uploaded ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <UploadFileIcon color="disabled" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={rt.label}
                        secondary={
                          uploaded
                            ? uploaded.fileName
                            : "Pendiente de subir"
                        }
                      />
                      <Button
                        component="label"
                        size="small"
                        variant={uploaded ? "text" : "outlined"}
                        startIcon={<AttachFileIcon />}
                        disabled={uploading}
                      >
                        {uploaded ? "Cambiar" : "Subir"}
                        <input
                          type="file"
                          hidden
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadDoc(rt.type, file);
                            e.target.value = "";
                          }}
                        />
                      </Button>
                    </ListItem>
                  );
                })}
              </List>
              {uploading && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 1,
                  }}
                >
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">
                    Subiendo...
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Navigation buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 4,
            }}
          >
            {step < 3 ? (
              <Button onClick={handleBack} disabled={step === 0}>
                Atrás
              </Button>
            ) : (
              <Box />
            )}
            {step < 2 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{ fontWeight: 700 }}
              >
                Siguiente
              </Button>
            ) : step === 2 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting}
                sx={{ fontWeight: 700 }}
              >
                {submitting ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  "Enviar solicitud"
                )}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => setDone(true)}
                disabled={!allDocsUploaded || uploading}
                sx={{ fontWeight: 700 }}
              >
                Finalizar
              </Button>
            )}
          </Box>

          {/* Login link */}
          {step < 3 && (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ mt: 3 }}
            >
              ¿Ya tienes cuenta?{" "}
              <Link
                to="/login"
                style={{ color: "#6366f1", fontWeight: 600 }}
              >
                Iniciar sesión
              </Link>
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
