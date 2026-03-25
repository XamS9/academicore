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
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataTable, Column } from '../../components/ui/DataTable';
import { useToast } from '../../hooks/useToast';
import { studentsService } from '../../services/students.service';

interface StudentUser {
  firstName: string;
  lastName: string;
  email: string;
}

interface StudentCareer {
  name: string;
}

interface StudentItem {
  id: string;
  studentCode: string;
  academicStatus: string;
  enrollmentDate: string;
  user: StudentUser;
  career: StudentCareer;
}

type AcademicStatus =
  | 'ACTIVE'
  | 'AT_RISK'
  | 'SUSPENDED'
  | 'GRADUATED'
  | 'WITHDRAWN'
  | 'ELIGIBLE_FOR_GRADUATION';

const ACADEMIC_STATUS_LABELS: Record<AcademicStatus, string> = {
  ACTIVE: 'Activo',
  AT_RISK: 'En riesgo',
  SUSPENDED: 'Suspendido',
  GRADUATED: 'Graduado',
  WITHDRAWN: 'Retirado',
  ELIGIBLE_FOR_GRADUATION: 'Elegible para graduación',
};

const ACADEMIC_STATUS_COLORS: Record<
  AcademicStatus,
  'success' | 'warning' | 'error' | 'primary' | 'default' | 'secondary'
> = {
  ACTIVE: 'success',
  AT_RISK: 'warning',
  SUSPENDED: 'error',
  GRADUATED: 'primary',
  WITHDRAWN: 'default',
  ELIGIBLE_FOR_GRADUATION: 'secondary',
};

export default function StudentsPage() {
  const [items, setItems] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StudentItem | null>(null);
  const [form, setForm] = useState<{ studentCode: string; academicStatus: AcademicStatus }>({
    studentCode: '',
    academicStatus: 'ACTIVE',
  });
  const { toast, showToast, clearToast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const data = await studentsService.getAll();
      setItems(data);
    } catch {
      showToast('Error al cargar estudiantes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ studentCode: '', academicStatus: 'ACTIVE' });
    setDialogOpen(true);
  };

  const openEdit = (item: StudentItem) => {
    setEditTarget(item);
    setForm({
      studentCode: item.studentCode,
      academicStatus: item.academicStatus as AcademicStatus,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editTarget) {
        await studentsService.update(editTarget.id, { academicStatus: form.academicStatus });
        showToast('Estudiante actualizado exitosamente');
        setDialogOpen(false);
        load();
      }
    } catch {
      showToast('Error al guardar estudiante', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar este estudiante?')) return;
    try {
      await studentsService.delete(id);
      showToast('Estudiante eliminado exitosamente');
      load();
    } catch {
      showToast('Error al eliminar estudiante', 'error');
    }
  };

  const columns: Column<StudentItem>[] = [
    {
      key: 'studentCode',
      label: 'Código',
    },
    {
      key: 'name',
      label: 'Nombre',
      render: (row) => `${row.user.firstName} ${row.user.lastName}`,
    },
    {
      key: 'career',
      label: 'Carrera',
      render: (row) => row.career?.name ?? '—',
    },
    {
      key: 'academicStatus',
      label: 'Estado',
      render: (row) => {
        const status = row.academicStatus as AcademicStatus;
        return (
          <Chip
            label={ACADEMIC_STATUS_LABELS[status] ?? row.academicStatus}
            color={ACADEMIC_STATUS_COLORS[status] ?? 'default'}
            size="small"
          />
        );
      },
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
        <Typography variant="h5">Estudiantes</Typography>
        <Button variant="contained" onClick={openCreate}>
          Nuevo Estudiante
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        getRowKey={(r) => r.id}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Editar Estudiante' : 'Nuevo Estudiante'}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          {!editTarget ? (
            <Alert severity="info">
              <AlertTitle>Información</AlertTitle>
              Para crear un estudiante, primero cree un usuario de tipo ESTUDIANTE desde la sección
              de Usuarios. Luego el perfil de estudiante se generará automáticamente.
            </Alert>
          ) : (
            <>
              <TextField
                label="Código de estudiante"
                value={form.studentCode}
                disabled
                fullWidth
                margin="dense"
                helperText="El código no puede modificarse"
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Estado académico</InputLabel>
                <Select
                  label="Estado académico"
                  value={form.academicStatus}
                  onChange={(e) =>
                    setForm({ ...form, academicStatus: e.target.value as AcademicStatus })
                  }
                >
                  {(Object.keys(ACADEMIC_STATUS_LABELS) as AcademicStatus[]).map((key) => (
                    <MenuItem key={key} value={key}>
                      {ACADEMIC_STATUS_LABELS[key]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
