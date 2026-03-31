import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../store/auth.context";
import { studentsService } from "../../services/students.service";
import { enrollmentsService } from "../../services/enrollments.service";
import { gradesService } from "../../services/grades.service";

interface EnrollmentSubjectItem {
  id: string;
  groupId: string;
  status: string;
  group: {
    groupCode: string;
    subject: { name: string; code: string };
  };
}

interface EnrollmentItem {
  id: string;
  academicPeriod: { name: string };
  enrollmentSubjects: EnrollmentSubjectItem[];
}

interface GradeItem {
  id: string;
  score: number;
  evaluation: {
    name: string;
    weight: number;
    maxScore: number;
  };
}

interface GroupOption {
  groupId: string;
  label: string;
}

export default function StudentGradesPage() {
  const { currentUser } = useAuth();
  const [studentId, setStudentId] = useState("");
  const [groupOptions, setGroupOptions] = useState<GroupOption[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const student = await studentsService.getByUserId(currentUser!.id);
        setStudentId(student.id);
        const enrollments: EnrollmentItem[] =
          await enrollmentsService.getByStudent(student.id);
        const options: GroupOption[] = enrollments.flatMap((e) =>
          e.enrollmentSubjects.map((es) => ({
            groupId: es.groupId,
            label: `${es.group.subject.name} (${es.group.groupCode}) — ${e.academicPeriod.name}`,
          })),
        );
        setGroupOptions(options);
      } catch {
        showToast("Error al cargar datos", "error");
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedGroup || !studentId) {
      setGrades([]);
      return;
    }
    const loadGrades = async () => {
      try {
        setLoading(true);
        const data = await gradesService.getByStudentAndGroup(
          studentId,
          selectedGroup,
        );
        setGrades(data);
      } catch {
        showToast("Error al cargar calificaciones", "error");
      } finally {
        setLoading(false);
      }
    };
    loadGrades();
  }, [selectedGroup, studentId]);

  const columns: Column<GradeItem>[] = [
    {
      key: "evaluation",
      label: "Evaluación",
      render: (row) => row.evaluation.name,
    },
    {
      key: "weight",
      label: "Peso",
      render: (row) => `${Number(row.evaluation.weight)}%`,
    },
    {
      key: "score",
      label: "Calificación",
      render: (row) =>
        `${Number(row.score)} / ${Number(row.evaluation.maxScore)}`,
    },
  ];

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5">Mis Calificaciones</Typography>
      </Box>

      <TextField
        select
        label="Seleccionar Materia"
        value={selectedGroup}
        onChange={(e) => setSelectedGroup(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
      >
        <MenuItem value="">— Seleccione una materia —</MenuItem>
        {groupOptions.map((g) => (
          <MenuItem key={g.groupId} value={g.groupId}>
            {g.label}
          </MenuItem>
        ))}
      </TextField>

      <DataTable
        columns={columns}
        rows={grades}
        loading={loading}
        getRowKey={(r) => r.id}
      />

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
