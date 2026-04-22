# Academicore Backend

API REST con Express.js para el sistema de gestión académica Academicore.

## Descripción General

El backend proporciona endpoints REST para todas las características de gestión académica: autenticación de usuarios, matrícula, calificaciones, certificaciones y operaciones administrativas. Está construido con Express, ORM Prisma, validación Zod y autenticación JWT.

## Stack Tecnológico

- **Framework**: Express 4
- **Base de Datos**: PostgreSQL 16 (via ORM Prisma 5)
- **Validación**: Zod 3
- **Autenticación**: JWT (jsonwebtoken) + bcryptjs
- **Almacenamiento de Archivos**: AWS S3 + sistema de archivos local
- **Otros**: Helmet (seguridad), CORS, Multer (cargas), Puppeteer (generación de PDF)

## Inicio Rápido

### Requisitos Previos

- Node.js 18+
- PostgreSQL 16+ (o Docker)

### Instalación

Desde la raíz del monorepo:
```bash
npm install
npm run prisma:migrate
cd apps/backend && npm run prisma:seed
npm run dev:backend
```

El servidor escucha en `http://localhost:3000/api`

### Configuración de Entorno

Copiar `.env.example` de la raíz a `.env` y configurar:

```env
DATABASE_URL=postgresql://academicore:academicore_pass@localhost:5432/academicore
JWT_SECRET=change-this-to-a-long-random-secret
JWT_REFRESH_SECRET=change-this-to-another-long-random-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

## Estructura del Proyecto

```
src/
├── main.ts                     # Punto de entrada del servidor
├── app.ts                      # Configuración de app Express, montaje de middleware
├── config/
│   └── env.ts                  # Validación Zod de variables de entorno
├── middleware/
│   ├── auth.middleware.ts      # Middleware authenticate & authorize
│   ├── error.middleware.ts     # Manejo centralizado de errores
│   └── ...
├── modules/                    # Módulos de características (cada uno sigue patrón de 5 archivos)
│   ├── auth/
│   │   ├── auth.router.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.dto.ts
│   │   └── index.ts
│   ├── students/
│   ├── teachers/
│   ├── enrollments/
│   ├── grades/
│   ├── certifications/
│   └── ...
├── shared/
│   ├── http-error.ts           # Clase HttpError
│   ├── prisma.client.ts        # Cliente Prisma singleton
│   └── seed.ts                 # Lógica de carga reutilizable
└── migrations/
    └── 001_trigger_and_sp.sql  # Triggers SQL y procedimientos almacenados

prisma/
├── schema.prisma               # Esquema de base de datos
├── migrations/                 # Migraciones auto-generadas
└── seed.ts                     # Punto de entrada de carga de datos
```

## Patrón de Módulo

Cada módulo de características sigue una estructura consistente de 5 archivos:

### `<modulo>.router.ts` — Definiciones de rutas
```typescript
const router = express.Router();

router.get('/', authenticate, authorize('ADMIN', 'TEACHER'), studentController.list);
router.post('/', authenticate, authorize('ADMIN'), studentController.create);
// ...
export { router as studentRouter };
```

### `<modulo>.controller.ts` — Manejadores de solicitudes
```typescript
export const studentController = {
  list: async (req, res, next) => {
    try {
      const students = await studentService.list();
      res.json(students);
    } catch (err) {
      next(err);
    }
  },
  // ...
};
```

### `<modulo>.service.ts` — Lógica de negocio y consultas de base de datos
```typescript
export const studentService = {
  list: async () => {
    return prisma.student.findMany({
      where: { deletedAt: null },
      include: { user: true }
    });
  },
  // Lanzar HttpError para errores de validación/no encontrado
  create: async (data) => {
    // validar, verificar duplicados, luego crear
  }
};
```

### `<modulo>.dto.ts` — Esquemas Zod y tipos
```typescript
const createStudentSchema = z.object({
  userId: z.string().uuid(),
  cardinality: z.string(),
});

