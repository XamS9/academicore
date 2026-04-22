# Academicore Frontend

Aplicación de una sola página en React para el sistema de gestión académica Academicore. UI moderna con Material-UI y Tailwind CSS, rutas y etiquetas en español.

## Descripción General

El frontend proporciona una interfaz de usuario completa para gestión académica:
- **Dashboard del Estudiante** — Ver calificaciones, contenido del curso, certificaciones
- **Portal del Profesor** — Gestionar clases, registrar calificaciones, ver envíos de estudiantes
- **Panel de Administración** — Gestión de usuarios, configuración del sistema, registros de auditoría
- **Páginas Públicas** — Inicio de sesión, registro, verificación de correo

**Idioma**: Rutas en español (`/estudiantes`, `/profesores`, etc.) con etiquetas de UI en español.

## Stack Tecnológico

- **Framework**: React 18
- **Enrutamiento**: React Router 6
- **Librería de UI**: Material-UI 6
- **Estilos**: Tailwind CSS 3 + Emotion
- **Cliente HTTP**: Axios con interceptor JWT
- **Gestión de Estado**: React Context (estado de autenticación)
- **Herramienta de Construcción**: Vite 5
- **Gráficos**: Recharts (visualización de calificaciones)
- **Iconos**: Material-UI Icons

## Inicio Rápido

### Instalación

Desde la raíz del monorepo:
```bash
npm install
npm run dev:frontend
```

Servidor de desarrollo en `http://localhost:5173`

### Configuración de Entorno

El frontend lee desde `.env` en la raíz del monorepo:

```env
VITE_API_URL=http://localhost:3000/api
```

Esto le dice al frontend dónde está ubicada la API del backend.

## Estructura del Proyecto

```
src/
├── main.tsx                    # Punto de entrada de React
├── App.tsx                     # Configuración de enrutamiento
├── pages/                      # Componentes de ruta
│   ├── LoginPage.tsx           # Login público
│   ├── RegisterPage.tsx        # Registro público
│   ├── DashboardPage.tsx       # Inicio/dashboard
│   ├── student/                # Páginas solo para estudiantes
│   │   ├── StudentGradesPage.tsx
│   │   ├── StudentGradesHistoryPage.tsx
│   │   ├── StudentContentPage.tsx
│   │   └── ...
│   ├── teacher/                # Páginas solo para profesores
│   │   ├── TeacherGroupsPage.tsx
│   │   ├── TeacherGroupDetailPage.tsx
│   │   ├── panels/             # Componentes anidados en páginas de detalle
│   │   │   ├── GroupContentPanel.tsx
│   │   │   ├── GroupEvaluationsPanel.tsx
│   │   │   └── GroupGradesPanel.tsx
│   │   └── ...
│   ├── admin/                  # Páginas solo para admin
│   │   ├── UsersPage.tsx
│   │   ├── EnrollmentsPage.tsx
│   │   ├── GroupsPage.tsx
│   │   ├── ContentPage.tsx
│   │   ├── AnnouncementsPage.tsx
│   │   ├── SystemSettingsPage.tsx
│   │   ├── AuditLogsPage.tsx
│   │   └── ...
│   └── certifications/
│       └── CertificationsPage.tsx
├── components/
│   ├── layout/                 # Componentes de layout compartido
│   │   ├── AppLayout.tsx       # Layout principal con sidebar
│   │   ├── Sidebar.tsx         # Sidebar de navegación
│   │   ├── TopBar.tsx          # Barra superior de navegación
│   │   └── NotificationBell.tsx
│   ├── ui/                     # Componentes de UI reutilizables
│   │   ├── DataTable.tsx       # Tabla de datos genérica
│   │   └── ...
│   └── ...
├── services/                   # Clientes de API
│   ├── api.ts                  # Instancia Axios con interceptor JWT
│   ├── auth.service.ts         # Llamadas de API de autenticación
│   ├── students.service.ts
│   ├── teachers.service.ts
│   ├── enrollments.service.ts
│   ├── grades.service.ts
│   ├── groups.service.ts
│   ├── departments.service.ts
│   └── ...
├── store/                      # Gestión de estado
│   └── auth.context.tsx        # AuthProvider + hook useAuth
├── App.css                     # Estilos globales
└── main.css                    # Importaciones de Tailwind
```

## Enrutamiento

