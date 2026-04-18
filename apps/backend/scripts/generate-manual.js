/**
 * Academicore — User Manual Generator
 *
 * Captures screenshots of every page and key interactive state for every role,
 * then assembles them into an HTML document and a PDF manual.
 *
 * Prerequisites: both dev servers must be running (`npm run dev`)
 * Usage: npm run generate:manual   (from monorepo root)
 */

"use strict";

const path = require("path");
const fs = require("fs");
const http = require("http");
const puppeteer = require("puppeteer");

// ─── Constants ────────────────────────────────────────────────────────────────

const FRONTEND_URL = "http://localhost:5173";
const BACKEND_URL = "http://localhost:3000";
const SEED_VERIFICATION_CODE = "00000000-seed-cert-0000-000000000001";

const CREDENTIALS = {
  ADMIN:   { email: "admin@academicore.com",       password: "admin123" },
  TEACHER: { email: "prof.garcia@academicore.com", password: "teacher123" },
  STUDENT: { email: "ana.garcia@academicore.com",  password: "student123" },
};

// Helper used inside `extras.setup` closures
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Click a button by its visible text (partial match)
async function clickButtonByText(page, text) {
  await page.evaluate((t) => {
    const btn = Array.from(document.querySelectorAll("button"))
      .find((b) => b.textContent.trim().includes(t) && !b.disabled);
    if (btn) btn.click();
  }, text);
}

// Click an MUI Tab by its visible label
async function clickTabByLabel(page, label) {
  await page.evaluate((l) => {
    const tab = Array.from(document.querySelectorAll('[role="tab"]'))
      .find((t) => t.textContent.trim().includes(l));
    if (tab) tab.click();
  }, label);
}

// Click the Nth icon-button inside the first data row of the first table.
// index 0 = Edit, 1 = Delete / Toggle (varies by page — confirmed from source).
async function clickFirstRowButton(page, index = 0) {
  await page.evaluate((idx) => {
    const row = document.querySelector("tbody tr");
    if (!row) return;
    const buttons = Array.from(row.querySelectorAll("button"));
    if (buttons[idx]) buttons[idx].click();
  }, index);
}

// Open the Nth MUI Select on the page and pick its first available option.
async function selectFirstMuiOption(page, selectIndex = 0) {
  await page.evaluate((idx) => {
    const selects = document.querySelectorAll(".MuiSelect-select");
    if (selects[idx]) selects[idx].click();
  }, selectIndex);
  await delay(400);
  await page.evaluate(() => {
    const opts = Array.from(document.querySelectorAll('[role="option"]'));
    const first = opts.find((o) => o.getAttribute("aria-disabled") !== "true");
    if (first) first.click();
  });
  await delay(600);
}

// Open the Nth MUI Select and pick the option at `optionIndex` (0-based within
// the rendered list).  Use this when the first option is a placeholder and you
// need to pick e.g. optionIndex=1 to get the first real value.
async function selectMuiOptionAt(page, selectIndex = 0, optionIndex = 0) {
  await page.evaluate((idx) => {
    const selects = document.querySelectorAll(".MuiSelect-select");
    if (selects[idx]) selects[idx].click();
  }, selectIndex);
  await delay(400);
  await page.evaluate((optIdx) => {
    const opts = Array.from(document.querySelectorAll('[role="option"]'));
    if (opts[optIdx]) opts[optIdx].click();
  }, optionIndex);
  await delay(600);
}

// ─── Pages manifest ───────────────────────────────────────────────────────────
// Each page can have an optional `extras` array.
// Each extra: { label, desc, setup: async (page) => { ... } }
// `setup` runs on a freshly loaded instance of the same route.

