import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";

import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BlockIcon from "@mui/icons-material/Block";
import DownloadIcon from "@mui/icons-material/Download";
import SchoolIcon from "@mui/icons-material/School";
import VerifiedIcon from "@mui/icons-material/Verified";
import LinkIcon from "@mui/icons-material/Link";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { useAuth } from "../../store/auth.context";
import { certificationsService } from "../../services/certifications.service";
import { api } from "../../services/api";
import type { CertificationStatus, CertificationType } from "../../types";

// ─── Shared types ─────────────────────────────────────────────────────────────

interface CriteriaItem {
  id: string;
  certificationType: CertificationType;
  minGrade: number;
  validityMonths: number;
  description?: string;
  career?: { name: string } | null;
}

interface CertItem {
  id: string;
  certificationType: CertificationType;
  status: CertificationStatus;
  verificationCode: string;
  documentHash: string;
  issuedAt: string;
  expiresAt: string | null;
  issuedBy: string;
  student: { user: { firstName: string; lastName: string } };
  career: { name: string } | null;
  issuer: { firstName: string; lastName: string } | null;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ py: 3 }}>
      {value === index && children}
    </Box>
  );
}

const certTypeLabels: Record<CertificationType, string> = {
  TRANSCRIPT: "Historial Académico",
  ENROLLMENT_PROOF: "Comprobante de Inscripción",
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

function CertStatusChip({ status }: { status: CertificationStatus }) {
  const { label, color } = certStatusMap[status] ?? {
    label: status,
    color: "warning",
  };
  return <Chip label={label} color={color} size="small" />;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Tab 1 — Criteria ─────────────────────────────────────────────────────────

function CriteriasTab({ canEdit }: { canEdit: boolean }) {
  const [criteria, setCriteria] = useState<CriteriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    certificationType: "TRANSCRIPT" as CertificationType,
    minGrade: 6.0,
    validityMonths: 12,
    description: "",
  });

  useEffect(() => {
    certificationsService
      .getCriteria()
      .then((data: CriteriaItem[]) => setCriteria(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    setSaving(true);
    try {
      const newEntry = await api
        .post("/certifications/criteria", form)
        .then((r) => r.data);
      setCriteria((prev) => [newEntry, ...prev]);
      setDialogOpen(false);
      setForm({
        certificationType: "TRANSCRIPT",
        minGrade: 6.0,
        validityMonths: 12,
        description: "",
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box className="flex justify-center py-8">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box className="flex items-center justify-between mb-3">
        <Typography variant="h6" fontWeight={600}>
          Criterios de Certificación
        </Typography>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="small"
            onClick={() => setDialogOpen(true)}
          >
            Agregar Criterio
          </Button>
        )}
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "grey.100" }}>
              <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Carrera</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                Cal. Mínima
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                Vigencia (meses)
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Descripción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {criteria.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>
                  <Chip
                    label={
                      certTypeLabels[c.certificationType] ?? c.certificationType
                    }
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{c.career?.name ?? "—"}</TableCell>
                <TableCell align="center">
                  {Number(c.minGrade).toFixed(1)}
                </TableCell>
                <TableCell align="center">{c.validityMonths}</TableCell>
                <TableCell sx={{ maxWidth: 300 }}>
                  <Typography variant="caption">
                    {c.description ?? "—"}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
            {criteria.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 2 }}
                  >
                    Sin criterios registrados
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {canEdit && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Agregar Criterio de Certificación</DialogTitle>
          <DialogContent className="flex flex-col gap-4 pt-2">
            <FormControl fullWidth size="small" sx={{ mt: 1 }}>
              <InputLabel>Tipo de Certificado</InputLabel>
              <Select
                value={form.certificationType}
                label="Tipo de Certificado"
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    certificationType: e.target.value as CertificationType,
                  }))
                }
              >
                {Object.entries(certTypeLabels).map(([k, v]) => (
                  <MenuItem key={k} value={k}>
                    {v}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Calificación Mínima"
              type="number"
              value={form.minGrade}
              onChange={(e) =>
                setForm((f) => ({ ...f, minGrade: parseFloat(e.target.value) }))
              }
              fullWidth
              size="small"
              inputProps={{ min: 0, max: 10, step: 0.5 }}
            />
            <TextField
              label="Vigencia (meses)"
              type="number"
              value={form.validityMonths}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  validityMonths: parseInt(e.target.value),
                }))
              }
              fullWidth
              size="small"
              inputProps={{ min: 1, max: 60 }}
            />
            <TextField
              label="Descripción"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleAdd} disabled={saving}>
              Agregar
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

// ─── Tab 2 — Issued certs ─────────────────────────────────────────────────────

