"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { ExercisesRepository } from "@/lib/repositories/exercises.repository";
import { WorkoutPlansRepository } from "@/lib/repositories/workout-plans.repository";

export interface WorkoutActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
  exerciseId?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableString(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return value || null;
}

function optionalNumber(formData: FormData, key: string, min: number, max: number) {
  const raw = stringValue(formData, key);
  if (!raw) return { value: null as number | null };
  const value = Number(raw.replace(",", "."));
  if (!Number.isFinite(value) || value < min || value > max) return { error: `Informe um valor entre ${min} e ${max}.` };
  return { value };
}

function weekdaysValue(formData: FormData) {
  return Array.from(
    new Set(
      formData
        .getAll("dias_semana")
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
    )
  ).sort((a, b) => a - b);
}

function scopedVideoPath(formData: FormData, trainerId: string, exerciseId: string) {
  const path = nullableString(formData, "video_path");
  if (!path) return { value: null as string | null };
  if (!path.startsWith(`${trainerId}/${exerciseId}/`)) {
    return { error: "O caminho do vídeo não pertence a este exercício." };
  }
  return { value: path };
}

export async function createExerciseAction(
  _prevState: WorkoutActionState,
  formData: FormData
): Promise<WorkoutActionState> {
  const nome = stringValue(formData, "nome");
  if (nome.length < 2) return { error: "Revise os campos.", fieldErrors: { nome: "Informe o nome do exercício." } };

  try {
    const { userId } = await requireTrainer();
    const db = await createClient();
    const requestedId = stringValue(formData, "exercise_id");
    const exerciseId = UUID_RE.test(requestedId) ? requestedId : randomUUID();
    const videoPath = scopedVideoPath(formData, userId, exerciseId);
    if (videoPath.error) return { error: videoPath.error };

    await new ExercisesRepository(db).create(userId, {
      id: exerciseId,
      nome,
      grupo_muscular: nullableString(formData, "grupo_muscular"),
      equipamento: nullableString(formData, "equipamento"),
      instrucoes: nullableString(formData, "instrucoes"),
      video_url: nullableString(formData, "video_url"),
      video_path: videoPath.value,
      ativo: true,
    });
    revalidatePath("/treinos");
    revalidatePath("/portal");
    return { success: true, exerciseId };
  } catch (error) {
    const message = error instanceof Error && error.message.includes("idx_exercises_unique_name_per_trainer")
      ? "Já existe um exercício com esse nome."
      : "Não foi possível cadastrar o exercício.";
    return { error: message };
  }
}

export async function updateExerciseAction(
  exerciseId: string,
  _prevState: WorkoutActionState,
  formData: FormData
): Promise<WorkoutActionState> {
  const nome = stringValue(formData, "nome");
  if (nome.length < 2) return { error: "Revise os campos.", fieldErrors: { nome: "Informe o nome do exercício." } };

  try {
    const { userId } = await requireTrainer();
    const db = await createClient();
    const videoPath = scopedVideoPath(formData, userId, exerciseId);
    if (videoPath.error) return { error: videoPath.error };

    await new ExercisesRepository(db).update(userId, exerciseId, {
      nome,
      grupo_muscular: nullableString(formData, "grupo_muscular"),
      equipamento: nullableString(formData, "equipamento"),
      instrucoes: nullableString(formData, "instrucoes"),
      video_url: nullableString(formData, "video_url"),
      video_path: videoPath.value,
    });
    revalidatePath("/treinos");
    revalidatePath("/portal");
    return { success: true, exerciseId };
  } catch {
    return { error: "Não foi possível atualizar o exercício." };
  }
}

export async function toggleExerciseAction(exerciseId: string, active: boolean) {
  const { userId } = await requireTrainer();
  const db = await createClient();
  await new ExercisesRepository(db).update(userId, exerciseId, { ativo: active });
  revalidatePath("/treinos");
}