const PAGES = {
  ADMIN: [
    {
      route: "/dashboard",
      label: "Dashboard",
      desc: "Panel principal con métricas globales: total de estudiantes, profesores, grupos activos y últimas entradas del registro de auditoría.",
    },
    {
      route: "/usuarios",
      label: "Usuarios",
      desc: "Gestión unificada de todas las cuentas del sistema con filtro por rol: Todos, Administradores, Docentes y Estudiantes. Cada vista muestra las columnas relevantes para el tipo de usuario seleccionado.",
      extras: [
        {
          label: "Filtro: Docentes",
          desc: "Al seleccionar el filtro Docentes se muestran número de empleado, nombre, correo y departamento con columnas específicas del perfil docente.",
          setup: async (page) => {
            await page.evaluate(() => {
              const btn = Array.from(document.querySelectorAll("button"))
                .find((b) => b.textContent.trim() === "Docentes");
              if (btn) btn.click();
            });
            await delay(1200);
          },
        },
        {
          label: "Filtro: Estudiantes",
          desc: "Al seleccionar el filtro Estudiantes se muestran código de matrícula, nombre, correo, carrera y estado académico.",
          setup: async (page) => {
            await page.evaluate(() => {
              const btn = Array.from(document.querySelectorAll("button"))
                .find((b) => b.textContent.trim() === "Estudiantes");
              if (btn) btn.click();
            });
            await delay(1200);
          },
        },
        {
          label: "Formulario: Nuevo Usuario",
          desc: "El botón Nuevo Usuario siempre abre el mismo formulario unificado con nombre, apellido, correo, contraseña, confirmación de contraseña y un selector de rol (Administrador, Docente o Estudiante). El filtro activo no cambia el formulario.",
          setup: async (page) => {
            await clickButtonByText(page, "Nuevo Usuario");
            await delay(800);
          },
        },
        {
          label: "Formulario: Editar Estudiante",
          desc: "El botón de lápiz en la vista de Estudiantes abre el diálogo con datos personales, estado académico y selector de carrera (bloqueado por defecto — se desbloquea con el ícono de candado). El código de matrícula se muestra deshabilitado.",
          setup: async (page) => {
            await page.evaluate(() => {
              const btn = Array.from(document.querySelectorAll("button"))
                .find((b) => b.textContent.trim() === "Estudiantes");
              if (btn) btn.click();
            });
            await delay(1200);
            await clickFirstRowButton(page, 0);
            await delay(800);
          },
        },
        {
          label: "Formulario: Editar Docente",
          desc: "El botón de lápiz en la vista de Docentes abre el diálogo con datos personales, código de empleado y selector de departamento cargado desde el catálogo. Al guardar se actualizan en paralelo el usuario y el perfil docente.",
          setup: async (page) => {
            await page.evaluate(() => {
              const btn = Array.from(document.querySelectorAll("button"))
                .find((b) => b.textContent.trim() === "Docentes");
              if (btn) btn.click();
            });
            await delay(1200);
            await clickFirstRowButton(page, 0);
            await delay(800);
          },
        },
      ],
    },
    {
      route: "/carreras",
      label: "Carreras",
      desc: "Catálogo de programas académicos con código, nombre y duración en semestres. Permite activar o desactivar carreras.",
      extras: [
        {
          label: "Formulario: Nueva Carrera",
          desc: "Diálogo para definir un nuevo programa académico con su nombre oficial, código interno y número de semestres.",
          setup: async (page) => {
            await clickButtonByText(page, "Nueva Carrera");
            await delay(800);
          },
        },
        {
          label: "Formulario: Editar Carrera",
          desc: "El botón de lápiz (índice 0 en la fila) precarga el diálogo con nombre, código y semestres de la carrera para su modificación.",
          setup: async (page) => {
            await clickFirstRowButton(page, 0);
            await delay(800);
          },
        },
      ],
    },
    {
      route: "/materias",
      label: "Materias",
      desc: "Catálogo de asignaturas con créditos, prerrequisitos y arancel opcional por materia (monto fijo). Si el arancel está vacío, en inscripción se usa el costo global por crédito definido en Configuración. El ícono de libro abre el temario oficial de la materia (temas ordenados).",
      extras: [
        {
          label: "Formulario: Nueva Materia",
          desc: "Formulario para crear una asignatura con nombre, código, créditos, prerrequisitos, arancel opcional y materias prerequisito.",
          setup: async (page) => {
            await clickButtonByText(page, "Nueva Materia");
            await delay(800);
          },
        },
        {
          label: "Formulario: Editar Materia",
          desc: "El botón de lápiz en la columna Acciones permite modificar nombre, código, créditos, prerrequisitos y arancel (el primer ícono abre Temario, no editar).",
          setup: async (page) => {
            await page.evaluate(() => {
              const edit = document.querySelector('tbody tr button[title="Editar"]');
              if (edit) edit.click();
            });
            await delay(800);
          },
        },
        {
          label: "Diálogo: Temario de la materia",
          desc: "El primer botón del grupo de acciones (ícono de libro) abre el diálogo para definir el temario oficial: lista ordenada de temas del plan de curso (reordenar, agregar, eliminar).",
          setup: async (page) => {
            await page.evaluate(() => {
              const row = document.querySelector("tbody tr");
              if (!row) return;
              const lastCell = row.querySelector("td:last-child");
              if (!lastCell) return;
              const buttons = lastCell.querySelectorAll("button");
              if (buttons[0]) buttons[0].click();
            });
            await delay(900);
          },
        },
      ],
    },
    {
      route: "/periodos",
      label: "Períodos Académicos",
      desc: "Gestión de períodos semestrales con fechas de inicio y fin. Solo un período puede estar activo a la vez.",
      extras: [
        {
          label: "Formulario: Nuevo Período",
          desc: "Diálogo para crear un período académico con nombre, fechas y configuración de inscripciones abiertas o cerradas.",
          setup: async (page) => {
            await clickButtonByText(page, "Nuevo Período");
            await delay(800);
          },
        },
        {
          label: "Formulario: Editar Período",
          desc: "El botón de lápiz en la fila abre el diálogo con los datos del período precargados para modificar nombre, fechas e indicador de inscripciones abiertas.",
          setup: async (page) => {
            await clickFirstRowButton(page, 0);
            await delay(800);
          },
        },
      ],
    },
    {
      route: "/aulas",
      label: "Aulas",
      desc: "Registro de salones y laboratorios con capacidad máxima y edificio de ubicación.",
      extras: [
        {
          label: "Formulario: Nueva Aula",
          desc: "Formulario para registrar un espacio físico indicando nombre, edificio y capacidad máxima de estudiantes.",
          setup: async (page) => {
            await clickButtonByText(page, "Nueva Aula");
            await delay(800);
          },
        },
        {
          label: "Formulario: Editar Aula",
          desc: "El botón de lápiz permite actualizar nombre, edificio y capacidad de un aula o laboratorio existente. El segundo botón activa o desactiva el espacio.",
          setup: async (page) => {
            await clickFirstRowButton(page, 0);
            await delay(800);
          },
        },
      ],
    },
    {
      route: "/grupos",
      label: "Grupos",
      desc: "Grupos de clase que vinculan materia, período, aula y docente con un cupo máximo de estudiantes.",
      extras: [
        {
          label: "Formulario: Nuevo Grupo",
          desc: "Diálogo para crear un grupo asignando materia, período académico, docente, aula y cupo máximo.",
          setup: async (page) => {
            await clickButtonByText(page, "Nuevo Grupo");
            await delay(800);
          },
        },
        {
          label: "Formulario: Editar Grupo",
          desc: "El botón de lápiz en la fila permite modificar el código y el cupo máximo de un grupo existente.",
          setup: async (page) => {
            await clickFirstRowButton(page, 0);
            await delay(800);
          },
        },
      ],
    },
    {
      route: "/inscripciones",
      label: "Inscripciones",
      desc: "Gestión global de inscripciones por período. Permite consultar las materias de cada alumno y realizar inscripciones manuales.",
      // Page shows an empty period dropdown until one is selected — pick the first real period (index 1, skipping the placeholder).
      setup: async (page) => {
        await selectMuiOptionAt(page, 0, 1);
        await delay(800);
      },
      extras: [
        {
          label: "Formulario: Inscribir Estudiante",
          desc: "Diálogo para inscribir manualmente a un estudiante en un período académico seleccionando los grupos disponibles.",
          setup: async (page) => {
            await selectMuiOptionAt(page, 0, 1);
            await delay(800);
            await clickButtonByText(page, "Inscribir Estudiante");
            await delay(800);
          },
        },
      ],
    },
    {
      route: "/evaluaciones",
      label: "Evaluaciones",
      desc: "Tipos de evaluación configurados por grupo (exámenes, tareas, proyectos) con su ponderación porcentual. La suma debe igualar el peso máximo configurado.",
      // Page shows only the group dropdown until a group is selected.
      setup: async (page) => {
        await selectFirstMuiOption(page, 0);
        await delay(600);
      },
      extras: [
        {
          label: "Formulario: Nueva Evaluación",
          desc: "Formulario para definir una evaluación en un grupo: nombre, tipo, ponderación y fecha de aplicación.",
          setup: async (page) => {
            await selectFirstMuiOption(page, 0);
            await clickButtonByText(page, "Nueva Evaluación");
            await delay(800);
          },
        },
        {
          label: "Formulario: Editar Evaluación",
          desc: "El botón de lápiz en cada fila de la lista abre el diálogo con los datos de la evaluación precargados para modificar nombre, tipo, peso y fecha.",
          setup: async (page) => {
            await selectFirstMuiOption(page, 0);
            await delay(400);
            await clickFirstRowButton(page, 0);
            await delay(800);
          },
        },
      ],
    },
    {
      route: "/calificaciones",
      label: "Calificaciones",
      desc: "Captura y consulta de calificaciones. Seleccione un grupo y una evaluación para ingresar o actualizar las notas de los estudiantes.",
      // Page shows only the group dropdown until a group is selected.
      setup: async (page) => {
        await selectFirstMuiOption(page, 0);
        await delay(600);
      },
    },
    {
      route: "/contenido",
      label: "Contenido de Grupos",
      desc: "Temas y materiales de aprendizaje organizados por grupo y semana del período. Los temas se agrupan bajo encabezados 'Semana N — DD mmm – DD mmm' con rango de fechas calculado automáticamente desde el inicio del período. Cada material muestra su fecha de publicación. Al crear un nuevo grupo para la misma materia, el contenido del grupo anterior se copia automáticamente.",
      setup: async (page) => {
        await selectFirstMuiOption(page, 0);
        await delay(800);
      },
      extras: [
        {
          label: "Formulario: Nuevo Tema",
          desc: "Diálogo para crear un tema con título, descripción, número de semana del período y orden de aparición dentro de la semana. El número de semana determina bajo qué encabezado de fecha aparece el tema.",
          setup: async (page) => {
            await selectFirstMuiOption(page, 0);
            await delay(400);
            await clickButtonByText(page, "Nuevo Tema");
            await delay(800);
          },
        },
        {
          label: "Formulario: Editar Tema",
          desc: "El ícono de lápiz en el encabezado del acordeón abre el diálogo para modificar título, descripción, semana y orden del tema.",
          setup: async (page) => {
            await selectFirstMuiOption(page, 0);
            await delay(600);
            await page.evaluate(() => {
              const btn = document.querySelector('button[title="Editar tema"]');
              if (btn) btn.click();
            });
            await delay(800);
          },
        },
        {
          label: "Formulario: Agregar Material",
          desc: "Dentro de cada tema expandido, el botón Agregar Material abre un diálogo para adjuntar un recurso con título, tipo (enlace, texto o referencia) y contenido. La fecha de publicación se registra automáticamente.",
          setup: async (page) => {
            await selectFirstMuiOption(page, 0);
            await delay(600);
            await clickButtonByText(page, "Agregar Material");
            await delay(800);
          },
        },
        {
          label: "Formulario: Editar Material",
          desc: "El ícono de lápiz junto a cada material permite modificar título, tipo y contenido del recurso.",
          setup: async (page) => {
            await selectFirstMuiOption(page, 0);
            await delay(600);
            await page.evaluate(() => {
              const btn = document.querySelector('button[title="Editar"]');
              if (btn) btn.click();
            });
            await delay(800);
          },
        },
      ],
    },
    {
      route: "/anuncios",
      label: "Anuncios",
      desc: "Anuncios institucionales y de grupo con prioridad y fecha de expiración. Visibles para los estudiantes del grupo correspondiente.",
      extras: [
        {
          label: "Formulario: Nuevo Anuncio",
          desc: "Formulario para publicar un anuncio indicando título, contenido, audiencia (todos, carrera o grupo), prioridad y fecha de vencimiento.",
          setup: async (page) => {
            await clickButtonByText(page, "Nuevo Anuncio");
            await delay(800);
          },
        },
        {
          label: "Formulario: Editar Anuncio",
          desc: "El botón de lápiz en cada fila abre el mismo formulario con los datos del anuncio precargados para modificar su contenido, audiencia o fecha de expiración.",
          setup: async (page) => {
            await clickFirstRowButton(page, 0);
            await delay(800);
          },
        },
      ],
    },
    {
      route: "/solicitudes-registro",
      label: "Solicitudes de Registro",
      desc: "Cola de estudiantes que se registraron desde el portal público y esperan aprobación. Muestra nombre, correo, carrera solicitada y fecha de solicitud. El administrador revisa la documentación escaneada cargada en el registro antes de activar la cuenta; Aprobar activa la cuenta y el rol de estudiante; Rechazar elimina el registro. El cargo de inscripción al período se genera cuando el estudiante se inscribe por primera vez a un grupo en ese período (no al aprobar la solicitud).",
      extras: [
        {
          label: "Diálogo: Rechazar Solicitud",
          desc: "Al hacer clic en el ícono de cancelación se abre un diálogo de confirmación con el nombre del estudiante y la carrera antes de proceder al rechazo.",
          setup: async (page) => {
            // Click the reject (cancel) icon on the first row if it exists
            await page.evaluate(() => {
              const row = document.querySelector("tbody tr");
              if (!row) return;
              const buttons = Array.from(row.querySelectorAll("button"));
              // reject button is index 1 (after approve)
              if (buttons[1]) buttons[1].click();
            });
            await delay(800);
          },
        },
      ],
    },
    {
      route: "/certifications",
      label: "Certificaciones",
      desc: "Gestión de certificados digitales. Las certificaciones de terminación se emiten automáticamente al completar todas las materias obligatorias.",
      extras: [
        {
          label: "Tab: Certificaciones Emitidas",
          desc: "Lista de todos los certificados emitidos con estado, código de verificación y acciones para revocar o compartir el enlace.",
          setup: async (page) => {
            await clickTabByLabel(page, "Emitidas");
            await delay(600);
          },
        },
        {
          label: "Tab: Certificado Digital",
          desc: "Vista previa del certificado digital con navegación entre certificados, opción de descarga en PDF y enlace de verificación pública.",
          setup: async (page) => {
            await clickTabByLabel(page, "Certificado Digital");
            await delay(800);
          },
        },
        {
          label: "Tab: Validación por Terceros",
          desc: "Herramienta interna para verificar la autenticidad de un certificado ingresando su código de verificación UUID.",
          setup: async (page) => {
            await clickTabByLabel(page, "Validación");
            await delay(600);
          },
        },
        {
          label: "Formulario: Agregar Criterio",
          desc: "Diálogo para configurar los criterios de elegibilidad de un tipo de certificado: calificación mínima, vigencia y créditos requeridos.",
          setup: async (page) => {
            await clickButtonByText(page, "Agregar Criterio");
            await delay(800);
          },
        },
      ],
    },
    {
      route: "/auditoria",
      label: "Auditoría",
      desc: "Registro inmutable de todas las operaciones del sistema: quién realizó cada acción, sobre qué entidad y cuándo.",
      extras: [
        {
          label: "Filtro por Entidad",
          desc: "El selector Filtrar por Entidad permite acotar el log a un tipo específico: usuario, estudiante, profesor, carrera, materia, grupo, inscripción, evaluación, calificación, certificación, pago o configuración.",
          setup: async (page) => {
            await selectFirstMuiOption(page, 0);
            await delay(1200); // wait for filtered results to render
          },
        },
      ],
    },
    {
      route: "/configuracion",
      label: "Configuración del Sistema",
      desc: "Parámetros globales editables: calificación mínima aprobatoria, máximo de materias por inscripción, peso máximo de evaluaciones, umbral de riesgo académico, costo por crédito (base para matrícula mensual cuando la materia no tiene arancel propio: créditos × costo por crédito), cuota de inscripción por período, ciclos por año (define cuántas mensualidades tiene el período: 12÷ciclos), máximo de créditos por materia en catálogo, y firmas digitales para certificados PDF.",
    },
    {
      route: "/calendario",
      label: "Calendario Académico",
      desc: "Eventos del calendario institucional: días festivos, semanas de exámenes, fechas límite de inscripción y actividades especiales.",
      extras: [
        {
          label: "Formulario: Nuevo Evento",
          desc: "Diálogo para registrar un evento en el calendario académico con título, descripción, tipo (festivo, semana de exámenes, fecha límite u otro) y rango de fechas.",
          setup: async (page) => {
            await clickButtonByText(page, "Nuevo Evento");
            await delay(800);
          },
        },
        {
          label: "Formulario: Editar Evento",
          desc: "El botón de lápiz en la fila del evento abre el mismo diálogo con los datos precargados para modificar cualquier campo.",
          setup: async (page) => {
            await clickFirstRowButton(page, 0);
            await delay(800);
          },
        },
      ],
    },
    {
      route: "/pagos",
      label: "Pagos y Finanzas",
      desc: "Gestión de conceptos de cobro y cargos a estudiantes. Permite definir conceptos y asignar cargos individuales o grupales. La cuota de inscripción del período se crea en la primera inscripción a grupo (monto en Configuración); tras pagarla (o si la inscripción está en 0), el sistema genera mensualidades «Mensualidad académica» que suman la matrícula del período por materias inscritas (arancel o créditos × costo por crédito), fraccionada según los ciclos por año configurados.",
      extras: [
        {
          label: "Formulario: Nuevo Concepto de Cobro",
          desc: "Diálogo para crear un concepto de pago institucional con nombre, monto y descripción.",
          setup: async (page) => {
            await clickButtonByText(page, "Nuevo Concepto");
            await delay(800);
          },
        },
        {
          label: "Tab: Cargos a Estudiantes",
          desc: "Pestaña para consultar y asignar cargos individuales a estudiantes según los conceptos de cobro definidos.",
          setup: async (page) => {
            await clickTabByLabel(page, "Cargos a Estudiantes");
            await delay(600);
          },
        },
        {
          label: "Formulario: Asignar Cargo",
          desc: "Diálogo para asignar un cargo de pago a un estudiante específico seleccionando el concepto y el monto.",
          setup: async (page) => {
            await clickTabByLabel(page, "Cargos a Estudiantes");
            await delay(600);
            await clickButtonByText(page, "Asignar Cargo");
            await delay(800);
          },
        },
      ],
    },
    {
      route: "/reportes",
      label: "Reportes",
      desc: "Reportes estadísticos con gráficas interactivas: inscripciones por período, tasas de aprobación, tendencias de promedio y listado de alumnos en riesgo académico.",
    },
    {
      route: "/academic-history",
      label: "Historial Académico",
      desc: "Historial académico de cualquier estudiante con calificaciones finales, créditos acumulados y promedio general ponderado. El administrador puede seleccionar cualquier alumno desde el selector superior.",
      extras: [
        {
          label: "Tab: Materias Cursadas",
          desc: "Vista de tarjetas con todas las asignaturas aprobadas por el alumno, mostrando créditos y calificación final de cada una.",
          setup: async (page) => {
            await clickTabByLabel(page, "Materias Cursadas");
            await delay(600);
          },
        },
        {
          label: "Tab: Aprobadas / Reprobadas",
          desc: "Columnas comparativas de materias aprobadas (izquierda) y reprobadas (derecha) con calificaciones.",
          setup: async (page) => {
            await clickTabByLabel(page, "Aprobadas");
            await delay(600);
          },
        },
        {
          label: "Tab: Promedios por Período",
          desc: "Tabla y barras de progreso con el promedio ponderado del alumno en cada período académico cursado.",
          setup: async (page) => {
            await clickTabByLabel(page, "Promedios");
            await delay(600);
          },
        },
        {
          label: "Tab: Estado Académico",
          desc: "Tarjeta de resumen del estado académico actual: estado, créditos acumulados, promedio general y checklist de criterios de graduación.",
          setup: async (page) => {
            await clickTabByLabel(page, "Estado");
            await delay(600);
          },
        },
      ],
    },
  ],

  TEACHER: [
    {
      route: "/dashboard",
      label: "Dashboard",
      desc: "Panel del docente con estadísticas de grupos y estudiantes, widget de próximas fechas límite de evaluaciones (próximos 14 días con contador de entregas por evaluación) y cuadrícula de grupos asignados con acceso directo a cada detalle.",
    },
    {
      route: "/mis-grupos",
      label: "Mis Grupos",
      desc: "Lista de todos los grupos asignados al docente con código, materia, período y ocupación de cupos. Hacer clic en cualquier fila navega a la página de detalle del grupo.",
    },
    {
      // Navigate to /mis-grupos and click the first row to reach the detail page.
      route: "/mis-grupos",
      label: "Detalle de Grupo",
      desc: "Página central de gestión de un grupo con pestañas: Evaluaciones, Calificaciones, Contenido (materiales semana a semana) y Temario (seguimiento del plan de curso de la materia: marcar temas del temario como vistos, con semana y fecha). El encabezado muestra materia, código de grupo, período y número de estudiantes.",
      setup: async (page) => {
        await page.evaluate(() => {
          const row = document.querySelector("tbody tr");
          if (row) row.click();
        });
        await delay(1500);
      },
      extras: [
        {
          label: "Tab: Evaluaciones",
          desc: "Lista de evaluaciones del grupo con nombre, tipo, peso porcentual, puntaje máximo, fecha límite y contador de entregas. Permite crear, editar y eliminar evaluaciones.",
          setup: async (page) => {
            await page.evaluate(() => {
              const row = document.querySelector("tbody tr");
              if (row) row.click();
            });
            await delay(1500);
            await clickTabByLabel(page, "Evaluaciones");
            await delay(600);
          },
        },
        {
          label: "Formulario: Nueva Evaluación",
          desc: "Diálogo para crear una evaluación con nombre, tipo, peso porcentual, puntaje máximo y fecha límite opcionales.",
          setup: async (page) => {
            await page.evaluate(() => {
              const row = document.querySelector("tbody tr");
              if (row) row.click();
            });
            await delay(1500);
            await clickTabByLabel(page, "Evaluaciones");
            await delay(600);
            await clickButtonByText(page, "Nueva Evaluación");
            await delay(800);
          },
        },
        {
          label: "Diálogo: Ver Entregas y Calificar",
          desc: "Al hacer clic en el ícono de bandeja de una evaluación se abre este diálogo con el listado de todos los estudiantes inscritos, mostrando el contenido de cada entrega (texto, enlace o archivo) junto a un campo de calificación editable por estudiante. El botón 'Guardar Calificaciones' persiste todos los puntajes en un solo clic.",
          setup: async (page) => {
            await page.evaluate(() => {
              const row = document.querySelector("tbody tr");
              if (row) row.click();
            });
            await delay(1500);
            await clickTabByLabel(page, "Evaluaciones");
            await delay(600);
            await page.evaluate(() => {
              const btn = document.querySelector('[data-testid="InboxIcon"]')?.closest("button");
              if (btn) btn.click();
            });
            await delay(1000);
          },
        },
        {
          label: "Tab: Calificaciones",
          desc: "Cuadrícula editable que cruza estudiantes inscritos con todas las evaluaciones del grupo. El docente ingresa o corrige puntajes directamente en las celdas y guarda con el botón 'Guardar Todo'.",
          setup: async (page) => {
            await page.evaluate(() => {
              const row = document.querySelector("tbody tr");
              if (row) row.click();
            });
            await delay(1500);
            await clickTabByLabel(page, "Calificaciones");
            await delay(800);
          },
        },
        {
          label: "Tab: Contenido",
          desc: "Organizador de temas del grupo. El docente crea temas con título, descripción y orden, y agrega materiales de tipo texto, enlace o referencia de archivo a cada tema expandible.",
          setup: async (page) => {
            await page.evaluate(() => {
              const row = document.querySelector("tbody tr");
              if (row) row.click();
            });
            await delay(1500);
            await clickTabByLabel(page, "Contenido");
            await delay(600);
          },
        },
        {
          label: "Tab: Temario",
          desc: "Sigue el plan de curso definido en la materia: marcar cada tema del temario como cubierto, con semana, fecha y notas. Complementa el Contenido (materiales) con el avance programático.",
          setup: async (page) => {
            await page.evaluate(() => {
              const row = document.querySelector("tbody tr");
              if (row) row.click();
            });
            await delay(1500);
            await clickTabByLabel(page, "Temario");
            await delay(600);
          },
        },
        {
          label: "Formulario: Nuevo Tema",
          desc: "Diálogo para crear un tema con título, descripción y número de orden, accesible desde la pestaña Contenido.",
          setup: async (page) => {
            await page.evaluate(() => {
              const row = document.querySelector("tbody tr");
              if (row) row.click();
            });
            await delay(1500);
            await clickTabByLabel(page, "Contenido");
            await delay(600);
            await clickButtonByText(page, "Nuevo Tema");
            await delay(800);
          },
        },
      ],
    },
    {
      route: "/anuncios",
      label: "Anuncios",
      desc: "Anuncios publicados para los grupos del docente. Permite crear comunicados con fecha de expiración y nivel de prioridad.",
      extras: [
        {
          label: "Formulario: Nuevo Anuncio",
          desc: "Formulario para redactar y publicar un anuncio dirigido a un grupo con prioridad normal o urgente.",
          setup: async (page) => {
            await clickButtonByText(page, "Nuevo Anuncio");
            await delay(800);
          },
        },
        {
          label: "Formulario: Editar Anuncio",
          desc: "El botón de lápiz permite modificar el título, contenido, audiencia o prioridad de un anuncio existente.",
          setup: async (page) => {
            await clickFirstRowButton(page, 0);
            await delay(800);
          },
        },
      ],
    },
  ],

  STUDENT: [
    {
      route: "/dashboard",
      label: "Dashboard",
      desc: "Resumen académico personal: materias inscritas, promedio general, materias aprobadas y estado académico. Incluye widget de próximas entregas (evaluaciones con fecha límite en los próximos 14 días con indicador de entregado/pendiente) y widget de anuncios recientes.",
    },
    {
      route: "/mi-inscripcion",
      label: "Mi Inscripción",
      desc: "Detalle de la inscripción activa con las materias inscritas, grupos asignados y estado de cada asignatura.",
    },
    {
      route: "/inscribir-materias",
      label: "Inscribir Materias",
      desc: "Proceso de auto-inscripción para el período activo. Muestra los grupos disponibles validando prerrequisitos y cupo. El estudiante selecciona y confirma las materias que desea cursar. La primera inscripción a un grupo en ese período genera en el sistema el cargo de inscripción semestral (concepto activo cuyo nombre contiene «inscripci»), visible en Mis pagos.",
    },
    {
      route: "/mis-calificaciones",
      label: "Mis Calificaciones",
      desc: "Vista de tarjetas con las materias del período activo. Cada tarjeta muestra el promedio ponderado actual y el número de evaluaciones calificadas. Hacer clic en una tarjeta abre el detalle de calificaciones de esa materia.",
      extras: [
        {
          label: "Detalle de Calificaciones por Materia",
          desc: "Al hacer clic en una tarjeta de materia se despliega la tabla con cada evaluación, su ponderación, el puntaje obtenido y el porcentaje calculado.",
          setup: async (page) => {
            // Click the first subject card to open the detail view
            await page.evaluate(() => {
              const card = document.querySelector(".MuiCardActionArea-root");
              if (card) card.click();
            });
            await delay(1000);
          },
        },
      ],
    },
    {
      route: "/mi-contenido",
      label: "Mi Contenido",
      desc: "Recursos académicos y temas publicados por los docentes de los grupos en que el estudiante está inscrito. Incluye la pestaña Temario (lectura) con el avance del plan de curso cuando la materia tiene temario definido. El acceso exige inscripción vigente y haber pagado la cuota de inscripción del período de ese grupo.",
      extras: [
        {
          label: "Contenido de una Materia",
          desc: "Al seleccionar una materia en el selector superior se muestran los temas con sus materiales expandibles (enlaces, textos, referencias).",
          setup: async (page) => {
            await selectFirstMuiOption(page, 0);
          },
        },
        {
          label: "Pestaña: Temario (progreso del plan)",
          desc: "Visible solo si la materia tiene temario: barra de progreso y lista de temas del plan marcados por el docente. Requiere haber elegido una materia en el selector.",
          setup: async (page) => {
            await selectFirstMuiOption(page, 0);
            await delay(500);
            await clickTabByLabel(page, "Temario");
            await delay(600);
          },
        },
      ],
    },
    {
      route: "/mis-pagos",
      label: "Mis Pagos",
      desc: "Estado de cuenta personal: conceptos de pago pendientes con fecha de vencimiento e historial de pagos realizados. Incluye la cuota de inscripción del período cuando corresponde (creada al inscribir el primer grupo) y otros cargos asignados por administración.",
      extras: [
        {
          label: "Formulario: Confirmar Pago",
          desc: "Al hacer clic en Pagar en un concepto pendiente se abre un diálogo de confirmación donde el estudiante elige el método de pago (tarjeta, transferencia o efectivo) antes de procesar el cobro.",
          setup: async (page) => {
            await clickButtonByText(page, "Pagar");
            await delay(800);
          },
        },
      ],
    },
    {
      route: "/academic-history",
      label: "Historial Académico",
      desc: "Historial académico personal completo con todas las materias cursadas, calificaciones finales y créditos acumulados.",
      extras: [
        {
          label: "Tab: Materias Cursadas",
          desc: "Tarjetas con todas las asignaturas aprobadas: nombre, créditos y calificación final.",
          setup: async (page) => {
            await clickTabByLabel(page, "Materias Cursadas");
            await delay(600);
          },
        },
        {
          label: "Tab: Aprobadas / Reprobadas",
          desc: "Vista comparativa de materias aprobadas vs. reprobadas con sus calificaciones finales.",
          setup: async (page) => {
            await clickTabByLabel(page, "Aprobadas");
            await delay(600);
          },
        },
        {
          label: "Tab: Promedios por Período",
          desc: "Tabla y barras de progreso con el promedio ponderado del alumno en cada período académico cursado.",
          setup: async (page) => {
            await clickTabByLabel(page, "Promedios");
            await delay(600);
          },
        },
        {
          label: "Tab: Estado Académico",
          desc: "Tarjeta con el estado académico actual, créditos acumulados, promedio general y checklist de criterios de graduación.",
          setup: async (page) => {
            await clickTabByLabel(page, "Estado");
            await delay(600);
          },
        },
      ],
    },
    {
      route: "/certifications",
      label: "Mis Certificados",
      desc: "Certificados digitales emitidos al estudiante. La pestaña principal lista los certificados con su estado, código de verificación y fecha de vencimiento. Incluye acciones por fila para abrir el portal de verificación pública y descargar el PDF oficial.",
      extras: [
        {
          label: "Acciones de fila: Ver verificación y Descargar PDF",
          desc: "Cada fila de certificado muestra dos botones en la columna Acciones: el ícono de ojo (Ver verificación) abre el portal público de verificación en una nueva pestaña, y el ícono de descarga genera y descarga el PDF oficial del certificado.",
          setup: async (page) => {
            // Hover over the first certificate row to make action tooltips visible
            await page.evaluate(() => {
              const row = document.querySelector("tbody tr");
              if (row) row.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
            });
            await delay(600);
            // Also trigger tooltip on the first action button
            await page.evaluate(() => {
              const btn = document.querySelector("tbody tr td:last-child button");
              if (btn) btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
            });
            await delay(500);
          },
        },
        {
          label: "Tab: Criterios de Certificación",
          desc: "Tabla con los requisitos para ser elegible a cada tipo de certificado: carrera, calificación mínima, vigencia en meses y descripción.",
          setup: async (page) => {
            await clickTabByLabel(page, "Criterios");
            await delay(600);
          },
        },
        {
          label: "Tab: Validación de Certificados",
          desc: "Herramienta para verificar la autenticidad de cualquier certificado ingresando su código UUID de verificación.",
          setup: async (page) => {
            await clickTabByLabel(page, "Validación");
            await delay(600);
          },
        },
      ],
    },
  ],
};