export type CreateStudentDto = z.infer<typeof createStudentSchema>;
```

### `index.ts` — Re-exportaciones
```typescript
export { studentRouter } from './student.router';
export { studentService } from './student.service';
```

## Autenticación y Autorización

Autenticación basada en JWT con tokens de acceso + refresh.

### Middleware `authenticate`
Verifica token Bearer; adjunta `user` a `req`:
```typescript
req.user = { sub, email, roles, userType }
```

### Middleware `authorize`
Verifica roles del usuario:
```typescript
router.post('/', authenticate, authorize('ADMIN'), ...)
```

### Tipos de Usuarios
- `ADMIN` — Acceso completo al sistema
- `TEACHER` — Gestión de clases y calificaciones
- `STUDENT` — Ver calificaciones propias, contenido

### JWT Payload
```typescript
{
  sub: string;        // ID de usuario
  email: string;
  roles: string[];
  userType: 'ADMIN' | 'TEACHER' | 'STUDENT';
}
```

## Esquema de Base de Datos

Definido en `prisma/schema.prisma`. Modelos clave:

**Usuarios y Acceso**
- `User` — Usuario base (correo, contraseña, roles, eliminación lógica)
- `Student` → extiende User
- `Teacher` → extiende User
- `AuditLog` — Registro de cambios de solo-escritura

**Estructura Académica**
- `Career` — Programa de grado
- `Subject` — Curso con requisitos previos
- `AcademicPeriod` — Semestre/año
- `Group` — Clase (profesor + materia + período)

**Matrícula y Calificaciones**
- `Enrollment` → `EnrollmentSubject` — Estudiante en materia
- `EvaluationType` — Examen, tarea, etc.
- `Evaluation` → `Grade` — Calificaciones individuales
- `AcademicRecord` — Calificación final por materia (auto-generado por trigger)

**Otros**
- `Certification` — Certificado (con verificación de código QR)
- `SystemSettings` — Configuración de aplicación

**Convención de Nombres**: Los nombres de tabla en BD usan `@@map("snake_case")` mientras que los modelos Prisma usan PascalCase.

### Triggers y Procedimientos Almacenados
Los triggers SQL en `src/migrations/001_trigger_and_sp.sql` **deben aplicarse manualmente** después de migraciones:
```bash
psql -U $POSTGRES_USER -d $POSTGRES_DB -f src/migrations/001_trigger_and_sp.sql
```

Estos implementan:
- Generación automática de `AcademicRecord` cuando se finalizan calificaciones
- Gestión de marcas de tiempo (created_at, updated_at)
- Verificaciones de consistencia de datos

## Endpoints de API

Todos los endpoints prefijados con `/api`. Autenticación requerida a menos que se indique lo contrario.

### Auth (Público)
- `POST /api/auth/login` — Iniciar sesión con correo/contraseña
- `POST /api/auth/register` — Registrar nuevo usuario
- `POST /api/auth/refresh` — Actualizar token de acceso
- `GET /api/auth/verify/:code` — Verificar correo

### Estudiantes
- `GET /api/estudiantes` — Listar estudiantes (admin/profesor)
- `POST /api/estudiantes` — Crear estudiante (admin)
- `GET /api/estudiantes/:id` — Obtener estudiante (admin/profesor/propio)
- `PUT /api/estudiantes/:id` — Actualizar estudiante (admin)
- `DELETE /api/estudiantes/:id` — Eliminar lógicamente estudiante (admin)

### Profesores
- Estructura REST similar a estudiantes

### Matrículas
- `GET /api/matriculas` — Listar matrículas
- `POST /api/matriculas` — Matricular estudiante
- `PUT /api/matriculas/:id` — Actualizar matrícula
- `DELETE /api/matriculas/:id` — Eliminar matrícula

### Calificaciones
- `GET /api/calificaciones` — Listar calificaciones
- `POST /api/calificaciones` — Registrar calificación
- `PUT /api/calificaciones/:id` — Actualizar calificación

### Certificaciones
- `GET /api/certificaciones` — Listar certificados
- `POST /api/certificaciones` — Generar certificado
- `GET /api/certificaciones/:code/verify` — Verificar certificado por código QR

### Sistema
- `GET /api/system-settings` — Obtener configuración del sistema (admin)
- `PUT /api/system-settings` — Actualizar configuración (admin)

**Lista completa de endpoints:** Ver routers de módulos individuales en `src/modules/`.

## Manejo de Errores

Centralizado en `src/middleware/error.middleware.ts` (debe ser último middleware):

- **ZodError** → 400 Bad Request con detalles de campos
- **HttpError** → Código de estado personalizado + mensaje
- **Otros** → 500 Internal Server Error

Ejemplo de uso:
```typescript
// En servicio
if (!student) {
  throw new HttpError(404, 'Estudiante no encontrado');
}