function IssuedCertsTab({ onRevoke }: { onRevoke?: () => void }) {
  const [filter, setFilter] = useState<CertificationStatus | "ALL">("ALL");
  const [certs, setCerts] = useState<CertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = () => {
    setLoading(true);
    certificationsService
      .getAll()
      .then((data: CertItem[]) => setCerts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered =
    filter === "ALL" ? certs : certs.filter((c) => c.status === filter);

  const handleRevoke = async (id: string) => {
    const reason = prompt("Motivo de revocación:");
    if (!reason) return;
    try {
      await certificationsService.revoke(id, reason);
      load();
      onRevoke?.();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Cada certificación está vinculada al historial académico del estudiante
        y puede ser validada públicamente mediante su código de verificación.
      </Alert>

      <Box className="flex items-center gap-3 mb-3">
        <Typography variant="h6" fontWeight={600}>
          Certificaciones Emitidas
        </Typography>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Filtrar por estado</InputLabel>
          <Select
            value={filter}
            label="Filtrar por estado"
            onChange={(e) =>
              setFilter(e.target.value as CertificationStatus | "ALL")
            }
          >
            <MenuItem value="ALL">Todos</MenuItem>
            <MenuItem value="ACTIVE">Activos</MenuItem>
            <MenuItem value="REVOKED">Revocados</MenuItem>
            <MenuItem value="EXPIRED">Vencidos</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box className="flex justify-center py-8">
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "grey.100" }}>
                <TableCell sx={{ fontWeight: 700 }}>Estudiante</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  Código Verificación
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">
                  Estado
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fecha Emisión</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Vence</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((cert) => (
                <TableRow key={cert.id} hover>
                  <TableCell>
                    {cert.student.user.firstName} {cert.student.user.lastName}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        certTypeLabels[cert.certificationType] ??
                        cert.certificationType
                      }
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" fontFamily="monospace">
                      {cert.verificationCode}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <CertStatusChip status={cert.status} />
                  </TableCell>
                  <TableCell>{formatDate(cert.issuedAt)}</TableCell>
                  <TableCell>{formatDate(cert.expiresAt)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Abrir portal público">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() =>
                          window.open(
                            `/verify/${cert.verificationCode}`,
                            "_blank",
                          )
                        }
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Copiar enlace de verificación">
                      <IconButton
                        size="small"
                        onClick={() => {
                          navigator.clipboard
                            .writeText(
                              `${window.location.origin}/verify/${cert.verificationCode}`,
                            )
                            .then(() => setCopied(true));
                        }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {cert.status === "ACTIVE" && (
                      <Tooltip title="Revocar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRevoke(cert.id)}
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 2 }}
                    >
                      Sin certificaciones
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Snackbar
        open={copied}
        autoHideDuration={2500}
        onClose={() => setCopied(false)}
        message="Enlace copiado al portapapeles"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}

// ─── Tab 3 — Digital cert ─────────────────────────────────────────────────────

function DigitalCertTab() {
  const [certs, setCerts] = useState<CertItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (verificationCode: string) => {
    const url = `${window.location.origin}/verify/${verificationCode}`;
    navigator.clipboard.writeText(url).then(() => setCopied(true));
  };

  useEffect(() => {
    certificationsService
      .getAll()
      .then((data: CertItem[]) => setCerts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cert = certs[index];

  if (loading) {
    return (
      <Box className="flex justify-center py-8">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {certs.length > 1 && (
        <Box className="flex items-center gap-2 mb-3">
          <IconButton
            size="small"
            onClick={() => setIndex((i) => i - 1)}
            disabled={index === 0}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            Certificado {index + 1} de {certs.length}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setIndex((i) => i + 1)}
            disabled={index === certs.length - 1}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      )}

      {!cert ? (
        <Alert severity="info">No hay certificaciones emitidas aún.</Alert>
      ) : (
        <>
          {/* Certificate document mockup */}
          <Paper
            variant="outlined"
            sx={{
              maxWidth: 600,
              p: 4,
              border: "3px solid",
              borderColor: "primary.main",
              borderRadius: 2,
              background: "linear-gradient(135deg, #f8fbff 0%, #ffffff 100%)",
            }}
          >
            {/* Header */}
            <Box className="flex items-center justify-center gap-3 mb-4">
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SchoolIcon sx={{ color: "white", fontSize: 28 }} />
              </Box>
              <Box className="text-center">
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  ACADEMICORE
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Instituto Tecnológico Superior
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Typography
              variant="h5"
              fontWeight={700}
              align="center"
              gutterBottom
            >
              {certTypeLabels[cert.certificationType] ?? cert.certificationType}
            </Typography>

            <Typography
              variant="body2"
              align="center"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              Se certifica que el/la estudiante
            </Typography>

            <Typography
              variant="h5"
              fontWeight={700}
              align="center"
              color="primary.main"
              sx={{ mb: 1 }}
            >
              {cert.student.user.firstName} {cert.student.user.lastName}
            </Typography>

            <Typography
              variant="body2"
              align="center"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              {cert.career?.name ?? "—"}
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Fecha de Emisión
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatDate(cert.issuedAt)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Fecha de Vencimiento
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatDate(cert.expiresAt)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Emitido por
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {cert.issuer
                    ? `${cert.issuer.firstName} ${cert.issuer.lastName}`
                    : cert.issuedBy}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Estado
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <CertStatusChip status={cert.status} />
                </Box>
              </Grid>
            </Grid>

            {/* Verification code box */}
            <Paper
              sx={{
                p: 2,
                backgroundColor: "grey.50",
                border: "1px dashed",
                borderColor: "grey.300",
                textAlign: "center",
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Código de Verificación
              </Typography>
              <Typography
                variant="body1"
                fontFamily="monospace"
                fontWeight={700}
                color="primary.main"
              >
                {cert.verificationCode}
              </Typography>
              <Box
                className="flex items-center justify-center gap-1"
                sx={{ mt: 0.5 }}
              >
                <Typography
                  variant="caption"
                  color="primary.main"
                  component="a"
                  href={`/verify/${cert.verificationCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ textDecoration: "underline", cursor: "pointer" }}
                >
                  {window.location.origin}/verify/{cert.verificationCode}
                </Typography>
                <Tooltip title="Copiar enlace">
                  <IconButton
                    size="small"
                    onClick={() => handleCopyLink(cert.verificationCode)}
                  >
                    <ContentCopyIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>

            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              align="center"
              sx={{ mt: 2 }}
            >
              Este documento ha sido emitido digitalmente por Academicore
            </Typography>
          </Paper>

          {/* Actions */}
          <Box className="flex gap-2 mt-3" sx={{ flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={async () => {
                try {
                  const blob = await certificationsService.downloadPdf(cert.id);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `certificado-${cert.verificationCode.slice(0, 8)}.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch {
                  alert("Error al descargar el certificado");
                }
              }}
            >
              Descargar PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={() => handleCopyLink(cert.verificationCode)}
            >
              Copiar enlace
            </Button>
            <Button
              variant="outlined"
              startIcon={<LinkIcon />}
              onClick={() =>
                window.open(`/verify/${cert.verificationCode}`, "_blank")
              }
            >
              Abrir portal público
            </Button>
          </Box>

          <Snackbar
            open={copied}
            autoHideDuration={2500}
            onClose={() => setCopied(false)}
            message="Enlace copiado al portapapeles"
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          />

          {/* Audit info */}
          <Alert severity="info" sx={{ mt: 2, maxWidth: 600 }}>
            <strong>Info de auditoría:</strong> Emitido el{" "}
            {formatDate(cert.issuedAt)}. Hash del documento:{" "}
            <code style={{ fontSize: "0.75em" }}>{cert.documentHash}</code>
          </Alert>
        </>
      )}
    </Box>
  );
}

// ─── Tab 5 — Third-party validation ──────────────────────────────────────────

interface VerifyResult {
  studentName: string;
  certificationType: CertificationType;
  issuedAt: string;
  status: CertificationStatus;
  expiresAt: string | null;
}

function ThirdPartyValidationTab() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<VerifyResult | null | "not-searched">(
    "not-searched",
  );
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const data: VerifyResult = await certificationsService.verify(
        code.trim(),
      );
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Interfaz pública — no requiere autenticación.</strong> Esta
        sección demuestra cómo terceros (empleadores, instituciones) pueden
        validar la autenticidad de un certificado emitido por Academicore
        mediante su código único de verificación.
      </Alert>

      <Typography variant="h6" fontWeight={600} gutterBottom>
        Validación por Terceros
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Ingrese el código de verificación del certificado para consultar su
        autenticidad. Esta funcionalidad está disponible en la ruta pública{" "}
        <code
          style={{
            backgroundColor: "#f1f5f9",
            padding: "2px 4px",
            borderRadius: 4,
          }}
        >
          /verify/:code
        </code>
        .
      </Typography>

      <Box className="flex gap-2 mb-3" sx={{ maxWidth: 500 }}>
        <TextField
          label="Código de verificación"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          fullWidth
          size="small"
          placeholder="UUID del certificado"
        />
        <Button
          variant="contained"
          onClick={handleValidate}
          startIcon={<VerifiedIcon />}
          disabled={loading}
        >
          Validar
        </Button>
      </Box>

      {loading && <CircularProgress size={24} />}

      {result !== "not-searched" && result !== null && !loading && (
        <Card
          sx={{
            maxWidth: 500,
            border: "2px solid",
            borderColor: "success.main",
          }}
        >
          <CardContent>
            <Box className="flex items-center gap-2 mb-2">
              <CheckCircleIcon color="success" />
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color="success.main"
              >
                Certificado Válido
              </Typography>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="body2">
              <strong>Estudiante:</strong> {result.studentName}
            </Typography>
            <Typography variant="body2">
              <strong>Tipo:</strong>{" "}
              {certTypeLabels[result.certificationType] ??
                result.certificationType}
            </Typography>
            <Typography variant="body2">
              <strong>Fecha de Emisión:</strong> {formatDate(result.issuedAt)}
            </Typography>
            <Typography variant="body2">
              <strong>Vence:</strong> {formatDate(result.expiresAt)}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <CertStatusChip status={result.status} />
            </Box>
          </CardContent>
        </Card>
      )}

      {result === null && !loading && (
        <Card
          sx={{ maxWidth: 500, border: "2px solid", borderColor: "error.main" }}
        >
          <CardContent>
            <Box className="flex items-center gap-2">
              <BlockIcon color="error" />
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color="error.main"
              >
                Certificado no encontrado o inválido
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              El código ingresado no corresponde a ningún certificado activo en
              el sistema.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Box sx={{ mt: 3 }}>
        <Button
          variant="text"
          startIcon={<LinkIcon />}
          onClick={() => window.open("/verify/" + code, "_blank")}
          size="small"
          disabled={!code.trim()}
        >
          Abrir portal público de validación
        </Button>
      </Box>
    </Box>
  );
}

// ─── Student certs tab ───────────────────────────────────────────────────────

function StudentCertsTab() {
  const [certs, setCerts] = useState<CertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await certificationsService.getMine();
        setCerts(data);
      } catch {
        // no certs or error
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Box className="flex justify-center py-8">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Mis Certificados
      </Typography>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "grey.100" }}>
              <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                Código Verificación
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                Estado
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Fecha Emisión</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Vence</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {certs.map((cert) => (
              <TableRow key={cert.id} hover>
                <TableCell>
                  <Chip
                    label={
                      certTypeLabels[cert.certificationType] ??
                      cert.certificationType
                    }
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" fontFamily="monospace">
                    {cert.verificationCode}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <CertStatusChip status={cert.status} />
                </TableCell>
                <TableCell>{formatDate(cert.issuedAt)}</TableCell>
                <TableCell>{formatDate(cert.expiresAt)}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Ver verificación">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() =>
                        window.open(
                          `/verify/${cert.verificationCode}`,
                          "_blank",
                        )
                      }
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Descargar PDF">
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={async () => {
                        try {
                          const blob = await certificationsService.downloadPdf(
                            cert.id,
                          );
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `certificado-${cert.verificationCode.slice(0, 8)}.pdf`;
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch {
                          alert("Error al descargar el certificado");
                        }
                      }}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {certs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 2 }}
                  >
                    No tienes certificaciones emitidas
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CertificationsPage() {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState(0);
  const isAdmin = currentUser?.role === "ADMIN";

  const adminTabs = [
    { label: "Criterios", component: <CriteriasTab canEdit /> },
    { label: "Emitidas", component: <IssuedCertsTab /> },
    { label: "Certificado Digital", component: <DigitalCertTab /> },
    { label: "Validación", component: <ThirdPartyValidationTab /> },
  ];

  const studentTabs = [
    {
      label: "Mis Certificados",
      component: <StudentCertsTab />,
    },
    { label: "Criterios", component: <CriteriasTab canEdit={false} /> },
    { label: "Validación", component: <ThirdPartyValidationTab /> },
  ];

  const tabs = isAdmin ? adminTabs : studentTabs;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {isAdmin ? "Gestión de Certificaciones" : "Mis Certificados"}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {isAdmin
          ? "Administración de certificaciones académicas digitales"
          : "Consulta y validación de tus certificaciones académicas"}
      </Typography>

      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <Tabs
          value={tab}
          onChange={(_e, v: number) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
        >
          {tabs.map((t, i) => (
            <Tab key={i} label={t.label} />
          ))}
        </Tabs>

        <Box sx={{ px: 3 }}>
          {tabs.map((t, i) => (
            <TabPanel key={i} value={tab} index={i}>
              {t.component}
            </TabPanel>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
