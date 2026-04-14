/** Prisma FeeStatus → etiquetas y colores de Chip (UI en español). */

export const FEE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  OVERDUE: "Vencido",
  CANCELLED: "Cancelado",
};

export type FeeStatusChipColor =
  | "warning"
  | "success"
  | "error"
  | "default";

export const FEE_STATUS_CHIP_COLORS: Record<string, FeeStatusChipColor> = {
  PENDING: "warning",
  PAID: "success",
  OVERDUE: "error",
  CANCELLED: "default",
};

export function feeStatusLabel(status: string): string {
  const key = (status ?? "").toString().trim().toUpperCase();
  return FEE_STATUS_LABELS[key] ?? status;
}

export function feeStatusChipColor(status: string): FeeStatusChipColor {
  const key = (status ?? "").toString().trim().toUpperCase();
  return FEE_STATUS_CHIP_COLORS[key] ?? "default";
}
