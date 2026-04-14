import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LinkIcon from "@mui/icons-material/Link";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadIcon from "@mui/icons-material/Upload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/HourglassEmpty";
import { useToast } from "../../hooks/useToast";
import { enrollmentsService } from "../../services/enrollments.service";
import { topicsService } from "../../services/topics.service";
import { evaluationsService } from "../../services/evaluations.service";
import {
  studentSubmissionsService,
  type StudentSubmissionWithEval,
} from "../../services/student-submissions.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentItem {
  id: string;
  title: string;
  type: "LINK" | "TEXT" | "FILE_REF";
  content: string;
  sortOrder: number;
  createdAt: string;
}

interface TopicItem {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  weekNumber: number | null;
  createdAt: string;
  contentItems: ContentItem[];
}

interface EvaluationItem {
  id: string;
  name: string;
  weight: number;
  dueDate: string | null;
  evaluationType: { name: string };
}

interface GroupCard {
  groupId: string;
  subjectName: string;
  subjectCode: string;
  groupCode: string;
  periodName: string;
  periodStartDate: string;
  teacherName: string;
  pendingCount: number;
}

interface SubmissionForm {
  title: string;
  type: "LINK" | "TEXT" | "FILE_REF";
  content: string;
  // populated after a successful upload
  fileKey?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function weekDateRange(weekNumber: number, periodStartDate: string): string {
  const start = new Date(periodStartDate);
  start.setDate(start.getDate() + (weekNumber - 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

const typeIcons: Record<string, React.ReactNode> = {
  LINK: <LinkIcon fontSize="small" />,
  TEXT: <DescriptionIcon fontSize="small" />,
  FILE_REF: <InsertDriveFileIcon fontSize="small" />,
};

const typeLabels: Record<string, string> = {
  LINK: "Enlace",
  TEXT: "Texto",
  FILE_REF: "Referencia",
};

const typeColors: Record<string, "primary" | "default" | "secondary"> = {
  LINK: "primary",
  TEXT: "default",
  FILE_REF: "secondary",
};

const emptyForm = (): SubmissionForm => ({
  title: "",
  type: "LINK",
  content: "",
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentContentPage() {
  const { toast, showToast, clearToast } = useToast();

  // Cards view
  const [cards, setCards] = useState<GroupCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);

  // Detail view
  const [selectedCard, setSelectedCard] = useState<GroupCard | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "submissions">(
    "content",
  );
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmissionWithEval[]>(
    [],
  );
  const [detailLoading, setDetailLoading] = useState(false);

  // Submission dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(
    null,
  );
  const [currentEvaluationId, setCurrentEvaluationId] = useState<string>("");
  const [form, setForm] = useState<SubmissionForm>(emptyForm());
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // ─── Load cards ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      try {
        setCardsLoading(true);

        const [enrollments, allSubmissions] = await Promise.all([
          enrollmentsService.getMine(),
          studentSubmissionsService.getMine(),
        ]);

        // Flatten enrolled groups
        type EnrollmentItem = {
          academicPeriod: { name: string; startDate: string };
          enrollmentSubjects: {
            groupId: string;
            status: string;
            group: {
              groupCode: string;
              subject: { name: string; code: string };
              teacher: { user: { firstName: string; lastName: string } };
            };
          }[];
        };

        const enrolledGroups = (enrollments as EnrollmentItem[]).flatMap((e) =>
          e.enrollmentSubjects
            .filter((es) => es.status === "ENROLLED")
            .map((es) => ({
              groupId: es.groupId,
              subjectName: es.group.subject.name,
              subjectCode: es.group.subject.code,
              groupCode: es.group.groupCode,
              periodName: e.academicPeriod.name,
              periodStartDate: e.academicPeriod.startDate,
              teacherName: es.group.teacher?.user
                ? `${es.group.teacher.user.firstName} ${es.group.teacher.user.lastName}`
                : "",
            })),
        );

        // Fetch evaluations for all groups in parallel
        const evalsByGroup = await Promise.all(
          enrolledGroups.map((g) =>
            evaluationsService
              .getByGroup(g.groupId)
              .then((evs: EvaluationItem[]) => ({ groupId: g.groupId, evs }))
              .catch(() => ({ groupId: g.groupId, evs: [] as EvaluationItem[] })),
          ),
        );

        const evalGroupMap = new Map(
          evalsByGroup.map((e) => [e.groupId, e.evs]),
        );
        const submittedEvalIds = new Set(
          allSubmissions.map((s) => s.evaluationId),
        );

        const builtCards: GroupCard[] = enrolledGroups.map((g) => {
          const evs = evalGroupMap.get(g.groupId) ?? [];
          const pending = evs.filter((ev) => !submittedEvalIds.has(ev.id))
            .length;
          return { ...g, pendingCount: pending };
        });

        setCards(builtCards);
        setSubmissions(allSubmissions);
      } catch {
        showToast("Error al cargar materias", "error");
      } finally {
        setCardsLoading(false);
      }
    };
    load();
  }, []);

