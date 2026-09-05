"use server";

import { revalidatePath } from "next/cache";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { WorkoutPlansRepository } from "@/lib/repositories/workout-plans.repository";
import type { WorkoutActionState } from "@/lib/actions/workouts.actions";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullable(formData: FormData, key: string) {
  const parsed = value(formData, key);
  return parsed || null;
}

function numberOrNull(formData: FormData, key: string, min: number, max: number) {
  const raw = value(formData, key);
  if (!raw) return { value: null as number | null };
  const parsed = Number(raw.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return { error: `Informe um valor entre ${min} e ${max}.` };
  }
  return { value: parsed };
}

export async function updateWorkoutItemAction(
  planId: string,
  itemId: string,
  _prevState: WorkoutActionState,
  formData: FormData
): Promise<WorkoutActionState> {
  const exerciseId = value(formData, "exercise_id");
  if (!exerciseId) return { error: "Selecione um exercício.", fieldErrors: { exercise_id: "Selecione um exercício." } };

  const series = numberOrNull(formData, "series", 1, 100);
  if (series.error) return { error: "Revise os campos.", fieldErrors: { series: series.error } };
  const rest = numberOrNull(formData, "descanso_segundos", 0, 7200);
  if (rest.error) return { error: "Revise os campos.", fieldErrors: { descanso_segundos: rest.error } };

  try {
    const { userId } = await requireTrainer();
    const db = await createClient();
    await new WorkoutPlansRepository(db).updateItem(userId, planId, itemId, {
      exercise_id: exerciseId,
      bloco: nullable(formData, "bloco"),
      series: series.value,
      repeticoes: nullable(formData, "repeticoes"),
      carga: nullable(formData, "carga"),
      descanso_segundos: rest.value,
      observacoes: nullable(formData, "observacoes"),
    });
    revalidatePath(`/treinos/${planId}`);
    return { success: true };
  } catch {
    return { error: "Não foi possível atualizar a prescrição." };
  }
}