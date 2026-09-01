import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const scheduleSchema = z.object({
  dia_semana: z.coerce.number().int().min(0, "Selecione um dia da semana.").max(6, "Selecione um dia da semana."),
  horario: z.string().regex(/^\d{2}:\d{2}$/, "Informe um horário válido."),
  observacoes: optionalString,
});

export type ScheduleInput = z.infer<typeof scheduleSchema>;

export const avulsaSessionSchema = z.object({
  student_id: z.string().uuid("Selecione um aluno."),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."),
  horario: z.string().regex(/^\d{2}:\d{2}$/, "Informe um horário válido."),
  observacoes: optionalString,
});

export type AvulsaSessionInput = z.infer<typeof avulsaSessionSchema>;
