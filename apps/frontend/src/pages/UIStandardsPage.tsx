import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';

import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import StarIcon from '@mui/icons-material/Star';
import PeopleIcon from '@mui/icons-material/People';

interface SectionProps {
  title: string;
  number: number;
  children: React.ReactNode;
}

function Section({ title, number, children }: SectionProps) {
  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
      <Box className="flex items-center gap-2 mb-3">
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Typography variant="caption" fontWeight={700}>{number}</Typography>
        </Box>
        <Typography variant="h6" fontWeight={700}>{title}</Typography>
      </Box>
      <Divider sx={{ mb: 3 }} />
      {children}
    </Paper>
  );
}

// ─── Color Swatch ─────────────────────────────────────────────────────────────
const colors = [
  { name: 'Primary', hex: '#1976d2', usage: 'Acciones principales, botones primarios, enlaces' },
  { name: 'Secondary', hex: '#9c27b0', usage: 'Acciones secundarias, roles de profesores' },
  { name: 'Success', hex: '#2e7d32', usage: 'Materias aprobadas, estado ACTIVO, confirmaciones' },
  { name: 'Warning', hex: '#ed6c02', usage: 'Estado EN_RIESGO, alertas de atención' },
  { name: 'Error', hex: '#d32f2f', usage: 'Materias reprobadas, estado SUSPENDIDO, errores' },
  { name: 'Info', hex: '#0288d1', usage: 'Información adicional, notificaciones neutras' },
  { name: 'Gris 100', hex: '#f5f5f5', usage: 'Fondos de tablas, cabeceras' },
  { name: 'Gris 400', hex: '#bdbdbd', usage: 'Bordes, separadores, elementos deshabilitados' },
  { name: 'Gris 700', hex: '#616161', usage: 'Texto secundario, subtítulos' },
];

// ─── Demo table data ──────────────────────────────────────────────────────────
const demoRows = [
  { id: 1, name: 'Ana García', code: 'EST-001', career: 'ISC', status: 'ACTIVO' },
  { id: 2, name: 'Juan Pérez', code: 'EST-002', career: 'ISC', status: 'EN_RIESGO' },
  { id: 3, name: 'María López', code: 'EST-003', career: 'ISC', status: 'ACTIVO' },
];

