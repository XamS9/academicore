import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { DataTable, Column } from "../../components/ui/DataTable";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../store/auth.context";
import { teachersService } from "../../services/teachers.service";
import { groupsService } from "../../services/groups.service";

interface GroupItem {
  id: string;
  groupCode: string;
  maxStudents: number;
  currentStudents: number;
  isActive: boolean;
  subject: { name: string; code: string };
  academicPeriod: { name: string };
}

export default function TeacherGroupsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const teacher = await teachersService.getByUserId(currentUser!.id);
        const data = await groupsService.getByTeacher(teacher.id);
        setItems(data);
      } catch {
        showToast("Error al cargar mis grupos", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns: Column<GroupItem>[] = [
    { key: "groupCode", label: "Código" },
    {
      key: "subject",
      label: "Materia",
      render: (row) => `${row.subject.name} (${row.subject.code})`,
    },
    {
      key: "academicPeriod",
      label: "Período",
      render: (row) => row.academicPeriod?.name ?? "—",
    },
    {
      key: "cupos",
      label: "Cupos",
      render: (row) => `${row.currentStudents}/${row.maxStudents}`,
    },
    {
      key: "isActive",
      label: "Estado",
      render: (row) => (
        <Chip
          label={row.isActive ? "Activo" : "Inactivo"}
          color={row.isActive ? "success" : "default"}
          size="small"
        />
      ),
    },
  ];

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5">Mis Grupos</Typography>
      </Box>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        getRowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/mis-grupos/${r.id}`)}
      />

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
