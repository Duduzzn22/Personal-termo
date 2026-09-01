import type { SupabaseClient } from "@supabase/supabase-js";
import { AgendaRepository } from "@/lib/repositories/agenda.repository";
import { weekdayOfISODate } from "@/lib/utils/agenda";
import type { TrainingSessionStatus } from "@/types/database";

/**
 * Uma ocorrência concreta da agenda num dia: o resultado de mesclar o padrão
 * semanal fixo (training_schedules) com as exceções/avulsas daquela data
 * específica (training_sessions). É o que a página /agenda renderiza.
 */
export interface AgendaOccurrence {
  /** Identificador estável para a UI (key do React). */
  key: string;
  /** Preenchido quando já existe uma linha própria em training_sessions. */
  sessionId: string | null;
  /** Preenchido quando a ocorrência nasce de um horário fixo semanal. */
  scheduleId: string | null;
  studentId: string;
  studentName: string;
  data: string;
  horario: string;
  status: TrainingSessionStatus;
  origem: "recorrente" | "avulso";
  /** true quando uma sessão já sobrescreveu o horário/status padrão desse dia. */
  ajustado: boolean;
  observacoes: string | null;
}

export async function getAgendaForDate(
  db: SupabaseClient,
  trainerId: string,
  data: string
): Promise<AgendaOccurrence[]> {
  const repo = new AgendaRepository(db);
  const weekday = weekdayOfISODate(data);

  const [schedules, sessions] = await Promise.all([
    repo.listSchedulesByWeekday(trainerId, weekday),
    repo.listSessionsByDate(trainerId, data),
  ]);

  const sessionsBySchedule = new Map<string, (typeof sessions)[number]>();
  const avulsas: typeof sessions = [];
  for (const s of sessions) {
    if (s.schedule_id) sessionsBySchedule.set(s.schedule_id, s);
    else avulsas.push(s);
  }

  const occurrences: AgendaOccurrence[] = [];

  for (const schedule of schedules) {
    const override = sessionsBySchedule.get(schedule.id);
    if (override) {
      occurrences.push({
        key: override.id,
        sessionId: override.id,
        scheduleId: schedule.id,
        studentId: schedule.student_id,
        studentName: schedule.students?.nome_completo ?? override.students?.nome_completo ?? "Aluno",
        data,
        horario: override.horario,
        status: override.status,
        origem: "recorrente",
        ajustado: true,
        observacoes: override.observacoes ?? schedule.observacoes,
      });
    } else {
      occurrences.push({
        key: `virtual-${schedule.id}`,
        sessionId: null,
        scheduleId: schedule.id,
        studentId: schedule.student_id,
        studentName: schedule.students?.nome_completo ?? "Aluno",
        data,
        horario: schedule.horario,
        status: "agendado",
        origem: "recorrente",
        ajustado: false,
        observacoes: schedule.observacoes,
      });
    }
  }

  for (const avulsa of avulsas) {
    occurrences.push({
      key: avulsa.id,
      sessionId: avulsa.id,
      scheduleId: null,
      studentId: avulsa.student_id,
      studentName: avulsa.students?.nome_completo ?? "Aluno",
      data,
      horario: avulsa.horario,
      status: avulsa.status,
      origem: "avulso",
      ajustado: false,
      observacoes: avulsa.observacoes,
    });
  }

  occurrences.sort((a, b) => a.horario.localeCompare(b.horario));
  return occurrences;
}
