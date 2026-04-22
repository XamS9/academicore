import React, { useState } from "react";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";

// Icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SubjectIcon from "@mui/icons-material/Subject";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import DomainIcon from "@mui/icons-material/Domain";
import GroupsIcon from "@mui/icons-material/Groups";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import GradingIcon from "@mui/icons-material/Grading";
import StarIcon from "@mui/icons-material/Star";
import VerifiedIcon from "@mui/icons-material/Verified";
import HistoryIcon from "@mui/icons-material/History";
import PaletteIcon from "@mui/icons-material/Palette";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ArticleIcon from "@mui/icons-material/Article";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CampaignIcon from "@mui/icons-material/Campaign";
import PaymentIcon from "@mui/icons-material/Payment";
import BarChartIcon from "@mui/icons-material/BarChart";
import EventIcon from "@mui/icons-material/Event";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../store/auth.context";
import { useStudentNav } from "../../store/student-nav.context";

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
  return "items" in entry;
}

type Role = "ADMIN" | "TEACHER" | "STUDENT";

const navByRole: Record<Role, NavEntry[]> = {
  ADMIN: [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    { label: "Usuarios", path: "/usuarios", icon: <PeopleIcon /> },
    {
      key: "academic",
      label: "Gestión Académica",
      icon: <AccountBalanceIcon />,
      items: [
        { label: "Carreras", path: "/carreras", icon: <MenuBookIcon /> },
        { label: "Materias", path: "/materias", icon: <SubjectIcon /> },
        { label: "Períodos", path: "/periodos", icon: <CalendarMonthIcon /> },
        { label: "Aulas", path: "/aulas", icon: <MeetingRoomIcon /> },
        { label: "Departamentos", path: "/departamentos", icon: <DomainIcon /> },
        { label: "Grupos", path: "/grupos", icon: <GroupsIcon /> },
      ],
    },
    {
      key: "teaching",
      label: "Enseñanza",
      icon: <EditNoteIcon />,
      items: [
        {
          label: "Inscripciones",
          path: "/inscripciones",
          icon: <AssignmentTurnedInIcon />,
        },
        { label: "Contenido", path: "/contenido", icon: <ArticleIcon /> },
        {
          label: "Evaluaciones",
          path: "/evaluaciones",
          icon: <AssignmentIcon />,
        },
        {
          label: "Calificaciones",
          path: "/calificaciones",
          icon: <GradingIcon />,
        },
        { label: "Anuncios", path: "/anuncios", icon: <CampaignIcon /> },
      ],
    },
    {
      key: "system",
      label: "Sistema",
      icon: <AdminPanelSettingsIcon />,
      items: [
        {
          label: "Solicitudes de Registro",
          path: "/solicitudes-registro",
          icon: <PersonAddIcon />,
        },
        {
          label: "Certificaciones",
          path: "/certifications",
          icon: <VerifiedIcon />,
        },
        { label: "Auditoría", path: "/auditoria", icon: <HistoryIcon /> },
        {
          label: "Configuración",
          path: "/configuracion",
          icon: <SettingsIcon />,
        },
        { label: "Calendario", path: "/calendario", icon: <EventIcon /> },
        { label: "Pagos", path: "/pagos", icon: <PaymentIcon /> },
        { label: "Reportes", path: "/reportes", icon: <BarChartIcon /> },
        { label: "Estándar UI", path: "/ui-standards", icon: <PaletteIcon /> },
      ],
    },
  ],
  TEACHER: [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    { label: "Mis Grupos", path: "/mis-grupos", icon: <GroupsIcon /> },
    { label: "Anuncios", path: "/anuncios", icon: <CampaignIcon /> },
  ],
  STUDENT: [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    {
      key: "academic",
      label: "Académico",
      icon: <SchoolIcon />,
      items: [
        { label: "Mi Inscripción", path: "/mi-inscripcion", icon: <AssignmentTurnedInIcon /> },
        { label: "Inscribir Materias", path: "/inscribir-materias", icon: <AddCircleIcon /> },
        { label: "Mi Contenido", path: "/mi-contenido", icon: <ArticleIcon /> },
        { label: "Mis Calificaciones", path: "/mis-calificaciones", icon: <StarIcon /> },
      ],
    },
    {
      key: "trayectoria",
      label: "Mi Trayectoria",
      icon: <WorkspacePremiumIcon />,
      items: [
        { label: "Mi Carrera", path: "/mi-carrera", icon: <MenuBookIcon /> },
        { label: "Historial de Notas", path: "/historial-calificaciones", icon: <GradingIcon /> },
        { label: "Historial Académico", path: "/academic-history", icon: <ListAltIcon /> },
        { label: "Mis Certificados", path: "/certifications", icon: <VerifiedIcon /> },
      ],
    },
    { label: "Anuncios", path: "/anuncios", icon: <CampaignIcon /> },
    { label: "Mis Pagos", path: "/mis-pagos", icon: <PaymentIcon /> },
  ],
};

