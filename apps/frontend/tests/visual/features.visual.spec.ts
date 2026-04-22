import { test, expect } from "@playwright/test";
import { creds, login } from "./helpers/auth";

/**
 * Visual regression mapped to required product capabilities:
 *
 * 1. Prerequisites on courses + validation when enrolling in later courses
 * 2. Configure global cost per credit
 * 3. Configure per-course payment (fixed tuition amount vs credits × credit cost)
 * 4. Course syllabi (catalog) + tracking by the instructor in group Temario
 * 5. Scanned admission documents (admin review)
 */
test.describe("product features (visual)", () => {
  test("1 & 3 · Admin — subjects: catalog (prerequisites) + edit payment & prereqs", async ({
    page,
  }) => {
    await login(page, creds.admin.email, creds.admin.password);
    await page.goto("/materias");
    await expect(page.getByRole("heading", { name: "Materias" })).toBeVisible();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("admin-materias-catalog.png", { fullPage: true });

    const firstRow = page.locator("table tbody tr").first();
    await expect(firstRow).toBeVisible({ timeout: 30_000 });
    await firstRow.getByTitle("Editar").click();
    await expect(page.getByRole("dialog", { name: /editar materia/i })).toBeVisible();
    await expect(page.getByLabel(/prerrequisitos/i)).toBeVisible();
    await expect(page.getByLabel(/monto por tutoría/i)).toBeVisible();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("admin-materias-edit-prerequisites-payment.png", {
      fullPage: true,
    });
    await page.keyboard.press("Escape");
  });

  test("2 · Admin — configure cost per credit", async ({ page }) => {
    await login(page, creds.admin.email, creds.admin.password);
    await page.goto("/configuracion");
    await expect(page.getByRole("heading", { name: "Configuración del Sistema" })).toBeVisible();
    await expect(page.getByLabel(/costo por crédito/i)).toBeVisible();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("admin-configuracion-costos.png", { fullPage: true });
  });

  test("1 · Student — self-enrollment (prerequisite rules in UI)", async ({ page }) => {
    await login(page, creds.student.email, creds.student.password);
    await page.goto("/inscribir-materias");
    await expect(page.getByRole("heading", { name: /inscribir materias/i })).toBeVisible();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("student-inscribir-materias.png", { fullPage: true });
  });

  test("4 · Admin — course syllabus (topics on subject)", async ({ page }) => {
    await login(page, creds.admin.email, creds.admin.password);
    await page.goto("/materias");
    await expect(page.getByRole("heading", { name: "Materias" })).toBeVisible();
    await page.waitForLoadState("networkidle");
    const firstRow = page.locator("table tbody tr").first();
    await expect(firstRow).toBeVisible({ timeout: 30_000 });
    // Actions: Temario, Editar, Eliminar
    await firstRow.getByRole("button").nth(0).click();
    await expect(page.getByRole("heading", { name: /^Temario —/ })).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("admin-materias-syllabus.png", { fullPage: true });
    await page.keyboard.press("Escape");
  });

  test("4 · Instructor — group Temario (progress tracking)", async ({ page }) => {
    await login(page, creds.teacher.email, creds.teacher.password);
    await page.goto("/mis-grupos");
    await expect(page.getByRole("heading", { name: "Mis Grupos" })).toBeVisible();
    await page.waitForLoadState("networkidle");
    const table = page.locator("table tbody tr").first();
    await expect(table).toBeVisible({ timeout: 30_000 });
    await table.click();
    await page.waitForURL(/\/mis-grupos\/[a-f0-9-]+$/i);
    await page.getByRole("tab", { name: "Temario" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("teacher-grupo-temario.png", { fullPage: true });
  });

  test("5 · Admin — scanned admission documents", async ({ page }) => {
    await login(page, creds.admin.email, creds.admin.password);
    await page.goto("/solicitudes-registro");
    await expect(
      page.getByRole("heading", { name: "Solicitudes de Registro" }),
    ).toBeVisible();
    await page.waitForLoadState("networkidle");
    const docChip = page.getByRole("button", { name: /\d+\/\d+ aprobados/ }).first();
    if (await docChip.isVisible().catch(() => false)) {
      await docChip.click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("admin-admision-documentos-dialog.png", {
        fullPage: true,
      });
      await page.keyboard.press("Escape");
    } else {
      await expect(page).toHaveScreenshot("admin-solicitudes-registro.png", { fullPage: true });
    }
  });
});
