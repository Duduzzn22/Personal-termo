"use client";

import { useActionState, useEffect } from "react";
import { createScheduleAction, updateScheduleAction, type AgendaActionState } from "@/lib/actions/agenda.actions";
import { Select, Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { DIAS_SEMANA } from "@/lib/utils/agenda";
import type { TrainingSchedule } from "@/types/database";

const initialState: AgendaActionState = {};

export function ScheduleForm({
  studentId,
  schedule,
  onSuccess,
}: {
  studentId: string;
  schedule?: TrainingSchedule;
  onSuccess: () => void;
}) {
  const action = schedule
    ? updateScheduleAction.bind(null, schedule.id, studentId)
    : createScheduleAction.bind(null, studentId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const { showToast } = useToast();

  useEffect(() => {
    if (state.success) {
      showToast("Horário salvo com sucesso.");
      onSuccess();
    }
  }, [state.success]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={formAction} className="space-y-4">
      <Select label="Dia da semana" name="dia_semana" required defaultValue={schedule?.dia_semana ?? ""} error={state.fieldErrors?.dia_semana}>
        <option value="" disabled>
          Selecione o dia
        </option>
        {DIAS_SEMANA.map((label, idx) => (
          <option key={idx} value={idx}>
            {label}
          </option>
        ))}
      </Select>
      <Input
        label="Horário"
        name="horario"
        type="time"
        required
        defaultValue={schedule?.horario?.slice(0, 5)}
        error={state.fieldErrors?.horario}
      />
      <Textarea
        label="Observações (opcional)"
        name="observacoes"
        defaultValue={schedule?.observacoes ?? ""}
        placeholder="Ex: treino de pernas, avaliação mensal…"
      />
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" loading={pending}>
          {schedule ? "Salvar horário" : "Adicionar horário"}
        </Button>
      </div>
    </form>
  );
}