const SIDEBAR_BG = "#0f172a"; // Slate-900
const SIDEBAR_HOVER = "rgba(255,255,255,0.06)";
const SIDEBAR_ACTIVE = "rgba(99,102,241,0.2)";
const SIDEBAR_ACTIVE_BAR = "#818cf8"; // Indigo-400
const SIDEBAR_TEXT = "rgba(255,255,255,0.65)";
const SIDEBAR_TEXT_ACTIVE = "#ffffff";
const SIDEBAR_SECTION = "rgba(255,255,255,0.4)";

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
        style={{ textDecoration: "none", width: "100%", color: "inherit" }}
        onClick={onClick}
      >
        <ListItemButton
          selected={isActive}
          sx={{
            borderRadius: "10px",
            mx: 1,
            my: 0.25,
            py: 0.75,
            position: "relative",
            color: isActive ? SIDEBAR_TEXT_ACTIVE : SIDEBAR_TEXT,
            ...(nested && { pl: 4.5 }),
            "&:hover": { backgroundColor: SIDEBAR_HOVER },
            "&.Mui-selected": {
              backgroundColor: SIDEBAR_ACTIVE,
              color: SIDEBAR_TEXT_ACTIVE,
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: "20%",
                height: "60%",
                width: 3,
                borderRadius: 4,
                backgroundColor: SIDEBAR_ACTIVE_BAR,
              },
              "& .MuiListItemIcon-root": { color: SIDEBAR_ACTIVE_BAR },
              "&:hover": { backgroundColor: SIDEBAR_ACTIVE },
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 34,
              color: isActive ? SIDEBAR_ACTIVE_BAR : SIDEBAR_TEXT,
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              variant: "body2",
              fontWeight: isActive ? 600 : 400,
              fontSize: "0.8125rem",
            }}
          />
        </ListItemButton>
      </NavLink>
    </ListItem>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function filterStudentNavItems(
  items: NavItem[],
  role: Role,
  gates: {
    showMiInscripcion: boolean;
    showInscribirMaterias: boolean;
    showMiContenido: boolean;
    showMisCalificaciones: boolean;
  },
): NavItem[] {
  if (role !== "STUDENT") return items;
  return items.filter((item) => {
    if (item.path === "/mi-inscripcion") return gates.showMiInscripcion;
    if (item.path === "/inscribir-materias") return gates.showInscribirMaterias;
    if (item.path === "/mi-contenido") return gates.showMiContenido;
    if (item.path === "/mis-calificaciones") return gates.showMisCalificaciones;
    return true;
  });
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { currentUser } = useAuth();
  const location = useLocation();
  const role = (currentUser?.role ?? "STUDENT") as Role;
  const {
    showMiInscripcion,
    showInscribirMaterias,
    showMiContenido,
    showMisCalificaciones,
  } = useStudentNav();

  const entries = navByRole[role].map((entry) => {
    if (role === "STUDENT" && isSection(entry) && entry.key === "academic") {
      return {
        ...entry,
        items: filterStudentNavItems(entry.items, role, {
          showMiInscripcion,
          showInscribirMaterias,
          showMiContenido,
          showMisCalificaciones,
        }),
      };
    }
    return entry;
  });

  const visibleEntries = entries.filter((entry) =>
    isSection(entry) ? entry.items.length > 0 : true,
  );

  // Auto-open the section that contains the current route
  const initialOpen = visibleEntries.reduce<Record<string, boolean>>((acc, entry) => {
    if (isSection(entry)) {
      acc[entry.key] = entry.items.some(
        (item) =>
          location.pathname === item.path ||
          (item.path !== "/dashboard" &&
            location.pathname.startsWith(item.path)),
      );
    }
    return acc;
  }, {});

  const [openSections, setOpenSections] =
    useState<Record<string, boolean>>(initialOpen);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isPathActive = (path: string) =>
    location.pathname === path ||
    (path !== "/dashboard" && location.pathname.startsWith(path));

  const handleNavClick = mobileOpen ? onMobileClose : undefined;

  const roleLabels: Record<string, string> = {
    ADMIN: "Administrador",
    TEACHER: "Profesor",
    STUDENT: "Estudiante",
  };

  const drawerContent = (
    <Box
      sx={{
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: SIDEBAR_BG,
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          px: 2.5,
          py: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SchoolIcon sx={{ color: "white", fontSize: 20 }} />
        </Box>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}
        >
          Academicore
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mx: 2 }} />

      {/* Nav */}
      <List dense sx={{ flex: 1, pt: 1.5, px: 0.5 }}>
        {visibleEntries.map((entry) => {
          if (isSection(entry)) {
            const sectionOpen = openSections[entry.key] ?? false;
            const sectionHasActive = entry.items.some((item) =>
              isPathActive(item.path),
            );

            return (
              <React.Fragment key={entry.key}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => toggleSection(entry.key)}
                    sx={{
                      borderRadius: "10px",
                      mx: 1,
                      my: 0.25,
                      py: 0.75,
                      color: sectionHasActive
                        ? SIDEBAR_TEXT_ACTIVE
                        : SIDEBAR_SECTION,
                      "&:hover": { backgroundColor: SIDEBAR_HOVER },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 34,
                        color: sectionHasActive
                          ? SIDEBAR_ACTIVE_BAR
                          : SIDEBAR_SECTION,
                      }}
                    >
                      {entry.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={entry.label}
                      primaryTypographyProps={{
                        variant: "body2",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    />
                    {sectionOpen ? (
                      <ExpandLess fontSize="small" sx={{ opacity: 0.5 }} />
                    ) : (
                      <ExpandMore fontSize="small" sx={{ opacity: 0.5 }} />
                    )}
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

      {/* User footer */}
      {currentUser && (
        <>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mx: 2 }} />
          <Box
            sx={{
              px: 2.5,
              py: 2,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                fontSize: "0.8rem",
                fontWeight: 700,
                bgcolor: "#6366f1",
              }}
            >
              {currentUser.name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currentUser.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: SIDEBAR_TEXT, fontSize: "0.7rem" }}
              >
                {roleLabels[role] ?? role}
              </Typography>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );

  const drawerPaperSx = {
    width: DRAWER_WIDTH,
    boxSizing: "border-box" as const,
    backgroundColor: SIDEBAR_BG,
    borderRight: "none",
    top: 0,
    height: "100vh",
  };

  return (
    <>
      {/* Permanent sidebar — large screens */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", lg: "block" },
          "& .MuiDrawer-paper": { ...drawerPaperSx, zIndex: 1300 },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Temporary sidebar — mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": { ...drawerPaperSx, zIndex: 1300 },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}

export { DRAWER_WIDTH };
