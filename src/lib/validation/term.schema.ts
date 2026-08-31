import { z } from "zod";

export const termTemplateSchema = z.object({
  titulo: z.string().trim().min(3, "Informe o título do termo."),
  descricao: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export type TermTemplateInput = z.infer<typeof termTemplateSchema>;

export const termClauseSchema = z.object({
  titulo: z.string().trim().min(2, "Informe o título da cláusula."),
  conteudo: z.string().trim().min(5, "Informe o conteúdo da cláusula."),
  posicao: z.coerce.number().int().nonnegative().default(0),
  obrigatoria: z.boolean().default(true),
  ativo: z.boolean().default(true),
});

export type TermClauseInput = z.infer<typeof termClauseSchema>;

export const publishVersionSchema = z.object({
  versao: z
    .string()
    .trim()
    .regex(/^\d+\.\d+$/, "Use o formato X.Y, por exemplo 1.0."),
  exigir_novo_aceite: z.boolean().default(false),
  alunos_para_notificar: z.array(z.string().uuid()).default([]),
});

export type PublishVersionInput = z.infer<typeof publishVersionSchema>;
