import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { DataTable, Column } from '../../components/ui/DataTable';
import { useToast } from '../../hooks/useToast';
import { classroomsService } from '../../services/classrooms.service';
import { api } from '../../services/api';

interface ClassroomItem {
  id: string;
  name: string;
  building: string;
  capacity: number;
  isActive: boolean;
}

interface ClassroomForm {
  name: string;
  building: string;
  capacity: number;
}

export default function ClassroomsPage() {
  const [items, setItems] = useState<ClassroomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ClassroomItem | null>(null);
  const [form, setForm] = useState<ClassroomForm>({ name: '', building: '', capacity: 1 });
  const { toast, showToast, clearToast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const data = await classroomsService.getAll();
      setItems(data);
    } catch {
      showToast('Error al cargar aulas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: '', building: '', capacity: 1 });
    setDialogOpen(true);
  };

  const openEdit = (item: ClassroomItem) => {
    setEditTarget(item);
    setForm({ name: item.name, building: item.building ?? '', capacity: item.capacity });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editTarget) {
        await classroomsService.update(editTarget.id, form);
        showToast('Aula actualizada exitosamente');
      } else {
        await classroomsService.create(form);
        showToast('Aula creada exitosamente');
      }
      setDialogOpen(false);
      load();
    } catch {
      showToast('Error al guardar aula', 'error');
    }
  };

  const handleToggleActive = async (item: ClassroomItem) => {
    try {
      await api.patch(`/classrooms/${item.id}/toggle-active`);
      showToast(`Aula ${item.isActive ? 'desactivada' : 'activada'} exitosamente`);
      load();
    } catch {
      showToast('Error al cambiar estado del aula', 'error');
    }
  };

  const columns: Column<ClassroomItem>[] = [
    {
      key: 'name',
      label: 'Nombre',
    },
    {
      key: 'building',
      label: 'Edificio',
      render: (row) => row.building ?? '—',
    },
    {
      key: 'capacity',
      label: 'Capacidad',
    },
    {
      key: 'isActive',
      label: 'Estado',
      render: (row) => (
        <Chip
          label={row.isActive ? 'Activo' : 'Inactivo'}
          color={row.isActive ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <>
          <IconButton size="small" onClick={() => openEdit(row)} title="Editar">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color={row.isActive ? 'warning' : 'success'}
            onClick={() => handleToggleActive(row)}
            title={row.isActive ? 'Desactivar' : 'Activar'}
          >
            <PowerSettingsNewIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5">Aulas</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nueva Aula
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        getRowKey={(r) => r.id}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Editar Aula' : 'Nueva Aula'}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <TextField
            label="Nombre del aula"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Edificio (opcional)"
            value={form.building}
            onChange={(e) => setForm({ ...form, building: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Capacidad"
            type="number"
            value={form.capacity}
            onChange={(e) =>
              setForm({ ...form, capacity: Math.max(1, parseInt(e.target.value, 10) || 1) })
            }
            inputProps={{ min: 1 }}
            fullWidth
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            Guardar
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
