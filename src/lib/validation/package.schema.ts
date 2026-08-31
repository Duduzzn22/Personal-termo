import { z } from "zod";

export const packageSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do pacote."),
  descricao: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  quantidade_aulas: z.coerce.number().int().positive("Informe a quantidade de aulas."),
  duracao_minutos: z.coerce.number().int().positive("Informe a duração da aula em minutos."),
  valor_centavos: z.coerce.number().int().nonnegative("Informe um valor válido."),
  validade_dias: z.coerce.number().int().positive("Informe a validade em dias."),
  status: z.enum(["ativo", "inativo"]).default("ativo"),
  observacoes: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export type PackageInput = z.infer<typeof packageSchema>;
