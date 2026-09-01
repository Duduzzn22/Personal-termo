/**
 * Helpers de data/dia-da-semana para a agenda. Deliberadamente sem libs
 * externas: as datas da agenda são "datas de parede" (YYYY-MM-DD) e horários
 * (HH:mm) sem componente de timezone — evitamos `new Date(isoString)` puro,
 * que interpretaria a data como UTC e poderia mostrar o dia errado.
 */

const DEFAULT_TIMEZONE = process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || "America/Sao_Paulo";

export const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export const DIAS_SEMANA_ABREV = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

/** "YYYY-MM-DD" -> Date local (meia-noite local, sem deslocamento de timezone). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 0 = domingo ... 6 = sábado. */
export function weekdayOfISODate(iso: string): number {
  return parseISODate(iso).getDay();
}

export function addDaysISO(iso: string, delta: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + delta);
  return toISODate(date);
}

/** "Hoje" no timezone configurado do sistema — não no timezone do servidor. */
export function todayISO(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

export function isToday(iso: string): boolean {
  return iso === todayISO();
}

export function isTomorrow(iso: string): boolean {
  return iso === addDaysISO(todayISO(), 1);
}

export function isYesterday(iso: string): boolean {
  return iso === addDaysISO(todayISO(), -1);
}

/** "19:00:00" ou "19:00" -> "19:00" (sem conversão: é um horário de parede). */
export function formatTimeShort(value: string | null | undefined): string {
  if (!value) return "—";
  return value.slice(0, 5);
}

export function formatDateLongBR(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(
    parseISODate(iso)
  );
}

/** Rótulo amigável: "Hoje", "Amanhã", "Ontem" ou "Segunda-feira, 01/09/2026". */
export function relativeDayLabel(iso: string): string {
  if (isToday(iso)) return "Hoje";
  if (isTomorrow(iso)) return "Amanhã";
  if (isYesterday(iso)) return "Ontem";
  const weekday = DIAS_SEMANA[weekdayOfISODate(iso)];
  const date = parseISODate(iso);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${weekday}, ${dd}/${mm}/${date.getFullYear()}`;
}
