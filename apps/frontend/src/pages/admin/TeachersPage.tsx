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
import AlertTitle from '@mui/material/AlertTitle';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import { DataTable, Column } from '../../components/ui/DataTable';
import { useToast } from '../../hooks/useToast';
import { teachersService } from '../../services/teachers.service';

interface TeacherUser {
  firstName: string;
  lastName: string;
  email: string;
}

interface TeacherItem {
  id: string;
  employeeCode: string;
  department: string;
  user: TeacherUser;
}

interface TeacherForm {
  employeeCode: string;
  department: string;
}

export default function TeachersPage() {
  const [items, setItems] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeacherItem | null>(null);
  const [form, setForm] = useState<TeacherForm>({ employeeCode: '', department: '' });
  const { toast, showToast, clearToast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const data = await teachersService.getAll();
      setItems(data);
    } catch {
      showToast('Error al cargar docentes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ employeeCode: '', department: '' });
    setDialogOpen(true);
  };

  const openEdit = (item: TeacherItem) => {
    setEditTarget(item);
    setForm({ employeeCode: item.employeeCode, department: item.department ?? '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editTarget) {
        await teachersService.update(editTarget.id, form);
        showToast('Docente actualizado exitosamente');
        setDialogOpen(false);
        load();
      }
    } catch {
      showToast('Error al guardar docente', 'error');
    }
  };

  const columns: Column<TeacherItem>[] = [
    {
      key: 'employeeCode',
      label: 'Código',
    },
    {
      key: 'name',
      label: 'Nombre',
      render: (row) => `${row.user.firstName} ${row.user.lastName}`,
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => row.user.email,
    },
    {
      key: 'department',
      label: 'Departamento',
      render: (row) => row.department ?? '—',
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <IconButton size="small" onClick={() => openEdit(row)} title="Editar">
          <EditIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5">Docentes</Typography>
        <Button variant="contained" onClick={openCreate}>
          Nuevo Docente
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        getRowKey={(r) => r.id}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Editar Docente' : 'Nuevo Docente'}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          {!editTarget ? (
            <Alert severity="info">
              <AlertTitle>Información</AlertTitle>
              Para crear un docente, primero cree un usuario de tipo DOCENTE desde la sección de
              Usuarios. Luego el perfil de docente se generará automáticamente.
            </Alert>
          ) : (
            <>
              <TextField
                label="Código de empleado"
                value={form.employeeCode}
                onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                fullWidth
                margin="dense"
              />
              <TextField
                label="Departamento"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                fullWidth
                margin="dense"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          {editTarget && (
            <Button variant="contained" onClick={handleSave}>
              Guardar
            </Button>
          )}
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
