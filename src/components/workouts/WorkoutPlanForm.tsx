"use client";

import { useActionState, useEffect } from "react";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  createWorkoutPlanAction,
  updateWorkoutPlanAction,
  type WorkoutActionState,
} from "@/lib/actions/workouts.actions";
import { DIAS_SEMANA, DIAS_SEMANA_ABREV, todayISO } from "@/lib/utils/agenda";
import type { Student } from "@/types/database";
import type { WorkoutPlan } from "@/types/workout";

const initialState: WorkoutActionState = {};

export function WorkoutPlanForm({
  students,
  plan,
  preselectedStudentId,
  onSuccess,
}: {
  students: Student[];
  plan?: WorkoutPlan;
  preselectedStudentId?: string;
  onSuccess: () => void;
}) {
  const action = plan ? updateWorkoutPlanAction.bind(null, plan.id) : createWorkoutPlanAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const { showToast } = useToast();
  const selectedDays = new Set((plan?.dias_semana ?? []).map(Number));

  useEffect(() => {
    if (state.success) {
      showToast(plan ? "Plano de treino atualizado." : "Plano de treino criado.");
      onSuccess();
    }
  }, [state.success]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={formAction} className="space-y-4">
      <Select
        label="Aluno"
        name="student_id"
        required
        defaultValue={plan?.student_id ?? preselectedStudentId ?? ""}
        error={state.fieldErrors?.student_id}
      >
        <option value="">Selecione...</option>
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.nome_completo}
          </option>
        ))}
      </Select>

      <Input
        label="Nome do treino"
        name="nome"
        required
        placeholder="Ex: Treino A — Peito e tríceps"
        defaultValue={plan?.nome ?? ""}
        error={state.fieldErrors?.nome}
      />

      <Input
        label="Objetivo"
        name="objetivo"
        placeholder="Ex: Hipertrofia, força, condicionamento..."
        defaultValue={plan?.objetivo ?? ""}
      />

      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium text-slate-700">Dias deste treino</p>
          <p className="mt-0.5 text-xs text-slate-500">O Portal do Aluno usa estes dias para destacar automaticamente o treino de hoje.</p>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {DIAS_SEMANA_ABREV.map((day, index) => (
            <label
              key={day}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50 has-[:checked]:border-slate-900 has-[:checked]:bg-slate-900 has-[:checked]:text-white"
              title={DIAS_SEMANA[index]}
            >
              <input
                type="checkbox"
                name="dias_semana"
                value={index}
                defaultChecked={selectedDays.has(index)}
                className="sr-only"
              />
              {day}
            </label>
          ))}
        </div>
        {state.fieldErrors?.dias_semana && <p className="text-xs text-red-600">{state.fieldErrors.dias_semana}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Início"
          name="data_inicio"
          type="date"
          defaultValue={plan?.data_inicio ?? todayISO()}
        />
        <Input
          label="Fim"
          name="data_fim"
          type="date"
          defaultValue={plan?.data_fim ?? ""}
          error={state.fieldErrors?.data_fim}
        />
      </div>

      <Textarea
        label="Observações"
        name="observacoes"
        placeholder="Orientações gerais do plano, limitações, estratégia..."
        defaultValue={plan?.observacoes ?? ""}
      />

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end pt-1">
        <Button type="submit" loading={pending}>
          {plan ? "Salvar alterações" : "Criar plano"}
        </Button>
      </div>
    </form>
  );
}
