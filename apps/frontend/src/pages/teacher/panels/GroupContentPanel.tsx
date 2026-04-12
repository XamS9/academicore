import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LinkIcon from "@mui/icons-material/Link";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useToast } from "../../../hooks/useToast";
import { topicsService } from "../../../services/topics.service";
import { contentItemsService } from "../../../services/content-items.service";

interface ContentItem {
  id: string;
  topicId: string;
  title: string;
  type: "LINK" | "TEXT" | "FILE_REF";
  content: string;
  sortOrder: number;
  createdAt: string;
}

interface TopicItem {
  id: string;
  groupId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  weekNumber: number | null;
  createdAt: string;
  contentItems: ContentItem[];
}

interface TopicForm {
  groupId: string;
  title: string;
  description: string;
  sortOrder: number;
  weekNumber: string;
}

interface ContentItemForm {
  topicId: string;
  title: string;
  type: "LINK" | "TEXT" | "FILE_REF";
  content: string;
  sortOrder: number;
}

const typeLabels: Record<string, string> = { LINK: "Enlace", TEXT: "Texto", FILE_REF: "Referencia" };
const typeIcons: Record<string, React.ReactNode> = {
  LINK: <LinkIcon fontSize="small" />,
  TEXT: <DescriptionIcon fontSize="small" />,
  FILE_REF: <InsertDriveFileIcon fontSize="small" />,
};
const typeColors: Record<string, "primary" | "default" | "secondary"> = {
  LINK: "primary",
  TEXT: "default",
  FILE_REF: "secondary",
};

