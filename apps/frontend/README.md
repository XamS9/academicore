# Academicore Frontend

React single-page application for the Academicore academic management system. Modern UI with Material-UI and Tailwind CSS, Spanish-language routes and labels.

## Overview

The frontend provides a complete user interface for academic management:
- **Student Dashboard** — View grades, course content, certifications
- **Teacher Portal** — Manage classes, record grades, view student submissions
- **Admin Panel** — User management, system configuration, audit logs
- **Public Pages** — Login, registration, email verification

**Language**: Spanish routes (`/estudiantes`, `/profesores`, etc.) with Spanish UI labels.

## Tech Stack

- **Framework**: React 18
- **Routing**: React Router 6
- **UI Library**: Material-UI 6
- **Styling**: Tailwind CSS 3 + Emotion
- **HTTP Client**: Axios with JWT interceptor
- **State Management**: React Context (auth state)
- **Build Tool**: Vite 5
- **Charting**: Recharts (grade visualization)
- **Icons**: Material-UI Icons

## Getting Started

### Installation

From the monorepo root:
```bash
npm install
npm run dev:frontend
```

Dev server runs at `http://localhost:5173`

### Environment Setup

The frontend reads from `.env` in the monorepo root:

```env
VITE_API_URL=http://localhost:3000/api
```

This tells the frontend where the backend API is located.

## Project Structure

```
src/
├── main.tsx                    # React entry point
├── App.tsx                     # Routing setup
├── pages/                      # Route components
│   ├── LoginPage.tsx           # Public login
│   ├── RegisterPage.tsx        # Public registration
│   ├── DashboardPage.tsx       # Home/dashboard
│   ├── student/                # Student-only pages
│   │   ├── StudentGradesPage.tsx
│   │   ├── StudentGradesHistoryPage.tsx
│   │   ├── StudentContentPage.tsx
│   │   └── ...
│   ├── teacher/                # Teacher-only pages
│   │   ├── TeacherGroupsPage.tsx
│   │   ├── TeacherGroupDetailPage.tsx
│   │   ├── panels/             # Nested components within detail pages
│   │   │   ├── GroupContentPanel.tsx
│   │   │   ├── GroupEvaluationsPanel.tsx
│   │   │   └── GroupGradesPanel.tsx
│   │   └── ...
│   ├── admin/                  # Admin-only pages
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
│   ├── layout/                 # Shared layout components
│   │   ├── AppLayout.tsx       # Main layout with sidebar
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   ├── TopBar.tsx          # Top navigation bar
│   │   └── NotificationBell.tsx
│   ├── ui/                     # Reusable UI components
│   │   ├── DataTable.tsx       # Generic data table
│   │   └── ...
│   └── ...
├── services/                   # API clients
│   ├── api.ts                  # Axios instance with JWT interceptor
│   ├── auth.service.ts         # Auth API calls
│   ├── students.service.ts
│   ├── teachers.service.ts
│   ├── enrollments.service.ts
│   ├── grades.service.ts
│   ├── groups.service.ts
│   ├── departments.service.ts
│   └── ...
├── store/                      # State management
│   └── auth.context.tsx        # AuthProvider + useAuth hook
├── App.css                     # Global styles
└── main.css                    # Tailwind imports
```

## Routing

Routes are organized by user role and feature area. Spanish route names reflect the university domain:

### Public Routes
- `/login` — Login page
- `/register` — Registration page
- `/verify/:code` — Email verification

### Authenticated Routes (wrapped in `AppLayout`)
- `/` — Dashboard (all roles)

**Student Routes** (`/estudiantes`):
- `/estudiantes` — Student list (admin/teacher)
- `/estudiantes/:id` — Student detail (admin/teacher/own)

**Teacher Routes** (`/profesores`):
- `/profesores` — Teacher list (admin)
- `/profesores/:id` — Teacher detail (admin)

**Academic Routes**:
- `/carreras` — Careers (admin)
- `/materias` — Subjects (admin)
- `/periodos` — Academic periods (admin)

**Group/Class Routes** (`/aulas`, `/grupos`):
- `/aulas` — Class/group list (admin/teacher)
- `/aulas/:id` — Class detail with nested tabs (teacher)
  - Content tab (GroupContentPanel)
  - Evaluations tab (GroupEvaluationsPanel)
  - Grades tab (GroupGradesPanel)
- `/grupos` — Group management (admin/teacher)

**Grading Routes** (`/calificaciones`):
- `/estudiantes/:id/calificaciones` — Student grade history
- Teacher/admin grade entry interfaces

**Certification Routes** (`/certificaciones`):
- `/certificaciones` — Certificate list and generation

**Admin Routes** (`/admin`):
- `/admin/usuarios` — User management
- `/admin/matriculas` — Enrollment management
- `/admin/aulas` — Class/group admin
- `/admin/anuncios` — Announcements
- `/admin/configuracion` — System settings
- `/admin/auditoria` — Audit logs

Full routing logic in `src/App.tsx`.

## Authentication

JWT-based authentication with React Context.

