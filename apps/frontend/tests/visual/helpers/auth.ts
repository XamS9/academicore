import type { Page } from "@playwright/test";

/** Seed / demo accounts (override with env for other environments). */
export const creds = {
  admin: {
    email: process.env.VISUAL_ADMIN_EMAIL ?? "admin@academicore.com",
    password: process.env.VISUAL_ADMIN_PASSWORD ?? "admin123",
  },
  teacher: {
    email: process.env.VISUAL_TEACHER_EMAIL ?? "prof.garcia@academicore.com",
    password: process.env.VISUAL_TEACHER_PASSWORD ?? "teacher123",
  },
  student: {
    email: process.env.VISUAL_STUDENT_EMAIL ?? "ana.garcia@academicore.com",
    password: process.env.VISUAL_STUDENT_PASSWORD ?? "student123",
  },
};

export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
}
