import type { Package, Student, TrainerProfile } from "@/types/database";
import { formatCurrencyFromCents, formatDateBR } from "./format";

export interface VariableContext {
  aluno: Pick<Student, "nome_completo" | "cpf" | "email">;
  personal: Pick<TrainerProfile, "nome_profissional" | "nome_empresa">;
  pacote: Pick<Package, "nome" | "quantidade_aulas" | "duracao_minutos" | "valor_centavos" | "validade_dias">;
  data_inicio: string | null;
}

/**
 * Resolve placeholders {{variavel}} dentro do texto de uma cláusula.
 * Variáveis suportadas: aluno_nome, personal_nome, pacote_nome,
 * quantidade_aulas, duracao_aula, valor_pacote, validade_pacote, data_inicio.
 */
export function resolveVariables(content: string, ctx: VariableContext): string {
  const replacements: Record<string, string> = {
    aluno_nome: ctx.aluno.nome_completo,
    personal_nome: ctx.personal.nome_profissional,
    pacote_nome: ctx.pacote.nome,
    quantidade_aulas: String(ctx.pacote.quantidade_aulas),
    duracao_aula: `${ctx.pacote.duracao_minutos} minutos`,
    valor_pacote: formatCurrencyFromCents(ctx.pacote.valor_centavos),
    validade_pacote: `${ctx.pacote.validade_dias} dias`,
    data_inicio: ctx.data_inicio ? formatDateBR(ctx.data_inicio) : "a combinar",
  };

  return content.replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (match, key: string) => {
    return key in replacements ? replacements[key] : match;
  });
}

export const AVAILABLE_VARIABLES: { key: string; label: string }[] = [
  { key: "aluno_nome", label: "Nome do aluno" },
  { key: "personal_nome", label: "Nome do personal" },
  { key: "pacote_nome", label: "Nome do pacote" },
  { key: "quantidade_aulas", label: "Quantidade de aulas" },
  { key: "duracao_aula", label: "Duração da aula" },
  { key: "valor_pacote", label: "Valor do pacote" },
  { key: "validade_pacote", label: "Validade do pacote" },
  { key: "data_inicio", label: "Data de início" },
];
