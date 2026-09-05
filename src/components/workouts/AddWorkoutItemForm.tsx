"use client";

import { useActionState, useEffect } from "react";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { addWorkoutItemAction, type WorkoutActionState } from "@/lib/actions/workouts.actions";
import { updateWorkoutItemAction } from "@/lib/actions/workout-item-edit.actions";
import type { Exercise, WorkoutPlanItemWithExercise } from "@/types/workout";

const initialState: WorkoutActionState = {};

export function AddWorkoutItemForm({
  planId,
  exercises,
  item,
  onSuccess,
}: {
  planId: string;
  exercises: Exercise[];
  item?: WorkoutPlanItemWithExercise;
  onSuccess: () => void;
}) {
  const action = item
    ? updateWorkoutItemAction.bind(null, planId, item.id)
    : addWorkoutItemAction.bind(null, planId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const { showToast } = useToast();

  useEffect(() => {
    if (state.success) {
      showToast(item ? "Prescrição atualizada." : "Exercício adicionado ao treino.");
      onSuccess();
    }
  }, [state.success]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={formAction} className="space-y-4">
      <Select
        label="Exercício"
        name="exercise_id"
        required
        defaultValue={item?.exercise_id ?? ""}
        error={state.fieldErrors?.exercise_id}
      >
        <option value="">Selecione...</option>
        {exercises.map((exercise) => (
          <option key={exercise.id} value={exercise.id}>
            {exercise.nome}{exercise.grupo_muscular ? ` · ${exercise.grupo_muscular}` : ""}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Input label="Bloco" name="bloco" placeholder="A" defaultValue={item?.bloco ?? ""} />
        <Input label="Séries" name="series" type="number" min="1" max="100" placeholder="4" defaultValue={item?.series ?? ""} error={state.fieldErrors?.series} />
        <Input label="Repetições" name="repeticoes" placeholder="8–12" defaultValue={item?.repeticoes ?? ""} />
        <Input label="Descanso (s)" name="descanso_segundos" type="number" min="0" max="7200" placeholder="90" defaultValue={item?.descanso_segundos ?? ""} error={state.fieldErrors?.descanso_segundos} />
      </div>

      <Input label="Carga / intensidade" name="carga" placeholder="Ex: 30 kg, RPE 8, 75% 1RM" defaultValue={item?.carga ?? ""} />
      <Textarea label="Observações" name="observacoes" placeholder="Cadência, amplitude, técnica, progressão..." defaultValue={item?.observacoes ?? ""} />

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end pt-1">
        <Button type="submit" loading={pending}>{item ? "Salvar prescrição" : "Adicionar ao treino"}</Button>
      </div>
    </form>
  );
}