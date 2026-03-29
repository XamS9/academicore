import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LinkIcon from '@mui/icons-material/Link';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../store/auth.context';
import { studentsService } from '../../services/students.service';
import { enrollmentsService } from '../../services/enrollments.service';
import { topicsService } from '../../services/topics.service';

interface ContentItem {
  id: string;
  title: string;
  type: 'LINK' | 'TEXT' | 'FILE_REF';
  content: string;
  sortOrder: number;
}

interface TopicItem {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  contentItems: ContentItem[];
}

interface EnrollmentSubjectItem {
  groupId: string;
  status: string;
  group: {
    groupCode: string;
    subject: { name: string; code: string };
  };
}

interface EnrollmentItem {
  academicPeriod: { name: string };
  enrollmentSubjects: EnrollmentSubjectItem[];
}

interface GroupOption {
  groupId: string;
  label: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  LINK: <LinkIcon fontSize="small" />,
  TEXT: <DescriptionIcon fontSize="small" />,
  FILE_REF: <InsertDriveFileIcon fontSize="small" />,
};

const typeLabels: Record<string, string> = { LINK: 'Enlace', TEXT: 'Texto', FILE_REF: 'Referencia' };
const typeColors: Record<string, 'primary' | 'default' | 'secondary'> = {
  LINK: 'primary',
  TEXT: 'default',
  FILE_REF: 'secondary',
};

export default function StudentContentPage() {
  const { currentUser } = useAuth();
  const [groupOptions, setGroupOptions] = useState<GroupOption[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const student = await studentsService.getByUserId(currentUser!.id);
        const enrollments: EnrollmentItem[] = await enrollmentsService.getByStudent(student.id);
        const options: GroupOption[] = enrollments.flatMap((e) =>
          e.enrollmentSubjects
            .filter((es) => es.status === 'ENROLLED')
            .map((es) => ({
              groupId: es.groupId,
              label: `${es.group.subject.name} (${es.group.groupCode}) — ${e.academicPeriod.name}`,
            })),
        );
        setGroupOptions(options);
      } catch {
        showToast('Error al cargar datos', 'error');
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedGroup) {
      setTopics([]);
      return;
    }
    const loadTopics = async () => {
      try {
        setLoading(true);
        const data = await topicsService.getByGroup(selectedGroup);
        setTopics(data);
      } catch {
        showToast('Error al cargar contenido', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadTopics();
  }, [selectedGroup]);

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5">Mi Contenido</Typography>
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

      {loading && <Typography color="text.secondary">Cargando...</Typography>}

      {!loading && selectedGroup && topics.length === 0 && (
        <Typography color="text.secondary">No hay contenido disponible para esta materia.</Typography>
      )}

      {topics.map((topic) => (
        <Accordion key={topic.id} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box className="flex items-center gap-3">
              <Chip label={`#${topic.sortOrder}`} size="small" variant="outlined" />
              <Typography sx={{ fontWeight: 600 }}>{topic.title}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {topic.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {topic.description}
              </Typography>
            )}
            {topic.contentItems.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay materiales en este tema.
              </Typography>
            ) : (
              <List dense>
                {topic.contentItems.map((item) => (
                  <ListItem key={item.id}>
                    <ListItemIcon sx={{ minWidth: 32 }}>{typeIcons[item.type]}</ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      secondaryTypographyProps={{ component: 'div' }}
                      secondary={
                        item.type === 'LINK' || item.type === 'FILE_REF' ? (
                          <a href={item.content} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', wordBreak: 'break-all' }}>
                            {item.content}
                          </a>
                        ) : (
                          <span style={{ whiteSpace: 'pre-wrap' }}>{item.content}</span>
                        )
                      }
                    />
                    <Chip label={typeLabels[item.type]} size="small" color={typeColors[item.type]} variant="outlined" />
                  </ListItem>
                ))}
              </List>
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={clearToast}>
        <Alert severity={toast?.severity} onClose={clearToast}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