### `AuthProvider` + `useAuth` hook
```typescript
// In main App
<AuthProvider>
  <App />
</AuthProvider>

// In any component
const { user, token, login, logout } = useAuth();
```

**Auth state includes:**
- `token` — JWT access token
- `user` — `{ id, email, roles, userType }`
- `isLoading` — Auth check in progress
- `isAuthenticated` — Boolean

**Storage**: Token and user persisted to localStorage for session continuity.

### JWT Interceptor
`src/services/api.ts` automatically:
- Attaches Bearer token to all requests
- Redirects to `/login` on 401 (expired/invalid token)
- Retries with refresh token if available

## API Client

`src/services/api.ts` exports an Axios instance:

```typescript
import { apiClient } from '@/services/api';

// Usage in services
export const studentsService = {
  list: async () => {
    const { data } = await apiClient.get('/estudiantes');
    return data;
  }
};
```

Each backend module has a corresponding service file that uses `apiClient`.

## State Management

Uses React Context for global auth state. For component-local state, plain React hooks (`useState`, `useReducer`) are used.

**Future**: Consider Redux or Zustand for complex app state if needed.

## UI Components

### `DataTable`
Generic table component for displaying lists:
```typescript
<DataTable
  columns={[
    { key: 'email', label: 'Email' },
    { key: 'name', label: 'Name' }
  ]}
  data={students}
  onRowClick={(row) => navigate(`/estudiantes/${row.id}`)}
/>
```

### Material-UI Components
All UI built with MUI components: Button, TextField, Dialog, Card, etc.

### Layout
- `AppLayout` — Main layout with Sidebar + TopBar
- `Sidebar` — Navigation menu (role-based)
- `TopBar` — Search, notifications, user menu
- `NotificationBell` — Notification indicator

## Styling

**Tailwind CSS** for utility classes:
```tsx
<div className="flex gap-4 p-6 bg-white rounded-lg shadow">
  <h1 className="text-xl font-bold">Title</h1>
</div>
```

**Emotion** (via MUI) for component-scoped styles:
```typescript
import { styled } from '@mui/material/styles';

const CustomButton = styled(Button)({
  backgroundColor: '#3f51b5',
  // ...
});
```

## Form Handling

Forms use React hooks + native HTML validation. Example:
```typescript
const [formData, setFormData] = useState({ email: '', password: '' });

const handleChange = (e) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
};

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await authService.login(formData);
    // Handle success
  } catch (err) {
    // Handle error
  }
};
```

## Data Fetching

Typical pattern in page components:

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

## Development

### Start Dev Server
```bash
npm run dev              # From monorepo root
# or
cd apps/frontend && npm run dev
```

Vite auto-refreshes on file changes.

### Build for Production
```bash
npm run build:frontend   # From monorepo root
# or
cd apps/frontend && npm run build
```

Outputs to `dist/`.

### Lint
```bash
npm run lint             # From apps/frontend
```

Runs ESLint on `src/` with TypeScript support.

### Debugging

**Browser DevTools**:
- React DevTools extension for component inspection
- Redux DevTools (if using Redux later)

**VS Code**:
- Debugger for Firefox / Chrome
- React Snippets extension

## Accessibility

- Semantic HTML (`<button>`, `<form>`, `<label>`)
- ARIA labels where needed
- Keyboard navigation support (Material-UI handles this)
- Color contrast compliance (MUI theme)

## Performance

- Code splitting: Routes lazy-load via React.lazy + Suspense
- Image optimization: Serve images at appropriate sizes
- Bundle analysis: `npm run build && npm run preview`
- Network: Minimize API calls, cache where appropriate

## Environment Variables

Configure in `.env` at monorepo root:

```env
VITE_API_URL=http://localhost:3000/api
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

## Deployment

### Build Artifact
```bash
npm run build:frontend
# Creates dist/ directory with static files
```

### Hosting Options
1. **Static Host** (Vercel, Netlify, GitHub Pages)
   - Upload `dist/` contents
   - Set up root fallback to `index.html` for client-side routing

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

3. **Express Server**
   - Serve `dist/` as static files
   - Fallback all routes to `index.html`

### Environment at Deploy Time
Set `VITE_API_URL` to production backend URL before building:
```bash
VITE_API_URL=https://api.example.com/api npm run build:frontend
```

## Common Issues

### Blank page after login
- Check browser console for errors
- Verify `VITE_API_URL` points to running backend
- Check JWT token in localStorage

### API calls fail with 401
- Token may be expired; refresh token implementation in `auth.context.tsx`
- Verify `JWT_SECRET` matches backend

### Styling not applying
- Ensure Tailwind CSS build is running (`npm run dev` includes PostCSS)
- Check CSS import order in `main.css`

### Type errors in services
```bash
npm run build
```

## Useful Resources

- [React Docs](https://react.dev)
- [React Router Docs](https://reactrouter.com)
- [Material-UI Docs](https://mui.com)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Axios Docs](https://axios-http.com)
- [Vite Docs](https://vitejs.dev)

## License

[Add your license]
