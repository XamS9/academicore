import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { DataTable, Column } from '../../components/ui/DataTable';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../store/auth.context';
import { enrollmentsService } from '../../services/enrollments.service';
import { studentsService } from '../../services/students.service';
import { academicPeriodsService } from '../../services/academic-periods.service';
import { api } from '../../services/api';

interface AvailableGroup {
  id: string;
  groupCode: string;
  maxStudents: number;
  currentStudents: number;
  subject: { id: string; name: string; code: string; credits: number };
  teacher: { user: { firstName: string; lastName: string } };
}

export default function StudentSelfEnrollPage() {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState<AvailableGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [activePeriodId, setActivePeriodId] = useState<string | null>(null);
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const student = await studentsService.getByUserId(currentUser!.id);
        setStudentId(student.id);

        const periods = await academicPeriodsService.getAll();
        const activePeriod = periods.find((p: any) => p.status === 'ACTIVE');
        if (activePeriod) setActivePeriodId(activePeriod.id);

        const available = await api.get('/enrollments/available-groups').then((r) => r.data);
        setGroups(available);
      } catch {
        showToast('Error al cargar materias disponibles', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleEnroll = async (groupId: string) => {
    if (!studentId || !activePeriodId) return;
    setEnrollingId(groupId);
    try {
      await enrollmentsService.enroll({ studentId, groupId, periodId: activePeriodId });
      showToast('Inscripción exitosa');
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al inscribirse';
      showToast(msg, 'error');
    } finally {
      setEnrollingId(null);
    }
  };

  const columns: Column<AvailableGroup>[] = [
    { key: 'code', label: 'Código', render: (r) => r.subject.code },
    { key: 'name', label: 'Materia', render: (r) => r.subject.name },
    { key: 'group', label: 'Grupo', render: (r) => r.groupCode },
    { key: 'credits', label: 'Créditos', render: (r) => r.subject.credits },
    { key: 'teacher', label: 'Profesor', render: (r) => `${r.teacher.user.firstName} ${r.teacher.user.lastName}` },
    {
      key: 'capacity', label: 'Cupo', render: (r) => (
        <Chip
          label={`${r.currentStudents}/${r.maxStudents}`}
          color={r.currentStudents < r.maxStudents ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      key: 'actions', label: '', render: (r) => (
        <Button
          size="small"
          variant="contained"
          disabled={enrollingId === r.id || r.currentStudents >= r.maxStudents}
          onClick={() => handleEnroll(r.id)}
        >
          {enrollingId === r.id ? 'Inscribiendo...' : 'Inscribir'}
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>Inscribir Materias</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Materias disponibles para el período activo en tu carrera
      </Typography>

      <DataTable columns={columns} rows={groups} loading={loading} getRowKey={(r) => r.id} />

      {!loading && groups.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          No hay materias disponibles para inscripción en este momento.
        </Typography>
      )}

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>{toast?.message}</Alert>
      </Snackbar>
    </Box>
  );
}
