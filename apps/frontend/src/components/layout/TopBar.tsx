import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import SchoolIcon from '@mui/icons-material/School';
import { useAuth } from '../../store/auth.context';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  TEACHER: 'Profesor',
  STUDENT: 'Estudiante',
};

const roleColors: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
  ADMIN: 'error',
  TEACHER: 'secondary',
  STUDENT: 'success',
};

interface TopBarProps {
  onToggleSidebar: () => void;
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const { currentUser, logout } = useAuth();

  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      elevation={2}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onToggleSidebar}
          sx={{ mr: 2 }}
          aria-label="abrir menú lateral"
        >
          <MenuIcon />
        </IconButton>

        <SchoolIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 700, letterSpacing: 1 }}>
          Academicore
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {currentUser && (
          <Box className="flex items-center gap-3">
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {currentUser.name}
            </Typography>
            <Chip
              label={roleLabels[currentUser.role] ?? currentUser.role}
              color={roleColors[currentUser.role] ?? 'default'}
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={logout}
              size="small"
              sx={{ ml: 1 }}
            >
              Salir
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