  // ─── Select a course card ────────────────────────────────────────────────────

  const handleSelectCard = async (card: GroupCard) => {
    setSelectedCard(card);
    setActiveTab("content");
    setDetailLoading(true);
    try {
      const [topicData, evalData] = await Promise.all([
        topicsService.getByGroup(card.groupId),
        evaluationsService.getByGroup(card.groupId),
      ]);
      setTopics(topicData);
      setEvaluations(evalData);
    } catch {
      showToast("Error al cargar contenido", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedCard(null);
    setTopics([]);
    setEvaluations([]);
  };

  // ─── Submission CRUD ─────────────────────────────────────────────────────────

  const openCreate = (evaluationId: string) => {
    setEditingSubmissionId(null);
    setCurrentEvaluationId(evaluationId);
    setForm(emptyForm());
    setPendingFile(null);
    setDialogOpen(true);
  };

  const openEdit = (sub: StudentSubmissionWithEval) => {
    setEditingSubmissionId(sub.id);
    setCurrentEvaluationId(sub.evaluationId);
    setForm({
      title: sub.title,
      type: sub.type,
      content: sub.content,
      fileKey: sub.fileKey ?? undefined,
      fileName: sub.fileName ?? undefined,
      fileSize: sub.fileSize ?? undefined,
      fileMimeType: sub.fileMimeType ?? undefined,
    });
    setPendingFile(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setPendingFile(null);
  };

  const handleDelete = async (submissionId: string) => {
    if (!window.confirm("¿Eliminar esta entrega?")) return;
    try {
      await studentSubmissionsService.delete(submissionId);
      const updated = submissions.filter((s) => s.id !== submissionId);
      setSubmissions(updated);
      // Recalculate pending count for current card
      if (selectedCard) {
        setCards((prev) =>
          prev.map((c) =>
            c.groupId === selectedCard.groupId
              ? { ...c, pendingCount: c.pendingCount + 1 }
              : c,
          ),
        );
      }
      showToast("Entrega eliminada");
    } catch {
      showToast("Error al eliminar entrega", "error");
    }
  };

  const handleSave = async () => {
    try {
      let currentForm = form;

      // Upload the file first if one was selected
      if (pendingFile) {
        setUploading(true);
        try {
          const uploaded = await studentSubmissionsService.uploadFile(pendingFile);
          currentForm = {
            ...currentForm,
            content: uploaded.url,
            fileKey: uploaded.key,
            fileName: uploaded.originalName,
            fileSize: uploaded.size,
            fileMimeType: uploaded.mimeType,
          };
          setForm(currentForm);
        } finally {
          setUploading(false);
        }
      }

      if (editingSubmissionId) {
        const updated = await studentSubmissionsService.update(
          editingSubmissionId,
          currentForm,
        );
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === editingSubmissionId ? { ...s, ...updated } : s,
          ),
        );
        showToast("Entrega actualizada");
      } else {
        await studentSubmissionsService.create({
          evaluationId: currentEvaluationId,
          ...currentForm,
        });
        const fresh = await studentSubmissionsService.getMine();
        setSubmissions(fresh);
        // Decrease pending count for the card
        if (selectedCard) {
          setCards((prev) =>
            prev.map((c) =>
              c.groupId === selectedCard.groupId
                ? { ...c, pendingCount: Math.max(0, c.pendingCount - 1) }
                : c,
            ),
          );
        }
        showToast("Entrega publicada exitosamente");
      }
      closeDialog();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Error al guardar entrega";
      showToast(msg, "error");
    }
  };

  // ─── Render: cards view ──────────────────────────────────────────────────────

  if (!selectedCard) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 4 }}>
          Mis Materias
        </Typography>

        {cardsLoading ? (
          <Typography color="text.secondary">Cargando materias…</Typography>
        ) : cards.length === 0 ? (
          <Typography color="text.secondary">
            No tienes materias inscritas en el período activo.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {cards.map((card) => (
              <Grid item xs={12} sm={6} md={4} key={card.groupId}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    transition: "box-shadow 0.2s",
                    "&:hover": { boxShadow: 4 },
                  }}
                >
                  <CardActionArea
                    onClick={() => handleSelectCard(card)}
                    sx={{ height: "100%", alignItems: "flex-start" }}
                  >
                    <CardContent sx={{ pb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {card.subjectName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {card.subjectCode} · Grupo {card.groupCode}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {card.periodName}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {card.pendingCount > 0 ? (
                          <Chip
                            icon={<PendingIcon />}
                            label={`${card.pendingCount} entrega${card.pendingCount !== 1 ? "s" : ""} pendiente${card.pendingCount !== 1 ? "s" : ""}`}
                            size="small"
                            color="warning"
                          />
                        ) : (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Entregas al día"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
          <Alert severity={toast?.severity} onClose={clearToast}>
            {toast?.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  // ─── Render: detail view ─────────────────────────────────────────────────────

  const groupSubmissions = submissions.filter(
    (s) => s.evaluation.groupId === selectedCard.groupId,
  );
  const submissionByEval = new Map(
    groupSubmissions.map((s) => [s.evaluationId, s]),
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 1 }}
        >
          Mis Materias
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {selectedCard.subjectName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {selectedCard.subjectCode} · Grupo {selectedCard.groupCode} ·{" "}
          {selectedCard.periodName}
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Contenido del curso" value="content" />
        <Tab
          label={
            selectedCard.pendingCount > 0
              ? `Mis Entregas (${selectedCard.pendingCount} pendientes)`
              : "Mis Entregas"
          }
          value="submissions"
        />
      </Tabs>

      {detailLoading && (
        <Typography color="text.secondary">Cargando…</Typography>
      )}

      {/* ── Content tab ── */}
      {!detailLoading && activeTab === "content" && (
        <Box>
          {topics.length === 0 ? (
            <Typography color="text.secondary">
              No hay contenido publicado en esta materia.
            </Typography>
          ) : (
            (() => {
              // Group topics by weekNumber
              const seen = new Map<number | null, TopicItem[]>();
              for (const t of topics) {
                const key = t.weekNumber ?? null;
                if (!seen.has(key)) seen.set(key, []);
                seen.get(key)!.push(t);
              }
              const numberedKeys = [...seen.keys()]
                .filter((k) => k !== null)
                .sort((a, b) => (a as number) - (b as number));
              const buckets = [
                ...numberedKeys.map((k) => ({ weekNumber: k, topics: seen.get(k)! })),
                ...(seen.has(null) ? [{ weekNumber: null, topics: seen.get(null)! }] : []),
              ];

              return buckets.map((bucket) => (
                <Box key={bucket.weekNumber ?? "none"} sx={{ mb: 3 }}>
                  {/* Week header */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                    <Divider sx={{ flex: 1 }} />
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>
                      {bucket.weekNumber !== null
                        ? `Semana ${bucket.weekNumber}${
                            selectedCard.periodStartDate
                              ? ` — ${weekDateRange(bucket.weekNumber, selectedCard.periodStartDate)}`
                              : ""
                          }`
                        : "Sin semana asignada"}
                    </Typography>
                    <Divider sx={{ flex: 1 }} />
                  </Box>

                  {bucket.topics.map((topic) => (
                    <Accordion key={topic.id} defaultExpanded sx={{ mb: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%" }}>
                          <Chip label={`#${topic.sortOrder}`} size="small" variant="outlined" />
                          <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>
                            {topic.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(topic.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {topic.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {topic.description}
                          </Typography>
                        )}
                        {topic.contentItems.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            Sin materiales en este tema.
                          </Typography>
                        ) : (
                          <List dense>
                            {topic.contentItems.map((item) => (
                              <ListItem key={item.id}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  {typeIcons[item.type]}
                                </ListItemIcon>
                                <ListItemText
                                  primary={item.title}
                                  secondaryTypographyProps={{ component: "div" }}
                                  secondary={
                                    <Box>
                                      {item.type === "LINK" || item.type === "FILE_REF" ? (
                                        <a href={item.content} target="_blank" rel="noopener noreferrer" style={{ color: "#1976d2", wordBreak: "break-all" }}>
                                          {item.content}
                                        </a>
                                      ) : (
                                        <span style={{ whiteSpace: "pre-wrap" }}>{item.content}</span>
                                      )}
                                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                                        Publicado el {new Date(item.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                                      </Typography>
                                    </Box>
                                  }
                                />
                                <Chip label={typeLabels[item.type]} size="small" color={typeColors[item.type]} variant="outlined" />
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              ));
            })()
          )}
        </Box>
      )}

      {/* ── Submissions tab ── */}
      {!detailLoading && activeTab === "submissions" && (
        <Box>
          {evaluations.length === 0 ? (
            <Typography color="text.secondary">
              El docente aún no ha creado evaluaciones para esta materia.
            </Typography>
          ) : (
            evaluations.map((ev) => {
              const sub = submissionByEval.get(ev.id);
              return (
                <Card
                  key={ev.id}
                  variant="outlined"
                  sx={{ mb: 2, p: 2 }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>{ev.name}</Typography>
                      <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                        <Chip
                          label={ev.evaluationType.name}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${ev.weight}%`}
                          size="small"
                          variant="outlined"
                        />
                        {ev.dueDate && (
                          <Chip
                            label={`Entrega: ${new Date(ev.dueDate).toLocaleDateString("es")}`}
                            size="small"
                            variant="outlined"
                            color={
                              new Date(ev.dueDate) < new Date()
                                ? "error"
                                : "default"
                            }
                          />
                        )}
                      </Box>
                    </Box>

                    {!sub ? (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<UploadIcon />}
                        onClick={() => openCreate(ev.id)}
                      >
                        Entregar
                      </Button>
                    ) : (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Entregado"
                          size="small"
                          color="success"
                        />
                        <IconButton
                          size="small"
                          onClick={() => openEdit(sub)}
                          title="Editar entrega"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(sub.id)}
                          title="Eliminar entrega"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>

                  {sub && (
                    <>
                      <Divider sx={{ my: 1.5 }} />
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {typeIcons[sub.type]}
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {sub.title}
                        </Typography>
                        <Chip
                          label={typeLabels[sub.type]}
                          size="small"
                          color={typeColors[sub.type]}
                          variant="outlined"
                        />
                      </Box>
                      {sub.type === "LINK" ? (
                        <a
                          href={sub.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 12,
                            color: "#1976d2",
                            wordBreak: "break-all",
                          }}
                        >
                          {sub.content}
                        </a>
                      ) : sub.type === "FILE_REF" ? (
                        <a
                          href={sub.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 12, color: "#1976d2" }}
                        >
                          {sub.fileName ?? sub.content}
                          {sub.fileSize
                            ? ` (${(sub.fileSize / 1024).toFixed(1)} KB)`
                            : ""}
                        </a>
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}
                        >
                          {sub.content}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ mt: 0.5, display: "block" }}
                      >
                        Enviado el{" "}
                        {new Date(sub.submittedAt).toLocaleDateString("es")}
                      </Typography>
                    </>
                  )}
                </Card>
              );
            })
          )}
        </Box>
      )}

      {/* ── Submission dialog ── */}
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingSubmissionId ? "Editar entrega" : "Publicar entrega"}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <TextField
            label="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            select
            label="Tipo"
            value={form.type}
            onChange={(e) => {
              const t = e.target.value as "LINK" | "TEXT" | "FILE_REF";
              setForm({ ...form, type: t, content: "" });
              setPendingFile(null);
            }}
            fullWidth
            margin="dense"
          >
            <MenuItem value="LINK">Enlace (URL)</MenuItem>
            <MenuItem value="TEXT">Texto</MenuItem>
            <MenuItem value="FILE_REF">Archivo</MenuItem>
          </TextField>

          {form.type === "FILE_REF" ? (
            <Box sx={{ mt: 1 }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<AttachFileIcon />}
                fullWidth
              >
                {pendingFile
                  ? pendingFile.name
                  : form.fileName
                    ? form.fileName
                    : "Seleccionar archivo"}
                <input
                  type="file"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setPendingFile(f);
                    if (f) setForm((prev) => ({ ...prev, content: f.name }));
                  }}
                />
              </Button>
              {(pendingFile || form.fileName) && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                  {pendingFile
                    ? `${(pendingFile.size / 1024).toFixed(1)} KB — listo para subir`
                    : form.fileName && form.fileSize
                      ? `${form.fileName} · ${(form.fileSize / 1024).toFixed(1)} KB`
                      : ""}
                </Typography>
              )}
              {/* Show current file link when editing without a new selection */}
              {!pendingFile && form.content && form.type === "FILE_REF" && (
                <a
                  href={form.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "#1976d2", wordBreak: "break-all" }}
                >
                  {form.fileName ?? form.content}
                </a>
              )}
            </Box>
          ) : (
            <TextField
              label={form.type === "TEXT" ? "Contenido" : "URL"}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              fullWidth
              margin="dense"
              multiline={form.type === "TEXT"}
              rows={form.type === "TEXT" ? 4 : 1}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={uploading}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              uploading ||
              !form.title ||
              (form.type === "FILE_REF"
                ? !pendingFile && !form.content
                : !form.content)
            }
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {uploading ? "Subiendo…" : editingSubmissionId ? "Guardar" : "Publicar"}
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
