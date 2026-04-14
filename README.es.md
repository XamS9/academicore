# Academicore

Un sistema integral de gestión académica para universidades y colegios. Construido como una aplicación full-stack moderna con una API REST en Express y un frontend en React.

## Descripción General

Academicore proporciona a las instituciones herramientas para gestionar:
- **Programas Académicos** — Carreras, materias, requisitos previos y organización de cursos
- **Gestión de Matrículas** — Registro de estudiantes, seguimiento de matrículas y validación
- **Períodos Académicos** — Organizar la instrucción por semestre o año académico
- **Grupos y Horarios** — Crear clases (grupos) que vinculen profesores, materias y períodos
- **Sistema de Calificaciones** — Múltiples tipos de evaluación, registro de calificaciones y récords académicos
- **Certificaciones de Estudiantes** — Generar y verificar certificados con códigos QR
- **Auditoría** — Rastrear todos los cambios del sistema para cumplimiento y responsabilidad
- **Gestión de Usuarios** — Control de acceso basado en roles (Administrador, Profesor, Estudiante)

**Idioma de la UI**: Español (rutas, etiquetas y flujos de trabajo)

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 18 + React Router + Material-UI 6 + Tailwind CSS |
| **Backend** | Express 4 + Prisma 5 + Zod |
| **Base de Datos** | PostgreSQL 16 |
| **Autenticación** | JWT (tokens de acceso + refresh) + bcryptjs |
| **Despliegue** | Docker y Docker Compose |

## Inicio Rápido

### Requisitos Previos

- **Node.js** 18+ y npm 10+
- **PostgreSQL** 16+ (local o Docker)
- **Git**

### 1. Clonar e Instalar

```bash
git clone <repository-url>
cd academicore
npm install
```

### 2. Configurar Entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales de base de datos y secretos JWT
```

Para PostgreSQL local:
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/academicore"
```

Para Docker Compose (ver paso 3):
```env
DATABASE_URL="postgresql://academicore:academicore_pass@db:5432/academicore"
```

### 3. Configurar Base de Datos

**Opción A: PostgreSQL Local**
```bash
npm run prisma:migrate    # Ejecutar migraciones
cd apps/backend
npm run prisma:seed       # Cargar datos de ejemplo
npm run db:setup          # Recordatorio para triggers SQL manuales
```

**Opción B: Docker Compose (incluye PostgreSQL)**
```bash
docker-compose up -d      # Iniciar PostgreSQL en segundo plano
npm run prisma:migrate
cd apps/backend
npm run prisma:seed
```

### 4. Iniciar Servidores de Desarrollo

```bash
npm run dev
```

