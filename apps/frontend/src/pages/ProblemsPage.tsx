import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";

import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import GradingIcon from "@mui/icons-material/Grading";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import ListAltIcon from "@mui/icons-material/ListAlt";
import VerifiedIcon from "@mui/icons-material/Verified";
import LockIcon from "@mui/icons-material/Lock";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { useNavigate } from "react-router-dom";

interface Problem {
  id: number;
  title: string;
  icon: React.ReactNode;
  problemText: string;
  solutionText: string;
  tables: string[];
  linkedPage?: string;
  linkedPageLabel?: string;
}

const problems: Problem[] = [
  {
    id: 1,
    title: "Gestión manual de calificaciones",
    icon: <GradingIcon sx={{ fontSize: 32 }} />,
    problemText:
      "Las calificaciones se registraban de forma manual y dispersa, sin un proceso automatizado que calculara promedios finales ni generara registros históricos. Esto causaba inconsistencias, errores humanos y pérdida de trazabilidad académica.",
    solutionText:
      "Academicore implementa una cadena de evaluaciones ponderadas (evaluation_types + evaluations + grades). El trigger fn_generate_academic_record calcula automáticamente el promedio final y genera un registro inmutable en academic_records cuando se captura la última calificación del período.",
    tables: [
      "evaluations",
      "evaluation_types",
      "grades",
      "academic_records",
      "groups",
    ],
    linkedPage: "/academic-history",
    linkedPageLabel: "Ver Historial Académico",
  },
  {
    id: 2,
    title: "Control de inscripciones sin validación",
    icon: <AssignmentTurnedInIcon sx={{ fontSize: 32 }} />,
    problemText:
      "Las inscripciones se procesaban sin verificar prerrequisitos, cupos, estado del estudiante ni duplicados. Esto generaba inscripciones inválidas, conflictos de horario y grupos sobresaturados.",
    solutionText:
      "El procedimiento almacenado sp_enroll_student ejecuta una cadena de 8 validaciones en orden antes de confirmar cualquier inscripción. Solo si todas pasan se hace COMMIT; cualquier falla devuelve un código de error específico (-1 a -8) y hace ROLLBACK automático.",
    tables: [
      "enrollments",
      "enrollment_subjects",
      "groups",
      "subject_prerequisites",
      "students",
      "academic_periods",
    ],
    linkedPage: "/academic-history",
    linkedPageLabel: "Ver Historial Académico",
  },
  {
    id: 3,
    title: "Historial académico disperso",
    icon: <ListAltIcon sx={{ fontSize: 32 }} />,
    problemText:
      "El historial académico de los estudiantes estaba fragmentado en múltiples sistemas y documentos físicos. No había una fuente única de verdad para consultar calificaciones históricas, promedios por período o estado de materias.",
    solutionText:
      "La tabla academic_records actúa como registro histórico inmutable, generado automáticamente por trigger cada vez que se cierran las calificaciones de un grupo. Consolida materia, período, calificación final, estado y número de intento en un solo registro consultable.",
    tables: [
      "academic_records",
      "groups",
      "academic_periods",
      "subjects",
      "students",
      "grades",
    ],
    linkedPage: "/academic-history",
    linkedPageLabel: "Ver Historial Académico",
  },
  {
    id: 4,
    title: "Certificación sin trazabilidad",
    icon: <VerifiedIcon sx={{ fontSize: 32 }} />,
    problemText:
      "Los certificados académicos se emitían en papel sin mecanismo de verificación de autenticidad. Era imposible para terceros (empleadores, instituciones) validar si un documento era legítimo o había sido revocado.",
    solutionText:
      "Academicore emite certificados digitales con verification_code único (UUID) y document_hash (SHA-256 del contenido). Todo el ciclo de vida (emisión, consulta, revocación) queda registrado en audit_logs. Los terceros pueden validar en el portal público /verify/:code sin requerir autenticación.",
    tables: [
      "certifications",
      "certification_criteria",
      "audit_logs",
      "students",
      "careers",
    ],
    linkedPage: "/certifications",
    linkedPageLabel: "Ver Certificaciones",
  },
  {
    id: 5,
    title: "Acceso sin control de roles",
    icon: <LockIcon sx={{ fontSize: 32 }} />,
    problemText:
      "Todos los usuarios del sistema tenían acceso a las mismas funcionalidades sin distinción de rol. Un estudiante podía acceder a datos de otros estudiantes o modificar calificaciones, y no había separación entre administradores, profesores y alumnos.",
    solutionText:
      "Academicore implementa RBAC (Control de Acceso Basado en Roles) mediante las tablas roles y user_roles. Cada endpoint del backend verifica el JWT y los roles asignados antes de ejecutar cualquier operación. El frontend muestra únicamente las opciones del menú correspondientes al rol del usuario autenticado.",
    tables: ["users", "roles", "user_roles", "students", "teachers"],
    linkedPage: "/ui-standards",
    linkedPageLabel: "Ver Estándar UI",
  },
];

export default function ProblemsPage() {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Problemas y Soluciones
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Los 5 problemas centrales que Academicore resuelve y cómo el diseño del
        sistema los aborda.
      </Typography>

      <Alert severity="info" sx={{ mb: 4 }}>
        Cada solución está respaldada por el diseño de la base de datos, los
        procedimientos almacenados y la arquitectura de la aplicación. Las
        tablas involucradas se muestran como chips en cada tarjeta.
      </Alert>

      <Grid container spacing={3}>
        {problems.map((problem) => (
          <Grid item xs={12} key={problem.id}>
            <Card elevation={3} sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                {/* Problem header */}
                <Box className="flex items-start gap-3 mb-2">
                  <Box sx={{ color: "error.main", mt: 0.5 }}>
                    {problem.icon}
                  </Box>
                  <Box className="flex-1">
                    <Box className="flex items-center gap-2 mb-1">
                      <Chip
                        label={`Problema ${problem.id}`}
                        color="error"
                        size="small"
                        icon={<ErrorOutlineIcon />}
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      {problem.title}
                    </Typography>
                  </Box>
                </Box>

                {/* Problem description */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    mb: 2,
                    borderColor: "error.light",
                    backgroundColor: "error.50",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {problem.problemText}
                  </Typography>
                </Paper>

                {/* Solution */}
                <Box className="flex items-center gap-2 mb-1">
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Chip
                    label="Solución"
                    color="success"
                    size="small"
                    icon={<CheckCircleIcon />}
                    sx={{ fontWeight: 700 }}
                  />
                </Box>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    mb: 2,
                    borderColor: "success.light",
                    backgroundColor: "success.50",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {problem.solutionText}
                  </Typography>
                </Paper>

                <Divider sx={{ my: 2 }} />

                {/* Tables */}
                <Box className="flex items-center gap-2 flex-wrap">
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ mr: 1 }}
                  >
                    TABLAS INVOLUCRADAS:
                  </Typography>
                  {problem.tables.map((table) => (
                    <Chip
                      key={table}
                      label={table}
                      size="small"
                      variant="outlined"
                      color="primary"
                      sx={{ fontFamily: "monospace", fontSize: "0.72rem" }}
                    />
                  ))}

                  {problem.linkedPage && (
                    <Button
                      size="small"
                      variant="text"
                      color="primary"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate(problem.linkedPage!)}
                      sx={{ ml: "auto" }}
                    >
                      {problem.linkedPageLabel}
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