Las rutas están organizadas por rol de usuario y área de características. Los nombres de ruta en español reflejan el dominio universitario:

### Rutas Públicas
- `/login` — Página de inicio de sesión
- `/register` — Página de registro
- `/verify/:code` — Verificación de correo

### Rutas Autenticadas (envueltas en `AppLayout`)
- `/` — Dashboard (todos los roles)

**Rutas de Estudiante** (`/estudiantes`):
- `/estudiantes` — Lista de estudiantes (admin/profesor)
- `/estudiantes/:id` — Detalle de estudiante (admin/profesor/propio)

**Rutas de Profesor** (`/profesores`):
- `/profesores` — Lista de profesores (admin)
- `/profesores/:id` — Detalle de profesor (admin)

**Rutas Académicas**:
- `/carreras` — Carreras (admin)
- `/materias` — Materias (admin)
- `/periodos` — Períodos académicos (admin)

**Rutas de Grupo/Clase** (`/aulas`, `/grupos`):
- `/aulas` — Lista de clases/grupos (admin/profesor)
- `/aulas/:id` — Detalle de clase con pestañas anidadas (profesor)
  - Pestaña de contenido (GroupContentPanel)
  - Pestaña de evaluaciones (GroupEvaluationsPanel)
  - Pestaña de calificaciones (GroupGradesPanel)
- `/grupos` — Gestión de grupos (admin/profesor)

**Rutas de Calificaciones** (`/calificaciones`):
- `/estudiantes/:id/calificaciones` — Historial de calificaciones de estudiante
- Interfaces de entrada de calificaciones para profesor/admin

**Rutas de Certificación** (`/certificaciones`):
- `/certificaciones` — Lista de certificados y generación

**Rutas de Admin** (`/admin`):
- `/admin/usuarios` — Gestión de usuarios
- `/admin/matriculas` — Gestión de matrículas
- `/admin/aulas` — Admin de clases/grupos
- `/admin/anuncios` — Anuncios
- `/admin/configuracion` — Configuración del sistema
- `/admin/auditoria` — Registros de auditoría

Lógica completa de enrutamiento en `src/App.tsx`.

## Autenticación

Autenticación basada en JWT con React Context.

### `AuthProvider` + hook `useAuth`
```typescript
// En App principal
<AuthProvider>
  <App />
</AuthProvider>

// En cualquier componente
const { user, token, login, logout } = useAuth();
```

**El estado de autenticación incluye:**
- `token` — Token de acceso JWT
- `user` — `{ id, email, roles, userType }`
- `isLoading` — Verificación de autenticación en progreso
- `isAuthenticated` — Booleano

**Almacenamiento**: Token y usuario persistidos en localStorage para continuidad de sesión.

### Interceptor JWT
`src/services/api.ts` automáticamente:
- Adjunta token Bearer a todas las solicitudes
- Redirige a `/login` en 401 (token expirado/inválido)
- Reintenta con token de refresh si está disponible

## Cliente de API

`src/services/api.ts` exporta una instancia Axios:

```typescript
import { apiClient } from '@/services/api';

// Uso en servicios
export const studentsService = {
  list: async () => {
    const { data } = await apiClient.get('/estudiantes');
    return data;
  }
};
```

Cada módulo backend tiene un archivo de servicio correspondiente que usa `apiClient`.

## Gestión de Estado

Usa React Context para estado de autenticación global. Para estado local de componentes, se usan hooks nativos de React (`useState`, `useReducer`).

**Futuro**: Considerar Redux o Zustand para estado de aplicación complejo si es necesario.

## Componentes de UI

### `DataTable`
Componente de tabla genérico para mostrar listas:
```typescript
<DataTable
  columns={[
    { key: 'email', label: 'Correo' },
    { key: 'name', label: 'Nombre' }
  ]}
  data={students}
  onRowClick={(row) => navigate(`/estudiantes/${row.id}`)}
/>
```

### Componentes de Material-UI
Toda la UI construida con componentes MUI: Button, TextField, Dialog, Card, etc.

### Layout
- `AppLayout` — Layout principal con Sidebar + TopBar
- `Sidebar` — Menú de navegación (basado en roles)
- `TopBar` — Búsqueda, notificaciones, menú de usuario
- `NotificationBell` — Indicador de notificaciones

## Estilos

