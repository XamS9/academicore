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
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { DataTable, Column } from '../../components/ui/DataTable';
import { useToast } from '../../hooks/useToast';
import { subjectsService } from '../../services/subjects.service';

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  credits: number;
  isActive: boolean;
}

interface SubjectForm {
  name: string;
  code: string;
  credits: number;
}

export default function SubjectsPage() {
  const [items, setItems] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SubjectItem | null>(null);
  const [form, setForm] = useState<SubjectForm>({ name: '', code: '', credits: 1 });
  const { toast, showToast, clearToast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const data = await subjectsService.getAll();
      setItems(data);
    } catch {
      showToast('Error al cargar materias', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: '', code: '', credits: 1 });
    setDialogOpen(true);
  };

  const openEdit = (item: SubjectItem) => {
    setEditTarget(item);
    setForm({ name: item.name, code: item.code, credits: item.credits });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editTarget) {
        await subjectsService.update(editTarget.id, form);
        showToast('Materia actualizada exitosamente');
      } else {
        await subjectsService.create(form);
        showToast('Materia creada exitosamente');
      }
      setDialogOpen(false);
      load();
    } catch {
      showToast('Error al guardar materia', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta materia?')) return;
    try {
      await subjectsService.delete(id);
      showToast('Materia eliminada exitosamente');
      load();
    } catch {
      showToast('Error al eliminar materia', 'error');
    }
  };

  const columns: Column<SubjectItem>[] = [
    {
      key: 'code',
      label: 'Código',
    },
    {
      key: 'name',
      label: 'Nombre',
    },
    {
      key: 'credits',
      label: 'Créditos',
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
            color="error"
            onClick={() => handleDelete(row.id)}
            title="Eliminar"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5">Materias</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nueva Materia
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        getRowKey={(r) => r.id}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Editar Materia' : 'Nueva Materia'}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <TextField
            label="Nombre de la materia"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Código"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Créditos"
            type="number"
            value={form.credits}
            onChange={(e) =>
              setForm({ ...form, credits: Math.max(1, parseInt(e.target.value, 10) || 1) })
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