export default function UIStandardsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checkValue, setCheckValue] = useState(true);
  const [switchValue, setSwitchValue] = useState(false);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Estándar de Diseño UI
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Guía visual completa del sistema de diseño utilizado en Academicore. Todos los componentes
        son de MUI v6 con espaciado base de 8px y paleta institucional.
      </Typography>

      {/* Section 1 — Colors */}
      <Section title="Paleta de Colores" number={1}>
        <Grid container spacing={2}>
          {colors.map((c) => (
            <Grid item xs={12} sm={6} md={4} key={c.hex}>
              <Box className="flex items-center gap-3">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1,
                    backgroundColor: c.hex,
                    flexShrink: 0,
                    border: '1px solid rgba(0,0,0,0.1)',
                  }}
                />
                <Box>
                  <Typography variant="body2" fontWeight={700}>{c.name}</Typography>
                  <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                    {c.hex}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {c.usage}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Section>

      {/* Section 2 — Typography */}
      <Section title="Tipografía" number={2}>
        <Box className="flex flex-col gap-2">
          {[
            { variant: 'h1' as const, label: 'h1', size: '6rem / 96px', weight: '300' },
            { variant: 'h2' as const, label: 'h2', size: '3.75rem / 60px', weight: '300' },
            { variant: 'h3' as const, label: 'h3', size: '3rem / 48px', weight: '400' },
            { variant: 'h4' as const, label: 'h4', size: '2.125rem / 34px', weight: '400' },
            { variant: 'h5' as const, label: 'h5', size: '1.5rem / 24px', weight: '400' },
            { variant: 'h6' as const, label: 'h6', size: '1.25rem / 20px', weight: '500' },
            { variant: 'subtitle1' as const, label: 'subtitle1', size: '1rem / 16px', weight: '400' },
            { variant: 'body1' as const, label: 'body1', size: '1rem / 16px', weight: '400' },
            { variant: 'body2' as const, label: 'body2', size: '0.875rem / 14px', weight: '400' },
            { variant: 'caption' as const, label: 'caption', size: '0.75rem / 12px', weight: '400' },
          ].map((t) => (
            <Box key={t.label} className="flex items-baseline gap-4">
              <Typography variant={t.variant} sx={{ minWidth: 200 }}>
                Texto de ejemplo
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <strong>{t.label}</strong> · {t.size} · peso {t.weight}
              </Typography>
            </Box>
          ))}
        </Box>
      </Section>

      {/* Section 3 — Buttons */}
      <Section title="Botones" number={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <Button variant="contained" color="primary" fullWidth>
              Contained Primary
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }} color="text.secondary">
              Acción principal de la página
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button variant="contained" color="secondary" fullWidth>
              Contained Secondary
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }} color="text.secondary">
              Acción alternativa importante
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button variant="contained" color="error" fullWidth>
              Contained Error
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }} color="text.secondary">
              Acciones destructivas (eliminar, revocar)
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button variant="outlined" color="primary" fullWidth>
              Outlined Primary
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }} color="text.secondary">
              Acción secundaria / cancelar
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button variant="text" color="primary" fullWidth>
              Text Button
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }} color="text.secondary">
              Acciones terciarias, enlaces internos
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button variant="contained" disabled fullWidth>
              Deshabilitado
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }} color="text.secondary">
              Acción no disponible en contexto
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button variant="contained" startIcon={<SaveIcon />} fullWidth>
              Con Ícono (Guardar)
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }} color="text.secondary">
              Botones con íconos para claridad visual
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button variant="outlined" startIcon={<AddIcon />} color="success" fullWidth>
              Con Ícono (Agregar)
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button variant="outlined" startIcon={<DeleteIcon />} color="error" fullWidth>
              Con Ícono (Eliminar)
            </Button>
          </Grid>
        </Grid>
      </Section>

      {/* Section 4 — Form fields */}
      <Section title="Campos de Formulario" number={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField label="Outlined (default)" variant="outlined" fullWidth size="small"
              helperText="Variante recomendada para formularios" />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField label="Standard" variant="standard" fullWidth size="small"
              helperText="Variante compacta" />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField label="Filled" variant="filled" fullWidth size="small"
              helperText="Variante con fondo" />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField label="Con error" variant="outlined" fullWidth size="small"
              error helperText="Campo requerido" />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField label="Deshabilitado" variant="outlined" fullWidth size="small"
              disabled value="Valor fijo" />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Select</InputLabel>
              <Select label="Select" defaultValue="opt1">
                <MenuItem value="opt1">Opción 1</MenuItem>
                <MenuItem value="opt2">Opción 2</MenuItem>
                <MenuItem value="opt3">Opción 3</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControlLabel
              control={<Checkbox checked={checkValue} onChange={(e) => setCheckValue(e.target.checked)} />}
              label="Checkbox"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControlLabel
              control={<Switch checked={switchValue} onChange={(e) => setSwitchValue(e.target.checked)} />}
              label={switchValue ? 'Activado' : 'Desactivado'}
            />
          </Grid>
          <Grid item xs={12}>
            <Alert severity="info" sx={{ maxWidth: 400 }}>
              <strong>DatePicker:</strong> Usar <code>@mui/x-date-pickers</code> con adapter de date-fns para campos de fecha.
              Validación de esquemas con Zod en el backend; errores inline en frontend.
            </Alert>
          </Grid>
        </Grid>
      </Section>

      {/* Section 5 — Status indicators */}
      <Section title="Indicadores de Estado (Chips/Badges)" number={5}>
        <Box className="flex flex-col gap-4">
          <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Estado Académico (AcademicStatus)</Typography>
            <Box className="flex flex-wrap gap-2">
              <Chip label="ACTIVO" color="success" icon={<SchoolIcon />} />
              <Chip label="EN_RIESGO" color="warning" />
              <Chip label="ELEGIBLE_GRADUACIÓN" color="info" />
              <Chip label="SUSPENDIDO" color="error" />
              <Chip label="GRADUADO" sx={{ backgroundColor: '#9c27b0', color: 'white' }} />
              <Chip label="RETIRADO" color="default" />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Estado Materia Inscrita (EnrollmentSubjectStatus)</Typography>
            <Box className="flex flex-wrap gap-2">
              <Chip label="INSCRITO" color="primary" />
              <Chip label="ABANDONADO" color="warning" variant="outlined" />
              <Chip label="COMPLETADO" color="success" />
              <Chip label="REPROBADO" color="error" />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Estado Certificación (CertificationStatus)</Typography>
            <Box className="flex flex-wrap gap-2">
              <Chip label="ACTIVO" color="success" />
              <Chip label="REVOCADO" color="error" />
              <Chip label="VENCIDO" color="warning" />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Variantes de tamaño</Typography>
            <Box className="flex flex-wrap gap-2 items-center">
              <Chip label="Small" size="small" color="primary" />
              <Chip label="Medium (default)" color="primary" />
              <Chip label="Outlined" variant="outlined" color="primary" />
              <Chip label="Filled" variant="filled" color="secondary" />
            </Box>
          </Box>
        </Box>
      </Section>

      {/* Section 6 — Tables */}
      <Section title="Tablas de Datos" number={6}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Las tablas usan MUI <code>Table</code> con <code>size="small"</code>, cabeceras en <code>grey.100</code>,
          hover en filas, y columna de acciones al final. Para grandes volúmenes usar MUI DataGrid de <code>@mui/x-data-grid</code>.
        </Alert>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Código</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Carrera</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {demoRows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.name}</TableCell>
                  <TableCell><code>{row.code}</code></TableCell>
                  <TableCell>{row.career}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={row.status}
                      color={row.status === 'ACTIVO' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalle">
                      <Button size="small" variant="text">Ver</Button>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <Button size="small" variant="text" color="error">Eliminar</Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Las tablas soportan: ordenamiento por columna, paginación, filtro por estado, y acciones por fila.
        </Typography>
      </Section>

      {/* Section 7 — Navigation */}
      <Section title="Navegación" number={7}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          El sidebar es permanente en pantallas ≥ lg (1200px) y temporal (drawer) en móvil/tablet.
          Se resalta la ruta activa con fondo de color primario.
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>Breadcrumbs</Typography>
          <Breadcrumbs aria-label="breadcrumb">
            <Link underline="hover" color="inherit" href="#" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <HomeIcon fontSize="small" />
              Inicio
            </Link>
            <Link underline="hover" color="inherit" href="#">
              Estudiantes
            </Link>
            <Typography color="text.primary">Ana García</Typography>
          </Breadcrumbs>
        </Box>

        <Box>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>Tabs de navegación interna</Typography>
          <Paper variant="outlined">
            <Tabs value={tabValue} onChange={(_e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Tab 1" />
              <Tab label="Tab 2" />
              <Tab label="Tab 3" />
            </Tabs>
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Contenido del tab {tabValue + 1}. Los tabs se usan para agrupar subprocesos dentro de una misma página.
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Section>

      {/* Section 8 — Cards */}
      <Section title="Tarjetas y Paneles" number={8}>
        <Grid container spacing={3}>
          {/* Stats card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
              <CardContent>
                <Box className="flex items-center justify-between">
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="primary.main">247</Typography>
                    <Typography variant="body2" color="text.secondary">Total Estudiantes</Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 36, color: 'primary.main', opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Info card */}
          <Grid item xs={12} sm={6} md={5}>
            <Card variant="outlined">
              <CardContent>
                <Box className="flex items-center gap-2 mb-1">
                  <StarIcon color="warning" />
                  <Typography variant="subtitle2" fontWeight={700}>Tarjeta de información</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Para mostrar información contextual sobre una entidad del sistema, con ícono
                  representativo y datos relevantes organizados visualmente.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Alerts */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Componente Alert</Typography>
            <Box className="flex flex-col gap-2">
              <Alert severity="success">Operación completada exitosamente.</Alert>
              <Alert severity="warning">Atención: el promedio del estudiante está en riesgo.</Alert>
              <Alert severity="error">Error: No se pudo completar la inscripción.</Alert>
              <Alert severity="info">Información: Los certificados vencen a los 12 meses.</Alert>
            </Box>
          </Grid>
        </Grid>
      </Section>

      {/* Section 9 — Dialogs & Feedback */}
      <Section title="Diálogos y Retroalimentación" number={9}>
        <Box className="flex flex-wrap gap-3 mb-4">
          <Button variant="outlined" onClick={() => setDialogOpen(true)}>
            Abrir Dialog de ejemplo
          </Button>
        </Box>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Confirmar acción</DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              ¿Está seguro de que desea realizar esta acción? Esta operación no se puede deshacer.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button variant="contained" color="error" onClick={() => setDialogOpen(false)}>
              Confirmar
            </Button>
          </DialogActions>
        </Dialog>

        <Box>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>Estados de carga</Typography>
          <Box className="flex items-center gap-4">
            <CircularProgress size={24} />
            <CircularProgress size={36} />
            <CircularProgress size={48} color="secondary" />
            <Typography variant="body2" color="text.secondary">
              Se usa CircularProgress para indicar operaciones en curso (login, guardado, carga de datos).
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          <strong>Snackbar:</strong> Las notificaciones de éxito/error se muestran con{' '}
          <code>MUI Snackbar</code> en la esquina inferior derecha con{' '}
          <code>autoHideDuration={4000}</code>.
        </Alert>
      </Section>

      {/* Section 10 — General principles */}
      <Section title="Principios Generales de Diseño" number={10}>
        <Grid container spacing={2}>
          {[
            { title: 'Idioma', desc: 'Todo el contenido de la UI está en español. Los códigos técnicos y enums pueden estar en inglés (e.g., ACTIVE, COMPLETED).' },
            { title: 'Íconos', desc: 'Se usan exclusivamente íconos de Material Icons (@mui/icons-material). Preferir íconos descriptivos sobre texto genérico.' },
            { title: 'Espaciado', desc: 'Sistema de espaciado MUI con base 8px. Usar theme.spacing() o clases de Tailwind (p-2 = 8px, p-4 = 16px, gap-3 = 12px).' },
            { title: 'Responsive', desc: 'Mobile-first. Sidebar temporal en xs/sm/md, permanente en lg+. Grid breakpoints: xs=12, sm=6, md=4, lg=3.' },
            { title: 'Validación', desc: 'Backend: Zod schema validation. Frontend: errores inline bajo cada campo, Alert para errores globales del formulario.' },
            { title: 'Coexistencia MUI + Tailwind', desc: 'Tailwind solo para layout/spacing (flex, gap, p-*). MUI para componentes. La config important: "#root" evita conflictos de especificidad CSS.' },
          ].map((p) => (
            <Grid item xs={12} sm={6} key={p.title}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom color="primary.main">
                  {p.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">{p.desc}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Section>
    </Box>
  );
}
