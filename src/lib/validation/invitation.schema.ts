import { z } from "zod";

export const invitationSchema = z.object({
  student_id: z.string().uuid("Selecione um aluno."),
  package_id: z.string().uuid("Selecione um pacote."),
  term_version_id: z.string().uuid("Selecione um termo publicado."),
  data_inicio: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  informacoes_adicionais: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  expires_in_days: z.coerce.number().int().positive().max(365).default(30),
});

export type InvitationInput = z.infer<typeof invitationSchema>;

export const acceptanceSchema = z.object({
  token: z.string().min(10),
  checkbox_confirmado: z.literal(true, {
    message: "É necessário marcar a confirmação de leitura para prosseguir.",
  }),
});

export type AcceptanceInput = z.infer<typeof acceptanceSchema>;
