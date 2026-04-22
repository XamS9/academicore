import React, { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";

import SchoolIcon from "@mui/icons-material/School";
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import LockOpenIcon from "@mui/icons-material/LockOpen";

import { useParams } from "react-router-dom";
import { api } from "../../services/api";
import type { CertificationStatus, CertificationType } from "../../types";

const certTypeLabels: Record<CertificationType, string> = {
  TRANSCRIPT: "Historial Académico",
  DEGREE: "Título Profesional",
  COMPLETION: "Certificado de Terminación",
};

const certStatusMap: Record<
  CertificationStatus,
  { label: string; color: "success" | "error" | "warning" }
> = {
  ACTIVE: { label: "ACTIVO", color: "success" },
  REVOKED: { label: "REVOCADO", color: "error" },
  EXPIRED: { label: "VENCIDO", color: "warning" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

interface CertResult {
  found: boolean;
  data: Record<string, unknown> | null;
}

export default function ValidateCertPage() {
  const { code: urlCode } = useParams<{ code: string }>();
  const [code, setCode] = useState(urlCode ?? "");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertResult | null>(null);

  const handleValidate = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/certifications/verify/${code.trim()}`);
      setResult({ found: true, data });
    } catch {
      setResult({ found: false, data: null });
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleValidate();
  };

  return (
    <Box
      className="min-h-screen flex flex-col items-center justify-start pt-12 pb-12"
      sx={{ backgroundColor: "background.default", px: 2 }}
    >
      {/* Branding header */}
      <Box className="flex flex-col items-center mb-8">
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            backgroundColor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
          }}
        >
          <SchoolIcon sx={{ fontSize: 40, color: "white" }} />
        </Box>
        <Typography variant="h5" fontWeight={700} color="primary.main">
          Academicore
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Instituto Tecnológico Superior
        </Typography>
      </Box>

      {/* Main card */}
      <Card sx={{ width: "100%", maxWidth: 560 }} elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Box className="flex items-center gap-2 mb-2">
            <VerifiedIcon color="primary" />
            <Typography variant="h5" fontWeight={700}>
              Validación de Certificados
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ingrese el código de verificación del certificado para validar su
            autenticidad e integridad en el sistema Academicore.
          </Typography>

          <Box className="flex gap-2 mb-3">
            <TextField
              label="Código de verificación"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              fullWidth
              size="small"
              placeholder="Ej: ACAD-2024-A1B2C3D4"
              inputProps={{ style: { fontFamily: "monospace" } }}
            />
            <Button
              variant="contained"
              onClick={handleValidate}
              disabled={!code.trim() || loading}
              startIcon={
                loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <VerifiedIcon />
                )
              }
              sx={{ whiteSpace: "nowrap" }}
            >
              Validar
            </Button>
          </Box>

          {/* Result: valid */}
          {searched && result?.found && result.data && (
            <Paper
              sx={{
                p: 3,
                border: "2px solid",
                borderColor: "success.main",
                borderRadius: 2,
                backgroundColor: "success.50",
              }}
            >
              <Box className="flex items-center gap-2 mb-2">
                <CheckCircleIcon color="success" />
                <Typography variant="h6" fontWeight={700} color="success.main">
                  Certificado Válido
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box className="flex flex-col gap-1">
                {(result.data as Record<string, unknown>).studentName !=
                  null && (
                  <Typography variant="body2">
                    <strong>Estudiante:</strong>{" "}
                    {String(
                      (result.data as Record<string, unknown>).studentName,
                    )}
                  </Typography>
                )}
                {(result.data as Record<string, unknown>).career != null && (
                  <Typography variant="body2">
                    <strong>Carrera:</strong>{" "}
                    {String((result.data as Record<string, unknown>).career)}
                  </Typography>
                )}
                {(result.data as Record<string, unknown>).type != null && (
                  <Typography variant="body2">
                    <strong>Tipo de Certificado:</strong>{" "}
                    {certTypeLabels[
                      (result.data as Record<string, unknown>)
                        .type as CertificationType
                    ] ?? String((result.data as Record<string, unknown>).type)}
                  </Typography>
                )}
                {(result.data as Record<string, unknown>).issuedAt != null && (
                  <Typography variant="body2">
                    <strong>Fecha de Emisión:</strong>{" "}
                    {formatDate(
                      String((result.data as Record<string, unknown>).issuedAt),
                    )}
                  </Typography>
                )}
                {(result.data as Record<string, unknown>).expiresAt != null && (
                  <Typography variant="body2">
                    <strong>Fecha de Vencimiento:</strong>{" "}
                    {formatDate(
                      String(
                        (result.data as Record<string, unknown>).expiresAt,
                      ),
                    )}
                  </Typography>
                )}
                {(result.data as Record<string, unknown>).status != null && (
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={
                        certStatusMap[
                          (result.data as Record<string, unknown>)
                            .status as CertificationStatus
                        ]?.label ??
                        String((result.data as Record<string, unknown>).status)
                      }
                      color={
                        certStatusMap[
                          (result.data as Record<string, unknown>)
                            .status as CertificationStatus
                        ]?.color ?? "default"
                      }
                      size="small"
                      icon={<CheckCircleIcon />}
                    />
                  </Box>
                )}
              </Box>
            </Paper>
          )}

          {/* Result: not found */}
          {searched && result !== null && !result.found && (
            <Paper
              sx={{
                p: 3,
                border: "2px solid",
                borderColor: "error.main",
                borderRadius: 2,
                backgroundColor: "error.50",
              }}
            >
              <Box className="flex items-center gap-2 mb-1">
                <ErrorIcon color="error" />
                <Typography variant="h6" fontWeight={700} color="error.main">
                  Certificado no encontrado o inválido
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                El código ingresado no corresponde a ningún certificado
                registrado o activo en el sistema. Verifique el código e intente
                nuevamente.
              </Typography>
            </Paper>
          )}

          <Divider sx={{ my: 3 }} />

          <Alert
            severity="info"
            icon={<LockOpenIcon />}
            sx={{ fontSize: "0.8rem" }}
          >
            <strong>Solo se muestran datos básicos.</strong> Este portal no
            requiere inicio de sesión y está disponible públicamente para
            verificación por terceros (empleadores, instituciones educativas,
            etc.).
          </Alert>
        </CardContent>
      </Card>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 3, textAlign: "center" }}
      >
        © {new Date().getFullYear()} Academicore — Sistema de Gestión Académica
        Institucional
      </Typography>
    </Box>
  );
}
