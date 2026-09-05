"use server";

import { revalidatePath } from "next/cache";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { ExercisesRepository } from "@/lib/repositories/exercises.repository";
import { WorkoutPlansRepository } from "@/lib/repositories/workout-plans.repository";

export interface WorkoutActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

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

export async function createExerciseAction(
  _prevState: WorkoutActionState,
  formData: FormData
): Promise<WorkoutActionState> {
  const nome = stringValue(formData, "nome");
  if (nome.length < 2) return { error: "Revise os campos.", fieldErrors: { nome: "Informe o nome do exercício." } };

  try {
    const { userId } = await requireTrainer();
    const db = await createClient();
    await new ExercisesRepository(db).create(userId, {
      nome,
      grupo_muscular: nullableString(formData, "grupo_muscular"),
      equipamento: nullableString(formData, "equipamento"),
      instrucoes: nullableString(formData, "instrucoes"),
      video_url: nullableString(formData, "video_url"),
      ativo: true,
    });
    revalidatePath("/treinos");
    return { success: true };
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
    await new ExercisesRepository(db).update(userId, exerciseId, {
      nome,
      grupo_muscular: nullableString(formData, "grupo_muscular"),
      equipamento: nullableString(formData, "equipamento"),
      instrucoes: nullableString(formData, "instrucoes"),
      video_url: nullableString(formData, "video_url"),
    });
    revalidatePath("/treinos");
    return { success: true };
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
  const fieldErrors: Record<string, string> = {};
  if (nome.length < 2) fieldErrors.nome = "Informe o nome do treino.";
  if (!studentId) fieldErrors.student_id = "Selecione um aluno.";
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
      data_inicio: start,
      data_fim: end,
      observacoes: nullableString(formData, "observacoes"),
      status: "ativo",
    });
    revalidatePath("/treinos");
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
  const fieldErrors: Record<string, string> = {};
  if (nome.length < 2) fieldErrors.nome = "Informe o nome do treino.";
  if (!studentId) fieldErrors.student_id = "Selecione um aluno.";
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
      data_inicio: start,
      data_fim: end,
      observacoes: nullableString(formData, "observacoes"),
    });
    revalidatePath("/treinos");
    revalidatePath(`/treinos/${planId}`);
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
}