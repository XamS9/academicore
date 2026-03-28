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
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import EditIcon from '@mui/icons-material/Edit';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import AddIcon from '@mui/icons-material/Add';
import { DataTable, Column } from '../../components/ui/DataTable';
import { useToast } from '../../hooks/useToast';
import { usersService } from '../../services/users.service';
import { api } from '../../services/api';

interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'ADMIN' | 'TEACHER' | 'STUDENT';
  isActive: boolean;
}

interface UserForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

const USER_TYPE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  TEACHER: 'Docente',
  STUDENT: 'Estudiante',
};

const USER_TYPE_COLORS: Record<string, 'primary' | 'success' | 'warning'> = {
  ADMIN: 'primary',
  TEACHER: 'success',
  STUDENT: 'warning',
};

export default function UsersPage() {
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserItem | null>(null);
  const [form, setForm] = useState<UserForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    userType: 'STUDENT',
  });
  const { toast, showToast, clearToast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const data = await usersService.getAll();
      setItems(data);
    } catch {
      showToast('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ firstName: '', lastName: '', email: '', password: '', userType: 'STUDENT' });
    setDialogOpen(true);
  };

  const openEdit = (item: UserItem) => {
    setEditTarget(item);
    setForm({
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.email,
      password: '',
      userType: item.userType,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editTarget) {
        const updateData: Partial<UserForm> = {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          userType: form.userType,
        };
        await usersService.update(editTarget.id, updateData);
        showToast('Usuario actualizado exitosamente');
      } else {
        await usersService.create(form);
        showToast('Usuario creado exitosamente');
      }
      setDialogOpen(false);
      load();
    } catch {
      showToast('Error al guardar usuario', 'error');
    }
  };

  const handleToggleActive = async (item: UserItem) => {
    try {
      await api.patch(`/users/${item.id}/toggle-active`);
      showToast(`Usuario ${item.isActive ? 'desactivado' : 'activado'} exitosamente`);
      load();
    } catch {
      showToast('Error al cambiar estado del usuario', 'error');
    }
  };

  const columns: Column<UserItem>[] = [
    {
      key: 'name',
      label: 'Nombre',
      render: (row) => `${row.firstName} ${row.lastName}`,
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'userType',
      label: 'Tipo',
      render: (row) => (
        <Chip
          label={USER_TYPE_LABELS[row.userType] ?? row.userType}
          color={USER_TYPE_COLORS[row.userType] ?? 'default'}
          size="small"
        />
      ),
    },
    {
      key: 'isActive',
      label: 'Activo',
      render: (row) => (
        <Chip
          label={row.isActive ? 'Activo' : 'Inactivo'}
          color={row.isActive ? 'success' : 'error'}
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
            color={row.isActive ? 'error' : 'success'}
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
        <Typography variant="h5">Usuarios</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nuevo Usuario
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        getRowKey={(r) => r.id}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <TextField
            label="Nombre"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Apellido"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Correo electrónico"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            fullWidth
            margin="dense"
          />
          {!editTarget && (
            <TextField
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              fullWidth
              margin="dense"
            />
          )}
          <FormControl fullWidth margin="dense">
            <InputLabel>Tipo de usuario</InputLabel>
            <Select
              label="Tipo de usuario"
              value={form.userType}
              onChange={(e) =>
                setForm({ ...form, userType: e.target.value as UserForm['userType'] })
              }
            >
              <MenuItem value="ADMIN">Administrador</MenuItem>
              <MenuItem value="TEACHER">Docente</MenuItem>
              <MenuItem value="STUDENT">Estudiante</MenuItem>
            </Select>
          </FormControl>
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
