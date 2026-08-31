import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "slate" | "green" | "amber" | "red" | "blue";

const toneClasses: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "slate", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

const STATUS_TONE: Record<string, Tone> = {
  ativo: "green",
  aceito: "green",
  publicado: "green",
  inativo: "slate",
  arquivado: "slate",
  rascunho: "amber",
  pendente: "amber",
  nova_versao_pendente: "amber",
  expirado: "red",
  cancelado: "red",
  concluido: "blue",
};

const STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  aceito: "Aceito",
  publicado: "Publicado",
  inativo: "Inativo",
  arquivado: "Arquivado",
  rascunho: "Rascunho",
  pendente: "Aguardando",
  nova_versao_pendente: "Nova versão pendente",
  expirado: "Expirado",
  cancelado: "Cancelado",
  concluido: "Concluído",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "slate"}>{STATUS_LABEL[status] ?? status}</Badge>;
}
