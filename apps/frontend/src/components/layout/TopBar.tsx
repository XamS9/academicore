import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../../store/auth.context";
import NotificationBell from "./NotificationBell";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  TEACHER: "Profesor",
  STUDENT: "Estudiante",
};

const roleColors: Record<
  string,
  "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info"
> = {
  ADMIN: "error",
  TEACHER: "secondary",
  STUDENT: "success",
};

interface TopBarProps {
  onToggleSidebar: () => void;
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const { currentUser, logout } = useAuth();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: "#ffffff",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        color: "text.primary",
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          onClick={onToggleSidebar}
          sx={{ mr: 2, color: "text.secondary" }}
          aria-label="abrir menu lateral"
        >
          <MenuIcon />
        </IconButton>
        <Typography
          variant="h5"
          fontWeight={600}
          sx={{ letterSpacing: "-0.02em" }}
        >
          Academicore
        </Typography>
        <Box sx={{ flexGrow: 1 }} />

        {currentUser && (
          <Box className="flex items-center gap-2">
            <NotificationBell />
            <Typography
              variant="body2"
              sx={{
                display: { xs: "none", sm: "block" },
                fontWeight: 500,
                color: "text.secondary",
              }}
            >
              {currentUser.name}
            </Typography>
            <Chip
              label={roleLabels[currentUser.role] ?? currentUser.role}
              color={roleColors[currentUser.role] ?? "default"}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: "0.7rem" }}
            />
            <IconButton
              onClick={logout}
              size="small"
              sx={{ ml: 0.5, color: "text.secondary" }}
              aria-label="cerrar sesion"
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
