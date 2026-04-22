import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { DataTable, Column } from "../../components/ui/DataTable";
import { SubjectPrerequisitesCaption } from "../../components/SubjectPrerequisitesCaption";
import { useToast } from "../../hooks/useToast";
import { enrollmentsService } from "../../services/enrollments.service";

type SubjectWithPrereqs = {
  name: string;
  code: string;
  prerequisites?: Array<{
    prerequisite: { id: string; code: string; name: string };
  }>;
};

interface EnrollmentSubjectItem {
  id: string;
  status: string;
  group: {
    groupCode: string;
    subject: SubjectWithPrereqs;
    teacher: { user: { firstName: string; lastName: string } };
  };
  periodName: string;
  enrollmentStatus: string;
}

interface EnrollmentItem {
  id: string;
  status: string;
  academicPeriod: { name: string };
  enrollmentSubjects: Array<{
    id: string;
    status: string;
    group: {
      groupCode: string;
      subject: SubjectWithPrereqs;
      teacher: { user: { firstName: string; lastName: string } };
    };
  }>;
}

const statusLabels: Record<string, string> = {
  ACTIVE: "Activa",
  ENROLLED: "Inscrito",
  COMPLETED: "Completada",
  DROPPED: "Baja",
  FAILED: "Reprobada",
  CLOSED: "Cerrada",
  CANCELLED: "Cancelada",
};

const statusColors: Record<
  string,
  "success" | "warning" | "error" | "default" | "info"
> = {
  ACTIVE: "success",
  ENROLLED: "info",
  COMPLETED: "success",
  DROPPED: "warning",
  FAILED: "error",
  CLOSED: "default",
  CANCELLED: "error",
};

export default function StudentEnrollmentPage() {
  const [allSubjects, setAllSubjects] = useState<EnrollmentSubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, clearToast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const data: EnrollmentItem[] = await enrollmentsService.getMine();
      setAllSubjects(
        data.flatMap((e) =>
          e.enrollmentSubjects.map((es) => ({
            ...es,
            periodName: e.academicPeriod.name,
            enrollmentStatus: e.status,
          }))
        )
      );
    } catch {
      showToast("Error al cargar inscripciones", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns: Column<EnrollmentSubjectItem>[] = [
    { key: "periodName", label: "Período" },
    {
      key: "subject",
      label: "Materia",
      render: (row) => (
        <Box>
          <Typography variant="body2">
            {row.group.subject.name} ({row.group.subject.code})
          </Typography>
          <SubjectPrerequisitesCaption subject={row.group.subject} />
        </Box>
      ),
    },
    {
      key: "groupCode",
      label: "Grupo",
      render: (row) => row.group.groupCode,
    },
    {
      key: "teacher",
      label: "Docente",
      render: (row) =>
        `${row.group.teacher.user.firstName} ${row.group.teacher.user.lastName}`,
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
        <Typography variant="h5">Mi Inscripción</Typography>
      </Box>

      {loading ? (
        <DataTable columns={columns} rows={[]} loading getRowKey={() => ""} />
      ) : allSubjects.length === 0 ? (
        <Alert severity="info">No tienes inscripciones registradas.</Alert>
      ) : (
        <DataTable
          columns={columns}
          rows={allSubjects}
          getRowKey={(r) => r.id}
        />
      )}

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