Esto inicia tanto el backend (http://localhost:3000) como el frontend (http://localhost:5173) simultáneamente.

**O por separado:**
```bash
npm run dev:backend       # Solo backend
npm run dev:frontend      # Solo frontend
```

### 5. Iniciar Sesión

Visita http://localhost:5173 e inicia sesión con las credenciales de los datos de ejemplo (verifica `apps/backend/prisma/seed.ts`).

## Estructura del Proyecto

```
academicore/
├── apps/
│   ├── backend/          # API REST con Express
│   │   ├── src/
│   │   │   ├── main.ts   # Punto de entrada del servidor
│   │   │   ├── app.ts    # Configuración de la aplicación Express
│   │   │   ├── modules/  # Módulos de características (auth, estudiantes, etc.)
│   │   │   ├── middleware/
│   │   │   └── shared/
│   │   ├── prisma/       # Esquema de ORM y migraciones
│   │   └── package.json
│   ├── frontend/         # Aplicación SPA en React
│   │   ├── src/
│   │   │   ├── pages/    # Componentes de rutas
│   │   │   ├── components/
│   │   │   ├── services/ # Clientes de API
│   │   │   ├── store/    # Context (auth, estado)
│   │   │   ├── App.tsx   # Enrutamiento
│   │   │   └── main.tsx  # Punto de entrada
│   │   └── package.json
├── docs/                 # Documentación
│   ├── processes.md      # Documentación de procesos de negocio
│   └── schema.dbml       # Esquema de base de datos (formato DBML)
├── docker-compose.yml    # Contenedores de PostgreSQL + backend
├── .env.example          # Plantilla de entorno
└── package.json          # Raíz del workspace
```

## Comandos Disponibles

### Desarrollo

```bash
npm run dev              # Iniciar backend + frontend concurrentemente
npm run dev:backend      # Solo backend (ts-node-dev con recarga automática)
npm run dev:frontend     # Solo frontend (servidor de desarrollo Vite)
```

### Construcción

```bash
npm run build:backend    # TypeScript → JavaScript
npm run build:frontend   # TypeScript → Vite bundle
```

### Base de Datos

```bash
npm run prisma:generate  # Regenerar cliente Prisma después de cambios de esquema
npm run prisma:migrate   # Ejecutar migraciones pendientes (interactivo)
npm run prisma:studio    # Abrir GUI de Prisma Studio
```

Desde `apps/backend`:
```bash
npm run prisma:seed      # Cargar base de datos con datos de ejemplo
npm run db:setup         # Migrar + cargar + recordatorio de triggers SQL manuales
```

### Calidad de Código

```bash
cd apps/frontend && npm run lint   # Verificación de ESLint (solo frontend)
```

**Nota:** No hay un ejecutor de pruebas configurado actualmente.

## Descripción General de la Arquitectura

### Backend (Express + Prisma + Zod)

El backend sigue una arquitectura modular con patrones consistentes:

**Cada módulo tiene 5 archivos:**
- `<modulo>.router.ts` — Definiciones de endpoints REST con middleware de autenticación
- `<modulo>.controller.ts` — Manejadores de solicitudes que analizan DTOs y delegan al servicio
- `<modulo>.service.ts` — Lógica de negocio y consultas Prisma
- `<modulo>.dto.ts` — Esquemas de validación Zod + tipos TypeScript
- `index.ts` — Re-exporta router y servicio

**Archivos Clave:**
- `src/main.ts` — Arranque del servidor; auto-carga si la BD está vacía (solo no-prod)
- `src/app.ts` — Monta todos los routers de módulos bajo `/api`
- `src/config/env.ts` — Validación Zod de todas las variables de entorno (fail-fast al inicio)
- `src/middleware/auth.middleware.ts` — Validación JWT y autorización basada en roles
- `src/middleware/error.middleware.ts` — Manejo centralizado de errores
- `src/shared/http-error.ts` — Clase `HttpError` para manejo limpio de errores
- `src/shared/prisma.client.ts` — Cliente Prisma singleton
- `src/shared/seed.ts` — Lógica de carga reutilizable

**Autenticación:**
- JWT con tokens de acceso (15m por defecto) + refresh (7d por defecto)
- Payload: `{ sub, email, roles[], userType }` (ADMIN, TEACHER, STUDENT)
- Eliminación lógica: La mayoría de entidades usan campo `deletedAt`; los servicios filtran

**Base de Datos:**
- PostgreSQL 16 con ORM Prisma
- Esquema: `apps/backend/prisma/schema.prisma`
- Triggers y procedimientos almacenados: `src/migrations/001_trigger_and_sp.sql` (aplicar manualmente)
- Modelos clave: User → Student/Teacher, Career, Subject, AcademicPeriod, Group, Enrollment, Grade, AcademicRecord, Certification, AuditLog

### Frontend (React + Vite + Material-UI)

Una aplicación de página única moderna con rutas y interfaz en español.

**Archivos Clave:**
- `src/App.tsx` — Configuración de enrutamiento (rutas públicas y autenticadas)
- `src/main.tsx` — Punto de entrada de React
- `src/services/api.ts` — Instancia Axios con interceptor JWT; redirige a `/login` en 401
- `src/store/auth.context.tsx` — Estado de autenticación (React Context); token y usuario en localStorage
- `src/services/<modulo>.service.ts` — Cliente de API para cada módulo backend
- `src/pages/` — Componentes de ruta
- `src/components/layout/` — AppLayout, Sidebar, TopBar, NotificationBell

**Rutas Clave:**
- `/` — Dashboard (autenticado)
- `/login` — Página de inicio de sesión (público)
- `/verify/:code` — Verificación de correo electrónico (público)
- `/usuarios` — Gestión de usuarios (admin)
- `/estudiantes` — Estudiantes (admin/profesor/estudiante)
- `/profesores` — Profesores (admin)
- `/carreras` — Carreras (admin)
- `/materias` — Materias (admin)
- `/periodos` — Períodos académicos (admin)
- `/aulas` — Grupos/Clases (profesor/admin)
- `/grupos` — Gestión de grupos (profesor/admin)

## Documentación

- **`docs/processes.md`** — Flujos de procesos de negocio (matrícula, calificación, certificación, etc.), reglas de validación y responsabilidades basadas en roles. **Debe mantenerse sincronizado con cambios de código.**
- **`docs/schema.dbml`** — Esquema de base de datos en formato DBML (todas las tablas, enums, relaciones, índices). **Debe actualizarse cuando cambia el esquema Prisma.**
- **`CLAUDE.md`** — Guía del asistente de IA para trabajar con este código.

## Variables de Entorno

Variables requeridas (copiar de `.env.example`):

```env
# Base de Datos
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/academicore

# JWT (mín 32 caracteres cada una)
JWT_SECRET=tu-secreto-aleatorio-largo-aqui
JWT_REFRESH_SECRET=otro-secreto-aleatorio-largo-aqui

# Opcional
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
VITE_API_URL=http://localhost:3000/api
```

## Despliegue con Docker

Se proporciona `docker-compose.yml` para despliegue en contenedores:

```bash
docker-compose up       # Iniciar PostgreSQL + backend
docker-compose down     # Detener servicios
```

Servicios:
- `db` — PostgreSQL 16 (puerto 5432, health-check)
- `api` — Backend Express (puerto 3000), construido desde `apps/backend/Dockerfile`

El frontend generalmente se sirve por separado (hosting estático, imagen Docker o servidor de desarrollo).

## Flujo de Trabajo de Desarrollo

1. **Desarrollo de Características**: Crear rama desde `main`
2. **Cambios de Esquema**: Modificar `apps/backend/prisma/schema.prisma`, luego:
   ```bash
   npm run prisma:generate    # Actualizar cliente Prisma
   npm run prisma:migrate     # Crear migración
   ```
3. **Agregar Características**: Crear archivos de módulo siguiendo el patrón de 5 archivos
4. **Actualizar Documentación**: Mantener sincronizado `docs/processes.md` y `docs/schema.dbml`
5. **Probar**: Ejecutar localmente con `npm run dev`
6. **Commit**: Usar commits convencionales (feat, fix, refactor, docs, chore)
7. **Push y PR**: Crear PR contra `main`

## Rendimiento y Seguridad

- **Helmet** — Encabezados de seguridad HTTP
- **CORS** — Configurado para origen del frontend
- **JWT** — Autenticación segura basada en tokens con rotación de refresh
- **bcryptjs** — Hash de contraseñas
- **Eliminación Lógica** — Preserva integridad de datos sin eliminación física
- **Auditoría** — Registro de solo-escritura de todos los cambios
- **Validación Zod** — Validación de entrada en límites de API

## Problemas Comunes

### Error de conexión a base de datos
- Verifica que PostgreSQL está ejecutándose: `psql -U postgres`
- Comprueba `DATABASE_URL` en `.env`
- Para Docker: Asegúrate de que Docker Compose está activo: `docker-compose ps`

### La migración falla
```bash
npm run prisma:migrate    # Resolver conflictos interactivamente
npm run prisma:generate   # Regenerar cliente
```

### Puerto ya en uso
- Backend (3000): `lsof -i :3000` y matar proceso, o cambiar `PORT` en `.env`
- Frontend (5173): Vite incrementará automáticamente el puerto si no está disponible

### Datos de ejemplo no aparecen
Asegúrate de que la base de datos esté vacía, o borra manualmente las tablas antes de cargar:
```bash
cd apps/backend && npm run prisma:seed
```

## Licencia

[Añade tu licencia aquí]

## Soporte

Para problemas, solicitudes de características o contribuciones, utiliza el rastreador de problemas de GitHub.