// En controlador
try {
  const data = createStudentSchema.parse(req.body);
} catch (err) {
  next(err); // Middleware maneja
}
```

## Comandos de Base de Datos

Desde raíz del monorepo o `apps/backend`:

```bash
# Generar/actualizar cliente Prisma después de cambios de esquema
npm run prisma:generate

# Ejecutar migraciones pendientes (interactivo)
npm run prisma:migrate

# Ver/editar datos en GUI
npm run prisma:studio

# Cargar base de datos con datos de ejemplo
npm run prisma:seed

# Configuración completa: migrar + cargar + imprimir recordatorio SQL
npm run db:setup
```

## Desarrollo

### Iniciar Servidor
```bash
npm run dev              # Desde raíz del monorepo
# o
cd apps/backend && npm run dev
```

Auto-recarga en cambios de archivo (ts-node-dev).

### Agregar una Característica Nueva

1. **Actualizar esquema Prisma** (`prisma/schema.prisma`)
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

2. **Crear archivos de módulo** en `src/modules/<caracteristica>/`:
   - `<caracteristica>.dto.ts` — Esquemas Zod
   - `<caracteristica>.service.ts` — Lógica
   - `<caracteristica>.controller.ts` — Manejadores
   - `<caracteristica>.router.ts` — Rutas
   - `index.ts` — Exportaciones

3. **Registrar router** en `src/app.ts`:
   ```typescript
   app.use('/api', characteristicRouter);
   ```

4. **Probar** con curl, Postman o frontend

### Prisma Studio

Herramienta GUI para examinar y editar datos:
```bash
npm run prisma:studio
# Abre http://localhost:5555
```

## Seguridad

- **Helmet** — Encabezados de seguridad HTTP (HSTS, CSP, X-Frame-Options, etc.)
- **CORS** — Configurado para origen del frontend
- **bcryptjs** — Hash de contraseñas (12 rondas)
- **JWT** — Autenticación basada en tokens, sin almacenamiento de sesión
- **Eliminación Lógica** — Eliminación lógica preserva auditoría
- **AuditLog** — Todos los cambios registrados
- **Validación de Entrada** — Zod en cada límite de API
- **Prevención de Inyección SQL** — Consultas parametrizadas de Prisma

## Cargas de Archivos

Datos multiples vía Multer:
- Almacenamiento local: directorio `uploads/`
- Almacenamiento S3: Configurado vía `@aws-sdk/client-s3`

Cambiar en `src/shared/storage/` — interfaz `StorageProvider` con implementaciones `LocalProvider` y `S3Provider`.

## Carga de Datos

`prisma/seed.ts` crea datos de ejemplo para desarrollo:
- Usuarios admin, profesor, estudiante
- Carreras y materias
- Períodos académicos y grupos
- Matrículas y calificaciones

**Se ejecuta automáticamente** al arranque si BD está vacía (solo no-producción).

Ejecutar manualmente:
```bash
cd apps/backend && npm run prisma:seed
```

## Despliegue

### Construir
```bash
npm run build:backend
# Salida: dist/main.js
```

### Ejecutar
```bash
node dist/main.js
```

### Docker
```bash
docker build -t academicore-api apps/backend/
docker run -e DATABASE_URL=... -e JWT_SECRET=... -p 3000:3000 academicore-api
```

O con Docker Compose (desde raíz):
```bash
docker-compose up
```

## Solución de Problemas

### Puerto 3000 ya en uso
```bash
lsof -i :3000          # Encontrar proceso
kill -9 <PID>          # Matarlo
# O cambiar PORT en .env
```

### Conexión a base de datos fallida
```bash
# Verificar que PostgreSQL está ejecutándose
psql -U postgres

# Verificar formato de DATABASE_URL
postgresql://user:password@host:5432/database
```

### Cliente Prisma no encontrado
```bash
npm run prisma:generate
npm install
```

### Errores de tipo en controladores/servicios
```bash
npm run build
```

## Referencias

- [Docs de Express.js](https://expressjs.com/)
- [Docs de Prisma](https://www.prisma.io/docs/)
- [Validación Zod](https://zod.dev/)
- [JWT.io](https://jwt.io/)
- [Docs de PostgreSQL](https://www.postgresql.org/docs/)

## Licencia

[Añade tu licencia]