function weekDateRange(weekNumber: number, periodStartDate: string): string {
  const start = new Date(periodStartDate);
  start.setDate(start.getDate() + (weekNumber - 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  groupId: string;
  periodStartDate?: string;
}

export default function GroupContentPanel({ groupId, periodStartDate }: Props) {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [editTopic, setEditTopic] = useState<TopicItem | null>(null);
  const [topicForm, setTopicForm] = useState<TopicForm>({
    groupId,
    title: "",
    description: "",
    sortOrder: 1,
    weekNumber: "",
  });

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [itemForm, setItemForm] = useState<ContentItemForm>({
    topicId: "",
    title: "",
    type: "TEXT",
    content: "",
    sortOrder: 1,
  });

  const { toast, showToast, clearToast } = useToast();

  const loadTopics = async () => {
    try {
      setLoading(true);
      const data = await topicsService.getByGroup(groupId);
      setTopics(data);
    } catch {
      showToast("Error al cargar temas", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTopics(); }, [groupId]);

  // ── Topic CRUD ──────────────────────────────────────────────────────────────

  const openCreateTopic = () => {
    setEditTopic(null);
    setTopicForm({ groupId, title: "", description: "", sortOrder: topics.length + 1, weekNumber: "" });
    setTopicDialogOpen(true);
  };

  const openEditTopic = (topic: TopicItem) => {
    setEditTopic(topic);
    setTopicForm({
      groupId: topic.groupId,
      title: topic.title,
      description: topic.description ?? "",
      sortOrder: topic.sortOrder,
      weekNumber: topic.weekNumber !== null ? String(topic.weekNumber) : "",
    });
    setTopicDialogOpen(true);
  };

  const handleSaveTopic = async () => {
    try {
      const weekNum = topicForm.weekNumber !== "" ? Number(topicForm.weekNumber) : undefined;
      const payload = { ...topicForm, description: topicForm.description || undefined, weekNumber: weekNum };
      if (editTopic) {
        await topicsService.update(editTopic.id, payload);
        showToast("Tema actualizado");
      } else {
        await topicsService.create(payload);
        showToast("Tema creado");
      }
      setTopicDialogOpen(false);
      loadTopics();
    } catch {
      showToast("Error al guardar tema", "error");
    }
  };

  const handleDeleteTopic = async (id: string) => {
    try {
      await topicsService.delete(id);
      showToast("Tema eliminado");
      loadTopics();
    } catch {
      showToast("Error al eliminar tema", "error");
    }
  };

  // ── Content Item CRUD ───────────────────────────────────────────────────────

  const openCreateItem = (topicId: string, currentCount: number) => {
    setEditItem(null);
    setItemForm({ topicId, title: "", type: "TEXT", content: "", sortOrder: currentCount + 1 });
    setItemDialogOpen(true);
  };

  const openEditItem = (item: ContentItem) => {
    setEditItem(item);
    setItemForm({ topicId: item.topicId, title: item.title, type: item.type, content: item.content, sortOrder: item.sortOrder });
    setItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    try {
      if (editItem) {
        await contentItemsService.update(editItem.id, itemForm);
        showToast("Material actualizado");
      } else {
        await contentItemsService.create(itemForm);
        showToast("Material creado");
      }
      setItemDialogOpen(false);
      loadTopics();
    } catch {
      showToast("Error al guardar material", "error");
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await contentItemsService.delete(id);
      showToast("Material eliminado");
      loadTopics();
    } catch {
      showToast("Error al eliminar material", "error");
    }
  };

  // ── Group by week ───────────────────────────────────────────────────────────
  type WeekBucket = { weekNumber: number | null; topics: TopicItem[] };
  const seen = new Map<number | null, TopicItem[]>();
  for (const t of topics) {
    const key = t.weekNumber ?? null;
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key)!.push(t);
  }
  const numberedKeys = [...seen.keys()].filter((k) => k !== null).sort((a, b) => (a as number) - (b as number));
  const weekBuckets: WeekBucket[] = [
    ...numberedKeys.map((k) => ({ weekNumber: k, topics: seen.get(k)! })),
    ...(seen.has(null) ? [{ weekNumber: null, topics: seen.get(null)! }] : []),
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreateTopic}>
          Nuevo Tema
        </Button>
      </Box>

      {loading && <Typography color="text.secondary">Cargando…</Typography>}

      {!loading && topics.length === 0 && (
        <Typography color="text.secondary">No hay temas registrados para este grupo.</Typography>
      )}

      {weekBuckets.map((bucket) => (
        <Box key={bucket.weekNumber ?? "none"} sx={{ mb: 3 }}>
          {/* Week header */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <Divider sx={{ flex: 1 }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
              <CalendarTodayIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {bucket.weekNumber !== null
                  ? `Semana ${bucket.weekNumber}${periodStartDate ? ` — ${weekDateRange(bucket.weekNumber, periodStartDate)}` : ""}`
                  : "Sin semana asignada"}
              </Typography>
            </Box>
            <Divider sx={{ flex: 1 }} />
          </Box>

          {bucket.topics.map((topic) => (
            <Accordion key={topic.id} defaultExpanded sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%" }}>
                  <Chip label={`#${topic.sortOrder}`} size="small" variant="outlined" />
                  <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>{topic.title}</Typography>
                  <Chip label={`${topic.contentItems.length} material(es)`} size="small" color="primary" variant="outlined" />
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                    {formatDate(topic.createdAt)}
                  </Typography>
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEditTopic(topic); }} title="Editar tema">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic.id); }} title="Eliminar tema">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {topic.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {topic.description}
                  </Typography>
                )}
                <List dense>
                  {topic.contentItems.map((item) => (
                    <ListItem
                      key={item.id}
                      secondaryAction={
                        <>
                          <IconButton size="small" onClick={() => openEditItem(item)} title="Editar material">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteItem(item.id)} title="Eliminar material">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      }
                      sx={{ pr: 12 }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>{typeIcons[item.type]}</ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <span>{item.title}</span>
                            <Chip label={typeLabels[item.type]} size="small" color={typeColors[item.type]} variant="outlined" />
                          </Box>
                        }
                        secondaryTypographyProps={{ component: "div" }}
                        secondary={
                          <Box>
                            {item.type === "LINK" || item.type === "FILE_REF" ? (
                              <a href={item.content} target="_blank" rel="noopener noreferrer" style={{ color: "#1976d2", wordBreak: "break-all" }}>
                                {item.content}
                              </a>
                            ) : (
                              <span>{item.content.length > 120 ? `${item.content.slice(0, 120)}…` : item.content}</span>
                            )}
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                              Publicado el {formatDate(item.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                <Button size="small" startIcon={<AddIcon />} onClick={() => openCreateItem(topic.id, topic.contentItems.length)} sx={{ mt: 1 }}>
                  Agregar Material
                </Button>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ))}

      {/* Topic Dialog */}
      <Dialog open={topicDialogOpen} onClose={() => setTopicDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTopic ? "Editar Tema" : "Nuevo Tema"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1, pt: 2 }}>
          <TextField
            label="Título" value={topicForm.title}
            onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
            fullWidth margin="dense"
          />
          <TextField
            label="Descripción" value={topicForm.description}
            onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
            fullWidth margin="dense" multiline rows={3}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Semana" type="number" value={topicForm.weekNumber}
              onChange={(e) => setTopicForm({ ...topicForm, weekNumber: e.target.value })}
              inputProps={{ min: 1 }} fullWidth margin="dense"
              helperText="Número de semana del período"
            />
            <TextField
              label="Orden dentro de la semana" type="number" value={topicForm.sortOrder}
              onChange={(e) => setTopicForm({ ...topicForm, sortOrder: Math.max(1, Number(e.target.value)) })}
              inputProps={{ min: 1 }} fullWidth margin="dense"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTopicDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveTopic} disabled={!topicForm.title}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Content Item Dialog */}
      <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? "Editar Material" : "Nuevo Material"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1, pt: 2 }}>
          <TextField
            label="Título" value={itemForm.title}
            onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
            fullWidth margin="dense"
          />
          <TextField
            select label="Tipo" value={itemForm.type}
            onChange={(e) => setItemForm({ ...itemForm, type: e.target.value as ContentItemForm["type"] })}
            fullWidth margin="dense"
          >
            <MenuItem value="TEXT">Texto</MenuItem>
            <MenuItem value="LINK">Enlace</MenuItem>
            <MenuItem value="FILE_REF">Referencia a archivo</MenuItem>
          </TextField>
          <TextField
            label={itemForm.type === "TEXT" ? "Contenido" : "URL"} value={itemForm.content}
            onChange={(e) => setItemForm({ ...itemForm, content: e.target.value })}
            fullWidth margin="dense" multiline={itemForm.type === "TEXT"} rows={itemForm.type === "TEXT" ? 4 : 1}
          />
          <TextField
            label="Orden" type="number" value={itemForm.sortOrder}
            onChange={(e) => setItemForm({ ...itemForm, sortOrder: Math.max(1, Number(e.target.value)) })}
            inputProps={{ min: 1 }} fullWidth margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveItem} disabled={!itemForm.title || !itemForm.content}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>{toast?.message}</Alert>
      </Snackbar>
    </Box>
  );
}