// ─── HTTP helper ──────────────────────────────────────────────────────────────

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: parsed.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error (status ${res.statusCode}): ${data}`)); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function checkServer(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => { res.resume(); resolve(); })
      .on("error", () => reject(new Error(`Not reachable: ${url}\nRun 'npm run dev' first.`)));
  });
}

async function verifyServers() {
  console.log("Checking servers…");
  await checkServer(FRONTEND_URL);
  // Backend: any error other than "not reachable" means it's up
  await new Promise((resolve) => {
    http.get(`${BACKEND_URL}/api`, (res) => { res.resume(); resolve(); }).on("error", resolve);
  });
  console.log("Servers OK.");
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function getAuthTokens(credentials) {
  const body = JSON.stringify({ email: credentials.email, password: credentials.password });
  const data = await httpPost(`${BACKEND_URL}/api/auth/login`, body);
  if (!data.accessToken) throw new Error(`Login failed for ${credentials.email}: ${JSON.stringify(data)}`);

  const payload = JSON.parse(Buffer.from(data.accessToken.split(".")[1], "base64").toString());
  const authUser = {
    id: payload.sub,
    name: `${data.user.firstName} ${data.user.lastName}`,
    email: data.user.email,
    role: payload.roles?.[0] ?? data.user.userType,
    userType: data.user.userType,
  };
  return { accessToken: data.accessToken, refreshToken: data.refreshToken, authUser };
}

// ─── Navigation ───────────────────────────────────────────────────────────────

async function injectAuthAndNavigate(page, tokens, route) {
  // Go to /login first — a public page that never redirects.
  // This avoids the race condition where React mounts on "/" and redirects
  // to /login before we've had a chance to set localStorage.
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle0", timeout: 15000 });

  await page.evaluate(({ accessToken, refreshToken, authUser }) => {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("academicore_token", accessToken);
    localStorage.setItem("academicore_user", JSON.stringify(authUser));
  }, tokens);

  // Navigate to the target route — React remounts fresh and reads localStorage
  await page.goto(`${FRONTEND_URL}${route}`, { waitUntil: "networkidle0", timeout: 30000 });
}

// Only expand sidebar sections that are currently collapsed
async function expandAllSidebarSections(page, role = "ADMIN") {
  const labelsByRole = {
    ADMIN:   ["Gestión Académica", "Enseñanza", "Sistema"],
    STUDENT: ["Académico", "Mi Trayectoria"],
  };
  const labels = labelsByRole[role] ?? [];
  if (labels.length === 0) return;
  await page.evaluate((sectionLabels) => {
    const buttons = Array.from(document.querySelectorAll(".MuiListItemButton-root"));
    for (const label of sectionLabels) {
      const btn = buttons.find((el) => el.textContent.trim().startsWith(label));
      if (!btn) continue;
      // Walk siblings to find the Collapse element
      let sibling = btn.nextElementSibling;
      let tries = 0;
      while (sibling && !sibling.classList.contains("MuiCollapse-root") && tries < 4) {
        sibling = sibling.nextElementSibling;
        tries++;
      }
      // Only click if the Collapse is currently hidden (section is closed)
      if (sibling && sibling.classList.contains("MuiCollapse-hidden")) {
        btn.click();
      }
    }
  }, labels);
  await delay(700); // wait for Collapse animations
}

async function waitForPageContent(page, route) {
  const heavyRoutes = new Set(["/reportes", "/dashboard"]);
  if (heavyRoutes.has(route)) {
    // Dashboard uses both Skeletons (stats cards) and CircularProgress (other data)
    try { await page.waitForSelector(".MuiSkeleton-root", { hidden: true, timeout: 12000 }); }
    catch { /* no skeleton */ }
    try { await page.waitForSelector(".MuiCircularProgress-root", { hidden: true, timeout: 8000 }); }
    catch { /* no spinner */ }
    await delay(2500);
  } else {
    try { await page.waitForSelector(".MuiSkeleton-root", { hidden: true, timeout: 8000 }); }
    catch { /* no skeleton */ }
    await delay(1200);
  }
}

// ─── Screenshot ───────────────────────────────────────────────────────────────

async function captureTab(browser, role, tokens, route, setupFn, refreshTokensFn) {
  const tab = await browser.newPage();
  // Use a tall viewport so pages taller than 900px render fully.
  // clipHeight calculation will crop to actual content.
  await tab.setViewport({ width: 1440, height: 2000, deviceScaleFactor: 1 });
  try {
    await injectAuthAndNavigate(tab, tokens, route);

    // If we ended up at /login, refresh tokens and retry once
    if (tab.url().includes("/login")) {
      if (refreshTokensFn) {
        const fresh = await refreshTokensFn();
        await injectAuthAndNavigate(tab, fresh, route);
      }
      if (tab.url().includes("/login")) {
        return { screenshot: null, error: "Authentication failed — check credentials and JWT expiry" };
      }
    }

    await waitForPageContent(tab, route);
    // Expand sidebar AFTER page content settles so Dashboard re-renders don't
    // collapse sections that were expanded before the long skeleton/spinner wait.
    if (role === "ADMIN" || role === "STUDENT") await expandAllSidebarSections(tab, role);
    if (setupFn) {
      await setupFn(tab);
      // If setupFn opened a dialog, wait for it to be fully visible and its
      // content to render before measuring/screenshotting.
      try {
        await tab.waitForSelector(".MuiDialog-paper", { visible: true, timeout: 5000 });
        await delay(800); // allow form fields / async content inside dialog to load
      } catch {
        // No dialog was opened — that's fine.
      }
      // Shrink viewport to 900 px so the dialog is centred in a realistic frame
      // rather than floating near the middle of a 2000 px tall blank space.
      const hasDialog = await tab.evaluate(() => !!document.querySelector(".MuiDialog-paper"));
      if (hasDialog) {
        await tab.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
        await delay(200); // let MUI re-centre the dialog in the new viewport
      }
    }
    await tab.evaluate(() => window.scrollTo(0, 0));

    // Measure actual content height.
    // Primary strategy: ask the <main> element's content child (Box sx={{ p:3 }})
    // for its bounding rect bottom — this gives the true rendered content height
    // regardless of flex-grow stretching on parent containers.
    // For dialogs: crop just below the dialog paper (dialog is now centred in 900px).
    const clipInfo = await tab.evaluate(() => {
      // If a dialog is open, crop tight to it (leave 32 px breathing room below).
      const dialog = document.querySelector(".MuiDialog-paper");
      if (dialog) {
        const rect = dialog.getBoundingClientRect();
        // Include the full page from y=0 so the sidebar/header provide context,
        // but stop just below the dialog — no giant dead space beneath it.
        const height = Math.max(Math.ceil(rect.bottom) + 32, 300);
        return { y: 0, height };
      }

      // AppLayout renders:  <main> → <Toolbar/> (spacer) + <Box p={3}> (content)
      const main = document.querySelector("main");
      let contentHeight = 900;
      if (main && main.children.length >= 2) {
        const contentBox = main.children[1]; // the Box sx={{ p: 3 }}
        const bottom = contentBox.getBoundingClientRect().bottom;
        contentHeight = Math.ceil(bottom) + 16;
      }

      // 750 px floor: ensures the fully-expanded admin sidebar (all sections open)
      // is never clipped even on short-content pages like Anuncios (2 rows).
      return { y: 0, height: Math.max(contentHeight, 750) };
    });

    const screenshot = await tab.screenshot({
      type: "png", encoding: "base64",
      clip: { x: 0, y: clipInfo.y, width: 1440, height: clipInfo.height },
    });
    return { screenshot, error: null };
  } catch (err) {
    return { screenshot: null, error: err.message };
  } finally {
    await tab.close();
  }
}

async function capturePublicPage(browser, url) {
  const tab = await browser.newPage();
  await tab.setViewport({ width: 1440, height: 2000, deviceScaleFactor: 1 });
  try {
    await tab.goto(url, { waitUntil: "networkidle0", timeout: 20000 });
    await delay(1500);
    await tab.evaluate(() => window.scrollTo(0, 0));
    // Crop to actual rendered content
    const clipHeight = await tab.evaluate(() => {
      let maxBottom = 200;
      document.querySelectorAll("*").forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0 || rect.top < 0) return;
        if (rect.height >= 1800) return; // skip full-page containers
        if (rect.bottom > maxBottom) maxBottom = rect.bottom;
      });
      return Math.min(Math.ceil(maxBottom) + 32, 2000);
    });
    const screenshot = await tab.screenshot({
      type: "png", encoding: "base64",
      clip: { x: 0, y: 0, width: 1440, height: clipHeight },
    });
    return { screenshot, error: null };
  } catch (err) {
    return { screenshot: null, error: err.message };
  } finally {
    await tab.close();
  }
}

async function captureRolePages(browser, role, credentials, pages) {
  console.log(`\n[${role}] Logging in…`);
  let tokens = await getAuthTokens(credentials);
  console.log(`[${role}] Authenticated as ${tokens.authUser.name}`);

  // Always re-fetches a fresh token — called automatically on any /login redirect
  const refreshTokens = async () => {
    console.log(`[${role}] Refreshing tokens…`);
    tokens = await getAuthTokens(credentials);
    return tokens;
  };

  const MAX_RETRIES = 3;

  const capture = async (route, setupFn, label) => {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const result = await captureTab(browser, role, tokens, route, setupFn, refreshTokens);
      if (!result.error) return result;
      if (attempt < MAX_RETRIES) {
        console.log(`  ✗ attempt ${attempt} failed (${result.error}) — retrying in ${attempt}s…`);
        await delay(attempt * 1000);
        await refreshTokens();
      } else {
        console.log(`  ✗ all ${MAX_RETRIES} attempts failed for [${label}]: ${result.error}`);
        return result;
      }
    }
  };

  const results = [];
  for (const pageInfo of pages) {
    console.log(`[${role}] ${pageInfo.route}`);

    const main = await capture(pageInfo.route, pageInfo.setup || null, pageInfo.label);
    console.log(`  main → ${main.error ? "✗ " + main.error : "✓"}`);

    const capturedExtras = [];
    if (pageInfo.extras) {
      for (const extra of pageInfo.extras) {
        const result = await capture(pageInfo.route, extra.setup, extra.label);
        console.log(`  extra [${extra.label}] → ${result.error ? "✗ " + result.error : "✓"}`);
        capturedExtras.push({ label: extra.label, desc: extra.desc, ...result });
      }
    }

    results.push({ ...pageInfo, ...main, extras: capturedExtras });
  }
  return results;
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

function buildHtmlDocument({ adminPages, teacherPages, studentPages, verifyPage, registerPage }) {
  const date = new Date().toLocaleDateString("es-MX", {
    year: "numeric", month: "long", day: "numeric",
  });

  const slugify = (role, route) =>
    `${role.toLowerCase()}-${route.replace(/[^a-z0-9]/gi, "-").replace(/-+/g, "-")}`;

  const img = (screenshot, alt) =>
    screenshot
      ? `<img class="screenshot" src="data:image/png;base64,${screenshot}" alt="${alt}" />`
      : `<div class="error-notice">⚠ No se pudo capturar esta pantalla.</div>`;

  const tocSection = (role, label, color, pages) => `
    <div class="toc-role">
      <div class="toc-role-header" style="color:${color}">${label}</div>
      <ol>
        ${pages.map((p) =>
          `<li><a href="#${slugify(role, p.route)}">${p.label}</a>${
            p.extras?.length ? `<ul>${p.extras.map((e) => `<li>${e.label}</li>`).join("")}</ul>` : ""
          }</li>`
        ).join("")}
      </ol>
    </div>`;

  const pageEntry = (role, p) => {
    const id = slugify(role, p.route);
    const extrasHtml = (p.extras || []).map((e) => `
      <div class="extra-entry">
        <div class="extra-header">
          <span class="extra-icon">↳</span>
          <h4>${e.label}</h4>
        </div>
        <p class="description extra-desc">${e.desc}</p>
        ${img(e.screenshot, e.label)}
      </div>`).join("");

    return `
      <div class="page-entry" id="${id}">
        <div class="page-entry-header">
          <h3>${p.label}</h3>
          <span class="route-badge">${p.route}</span>
        </div>
        <p class="description">${p.desc}</p>
        ${img(p.screenshot, p.label)}
        ${extrasHtml}
      </div>`;
  };

  const roleSection = (role, label, gradient, pages) => `
    <div class="role-section">
      <div class="role-header" style="background:${gradient}">
        <div class="role-header-inner">
          <h2>${label}</h2>
          <span class="page-count">${pages.length} pantallas · ${pages.reduce((s, p) => s + (p.extras?.length || 0), 0)} extras</span>
        </div>
      </div>
      <div class="role-pages">
        ${pages.map((p) => pageEntry(role, p)).join("")}
      </div>
    </div>`;

  const publicSection = verifyPage || registerPage ? `
    <div class="role-section" style="page-break-before: always; break-before: page;">
      <div class="role-header" style="background:linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)">
        <div class="role-header-inner">
          <h2>Acceso público</h2>
          <span class="page-count">Sin autenticación requerida</span>
        </div>
      </div>
      <div class="role-pages">
        <div id="public-registro" style="margin-bottom:36px; padding-bottom:36px; border-bottom:1px solid #f1f5f9;">
          <div class="page-entry-header">
            <h3>Autoregistro de estudiante</h3>
            <span class="route-badge">/registro</span>
          </div>
          <p class="description">Formulario público para crear solicitud de cuenta (datos personales y carrera). El flujo puede incluir la carga de documentación escaneada requerida según política institucional; las solicitudes quedan pendientes hasta revisión en <strong>Solicitudes de Registro</strong>.</p>
          ${img(registerPage?.screenshot, "Autoregistro")}
          ${registerPage?.error ? `<div class="error-notice">⚠ Captura: ${registerPage.error}</div>` : ""}
        </div>
        <div id="public-verify">
          <div class="page-entry-header">
            <h3>Portal de Verificación de Certificados</h3>
            <span class="route-badge">/verify/:codigo</span>
          </div>
          <p class="description">Página pública accesible sin iniciar sesión. Cualquier persona (empleadores, instituciones) puede verificar la autenticidad de un certificado ingresando la URL <code>/verify/&lt;codigo&gt;</code> o escaneando el código QR del documento PDF. Muestra el nombre del estudiante, tipo de certificado, fecha de emisión, estado (activo/revocado/vencido) y fecha de vencimiento.</p>
          ${img(verifyPage?.screenshot, "Portal de verificación pública")}
          ${verifyPage?.error ? `<div class="error-notice">⚠ Captura: ${verifyPage.error}</div>` : ""}
        </div>
      </div>
    </div>` : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Academicore — Manual de Usuario</title>
  <style>
    @page { size: A4 landscape; margin: 12mm 18mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; background: #fff; font-size: 13px; line-height: 1.5; }

    /* Cover */
    .cover { page-break-after: always; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; text-align: center; padding: 40px; }
    .cover-logo { width: 80px; height: 80px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 800; color: white; margin-bottom: 24px; box-shadow: 0 8px 32px rgba(99,102,241,0.4); }
    .cover h1 { font-size: 48px; font-weight: 800; letter-spacing: 6px; text-transform: uppercase; margin-bottom: 8px; }
    .cover-subtitle { font-size: 20px; font-weight: 300; letter-spacing: 3px; text-transform: uppercase; color: #94a3b8; margin-bottom: 32px; }
    .cover-date { font-size: 14px; color: #64748b; margin-bottom: 40px; }
    .role-badges { display: flex; gap: 12px; }
    .badge { padding: 6px 18px; border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
    .badge.admin   { background: rgba(239,68,68,0.2);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }
    .badge.teacher { background: rgba(139,92,246,0.2); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.3); }
    .badge.student { background: rgba(34,197,94,0.2);  color: #86efac; border: 1px solid rgba(34,197,94,0.3); }
    .badge.public  { background: rgba(14,165,233,0.2); color: #7dd3fc; border: 1px solid rgba(14,165,233,0.3); }

    /* TOC */
    .toc { page-break-after: always; padding: 40px 48px; }
    .toc > h2 { font-size: 28px; font-weight: 700; margin-bottom: 32px; padding-bottom: 12px; border-bottom: 3px solid #e2e8f0; }
    .toc-roles { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px; }
    .toc-role-header { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .toc-role ol { padding-left: 18px; }
    .toc-role li { margin-bottom: 5px; font-size: 12px; }
    .toc-role ul { padding-left: 16px; list-style: '↳ '; margin-top: 3px; }
    .toc-role ul li { font-size: 11px; color: #64748b; margin-bottom: 2px; }
    .toc-role a { color: #6366f1; text-decoration: none; }

    /* Role sections */
    .role-section { page-break-before: always; }
    .role-header { color: white; break-after: avoid; page-break-after: avoid; }
    .role-header-inner { display: flex; align-items: center; justify-content: space-between; padding: 22px 40px; }
    .role-header h2 { font-size: 24px; font-weight: 700; }
    .page-count { background: rgba(255,255,255,0.2); padding: 4px 14px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .role-pages { padding: 20px 40px 28px; }

    /* Page entries */
    .page-entry { page-break-inside: avoid; margin-bottom: 36px; padding-bottom: 36px; border-bottom: 1px solid #f1f5f9; }
    .page-entry:last-child { border-bottom: none; }
    .page-entry-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 6px; }
    .page-entry h3 { font-size: 17px; font-weight: 700; }
    .route-badge { font-family: 'Courier New', monospace; font-size: 11px; color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; padding: 2px 8px; border-radius: 4px; }
    .description { color: #475569; margin-bottom: 12px; font-size: 13px; }
    .screenshot { width: 100%; max-height: 560px; object-fit: cover; object-position: top left; border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); display: block; }
    .error-notice { padding: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; color: #991b1b; font-size: 12px; }

    /* Extras */
    .extra-entry { margin-top: 16px; padding: 14px 18px; background: #f8fafc; border-left: 3px solid #6366f1; border-radius: 0 6px 6px 0; page-break-inside: avoid; }
    .extra-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .extra-icon { color: #6366f1; font-weight: 700; font-size: 16px; }
    .extra-entry h4 { font-size: 14px; font-weight: 600; color: #312e81; }
    .extra-desc { font-size: 12px; color: #64748b; }
    .extra-entry .screenshot { max-height: 520px; margin-top: 10px; }

    code { font-family: 'Courier New', monospace; font-size: 12px; background: #f1f5f9; padding: 1px 5px; border-radius: 3px; }
  </style>
</head>
<body>

  <div class="cover">
    <div class="cover-logo">A</div>
    <h1>Academicore</h1>
    <p class="cover-subtitle">Manual de Usuario</p>
    <p class="cover-date">Generado el ${date}</p>
    <div class="role-badges">
      <span class="badge admin">Administrador</span>
      <span class="badge teacher">Docente</span>
      <span class="badge student">Estudiante</span>
      <span class="badge public">Público</span>
    </div>
  </div>

  <div class="toc">
    <h2>Tabla de Contenidos</h2>
    <div class="toc-roles">
      ${tocSection("ADMIN",   "Administrador", "#ef4444", adminPages)}
      ${tocSection("TEACHER", "Docente",       "#8b5cf6", teacherPages)}
      ${tocSection("STUDENT", "Estudiante",    "#22c55e", studentPages)}
    </div>
    <div style="margin-top:28px;padding-top:22px;border-top:2px solid #e2e8f0;">
      <div class="toc-role-header" style="color:#0284c7">ACCESO PÚBLICO</div>
      <ol style="padding-left:18px;margin-top:8px;">
        <li><a href="#public-registro">Autoregistro (/registro)</a></li>
        <li><a href="#public-verify">Verificación de certificados (/verify)</a></li>
      </ol>
    </div>
  </div>

  ${roleSection("ADMIN",   "Administrador", "linear-gradient(135deg,#ef4444 0%,#b91c1c 100%)", adminPages)}
  ${roleSection("TEACHER", "Docente",       "linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%)", teacherPages)}
  ${roleSection("STUDENT", "Estudiante",    "linear-gradient(135deg,#22c55e 0%,#15803d 100%)", studentPages)}
  ${publicSection}

</body>
</html>`;
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

