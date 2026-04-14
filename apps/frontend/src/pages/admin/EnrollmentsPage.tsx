import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Chip from "@mui/material/Chip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../services/api";
import { enrollmentsService } from "../../services/enrollments.service";
import { studentsService } from "../../services/students.service";
import { groupsService } from "../../services/groups.service";
import { academicPeriodsService } from "../../services/academic-periods.service";
import {
  GroupAutocomplete,
  PeriodAutocomplete,
  StudentAutocomplete,
} from "../../components/ui/ScalablePickers";

interface PeriodOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface StudentOption {
  id: string;
  studentCode: string;
  user: { firstName: string; lastName: string };
}

interface GroupOption {
  id: string;
  groupCode: string;
  subject: { name: string; code: string };
}

interface EnrollmentRow {
  id: string;
  status: string;
  enrolledAt: string;
  student: {
    id: string;
    studentCode: string;
    user: { firstName: string; lastName: string };
  };
  enrollmentSubjects: { id: string }[];
}

const statusLabels: Record<string, string> = {
  ACTIVE: "Activa",
  CLOSED: "Cerrada",
  CANCELLED: "Cancelada",
};

const statusColors: Record<
  string,
  "success" | "warning" | "error" | "default"
> = {
  ACTIVE: "success",
  CLOSED: "default",
  CANCELLED: "error",
};

export default function EnrollmentsPage() {
  const [periods, setPeriods] = useState<PeriodOption[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [items, setItems] = useState<EnrollmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [form, setForm] = useState({
    studentId: "",
    groupId: "",
    periodId: "",
  });
  const [enrollmentListVersion, setEnrollmentListVersion] = useState(0);
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    academicPeriodsService
      .getAll()
      .then(setPeriods)
      .catch(() => showToast("Error al cargar períodos", "error"));
  }, []);

  useEffect(() => {
    if (!selectedPeriod) {
      setItems([]);
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const data = await enrollmentsService.getByPeriod(selectedPeriod);
        setItems(data as EnrollmentRow[]);
      } catch {
        showToast("Error al cargar inscripciones", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedPeriod, enrollmentListVersion]);

  const openEnroll = async () => {
    try {
      const [studentList, groupList] = await Promise.all([
        studentsService.getAll(),
        groupsService.getAll(),
      ]);
      setStudents(studentList);
      setGroups(groupList);
      setForm({ studentId: "", groupId: "", periodId: selectedPeriod });
      setDialogOpen(true);
    } catch {
      showToast("Error al cargar datos", "error");
    }
  };

  const handleEnroll = async () => {
    try {
      await enrollmentsService.enroll(form);
      showToast("Estudiante inscrito exitosamente");
      setDialogOpen(false);
      setEnrollmentListVersion((v) => v + 1);
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Error al inscribir"), "error");
    }
  };

  const columns: Column<EnrollmentRow>[] = [
    {
      key: "studentCode",
      label: "Código",
      render: (row) => row.student.studentCode,
    },
    {
      key: "studentName",
      label: "Estudiante",
      render: (row) =>
        `${row.student.user.firstName} ${row.student.user.lastName}`,
    },
    {
      key: "enrolledAt",
      label: "Fecha Inscripción",
      render: (row) => new Date(row.enrolledAt).toLocaleDateString("es"),
    },
    {
      key: "subjects",
      label: "Materias",
      render: (row) => String(row.enrollmentSubjects?.length ?? 0),
    },
    {
      key: "status",
      label: "Estado",
      render: (row) => (
        <Chip
          label={statusLabels[row.status] ?? row.status}
          color={statusColors[row.status] ?? "default"}
          size="small"
        />
      ),
    },
  ];

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5">Inscripciones</Typography>
        <Button
          variant="contained"
          onClick={openEnroll}
          disabled={!selectedPeriod}
        >
          Inscribir Estudiante
        </Button>
      </Box>

      <PeriodAutocomplete
        options={periods}
        value={selectedPeriod}
        onChange={setSelectedPeriod}
        label="Período académico"
        sx={{ mb: 3 }}
      />

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        getRowKey={(r) => r.id}
      />

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Inscribir Estudiante</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <StudentAutocomplete
            options={students}
            value={form.studentId}
            onChange={(studentId) => setForm({ ...form, studentId })}
          />
          <GroupAutocomplete
            options={groups}
            value={form.groupId}
            onChange={(groupId) => setForm({ ...form, groupId })}
            label="Grupo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleEnroll}>
            Inscribir
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
