import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { DataTable, Column } from '../../components/ui/DataTable';
import { useToast } from '../../hooks/useToast';
import { calendarEventsService } from '../../services/calendar-events.service';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  startDate: string;
  endDate: string;
  period?: { id: string; name: string } | null;
}

const eventTypeLabels: Record<string, string> = {
  HOLIDAY: 'Día Festivo',
  EXAM_WEEK: 'Semana de Exámenes',
  DEADLINE: 'Fecha Límite',
  OTHER: 'Otro',
};

const eventTypeColors: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  HOLIDAY: 'error',
  EXAM_WEEK: 'warning',
  DEADLINE: 'info',
  OTHER: 'default',
};

const emptyForm = { title: '', description: '', eventType: 'OTHER', startDate: '', endDate: '' };

export default function CalendarEventsPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { toast, showToast, clearToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      setEvents(await calendarEventsService.getAll());
    } catch { showToast('Error al cargar eventos', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleOpen = (event?: CalendarEvent) => {
    if (event) {
      setEditing(event);
      setForm({
        title: event.title,
        description: event.description ?? '',
        eventType: event.eventType,
        startDate: event.startDate.slice(0, 10),
        endDate: event.endDate.slice(0, 10),
      });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await calendarEventsService.update(editing.id, form);
        showToast('Evento actualizado');
      } else {
        await calendarEventsService.create(form);
        showToast('Evento creado');
      }
      setOpen(false);
      load();
    } catch { showToast('Error al guardar evento', 'error'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await calendarEventsService.delete(id);
      showToast('Evento eliminado');
      load();
    } catch { showToast('Error al eliminar evento', 'error'); }
  };

  const columns: Column<CalendarEvent>[] = [
    { key: 'title', label: 'Título', render: (r) => r.title },
    { key: 'eventType', label: 'Tipo', render: (r) => <Chip label={eventTypeLabels[r.eventType] ?? r.eventType} color={eventTypeColors[r.eventType] ?? 'default'} size="small" /> },
    { key: 'startDate', label: 'Inicio', render: (r) => new Date(r.startDate).toLocaleDateString('es-MX') },
    { key: 'endDate', label: 'Fin', render: (r) => new Date(r.endDate).toLocaleDateString('es-MX') },
    {
      key: 'actions', label: 'Acciones', render: (r) => (
        <Box>
          <IconButton size="small" onClick={() => handleOpen(r)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5">Calendario Académico</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>Nuevo Evento</Button>
      </Box>

      <DataTable columns={columns} rows={events} loading={loading} getRowKey={(r) => r.id} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar Evento' : 'Nuevo Evento'}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-2">
          <TextField label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth margin="dense" />
          <TextField label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} margin="dense" />
          <TextField select label="Tipo" value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })} fullWidth margin="dense">
            {Object.entries(eventTypeLabels).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
          </TextField>
          <Box className="flex gap-4">
            <TextField label="Fecha Inicio" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} margin="dense" />
            <TextField label="Fecha Fin" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} margin="dense" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>{toast?.message}</Alert>
      </Snackbar>
    </Box>
  );
}
