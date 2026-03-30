import React, { useState } from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
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
import ArticleIcon from '@mui/icons-material/Article';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import BadgeIcon from '@mui/icons-material/Badge';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CampaignIcon from '@mui/icons-material/Campaign';
import PaymentIcon from '@mui/icons-material/Payment';
import BarChartIcon from '@mui/icons-material/BarChart';
import EventIcon from '@mui/icons-material/Event';
import AddCircleIcon from '@mui/icons-material/AddCircle';

import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth.context';

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavSection {
  key: string;
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
}

type NavEntry = NavItem | NavSection;

function isSection(entry: NavEntry): entry is NavSection {
  return 'items' in entry;
}

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

const navByRole: Record<Role, NavEntry[]> = {
  ADMIN: [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    {
      key: 'users',
      label: 'Usuarios',
      icon: <BadgeIcon />,
      items: [
        { label: 'Todos los Usuarios', path: '/usuarios', icon: <PeopleIcon /> },
        { label: 'Estudiantes', path: '/estudiantes', icon: <SchoolIcon /> },
        { label: 'Profesores', path: '/profesores', icon: <PersonIcon /> },
      ],
    },
    {
      key: 'academic',
      label: 'Gestión Académica',
      icon: <AccountBalanceIcon />,
      items: [
        { label: 'Carreras', path: '/carreras', icon: <MenuBookIcon /> },
        { label: 'Materias', path: '/materias', icon: <SubjectIcon /> },
        { label: 'Períodos', path: '/periodos', icon: <CalendarMonthIcon /> },
        { label: 'Aulas', path: '/aulas', icon: <MeetingRoomIcon /> },
        { label: 'Grupos', path: '/grupos', icon: <GroupsIcon /> },
      ],
    },
    {
      key: 'teaching',
      label: 'Enseñanza',
      icon: <EditNoteIcon />,
      items: [
        { label: 'Inscripciones', path: '/inscripciones', icon: <AssignmentTurnedInIcon /> },
        { label: 'Contenido', path: '/contenido', icon: <ArticleIcon /> },
        { label: 'Evaluaciones', path: '/evaluaciones', icon: <AssignmentIcon /> },
        { label: 'Calificaciones', path: '/calificaciones', icon: <GradingIcon /> },
        { label: 'Anuncios', path: '/anuncios', icon: <CampaignIcon /> },
      ],
    },
    {
      key: 'system',
      label: 'Sistema',
      icon: <AdminPanelSettingsIcon />,
      items: [
        { label: 'Certificaciones', path: '/certifications', icon: <VerifiedIcon /> },
        { label: 'Auditoría', path: '/auditoria', icon: <HistoryIcon /> },
        { label: 'Configuración', path: '/configuracion', icon: <SettingsIcon /> },
        { label: 'Calendario', path: '/calendario', icon: <EventIcon /> },
        { label: 'Pagos', path: '/pagos', icon: <PaymentIcon /> },
        { label: 'Reportes', path: '/reportes', icon: <BarChartIcon /> },
        { label: 'Estándar UI', path: '/ui-standards', icon: <PaletteIcon /> },
      ],
    },
  ],
  TEACHER: [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Mis Grupos', path: '/mis-grupos', icon: <GroupsIcon /> },
    { label: 'Contenido', path: '/contenido', icon: <ArticleIcon /> },
    { label: 'Evaluaciones', path: '/evaluaciones', icon: <AssignmentIcon /> },
    { label: 'Calificaciones', path: '/calificaciones', icon: <GradingIcon /> },
    { label: 'Anuncios', path: '/anuncios', icon: <CampaignIcon /> },
  ],
  STUDENT: [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Mi Inscripción', path: '/mi-inscripcion', icon: <AssignmentTurnedInIcon /> },
    { label: 'Inscribir Materias', path: '/inscribir-materias', icon: <AddCircleIcon /> },
    { label: 'Mi Contenido', path: '/mi-contenido', icon: <ArticleIcon /> },
    { label: 'Mis Calificaciones', path: '/mis-calificaciones', icon: <StarIcon /> },
    { label: 'Mis Pagos', path: '/mis-pagos', icon: <PaymentIcon /> },
    { label: 'Historial Académico', path: '/academic-history', icon: <ListAltIcon /> },
    { label: 'Mis Certificados', path: '/certifications', icon: <VerifiedIcon /> },
  ],
};

function NavItemLink({
  item,
  isActive,
  onClick,
  nested,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
  nested?: boolean;
}) {
  return (
    <ListItem disablePadding>
      <NavLink
        to={item.path}
        style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}
        onClick={onClick}
      >
        <ListItemButton
          selected={isActive}
          sx={{
            borderRadius: 1,
            mx: 0.5,
            my: 0.25,
            ...(nested && { pl: 4 }),
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
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'temporary';
}

export default function Sidebar({ open, onClose, variant = 'temporary' }: SidebarProps) {
  const { currentUser } = useAuth();
  const location = useLocation();
  const role = (currentUser?.role ?? 'STUDENT') as Role;

  const entries = navByRole[role];

  // Auto-open the section that contains the current route
  const initialOpen = entries.reduce<Record<string, boolean>>((acc, entry) => {
    if (isSection(entry)) {
      acc[entry.key] = entry.items.some(
        (item) =>
          location.pathname === item.path ||
          (item.path !== '/dashboard' && location.pathname.startsWith(item.path)),
      );
    }
    return acc;
  }, {});

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(initialOpen);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isPathActive = (path: string) =>
    location.pathname === path ||
    (path !== '/dashboard' && location.pathname.startsWith(path));

  const handleNavClick = variant === 'temporary' ? onClose : undefined;

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
        {entries.map((entry) => {
          if (isSection(entry)) {
            const sectionOpen = openSections[entry.key] ?? false;
            const sectionHasActive = entry.items.some((item) => isPathActive(item.path));

            return (
              <React.Fragment key={entry.key}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => toggleSection(entry.key)}
                    sx={{ borderRadius: 1, mx: 0.5, my: 0.25 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: sectionHasActive ? 'primary.main' : undefined }}>
                      {entry.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={entry.label}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: sectionHasActive ? 600 : 400,
                        color: sectionHasActive ? 'primary.main' : undefined,
                      }}
                    />
                    {sectionOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                  </ListItemButton>
                </ListItem>
                <Collapse in={sectionOpen} timeout="auto" unmountOnExit>
                  <List dense disablePadding>
                    {entry.items.map((item) => (
                      <NavItemLink
                        key={item.path}
                        item={item}
                        isActive={isPathActive(item.path)}
                        onClick={handleNavClick}
                        nested
                      />
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }

          return (
            <NavItemLink
              key={entry.path}
              item={entry}
              isActive={isPathActive(entry.path)}
              onClick={handleNavClick}
            />
          );
        })}
      </List>
    </Box>
  );

  if (variant === 'permanent') {
    return (
      <Drawer
        variant="persistent"
        open={open}
        sx={{
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
