import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import { DataTable, Column } from '../../components/ui/DataTable';
import { useToast } from '../../hooks/useToast';
import { paymentsService } from '../../services/payments.service';
import { studentsService } from '../../services/students.service';
import { academicPeriodsService } from '../../services/academic-periods.service';

interface FeeConcept { id: string; name: string; amount: string; description: string | null; }
interface StudentFee {
  id: string; amount: string; dueDate: string; status: string;
  student: { studentCode: string; user: { firstName: string; lastName: string } };
  feeConcept: { name: string }; period: { name: string };
}

const statusColors: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  PENDING: 'warning', PAID: 'success', OVERDUE: 'error', CANCELLED: 'default',
};

export default function PaymentsPage() {
  const [tab, setTab] = useState(0);
  const [concepts, setConcepts] = useState<FeeConcept[]>([]);
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [openConcept, setOpenConcept] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [conceptForm, setConceptForm] = useState({ name: '', amount: '', description: '' });
  const [assignForm, setAssignForm] = useState({ studentId: '', feeConceptId: '', periodId: '', amount: '', dueDate: '' });
  const [students, setStudents] = useState<{ id: string; studentCode: string; user: { firstName: string; lastName: string } }[]>([]);
  const [periods, setPeriods] = useState<{ id: string; name: string }[]>([]);
  const { toast, showToast, clearToast } = useToast();

  const loadConcepts = () => paymentsService.getFeeConcepts().then(setConcepts).catch(() => showToast('Error al cargar conceptos', 'error'));
  const loadFees = () => paymentsService.getStudentFees().then(setFees).catch(() => showToast('Error al cargar cargos', 'error'));

  useEffect(() => {
    Promise.all([loadConcepts(), loadFees()]).finally(() => setLoading(false));
    studentsService.getAll().then(setStudents).catch(() => {});
    academicPeriodsService.getAll().then(setPeriods).catch(() => {});
  }, []);

  const handleCreateConcept = async () => {
    try {
      await paymentsService.createFeeConcept({ ...conceptForm, amount: Number(conceptForm.amount) });
      showToast('Concepto creado');
      setOpenConcept(false);
      setConceptForm({ name: '', amount: '', description: '' });
      loadConcepts();
    } catch { showToast('Error al crear concepto', 'error'); }
  };

  const handleAssignFee = async () => {
    try {
      await paymentsService.assignFee({ ...assignForm, amount: Number(assignForm.amount) });
      showToast('Cargo asignado');
      setOpenAssign(false);
      setAssignForm({ studentId: '', feeConceptId: '', periodId: '', amount: '', dueDate: '' });
      loadFees();
    } catch { showToast('Error al asignar cargo', 'error'); }
  };

  const conceptColumns: Column<FeeConcept>[] = [
    { key: 'name', label: 'Nombre', render: (r) => r.name },
    { key: 'amount', label: 'Monto', render: (r) => `$${Number(r.amount).toFixed(2)}` },
    { key: 'description', label: 'Descripción', render: (r) => r.description ?? '—' },
  ];

  const feeColumns: Column<StudentFee>[] = [
    { key: 'student', label: 'Estudiante', render: (r) => `${r.student.user.firstName} ${r.student.user.lastName} (${r.student.studentCode})` },
    { key: 'concept', label: 'Concepto', render: (r) => r.feeConcept.name },
    { key: 'period', label: 'Período', render: (r) => r.period.name },
    { key: 'amount', label: 'Monto', render: (r) => `$${Number(r.amount).toFixed(2)}` },
    { key: 'dueDate', label: 'Vencimiento', render: (r) => new Date(r.dueDate).toLocaleDateString('es-MX') },
    { key: 'status', label: 'Estado', render: (r) => <Chip label={r.status} color={statusColors[r.status] ?? 'default'} size="small" /> },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Pagos</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Conceptos de Cobro" />
        <Tab label="Cargos a Estudiantes" />
      </Tabs>

      {tab === 0 && (
        <>
          <Box className="flex justify-end mb-4">
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenConcept(true)}>Nuevo Concepto</Button>
          </Box>
          <DataTable columns={conceptColumns} rows={concepts} loading={loading} getRowKey={(r) => r.id} />
        </>
      )}

      {tab === 1 && (
        <>
          <Box className="flex justify-end mb-4">
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAssign(true)}>Asignar Cargo</Button>
          </Box>
          <DataTable columns={feeColumns} rows={fees} loading={loading} getRowKey={(r) => r.id} />
        </>
      )}

      {/* New Concept Dialog */}
      <Dialog open={openConcept} onClose={() => setOpenConcept(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Concepto de Cobro</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-2">
          <TextField label="Nombre" value={conceptForm.name} onChange={(e) => setConceptForm({ ...conceptForm, name: e.target.value })} fullWidth margin="dense" />
          <TextField label="Monto" type="number" value={conceptForm.amount} onChange={(e) => setConceptForm({ ...conceptForm, amount: e.target.value })} fullWidth margin="dense" />
          <TextField label="Descripción" value={conceptForm.description} onChange={(e) => setConceptForm({ ...conceptForm, description: e.target.value })} fullWidth margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConcept(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateConcept}>Crear</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Fee Dialog */}
      <Dialog open={openAssign} onClose={() => setOpenAssign(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Asignar Cargo a Estudiante</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-2">
          <TextField select label="Estudiante" value={assignForm.studentId} onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })} fullWidth margin="dense">
            {students.map((s) => <MenuItem key={s.id} value={s.id}>{s.user.firstName} {s.user.lastName} ({s.studentCode})</MenuItem>)}
          </TextField>
          <TextField select label="Concepto" value={assignForm.feeConceptId} onChange={(e) => {
            const concept = concepts.find((c) => c.id === e.target.value);
            setAssignForm({ ...assignForm, feeConceptId: e.target.value, amount: concept ? String(Number(concept.amount)) : assignForm.amount });
          }} fullWidth margin="dense">
            {concepts.map((c) => <MenuItem key={c.id} value={c.id}>{c.name} (${Number(c.amount).toFixed(2)})</MenuItem>)}
          </TextField>
          <TextField select label="Período" value={assignForm.periodId} onChange={(e) => setAssignForm({ ...assignForm, periodId: e.target.value })} fullWidth margin="dense">
            {periods.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
          <TextField label="Monto" type="number" value={assignForm.amount} onChange={(e) => setAssignForm({ ...assignForm, amount: e.target.value })} fullWidth margin="dense" />
          <TextField label="Fecha de Vencimiento" type="date" value={assignForm.dueDate} onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssign(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAssignFee}>Asignar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>{toast?.message}</Alert>
      </Snackbar>
    </Box>
  );
}
