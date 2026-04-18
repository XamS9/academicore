import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArticleIcon from "@mui/icons-material/Article";
import AssignmentIcon from "@mui/icons-material/Assignment";
import GradingIcon from "@mui/icons-material/Grading";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { groupsService } from "../../services/groups.service";
import GroupContentPanel from "./panels/GroupContentPanel";
import GroupEvaluationsPanel from "./panels/GroupEvaluationsPanel";
import GroupGradesPanel from "./panels/GroupGradesPanel";
import GroupSyllabusPanel from "./panels/GroupSyllabusPanel";

interface GroupDetail {
  id: string;
  groupCode: string;
  maxStudents: number;
  currentStudents: number;
  isActive: boolean;
  subject: { name: string; code: string };
  academicPeriod: { name: string; startDate: string };
}

export default function TeacherGroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (!groupId) return;
    groupsService.getById(groupId).then(setGroup).catch(() => {});
  }, [groupId]);

  if (!groupId) return null;

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate("/mis-grupos")} size="small" sx={{ mt: 0.25 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          {group ? (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {group.subject.name}
                </Typography>
                <Chip label={`Grupo ${group.groupCode}`} size="small" variant="outlined" />
                <Chip
                  label={group.isActive ? "Activo" : "Inactivo"}
                  color={group.isActive ? "success" : "default"}
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {group.subject.code} · {group.academicPeriod?.name} ·{" "}
                {group.currentStudents}/{group.maxStudents} estudiantes
              </Typography>
            </>
          ) : (
            <>
              <Skeleton width={280} height={32} />
              <Skeleton width={200} height={20} />
            </>
          )}
        </Box>
      </Box>

      {/* ── Tabs ── */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            "& .MuiTab-root.Mui-selected .MuiTab-iconWrapper": {
              color: "primary.main",
            },
            "& .MuiTab-root:not(.Mui-selected) .MuiTab-iconWrapper": {
              color: "action.active",
            },
          }}
        >
          <Tab
            icon={<AssignmentIcon fontSize="small" />}
            iconPosition="start"
            label="Evaluaciones"
          />
          <Tab
            icon={<GradingIcon fontSize="small" />}
            iconPosition="start"
            label="Calificaciones"
          />
          <Tab
            icon={<ArticleIcon fontSize="small" />}
            iconPosition="start"
            label="Contenido"
          />
          <Tab
            icon={<MenuBookIcon fontSize="small" />}
            iconPosition="start"
            label="Temario"
          />
        </Tabs>
      </Box>

      {/* ── Tab panels ── */}
      {tab === 0 && <GroupEvaluationsPanel groupId={groupId} />}
      {tab === 1 && <GroupGradesPanel groupId={groupId} />}
      {tab === 2 && <GroupContentPanel groupId={groupId} periodStartDate={group?.academicPeriod?.startDate} />}
      {tab === 3 && <GroupSyllabusPanel groupId={groupId} />}
    </Box>
  );
}
