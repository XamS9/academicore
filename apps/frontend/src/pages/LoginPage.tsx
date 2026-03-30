import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import ButtonGroup from '@mui/material/ButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import SchoolIcon from '@mui/icons-material/School';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth.context';

type RoleOption = 'ADMIN' | 'TEACHER' | 'STUDENT';

const rolePresets: Record<RoleOption, { label: string; icon: React.ReactNode; color: 'error' | 'secondary' | 'success' }> = {
  ADMIN: { label: 'Administrador', icon: <AdminPanelSettingsIcon />, color: 'error' },
  TEACHER: { label: 'Profesor', icon: <PersonIcon />, color: 'secondary' },
  STUDENT: { label: 'Estudiante', icon: <SchoolOutlinedIcon />, color: 'success' },
};

const demoCredentials: Record<RoleOption, { email: string; password: string }> = {
  ADMIN: { email: 'admin@academicore.mx', password: 'admin123' },
  TEACHER: { email: 'prof.garcia@academicore.mx', password: 'teacher123' },
  STUDENT: { email: 'ana.garcia@academicore.mx', password: 'student123' },
};

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleOption>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role);
    const creds = demoCredentials[role];
    setEmail(creds.email);
    setPassword(creds.password);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Por favor ingrese su correo y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const success = await login(email, password, selectedRole);
      if (success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError('Credenciales inválidas. Por favor verifique sus datos.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      className="min-h-screen flex items-center justify-center"
      sx={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}
    >
      <Card sx={{ width: '100%', maxWidth: 440, mx: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box className="flex flex-col items-center mb-6">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
              }}
            >
              <SchoolIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
              Academicore
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Ingrese sus credenciales para continuar
            </Typography>
          </Box>

          {/* Role selector */}
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
            SELECCIONAR ROL DE DEMOSTRACIÓN
          </Typography>
          <ButtonGroup fullWidth variant="outlined" sx={{ mb: 3 }} size="small">
            {(Object.entries(rolePresets) as [RoleOption, typeof rolePresets[RoleOption]][]).map(([role, preset]) => (
              <Button
                key={role}
                color={preset.color}
                variant={selectedRole === role ? 'contained' : 'outlined'}
                onClick={() => handleRoleSelect(role)}
                startIcon={preset.icon}
              >
                {preset.label}
              </Button>
            ))}
          </ButtonGroup>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              autoComplete="email"
              size="small"
            />

            <TextField
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              autoComplete="current-password"
              size="small"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 1, py: 1.5, fontWeight: 700 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="caption" color="text.secondary" align="center" display="block">
            Sistema de Gestión Académica Institucional
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
