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
import Chip from "@mui/material/Chip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../store/auth.context";
import { announcementsService } from "../../services/announcements.service";
import { careersService } from "../../services/careers.service";
import { groupsService } from "../../services/groups.service";

interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: string;
  targetId: string | null;
  publishedAt: string;
  author: { firstName: string; lastName: string };
}

const audienceLabels: Record<string, string> = {
  ALL: "Todos",
  CAREER: "Carrera",
  GROUP: "Grupo",
};

const emptyForm = { title: "", body: "", audience: "ALL", targetId: "" };

export default function AnnouncementsPage() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";
  const isTeacher = currentUser?.role === "TEACHER";
  const canManage = isAdmin || isTeacher;
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [careers, setCareers] = useState<{ id: string; name: string }[]>([]);
  const [groups, setGroups] = useState<
    { id: string; groupCode: string; subject: { name: string } }[]
  >([]);
  const { toast, showToast, clearToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      // Students see only their relevant announcements; admins/teachers see all
      setAnnouncements(
        canManage
          ? await announcementsService.getAll()
          : await announcementsService.getMy(),
      );
    } catch {
      showToast("Error al cargar anuncios", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (canManage) {
      careersService
        .getAll()
        .then(setCareers)
        .catch(() => {});
      groupsService
        .getAll()
        .then(setGroups)
        .catch(() => {});
    }
  }, []);

  const handleOpen = (a?: Announcement) => {
    if (a) {
      setEditing(a);
      setForm({
        title: a.title,
        body: a.body,
        audience: a.audience,
        targetId: a.targetId ?? "",
      });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        targetId: form.audience !== "ALL" ? form.targetId : undefined,
      };
      if (editing) {
        await announcementsService.update(editing.id, {
          title: form.title,
          body: form.body,
        });
        showToast("Anuncio actualizado");
      } else {
        await announcementsService.create(payload);
        showToast("Anuncio publicado");
      }
      setOpen(false);
      load();
    } catch {
      showToast("Error al guardar anuncio", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await announcementsService.delete(id);
      showToast("Anuncio eliminado");
      load();
    } catch {
      showToast("Error al eliminar anuncio", "error");
    }
  };

  const columns: Column<Announcement>[] = [
    { key: "title", label: "Título", render: (r) => r.title },
    {
      key: "audience",
      label: "Audiencia",
      render: (r) => <Chip label={audienceLabels[r.audience]} size="small" />,
    },
    {
      key: "author",
      label: "Autor",
      render: (r) => `${r.author.firstName} ${r.author.lastName}`,
    },
    {
      key: "publishedAt",
      label: "Fecha",
      render: (r) => new Date(r.publishedAt).toLocaleDateString("es-MX"),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            label: "Acciones",
            render: (r: Announcement) => (
              <Box>
                <IconButton size="small" onClick={() => handleOpen(r)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                {isAdmin && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(r.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ),
          },
        ]
      : []),
  ];

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5">Anuncios</Typography>
        {canManage && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Nuevo Anuncio
          </Button>
        )}
      </Box>

      <DataTable
        columns={columns}
        rows={announcements}
        loading={loading}
        getRowKey={(r) => r.id}
      />

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editing ? "Editar Anuncio" : "Nuevo Anuncio"}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-2">
          <TextField
            label="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Contenido"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            fullWidth
            multiline
            rows={3}
            margin="dense"
          />
          {!editing && (
            <>
              <TextField
                select
                label="Audiencia"
                value={form.audience}
                onChange={(e) =>
                  setForm({ ...form, audience: e.target.value, targetId: "" })
                }
                fullWidth
                margin="dense"
              >
                {Object.entries(audienceLabels).map(([k, v]) => (
                  <MenuItem key={k} value={k}>
                    {v}
                  </MenuItem>
                ))}
              </TextField>
              {form.audience === "CAREER" && (
                <TextField
                  select
                  label="Carrera"
                  value={form.targetId}
                  onChange={(e) =>
                    setForm({ ...form, targetId: e.target.value })
                  }
                  fullWidth
                  margin="dense"
                >
                  {careers.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              {form.audience === "GROUP" && (
                <TextField
                  select
                  label="Grupo"
                  value={form.targetId}
                  onChange={(e) =>
                    setForm({ ...form, targetId: e.target.value })
                  }
                  fullWidth
                  margin="dense"
                >
                  {groups.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.subject.name} ({g.groupCode})
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            {editing ? "Guardar" : "Publicar"}
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
