import type { SupabaseClient } from "@supabase/supabase-js";
import type { TrainingSchedule, TrainingSession, TrainingSessionStatus } from "@/types/database";

type WithStudentName<T> = T & { students: { nome_completo: string } | null };

export type TrainingSessionWithPackage = TrainingSession & {
  student_packages: { packages: { nome: string } | null } | null;
};

export class AgendaRepository {
  constructor(private db: SupabaseClient) {}

  // ---- Horários fixos (padrão semanal, editado na aba do aluno) ----

  async listSchedulesByStudent(trainerId: string, studentId: string) {
    const { data, error } = await this.db
      .from("training_schedules")
      .select("*")
      .eq("trainer_id", trainerId)
      .eq("student_id", studentId)
      .eq("ativo", true)
      .order("dia_semana", { ascending: true })
      .order("horario", { ascending: true });
    if (error) throw error;
    return data as TrainingSchedule[];
  }

  async listSchedulesByWeekday(trainerId: string, diaSemana: number) {
    const { data, error } = await this.db
      .from("training_schedules")
      .select("*, students(nome_completo)")
      .eq("trainer_id", trainerId)
      .eq("dia_semana", diaSemana)
      .eq("ativo", true)
      .order("horario", { ascending: true });
    if (error) throw error;
    return data as WithStudentName<TrainingSchedule>[];
  }

  async createSchedule(trainerId: string, input: Partial<TrainingSchedule>) {
    const { data, error } = await this.db
      .from("training_schedules")
      .insert({ ...input, trainer_id: trainerId })
      .select("*")
      .single();
    if (error) throw error;
    return data as TrainingSchedule;
  }

  async updateSchedule(trainerId: string, id: string, input: Partial<TrainingSchedule>) {
    const { data, error } = await this.db
      .from("training_schedules")
      .update(input)
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as TrainingSchedule;
  }

  async deleteSchedule(trainerId: string, id: string) {
    const { error } = await this.db
      .from("training_schedules")
      .delete()
      .eq("trainer_id", trainerId)
      .eq("id", id);
    if (error) throw error;
  }

  // ---- Sessões concretas (avulsas ou exceções de uma data específica) ----

  async listSessionsByDate(trainerId: string, data: string) {
    const { data: rows, error } = await this.db
      .from("training_sessions")
      .select("*, students(nome_completo)")
      .eq("trainer_id", trainerId)
      .eq("data", data);
    if (error) throw error;
    return rows as WithStudentName<TrainingSession>[];
  }

  async listSessionsByStudent(trainerId: string, studentId: string, limit = 30) {
    const { data, error } = await this.db
      .from("training_sessions")
      .select("*, student_packages(packages(nome))")
      .eq("trainer_id", trainerId)
      .eq("student_id", studentId)
      .order("data", { ascending: false })
      .order("horario", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as unknown as TrainingSessionWithPackage[];
  }

  async updateSession(trainerId: string, id: string, input: Partial<TrainingSession>) {
    const { data, error } = await this.db
      .from("training_sessions")
      .update(input)
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as TrainingSession;
  }

  async createSession(trainerId: string, input: Partial<TrainingSession>) {
    const { data, error } = await this.db
      .from("training_sessions")
      .insert({ ...input, trainer_id: trainerId })
      .select("*")
      .single();
    if (error) throw error;
    return data as TrainingSession;
  }

  async deleteSession(trainerId: string, id: string) {
    const { error } = await this.db
      .from("training_sessions")
      .delete()
      .eq("trainer_id", trainerId)
      .eq("id", id);
    if (error) throw error;
  }

  /**
   * Upsert por (schedule_id, data): registra a primeira exceção de uma
   * ocorrência que até então só existia como padrão semanal "virtual"
   * (horário alterado ou cancelamento só daquele dia).
   */
  async upsertSessionForSchedule(
    trainerId: string,
    input: {
      schedule_id: string;
      student_id: string;
      data: string;
      horario: string;
      status: TrainingSessionStatus;
      observacoes?: string | null;
    }
  ) {
    const { data, error } = await this.db
      .from("training_sessions")
      .upsert({ ...input, trainer_id: trainerId }, { onConflict: "schedule_id,data" })
      .select("*")
      .single();
    if (error) throw error;
    return data as TrainingSession;
  }
}
