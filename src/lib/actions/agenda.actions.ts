"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { AgendaRepository } from "@/lib/repositories/agenda.repository";
import { AuditRepository } from "@/lib/repositories/audit.repository";
import { scheduleSchema, avulsaSessionSchema } from "@/lib/validation/agenda.schema";
import { DIAS_SEMANA, formatTimeShort } from "@/lib/utils/agenda";
import type { TrainingSessionStatus } from "@/types/database";

export interface AgendaActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

// ---- Horário fixo semanal (editável na aba do aluno) ----

export async function createScheduleAction(
  studentId: string,
  _prevState: AgendaActionState,
  formData: FormData
): Promise<AgendaActionState> {
  const parsed = scheduleSchema.safeParse({
    dia_semana: formData.get("dia_semana"),
    horario: formData.get("horario"),
    observacoes: formData.get("observacoes"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Verifique os campos destacados.", fieldErrors };
  }

  const { userId } = await requireTrainer();
  const db = await createClient();
  const agenda = new AgendaRepository(db);
  const audit = new AuditRepository(db);

  const schedule = await agenda.createSchedule(userId, {
    student_id: studentId,
    dia_semana: parsed.data.dia_semana,
    horario: parsed.data.horario,
    observacoes: parsed.data.observacoes ?? null,
    ativo: true,
  });
  await audit.log({
    trainer_id: userId,
    entity_type: "training_schedule",
    entity_id: schedule.id,
    event_type: "horario_treino_criado",
    description: `Horário fixo adicionado: ${DIAS_SEMANA[schedule.dia_semana]} às ${formatTimeShort(schedule.horario)}.`,
  });

  revalidatePath(`/alunos/${studentId}`);
  revalidatePath("/agenda");
  return { success: true };
}

export async function updateScheduleAction(
  scheduleId: string,
  studentId: string,
  _prevState: AgendaActionState,
  formData: FormData
): Promise<AgendaActionState> {
  const parsed = scheduleSchema.safeParse({
    dia_semana: formData.get("dia_semana"),
    horario: formData.get("horario"),
    observacoes: formData.get("observacoes"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Verifique os campos destacados.", fieldErrors };
  }

  const { userId } = await requireTrainer();
  const db = await createClient();
  const agenda = new AgendaRepository(db);
  const audit = new AuditRepository(db);

  const schedule = await agenda.updateSchedule(userId, scheduleId, {
    dia_semana: parsed.data.dia_semana,
    horario: parsed.data.horario,
    observacoes: parsed.data.observacoes ?? null,
  });
  await audit.log({
    trainer_id: userId,
    entity_type: "training_schedule",
    entity_id: schedule.id,
    event_type: "horario_treino_atualizado",
    description: `Horário fixo atualizado: ${DIAS_SEMANA[schedule.dia_semana]} às ${formatTimeShort(schedule.horario)}.`,
  });

  revalidatePath(`/alunos/${studentId}`);
  revalidatePath("/agenda");
  return { success: true };
}

export async function deleteScheduleAction(scheduleId: string, studentId: string) {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const agenda = new AgendaRepository(db);
  const audit = new AuditRepository(db);

  await agenda.deleteSchedule(userId, scheduleId);
  await audit.log({
    trainer_id: userId,
    entity_type: "training_schedule",
    entity_id: scheduleId,
    event_type: "horario_treino_removido",
    description: "Horário fixo removido.",
  });

  revalidatePath(`/alunos/${studentId}`);
  revalidatePath("/agenda");
}

// ---- Sessões concretas na agenda (avulsas ou exceções de uma data) ----

export async function createAvulsaSessionAction(
  _prevState: AgendaActionState,
  formData: FormData
): Promise<AgendaActionState> {
  const parsed = avulsaSessionSchema.safeParse({
    student_id: formData.get("student_id"),
    data: formData.get("data"),
    horario: formData.get("horario"),
    observacoes: formData.get("observacoes"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Verifique os campos destacados.", fieldErrors };
  }

  const { userId } = await requireTrainer();
  const db = await createClient();
  const agenda = new AgendaRepository(db);
  const audit = new AuditRepository(db);

  const session = await agenda.createSession(userId, {
    student_id: parsed.data.student_id,
    schedule_id: null,
    data: parsed.data.data,
    horario: parsed.data.horario,
    status: "agendado",
    observacoes: parsed.data.observacoes ?? null,
  });
  await audit.log({
    trainer_id: userId,
    entity_type: "training_session",
    entity_id: session.id,
    event_type: "sessao_treino_registrada",
    description: `Sessão avulsa marcada para ${session.data} às ${formatTimeShort(session.horario)}.`,
  });

  revalidatePath("/agenda");
  return { success: true };
}

/**
 * Aplica o estado desejado (horário + status) a uma ocorrência do dia. Usada
 * tanto para concluir/cancelar quanto para mudar o horário só daquele dia.
 * Quando a ocorrência ainda é apenas o padrão semanal "virtual" (nunca teve
 * exceção registrada), materializa a primeira linha em training_sessions.
 */
export async function upsertOccurrenceAction(input: {
  sessionId: string | null;
  scheduleId: string | null;
  studentId: string;
  data: string;
  horario: string;
  status: TrainingSessionStatus;
}) {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const agenda = new AgendaRepository(db);
  const audit = new AuditRepository(db);

  const session = input.sessionId
    ? await agenda.updateSession(userId, input.sessionId, {
        horario: input.horario,
        status: input.status,
      })
    : input.scheduleId
      ? await agenda.upsertSessionForSchedule(userId, {
          schedule_id: input.scheduleId,
          student_id: input.studentId,
          data: input.data,
          horario: input.horario,
          status: input.status,
        })
      : await agenda.createSession(userId, {
          student_id: input.studentId,
          schedule_id: null,
          data: input.data,
          horario: input.horario,
          status: input.status,
        });

  await audit.log({
    trainer_id: userId,
    entity_type: "training_session",
    entity_id: session.id,
    event_type: "sessao_treino_registrada",
    description: `Sessão de ${session.data} às ${formatTimeShort(session.horario)} marcada como "${input.status}".`,
  });

  revalidatePath("/agenda");
}

/** Remove uma sessão avulsa, ou reverte uma exceção recorrente para o horário/status padrão do dia. */
export async function deleteOccurrenceSessionAction(sessionId: string) {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const agenda = new AgendaRepository(db);
  const audit = new AuditRepository(db);

  await agenda.deleteSession(userId, sessionId);
  await audit.log({
    trainer_id: userId,
    entity_type: "training_session",
    entity_id: sessionId,
    event_type: "sessao_treino_removida",
    description: "Sessão removida da agenda.",
  });

  revalidatePath("/agenda");
}
