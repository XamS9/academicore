import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { DataTable, Column } from '../../components/ui/DataTable';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../store/auth.context';
import { groupsService } from '../../services/groups.service';
import { evaluationsService } from '../../services/evaluations.service';
import { gradesService } from '../../services/grades.service';
import { teachersService } from '../../services/teachers.service';

interface GroupOption {
  id: string;
  groupCode: string;
  subject: { name: string; code: string };
  academicPeriod: { name: string };
}

interface EvalOption {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
}

interface GradeRow {
  id: string;
  score: number;
  evaluationId: string;
  studentId: string;
  student: {
    id: string;
    studentCode: string;
    user: { firstName: string; lastName: string };
  };
}

export default function GradesPage() {
  const { currentUser } = useAuth();
  const isTeacher = currentUser?.role === 'TEACHER';

  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [evaluations, setEvaluations] = useState<EvalOption[]>([]);
  const [selectedEval, setSelectedEval] = useState('');
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [editedScores, setEditedScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const groupList = isTeacher
          ? await teachersService.getByUserId(currentUser!.id).then((t: { id: string }) => groupsService.getByTeacher(t.id))
          : await groupsService.getAll();
        setGroups(groupList);
      } catch {
        showToast('Error al cargar grupos', 'error');
      }
    };
    loadGroups();
  }, []);

  useEffect(() => {
    setSelectedEval('');
    setGrades([]);
    if (!selectedGroup) {
      setEvaluations([]);
      return;
    }
    evaluationsService.getByGroup(selectedGroup).then(setEvaluations).catch(() =>
      showToast('Error al cargar evaluaciones', 'error'),
    );
  }, [selectedGroup]);

  useEffect(() => {
    if (!selectedEval) {
      setGrades([]);
      return;
    }
    const loadGrades = async () => {
      try {
        setLoading(true);
        const data = await gradesService.getByEvaluation(selectedEval);
        setGrades(data);
        const scores: Record<string, number> = {};
        data.forEach((g: GradeRow) => {
          scores[g.student.id] = Number(g.score);
        });
        setEditedScores(scores);
      } catch {
        showToast('Error al cargar calificaciones', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadGrades();
  }, [selectedEval]);

  const handleScoreChange = (studentId: string, value: number) => {
    setEditedScores((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleSaveAll = async () => {
    try {
      const gradesToSave = Object.entries(editedScores).map(([studentId, score]) => ({
        evaluationId: selectedEval,
        studentId,
        score,
      }));
      await gradesService.bulkUpsert(gradesToSave);
      showToast('Calificaciones guardadas');
      const data = await gradesService.getByEvaluation(selectedEval);
      setGrades(data);
    } catch {
      showToast('Error al guardar calificaciones', 'error');
    }
  };

  const currentEval = evaluations.find((e) => e.id === selectedEval);

  const columns: Column<GradeRow>[] = [
    {
      key: 'studentCode',
      label: 'Código',
      render: (row) => row.student.studentCode,
    },
    {
      key: 'studentName',
      label: 'Estudiante',
      render: (row) => `${row.student.user.firstName} ${row.student.user.lastName}`,
    },
    {
      key: 'score',
      label: `Calificación (máx. ${currentEval ? Number(currentEval.maxScore) : 100})`,
      render: (row) => (
        <TextField
          type="number"
          size="small"
          value={editedScores[row.student.id] ?? ''}
          onChange={(e) => handleScoreChange(row.student.id, Number(e.target.value))}
          inputProps={{ min: 0, max: currentEval ? Number(currentEval.maxScore) : 100, step: 0.01 }}
          sx={{ width: 100 }}
        />
      ),
    },
  ];

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5">Calificaciones</Typography>
        {selectedEval && grades.length > 0 && (
          <Button variant="contained" onClick={handleSaveAll}>
            Guardar Todo
          </Button>
        )}
      </Box>

      <Box className="flex gap-4 mb-4">
        <TextField
          select
          label="Grupo"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          fullWidth
        >
          <MenuItem value="">— Seleccione un grupo —</MenuItem>
          {groups.map((g) => (
            <MenuItem key={g.id} value={g.id}>
              {g.subject.name} ({g.groupCode}) — {g.academicPeriod?.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Evaluación"
          value={selectedEval}
          onChange={(e) => setSelectedEval(e.target.value)}
          fullWidth
          disabled={!selectedGroup}
        >
          <MenuItem value="">— Seleccione una evaluación —</MenuItem>
          {evaluations.map((e) => (
            <MenuItem key={e.id} value={e.id}>
              {e.name} ({Number(e.weight)}%)
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <DataTable columns={columns} rows={grades} loading={loading} getRowKey={(r) => r.id} />

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
