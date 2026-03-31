import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StorageIcon from "@mui/icons-material/Storage";
import TableChartIcon from "@mui/icons-material/TableChart";
import CodeIcon from "@mui/icons-material/Code";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";

interface TableInfo {
  name: string;
  columns: number;
  pkType: string;
  relationships: string;
}

interface DBCategory {
  label: string;
  color: "primary" | "secondary" | "success" | "warning";
  tables: TableInfo[];
}

const dbCategories: DBCategory[] = [
  {
    label: "Gestión de Usuarios",
    color: "primary",
    tables: [
      {
        name: "users",
        columns: 8,
        pkType: "SERIAL",
        relationships: "Base de students, teachers",
      },
      {
        name: "students",
        columns: 7,
        pkType: "SERIAL",
        relationships: "FK → users, careers; 1:N enrollments, academic_records",
      },
      {
        name: "teachers",
        columns: 6,
        pkType: "SERIAL",
        relationships: "FK → users; 1:N groups",
      },
      {
        name: "roles",
        columns: 4,
        pkType: "SERIAL",
        relationships: "M:N → users vía user_roles",
      },
      {
        name: "user_roles",
        columns: 3,
        pkType: "Compuesta",
        relationships: "Bridge: users ↔ roles (RBAC)",
      },
    ],
  },
  {
    label: "Estructura Académica",
    color: "secondary",
    tables: [
      {
        name: "careers",
        columns: 6,
        pkType: "SERIAL",
        relationships: "1:N subjects (vía career_subjects), students",
      },
      {
        name: "subjects",
        columns: 7,
        pkType: "SERIAL",
        relationships: "M:N → careers; M:N prerreq.; 1:N groups",
      },
      {
        name: "subject_prerequisites",
        columns: 3,
        pkType: "Compuesta",
        relationships: "Bridge: subjects ↔ subjects (prerrequisitos)",
      },
      {
        name: "career_subjects",
        columns: 4,
        pkType: "Compuesta",
        relationships: "Bridge: careers ↔ subjects",
      },
      {
        name: "academic_periods",
        columns: 7,
        pkType: "SERIAL",
        relationships: "1:N groups, enrollments",
      },
      {
        name: "classrooms",
        columns: 7,
        pkType: "SERIAL",
        relationships: "M:N → groups vía group_classrooms",
      },
    ],
  },
  {
    label: "Inscripciones y Evaluación",
    color: "success",
    tables: [
      {
        name: "groups",
        columns: 8,
        pkType: "SERIAL",
        relationships: "FK → subjects, teachers, periods; 1:N enrollments",
      },
      {
        name: "group_classrooms",
        columns: 3,
        pkType: "Compuesta",
        relationships: "Bridge: groups ↔ classrooms",
      },
      {
        name: "enrollments",
        columns: 7,
        pkType: "SERIAL",
        relationships: "FK → students, periods; 1:N enrollment_subjects",
      },
      {
        name: "enrollment_subjects",
        columns: 7,
        pkType: "SERIAL",
        relationships: "FK → enrollments, groups; 1:N grades",
      },
      {
        name: "evaluation_types",
        columns: 5,
        pkType: "SERIAL",
        relationships: "1:N evaluations por group",
      },
      {
        name: "evaluations",
        columns: 8,
        pkType: "SERIAL",
        relationships: "FK → groups, eval_types; 1:N grades",
      },
      {
        name: "grades",
        columns: 6,
        pkType: "SERIAL",
        relationships:
          "FK → enrollment_subjects, evaluations; triggers academic_records",
      },
      {
        name: "academic_records",
        columns: 9,
        pkType: "SERIAL",
        relationships: "Generada por trigger fn_generate_academic_record",
      },
    ],
  },
  {
    label: "Certificaciones y Auditoría",
    color: "warning",
    tables: [
      {
        name: "certification_criteria",
        columns: 7,
        pkType: "SERIAL",
        relationships: "FK → careers; define reglas de emisión",
      },
      {
        name: "certifications",
        columns: 10,
        pkType: "SERIAL",
        relationships: "FK → students; verification_code único; document_hash",
      },
      {
        name: "audit_logs",
        columns: 8,
        pkType: "SERIAL",
        relationships: "Inmutable; registra todas las operaciones del sistema",
      },
    ],
  },
];

