import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import Tooltip from "@mui/material/Tooltip";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import SchoolIcon from "@mui/icons-material/School";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../store/auth.context";
import { studentsService } from "../../services/students.service";
import { academicRecordsService } from "../../services/academic-records.service";
import { api } from "../../services/api";

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  prerequisites: Array<{ prerequisiteId: string; prerequisite: { id: string; name: string; code: string } }>;
}

interface CareerSubject {
  semesterNumber: number;
  isMandatory: boolean;
  subject: Subject;
}

interface Career {
  id: string;
  name: string;
  code: string;
  totalSemesters: number;
  careerSubjects: CareerSubject[];
}

interface PassedSubject {
  subjectId: string;
  finalGrade: number;
  passed: boolean;
}

export default function StudentCareerPage() {
  const { currentUser } = useAuth();
  const [career, setCareer] = useState<Career | null>(null);
  const [passedMap, setPassedMap] = useState<Map<string, PassedSubject>>(new Map());
  const [loading, setLoading] = useState(true);
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const student = await studentsService.getMe();

        const [careerData, records] = await Promise.all([
          api.get(`/careers/${student.careerId}`).then((r) => r.data),
          academicRecordsService.getMine(),
        ]);

        setCareer(careerData);

        // Build a map: subjectId → best academic record
        const map = new Map<string, PassedSubject>();
        for (const rec of records as Array<{
          group: { subjectId: string };
          finalGrade: number;
          passed: boolean;
          attemptNumber: number;
        }>) {
          const sid = rec.group?.subjectId;
          if (!sid) continue;
          const existing = map.get(sid);
          // Keep the record that shows passed=true, or the latest attempt
          if (!existing || rec.passed || rec.attemptNumber > existing.finalGrade) {
            map.set(sid, {
              subjectId: sid,
              finalGrade: rec.finalGrade,
              passed: rec.passed,
            });
          }
        }
        setPassedMap(map);
      } catch {
        showToast("Error al cargar el plan de estudios", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Mi Carrera
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (!career) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Mi Carrera
        </Typography>
        <Alert severity="warning">No se encontró información de tu carrera.</Alert>
      </Box>
    );
  }

  // Group subjects by semester
  const bySemester = new Map<number, CareerSubject[]>();
  for (const cs of career.careerSubjects) {
    const arr = bySemester.get(cs.semesterNumber) ?? [];
    arr.push(cs);
    bySemester.set(cs.semesterNumber, arr);
  }
  const semesters = Array.from(bySemester.keys()).sort((a, b) => a - b);

  const totalSubjects = career.careerSubjects.length;
  const passedCount = career.careerSubjects.filter(
    (cs) => passedMap.get(cs.subject.id)?.passed
  ).length;
  const totalCredits = career.careerSubjects.reduce(
    (sum, cs) => sum + cs.subject.credits,
    0
  );
  const earnedCredits = career.careerSubjects
    .filter((cs) => passedMap.get(cs.subject.id)?.passed)
    .reduce((sum, cs) => sum + cs.subject.credits, 0);
  const progressPct =
    totalSubjects === 0 ? 0 : Math.round((passedCount / totalSubjects) * 100);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <SchoolIcon sx={{ color: "white" }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            {career.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {career.code} · {career.totalSemesters} semestres
          </Typography>
        </Box>
      </Box>

      {/* Progress summary */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          mb: 3,
          p: 2.5,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 180 }}>
          <Typography variant="caption" color="text.secondary">
            Progreso general
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
            <LinearProgress
              variant="determinate"
              value={progressPct}
              sx={{ flex: 1, height: 8, borderRadius: 4 }}
              color={progressPct === 100 ? "success" : "primary"}
            />
            <Typography variant="body2" fontWeight={600}>
              {progressPct}%
            </Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" fontWeight={700} color="success.main">
            {passedCount}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            de {totalSubjects} materias
          </Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" fontWeight={700} color="primary.main">
            {earnedCredits}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            de {totalCredits} créditos
          </Typography>
        </Box>
      </Box>

      {/* Semesters */}
      {semesters.map((sem) => {
        const subjects = bySemester.get(sem)!;
        const semPassed = subjects.filter(
          (cs) => passedMap.get(cs.subject.id)?.passed
        ).length;

        return (
          <Accordion key={sem} defaultExpanded={semPassed < subjects.length} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  width: "100%",
                  pr: 1,
                }}
              >
                <Typography fontWeight={600} sx={{ flex: 1 }}>
                  Semestre {sem}
                </Typography>
                <Chip
                  label={`${semPassed}/${subjects.length}`}
                  size="small"
                  color={semPassed === subjects.length ? "success" : "default"}
                  variant={semPassed === subjects.length ? "filled" : "outlined"}
                />
              </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ pt: 0 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                  gap: 1.5,
                }}
              >
                {subjects.map(({ subject, isMandatory }) => {
                  const record = passedMap.get(subject.id);
                  const passed = record?.passed ?? false;
                  const grade = record?.finalGrade;
                  const failed = record && !record.passed;

                  return (
                    <Box
                      key={subject.id}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: passed
                          ? "success.light"
                          : failed
                          ? "error.light"
                          : "divider",
                        bgcolor: passed
                          ? "success.50"
                          : failed
                          ? "error.50"
                          : "background.paper",
                        display: "flex",
                        gap: 1.5,
                        alignItems: "flex-start",
                      }}
                    >
                      <Box sx={{ mt: 0.25, flexShrink: 0 }}>
                        {passed ? (
                          <CheckCircleIcon
                            color="success"
                            fontSize="small"
                          />
                        ) : (
                          <RadioButtonUncheckedIcon
                            sx={{
                              color: failed ? "error.main" : "action.disabled",
                              fontSize: 20,
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{
                              textDecoration: passed ? "line-through" : "none",
                              color: passed ? "text.secondary" : "text.primary",
                            }}
                          >
                            {subject.name}
                          </Typography>
                          {!isMandatory && (
                            <Chip
                              label="Optativa"
                              size="small"
                              variant="outlined"
                              sx={{ height: 16, fontSize: "0.65rem" }}
                            />
                          )}
                        </Box>
                        <Box sx={{ display: "flex", gap: 1, mt: 0.5, alignItems: "center", flexWrap: "wrap" }}>
                          <Typography variant="caption" color="text.secondary">
                            {subject.code} · {subject.credits} cr.
                          </Typography>
                          {grade !== undefined && (
                            <Chip
                              label={`${Number(grade).toFixed(1)}`}
                              size="small"
                              color={passed ? "success" : "error"}
                              sx={{ height: 18, fontSize: "0.7rem" }}
                            />
                          )}
                          {subject.prerequisites.length > 0 && (
                            <Tooltip
                              title={`Requiere: ${subject.prerequisites.map((p) => p.prerequisite.code).join(", ")}`}
                            >
                              <Typography
                                variant="caption"
                                color="text.disabled"
                                sx={{ cursor: "default" }}
                              >
                                {subject.prerequisites.length} req.
                              </Typography>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </AccordionDetails>
          </Accordion>
        );
      })}

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