**Tailwind CSS** para clases de utilidad:
```tsx
<div className="flex gap-4 p-6 bg-white rounded-lg shadow">
  <h1 className="text-xl font-bold">Título</h1>
</div>
```

**Emotion** (vía MUI) para estilos de componentes:
```typescript
import { styled } from '@mui/material/styles';

const CustomButton = styled(Button)({
  backgroundColor: '#3f51b5',
  // ...
});
```

## Manejo de Formularios

Los formularios usan hooks de React + validación HTML nativa. Ejemplo:
```typescript
const [formData, setFormData] = useState({ email: '', password: '' });

const handleChange = (e) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
};

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await authService.login(formData);
    // Manejar éxito
  } catch (err) {
    // Manejar error
  }
};
```

## Obtención de Datos

Patrón típico en componentes de página:

```typescript
export const StudentGradesPage = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const data = await gradesService.getStudentGrades();
        setGrades(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorAlert message={error} />;
  return <DataTable data={grades} />;
};
```

## Desarrollo

### Iniciar Servidor de Desarrollo
```bash
npm run dev              # Desde raíz del monorepo
# o
cd apps/frontend && npm run dev
```

Vite auto-recarga en cambios de archivo.

### Construir para Producción
```bash
npm run build:frontend   # Desde raíz del monorepo
# o
cd apps/frontend && npm run build
```

Salida a `dist/`.

### Linting
```bash
npm run lint             # Desde apps/frontend
```

Ejecuta ESLint en `src/` con soporte TypeScript.

### Depuración

**Herramientas del Navegador**:
- Extensión React DevTools para inspección de componentes
- Redux DevTools (si se usa Redux más adelante)

**VS Code**:
- Depurador para Firefox / Chrome
- Extensión React Snippets

## Accesibilidad

- HTML semántico (`<button>`, `<form>`, `<label>`)
- Etiquetas ARIA donde sea necesario
- Soporte de navegación por teclado (Material-UI lo maneja)
- Cumplimiento de contraste de color (tema de MUI)

## Rendimiento

- División de código: Las rutas se cargan perezosamente vía React.lazy + Suspense
- Optimización de imágenes: Servir imágenes en tamaños apropiados
- Análisis de bundle: `npm run build && npm run preview`
- Red: Minimizar llamadas a API, cachear donde sea apropiado

## Variables de Entorno

Configurar en `.env` en raíz del monorepo:

```env
VITE_API_URL=http://localhost:3000/api
```

Acceder en código:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

## Despliegue

### Artefacto de Construcción
```bash
npm run build:frontend
# Crea directorio dist/ con archivos estáticos
```

### Opciones de Hosting
1. **Host Estático** (Vercel, Netlify, GitHub Pages)
   - Subir contenidos de `dist/`
   - Configurar fallback raíz a `index.html` para enrutamiento del lado del cliente

2. **Docker**
   ```dockerfile
   FROM node:18 AS build
   WORKDIR /app
   COPY . .
   RUN npm install && npm run build:frontend

   FROM nginx:latest
   COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

3. **Servidor Express**
   - Servir `dist/` como archivos estáticos
   - Fallback de todas las rutas a `index.html`

### Entorno en Tiempo de Despliegue
Establecer `VITE_API_URL` a URL de backend de producción antes de construir:
```bash
VITE_API_URL=https://api.ejemplo.com/api npm run build:frontend
```

## Problemas Comunes

### Página en blanco después de iniciar sesión
- Verifica la consola del navegador para errores
- Verifica que `VITE_API_URL` apunta a backend ejecutándose
- Verifica el token JWT en localStorage

### Llamadas a API fallan con 401
- Token puede estar expirado; implementación de token de refresh en `auth.context.tsx`
- Verifica que `JWT_SECRET` coincida con backend

### Estilos no se aplican
- Asegúrate de que la construcción de Tailwind CSS se ejecuta (`npm run dev` incluye PostCSS)
- Verifica el orden de importación de CSS en `main.css`

### Errores de tipo en servicios
```bash
npm run build
```

## Recursos Útiles

- [Docs de React](https://react.dev)
- [Docs de React Router](https://reactrouter.com)
- [Docs de Material-UI](https://mui.com)
- [Docs de Tailwind CSS](https://tailwindcss.com)
- [Docs de Axios](https://axios-http.com)
- [Docs de Vite](https://vitejs.dev)

## Licencia

[Añade tu licencia]
