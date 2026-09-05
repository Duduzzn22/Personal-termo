"use client";

import { useActionState, useEffect } from "react";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  createExerciseAction,
  updateExerciseAction,
  type WorkoutActionState,
} from "@/lib/actions/workouts.actions";
import type { Exercise } from "@/types/workout";

const initialState: WorkoutActionState = {};

export function ExerciseForm({ exercise, onSuccess }: { exercise?: Exercise; onSuccess: () => void }) {
  const action = exercise ? updateExerciseAction.bind(null, exercise.id) : createExerciseAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const { showToast } = useToast();

  useEffect(() => {
    if (state.success) {
      showToast(exercise ? "Exercício atualizado." : "Exercício cadastrado.");
      onSuccess();
    }
  }, [state.success]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={formAction} className="space-y-4">
      <Input
        label="Nome do exercício"
        name="nome"
        required
        placeholder="Ex: Supino reto com barra"
        defaultValue={exercise?.nome ?? ""}
        error={state.fieldErrors?.nome}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Grupo muscular"
          name="grupo_muscular"
          placeholder="Ex: Peitoral"
          defaultValue={exercise?.grupo_muscular ?? ""}
        />
        <Input
          label="Equipamento"
          name="equipamento"
          placeholder="Ex: Barra e banco"
          defaultValue={exercise?.equipamento ?? ""}
        />
      </div>
      <Input
        label="Vídeo / referência"
        name="video_url"
        type="url"
        placeholder="https://..."
        defaultValue={exercise?.video_url ?? ""}
        hint="Opcional. Pode apontar para YouTube ou outra referência técnica."
      />
      <Textarea
        label="Instruções"
        name="instrucoes"
        placeholder="Descreva execução, postura e cuidados..."
        defaultValue={exercise?.instrucoes ?? ""}
      />

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end pt-1">
        <Button type="submit" loading={pending}>
          {exercise ? "Salvar alterações" : "Cadastrar exercício"}
        </Button>
      </div>
    </form>
  );
}