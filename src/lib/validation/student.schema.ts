import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const studentSchema = z.object({
  nome_completo: z
    .string()
    .trim()
    .min(3, "Informe o nome completo do aluno."),
  cpf: optionalString.refine(
    (v) => !v || v.replace(/\D/g, "").length === 11,
    "CPF deve conter 11 dígitos."
  ),
  data_nascimento: optionalString,
  telefone: optionalString,
  whatsapp: optionalString,
  email: z
    .string()
    .trim()
    .email("E-mail inválido.")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  observacoes: optionalString,
  status: z.enum(["ativo", "inativo", "arquivado"]).default("ativo"),
});

export type StudentInput = z.infer<typeof studentSchema>;
