/**
 * Formatação no padrão brasileiro: datas DD/MM/AAAA, horários HH:mm e
 * valores em R$ 0.000,00. Timezone padrão: America/Sao_Paulo.
 */

const DEFAULT_TIMEZONE = process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || "America/Sao_Paulo";

export function formatCurrencyFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function parseCurrencyToCents(value: string): number {
  const normalized = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3},)/g, "")
    .replace(",", ".");
  const parsed = parseFloat(normalized);
  if (Number.isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function formatDateBR(value: string | Date | null | undefined): string {
  if (!value) return "—";

  // Datas SQL do tipo DATE chegam como YYYY-MM-DD. O construtor Date interpreta
  // esse formato como UTC e poderia exibir o dia anterior em America/Sao_Paulo.
  // Usar meio-dia local preserva a data civil original.
  const date =
    typeof value === "string"
      ? /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T12:00:00`)
        : new Date(value)
      : value;

  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: DEFAULT_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeBR(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: DEFAULT_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatTimeBR(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: DEFAULT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return "—";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return phone;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