async function generatePdf(htmlContent, outputPath) {
  console.log("\nRendering PDF…");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    await page.evaluate(() =>
      Promise.all(Array.from(document.images).map((img) =>
        img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; })
      ))
    );
    await page.pdf({
      path: outputPath,
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "12mm", right: "18mm", bottom: "12mm", left: "18mm" },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:8px;color:#94a3b8;width:100%;text-align:center;font-family:sans-serif;">Academicore — Manual de Usuario</div>`,
      footerTemplate: `<div style="font-size:8px;color:#94a3b8;width:100%;text-align:right;padding-right:18mm;font-family:sans-serif;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
    });
  } finally {
    await browser.close();
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await verifyServers();

  const outDir = path.resolve(__dirname, "../../../manuals");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const adminPages   = await captureRolePages(browser, "ADMIN",   CREDENTIALS.ADMIN,   PAGES.ADMIN);
    const teacherPages = await captureRolePages(browser, "TEACHER", CREDENTIALS.TEACHER, PAGES.TEACHER);
    const studentPages = await captureRolePages(browser, "STUDENT", CREDENTIALS.STUDENT, PAGES.STUDENT);

    // Public pages (no auth)
    console.log("\n[PUBLIC] Capturing /registro…");
    const registerPage = await capturePublicPage(browser, `${FRONTEND_URL}/registro`);
    console.log(`  → ${registerPage.error ? "✗ " + registerPage.error : "✓"}`);

    console.log("\n[PUBLIC] Capturing /verify/:code…");
    const verifyPage = await capturePublicPage(
      browser,
      `${FRONTEND_URL}/verify/${SEED_VERIFICATION_CODE}`
    );
    console.log(`  → ${verifyPage.error ? "✗ " + verifyPage.error : "✓"}`);

    const allPages = [...adminPages, ...teacherPages, ...studentPages];
    const allExtras = allPages.flatMap((p) => p.extras || []);
    const failed =
      [...allPages, ...allExtras].filter((p) => p.error).length +
      (registerPage.error ? 1 : 0) +
      (verifyPage.error ? 1 : 0);
    const total = allPages.length + allExtras.length + 2; // +2 public: registro + verify
    console.log(`\nCaptures: ${total - failed}/${total} succeeded.`);

    const htmlContent = buildHtmlDocument({
      adminPages,
      teacherPages,
      studentPages,
      verifyPage,
      registerPage,
    });

    const htmlPath = path.join(outDir, "user-manual.html");
    fs.writeFileSync(htmlPath, htmlContent, "utf8");
    console.log(`HTML → ${htmlPath}`);

    const pdfPath = path.join(outDir, "user-manual.pdf");
    await generatePdf(htmlContent, pdfPath);
    console.log(`PDF  → ${pdfPath}`);

    console.log("\nDone!");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("\nFatal:", err.message);
  process.exit(1);
});