const enums = [
  { name: "UserType", values: ["STUDENT", "TEACHER", "ADMIN"] },
  {
    name: "AcademicStatus",
    values: [
      "ACTIVE",
      "AT_RISK",
      "ELIGIBLE_FOR_GRADUATION",
      "SUSPENDED",
      "GRADUATED",
      "WITHDRAWN",
    ],
  },
  { name: "EnrollmentStatus", values: ["ACTIVE", "CLOSED", "CANCELLED"] },
  {
    name: "EnrollmentSubjectStatus",
    values: ["ENROLLED", "DROPPED", "COMPLETED", "FAILED"],
  },
  {
    name: "CertificationType",
    values: ["DEGREE", "TRANSCRIPT", "ENROLLMENT_PROOF", "COMPLETION"],
  },
  { name: "CertificationStatus", values: ["ACTIVE", "REVOKED", "EXPIRED"] },
  {
    name: "AuditAction",
    values: ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "VALIDATE"],
  },
];

const spValidations = [
  { code: "-1", description: "El estudiante no existe en el sistema" },
  {
    code: "-2",
    description: "El período académico no existe o no está activo",
  },
  {
    code: "-3",
    description: "Ya existe una inscripción activa para este período",
  },
  { code: "-4", description: "El grupo no existe o no pertenece al período" },
  { code: "-5", description: "El grupo ya está lleno (cupo máximo alcanzado)" },
  {
    code: "-6",
    description: "El estudiante no cumple los prerrequisitos de la materia",
  },
  {
    code: "-7",
    description: "El estudiante ya está inscrito en la materia este período",
  },
  {
    code: "-8",
    description:
      "El estado académico del estudiante no permite inscripción (SUSPENDED/WITHDRAWN)",
  },
  { code: "0", description: "Inscripción procesada exitosamente" },
  {
    code: "-99",
    description: "Error interno del sistema (rollback automático)",
  },
];

const bridgeTables = [
  {
    name: "user_roles",
    entities: "users ↔ roles",
    purpose:
      "Control de acceso basado en roles (RBAC). Un usuario puede tener múltiples roles.",
  },
  {
    name: "subject_prerequisites",
    entities: "subjects ↔ subjects",
    purpose: "Auto-referencia para modelar prerrequisitos entre materias.",
  },
  {
    name: "career_subjects",
    entities: "careers ↔ subjects",
    purpose:
      "Plan de estudios: qué materias pertenecen a qué carrera (con semestre y obligatoriedad).",
  },
  {
    name: "group_classrooms",
    entities: "groups ↔ classrooms",
    purpose: "Asignación de aulas a grupos con horario específico.",
  },
];

const categoryColors: Record<
  string,
  "primary" | "secondary" | "success" | "warning"
> = {
  primary: "primary",
  secondary: "secondary",
  success: "success",
  warning: "warning",
};