export async function createWorkoutPlanAction(
  _prevState: WorkoutActionState,
  formData: FormData
): Promise<WorkoutActionState> {
  const nome = stringValue(formData, "nome");
  const studentId = stringValue(formData, "student_id");
  const diasSemana = weekdaysValue(formData);
  const fieldErrors: Record<string, string> = {};
  if (nome.length < 2) fieldErrors.nome = "Informe o nome do treino.";
  if (!studentId) fieldErrors.student_id = "Selecione um aluno.";
  if (diasSemana.length === 0) fieldErrors.dias_semana = "Selecione pelo menos um dia da semana.";
  if (Object.keys(fieldErrors).length) return { error: "Revise os campos.", fieldErrors };

  const start = nullableString(formData, "data_inicio");
  const end = nullableString(formData, "data_fim");
  if (start && end && end < start) {
    return { error: "Revise os campos.", fieldErrors: { data_fim: "A data final não pode ser anterior à inicial." } };
  }

  try {
    const { userId } = await requireTrainer();
    const db = await createClient();
    await new WorkoutPlansRepository(db).create(userId, {
      student_id: studentId,
      nome,
      objetivo: nullableString(formData, "objetivo"),
      dias_semana: diasSemana,
      data_inicio: start,
      data_fim: end,
      observacoes: nullableString(formData, "observacoes"),
      status: "ativo",
    });
    revalidatePath("/treinos");
    revalidatePath("/portal");
    return { success: true };
  } catch {
    return { error: "Não foi possível criar o plano de treino." };
  }
}

export async function updateWorkoutPlanAction(
  planId: string,
  _prevState: WorkoutActionState,
  formData: FormData
): Promise<WorkoutActionState> {
  const nome = stringValue(formData, "nome");
  const studentId = stringValue(formData, "student_id");
  const diasSemana = weekdaysValue(formData);
  const fieldErrors: Record<string, string> = {};
  if (nome.length < 2) fieldErrors.nome = "Informe o nome do treino.";
  if (!studentId) fieldErrors.student_id = "Selecione um aluno.";
  if (diasSemana.length === 0) fieldErrors.dias_semana = "Selecione pelo menos um dia da semana.";
  if (Object.keys(fieldErrors).length) return { error: "Revise os campos.", fieldErrors };

  const start = nullableString(formData, "data_inicio");
  const end = nullableString(formData, "data_fim");
  if (start && end && end < start) {
    return { error: "Revise os campos.", fieldErrors: { data_fim: "A data final não pode ser anterior à inicial." } };
  }

  try {
    const { userId } = await requireTrainer();
    const db = await createClient();
    await new WorkoutPlansRepository(db).update(userId, planId, {
      student_id: studentId,
      nome,
      objetivo: nullableString(formData, "objetivo"),
      dias_semana: diasSemana,
      data_inicio: start,
      data_fim: end,
      observacoes: nullableString(formData, "observacoes"),
    });
    revalidatePath("/treinos");
    revalidatePath(`/treinos/${planId}`);
    revalidatePath("/portal");
    return { success: true };
  } catch {
    return { error: "Não foi possível atualizar o plano de treino." };
  }
}

export async function archiveWorkoutPlanAction(planId: string, archive: boolean) {
  const { userId } = await requireTrainer();
  const db = await createClient();
  await new WorkoutPlansRepository(db).update(userId, planId, { status: archive ? "arquivado" : "ativo" });
  revalidatePath("/treinos");
  revalidatePath(`/treinos/${planId}`);
  revalidatePath("/portal");
}

export async function addWorkoutItemAction(
  planId: string,
  _prevState: WorkoutActionState,
  formData: FormData
): Promise<WorkoutActionState> {
  const exerciseId = stringValue(formData, "exercise_id");
  if (!exerciseId) return { error: "Selecione um exercício.", fieldErrors: { exercise_id: "Selecione um exercício." } };

  const series = optionalNumber(formData, "series", 1, 100);
  if (series.error) return { error: "Revise os campos.", fieldErrors: { series: series.error } };
  const rest = optionalNumber(formData, "descanso_segundos", 0, 7200);
  if (rest.error) return { error: "Revise os campos.", fieldErrors: { descanso_segundos: rest.error } };

  try {
    const { userId } = await requireTrainer();
    const db = await createClient();
    await new WorkoutPlansRepository(db).addItem(userId, planId, {
      exercise_id: exerciseId,
      bloco: nullableString(formData, "bloco"),
      series: series.value,
      repeticoes: nullableString(formData, "repeticoes"),
      carga: nullableString(formData, "carga"),
      descanso_segundos: rest.value,
      observacoes: nullableString(formData, "observacoes"),
    });
    revalidatePath(`/treinos/${planId}`);
    revalidatePath("/portal");
    return { success: true };
  } catch {
    return { error: "Não foi possível adicionar o exercício ao treino." };
  }
}

export async function removeWorkoutItemAction(planId: string, itemId: string) {
  const { userId } = await requireTrainer();
  const db = await createClient();
  await new WorkoutPlansRepository(db).removeItem(userId, planId, itemId);
  revalidatePath(`/treinos/${planId}`);
  revalidatePath("/portal");
}
