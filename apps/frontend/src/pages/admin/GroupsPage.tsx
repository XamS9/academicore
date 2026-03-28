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
import EditIcon from '@mui/icons-material/Edit';
import { DataTable, Column } from '../../components/ui/DataTable';
import { useToast } from '../../hooks/useToast';
import { groupsService } from '../../services/groups.service';

interface GroupSubject {
  name: string;
  code: string;
}

interface GroupPeriod {
  name: string;
}

interface GroupTeacherUser {
  firstName: string;
  lastName: string;
}

interface GroupTeacher {
  user: GroupTeacherUser;
}

interface GroupItem {
  id: string;
  groupCode: string;
  maxStudents: number;
  currentStudents: number;
  isActive: boolean;
  subject: GroupSubject;
  academicPeriod: GroupPeriod;
  teacher: GroupTeacher;
}

interface GroupForm {
  groupCode: string;
  maxStudents: number;
}

export default function GroupsPage() {
  const [items, setItems] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GroupItem | null>(null);
  const [form, setForm] = useState<GroupForm>({ groupCode: '', maxStudents: 30 });
  const { toast, showToast, clearToast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const data = await groupsService.getAll();
      setItems(data);
    } catch {
      showToast('Error al cargar grupos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ groupCode: '', maxStudents: 30 });
    setDialogOpen(true);
  };

  const openEdit = (item: GroupItem) => {
    setEditTarget(item);
    setForm({ groupCode: item.groupCode, maxStudents: item.maxStudents });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editTarget) {
        await groupsService.update(editTarget.id, form);
        showToast('Grupo actualizado exitosamente');
        setDialogOpen(false);
        load();
      }
    } catch {
      showToast('Error al guardar grupo', 'error');
    }
  };

  const columns: Column<GroupItem>[] = [
    {
      key: 'groupCode',
      label: 'Código',
    },
    {
      key: 'subject',
      label: 'Materia',
      render: (row) =>
        row.subject ? `${row.subject.name} (${row.subject.code})` : '—',
    },
    {
      key: 'academicPeriod',
      label: 'Período',
      render: (row) => row.academicPeriod?.name ?? '—',
    },
    {
      key: 'teacher',
      label: 'Docente',
      render: (row) =>
        row.teacher?.user
          ? `${row.teacher.user.firstName} ${row.teacher.user.lastName}`
          : '—',
    },
    {
      key: 'cupos',
      label: 'Cupos',
      render: (row) => `${row.currentStudents}/${row.maxStudents}`,
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
        <IconButton size="small" onClick={() => openEdit(row)} title="Editar">
          <EditIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5">Grupos</Typography>
        <Button variant="contained" onClick={openCreate}>
          Nuevo Grupo
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        getRowKey={(r) => r.id}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Editar Grupo' : 'Nuevo Grupo'}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          {!editTarget ? (
            <Alert severity="info">
              <AlertTitle>Información</AlertTitle>
              Para crear un grupo, use la API directamente con los siguientes campos: subjectId,
              academicPeriodId, teacherId, groupCode y maxStudents.
            </Alert>
          ) : (
            <>
              <TextField
                label="Código del grupo"
                value={form.groupCode}
                onChange={(e) => setForm({ ...form, groupCode: e.target.value })}
                fullWidth
                margin="dense"
              />
              <TextField
                label="Máximo de estudiantes"
                type="number"
                value={form.maxStudents}
                onChange={(e) =>
                  setForm({ ...form, maxStudents: Math.max(1, parseInt(e.target.value, 10) || 1) })
                }
                inputProps={{ min: 1 }}
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