export default function DBModelPage() {
  const [expandedCategory, setExpandedCategory] = useState<string | false>(
    "Gestión de Usuarios",
  );

  const totalTables = dbCategories.reduce((s, c) => s + c.tables.length, 0);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Modelo de Base de Datos
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Visualización del esquema relacional completo de Academicore (Tercera
        Forma Normal / BCNF)
      </Typography>

      {/* Section 1 — Overview */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box className="flex items-center gap-2 mb-3">
          <StorageIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Resumen del Esquema
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {[
            { value: totalTables, label: "Tablas totales", color: "#1976d2" },
            { value: 7, label: "ENUMs definidos", color: "#9c27b0" },
            { value: 4, label: "Tablas bridge (M:N)", color: "#2e7d32" },
            { value: "BCNF", label: "Forma Normal", color: "#ed6c02" },
          ].map((s) => (
            <Grid item xs={6} md={3} key={s.label}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="h4" fontWeight={700} color={s.color}>
                  {s.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {s.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          {dbCategories.map((cat) => (
            <Grid item xs={6} md={3} key={cat.label}>
              <Card variant="outlined" sx={{ textAlign: "center" }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Chip
                    label={cat.label}
                    color={categoryColors[cat.color]}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="h5" fontWeight={700}>
                    {cat.tables.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    tablas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Section 2 — Tables by category */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box className="flex items-center gap-2 mb-3">
          <TableChartIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Tablas por Categoría
          </Typography>
        </Box>

        {dbCategories.map((cat) => (
          <Accordion
            key={cat.label}
            expanded={expandedCategory === cat.label}
            onChange={(_e, isExpanded) =>
              setExpandedCategory(isExpanded ? cat.label : false)
            }
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box className="flex items-center gap-2">
                <Chip label={cat.label} color={cat.color} size="small" />
                <Typography variant="body2" color="text.secondary">
                  {cat.tables.length} tablas
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "grey.100" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Tabla</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        # Columnas
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tipo de PK</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Relaciones clave
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cat.tables.map((t) => (
                      <TableRow key={t.name} hover>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontFamily="monospace"
                            fontWeight={600}
                            color="primary.main"
                          >
                            {t.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{t.columns}</TableCell>
                        <TableCell>
                          <Chip
                            label={t.pkType}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {t.relationships}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      {/* Section 3 — ENUMs */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box className="flex items-center gap-2 mb-3">
          <CodeIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            ENUMs (7 tipos definidos)
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "grey.100" }}>
                <TableCell sx={{ fontWeight: 700 }}>Nombre del ENUM</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Valores</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enums.map((e) => (
                <TableRow key={e.name} hover>
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontFamily="monospace"
                      fontWeight={700}
                      color="secondary.main"
                    >
                      {e.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box className="flex flex-wrap gap-1">
                      {e.values.map((v) => (
                        <Chip
                          key={v}
                          label={v}
                          size="small"
                          variant="outlined"
                          sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Section 4 — Trigger & SP */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box className="flex items-center gap-2 mb-3">
          <AutoFixHighIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Trigger y Procedimiento Almacenado
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Trigger */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ borderColor: "warning.main" }}>
              <CardContent>
                <Box className="flex items-center gap-2 mb-1">
                  <Chip label="TRIGGER" color="warning" size="small" />
                  <Typography
                    variant="subtitle1"
                    fontFamily="monospace"
                    fontWeight={700}
                  >
                    fn_generate_academic_record
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Evento:</strong> AFTER INSERT OR UPDATE en tabla{" "}
                  <code>grades</code>
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Lógica:</strong> Cuando se inserta o actualiza una
                  calificación que corresponde al tipo "examen final" del grupo,
                  el trigger calcula el promedio ponderado de todas las
                  evaluaciones del estudiante en ese grupo y genera (o
                  actualiza) automáticamente un registro en{" "}
                  <code>academic_records</code> con el estado COMPLETED o
                  FAILED.
                </Typography>
                <Box className="flex flex-wrap gap-1 mt-2">
                  {[
                    "grades",
                    "evaluations",
                    "evaluation_types",
                    "enrollment_subjects",
                    "academic_records",
                  ].map((t) => (
                    <Chip
                      key={t}
                      label={t}
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* SP */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ borderColor: "primary.main" }}>
              <CardContent>
                <Box className="flex items-center gap-2 mb-1">
                  <Chip label="STORED PROCEDURE" color="primary" size="small" />
                  <Typography
                    variant="subtitle1"
                    fontFamily="monospace"
                    fontWeight={700}
                  >
                    sp_enroll_student
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Parámetros:</strong> <code>p_student_id</code>,{" "}
                  <code>p_period_id</code>, <code>p_group_ids[]</code>,{" "}
                  <code>OUT p_result INT</code>
                </Typography>

                <TableContainer sx={{ mt: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "grey.100" }}>
                        <TableCell sx={{ fontWeight: 700, width: 60 }}>
                          Código
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          Descripción
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {spValidations.map((v) => (
                        <TableRow key={v.code}>
                          <TableCell>
                            <Chip
                              label={v.code}
                              size="small"
                              color={v.code === "0" ? "success" : "error"}
                              sx={{
                                fontFamily: "monospace",
                                fontWeight: 700,
                                minWidth: 40,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {v.description}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Section 5 — Bridge tables */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box className="flex items-center gap-2 mb-3">
          <SwapHorizIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Tablas Bridge (M:N)
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Las tablas bridge resuelven relaciones muchos-a-muchos (M:N) que no
          pueden representarse directamente en el modelo relacional. Cada una
          tiene una PK compuesta por las FKs de las entidades que conecta.
        </Alert>

        <Grid container spacing={2}>
          {bridgeTables.map((bt) => (
            <Grid item xs={12} sm={6} key={bt.name}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography
                  variant="subtitle2"
                  fontFamily="monospace"
                  fontWeight={700}
                  color="primary.main"
                >
                  {bt.name}
                </Typography>
                <Chip
                  label={bt.entities}
                  size="small"
                  variant="outlined"
                  sx={{ my: 1, fontFamily: "monospace", fontSize: "0.7rem" }}
                />
                <Typography variant="body2" color="text.secondary">
                  {bt.purpose}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}
