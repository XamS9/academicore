import React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SubjectIcon from '@mui/icons-material/Subject';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import GradingIcon from '@mui/icons-material/Grading';
import StarIcon from '@mui/icons-material/Star';
import VerifiedIcon from '@mui/icons-material/Verified';
import HistoryIcon from '@mui/icons-material/History';
import PaletteIcon from '@mui/icons-material/Palette';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ListAltIcon from '@mui/icons-material/ListAlt';

import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth.context';

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: Array<'ADMIN' | 'TEACHER' | 'STUDENT'>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon />, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },

  // ADMIN
  { label: 'Usuarios', path: '/usuarios', icon: <PeopleIcon />, roles: ['ADMIN'] },
  { label: 'Estudiantes', path: '/estudiantes', icon: <SchoolIcon />, roles: ['ADMIN'] },
  { label: 'Profesores', path: '/profesores', icon: <PersonIcon />, roles: ['ADMIN'] },
  { label: 'Carreras', path: '/carreras', icon: <MenuBookIcon />, roles: ['ADMIN'] },
  { label: 'Materias', path: '/materias', icon: <SubjectIcon />, roles: ['ADMIN'] },
  { label: 'Períodos Académicos', path: '/periodos', icon: <CalendarMonthIcon />, roles: ['ADMIN'] },
  { label: 'Aulas', path: '/aulas', icon: <MeetingRoomIcon />, roles: ['ADMIN'] },
  { label: 'Grupos', path: '/grupos', icon: <GroupsIcon />, roles: ['ADMIN'] },
  { label: 'Inscripciones', path: '/inscripciones', icon: <AssignmentTurnedInIcon />, roles: ['ADMIN'] },
  { label: 'Evaluaciones', path: '/evaluaciones', icon: <AssignmentIcon />, roles: ['ADMIN'] },
  { label: 'Calificaciones', path: '/calificaciones', icon: <GradingIcon />, roles: ['ADMIN'] },
  { label: 'Certificaciones', path: '/certifications', icon: <VerifiedIcon />, roles: ['ADMIN'] },
  { label: 'Auditoría', path: '/auditoria', icon: <HistoryIcon />, roles: ['ADMIN'] },

  // TEACHER
  { label: 'Mis Grupos', path: '/mis-grupos', icon: <GroupsIcon />, roles: ['TEACHER'] },
  { label: 'Evaluaciones', path: '/evaluaciones', icon: <AssignmentIcon />, roles: ['TEACHER'] },
  { label: 'Calificaciones', path: '/calificaciones', icon: <GradingIcon />, roles: ['TEACHER'] },

  // STUDENT
  { label: 'Mi Inscripción', path: '/mi-inscripcion', icon: <AssignmentTurnedInIcon />, roles: ['STUDENT'] },
  { label: 'Mis Calificaciones', path: '/mis-calificaciones', icon: <StarIcon />, roles: ['STUDENT'] },
  { label: 'Historial Académico', path: '/academic-history', icon: <ListAltIcon />, roles: ['STUDENT'] },
  { label: 'Mis Certificados', path: '/certifications', icon: <VerifiedIcon />, roles: ['STUDENT'] },

  // ALL
  { label: 'Estándar UI', path: '/ui-standards', icon: <PaletteIcon />, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'temporary';
}

export default function Sidebar({ open, onClose, variant = 'temporary' }: SidebarProps) {
  const { currentUser } = useAuth();
  const location = useLocation();

  const role = currentUser?.role ?? 'STUDENT';

  const filtered = navItems.filter((item) => item.roles.includes(role));

  const drawerContent = (
    <Box sx={{ overflow: 'auto' }}>
      <Toolbar>
        <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Academicore
        </Typography>
      </Toolbar>
      <Divider />
      <List dense>
        {filtered.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <ListItem key={`${item.path}-${item.label}`} disablePadding>
              <NavLink
                to={item.path}
                style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}
                onClick={variant === 'temporary' ? onClose : undefined}
              >
                <ListItemButton
                  selected={isActive}
                  sx={{
                    borderRadius: 1,
                    mx: 0.5,
                    my: 0.25,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '& .MuiListItemIcon-root': { color: 'white' },
                      '&:hover': { backgroundColor: 'primary.dark' },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: isActive ? 600 : 400 }}
                  />
                </ListItemButton>
              </NavLink>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  if (variant === 'permanent') {
    return (
      <Drawer
        variant="permanent"
        open
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        display: { xs: 'block', lg: 'none' },
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}

export { DRAWER_WIDTH };
