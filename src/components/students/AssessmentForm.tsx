"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import {
  createPhysicalAssessmentAction,
  updatePhysicalAssessmentAction,
  type AssessmentActionState,
} from "@/lib/actions/physical-assessments.actions";
import { todayISO } from "@/lib/utils/agenda";
import type { PhysicalAssessment } from "@/types/assessment";

const initialState: AssessmentActionState = {};

export function AssessmentForm({
  studentId,
  assessment,
  onSuccess,
}: {
  studentId: string;
  assessment?: PhysicalAssessment;
  onSuccess: () => void;
}) {
  const action = assessment
    ? updatePhysicalAssessmentAction.bind(null, studentId, assessment.id)
    : createPhysicalAssessmentAction.bind(null, studentId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const { showToast } = useToast();

  useEffect(() => {
    if (state.success) {
      showToast(assessment ? "Avaliação atualizada com sucesso." : "Avaliação registrada com sucesso.");
      onSuccess();
    }
  }, [state.success]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={formAction} className="space-y-5">
      <Input
        label="Data da avaliação"
        name="data_avaliacao"
        type="date"
        required
        defaultValue={assessment?.data_avaliacao ?? todayISO()}
        error={state.fieldErrors?.data_avaliacao}
      />

      <div>
        <p className="mb-3 text-sm font-semibold text-slate-900">Indicadores principais</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Peso (kg)"
            name="peso_kg"
            type="number"
            step="0.1"
            min="0.1"
            max="500"
            placeholder="Ex: 78,5"
            defaultValue={assessment?.peso_kg ?? ""}
            error={state.fieldErrors?.peso_kg}
          />
          <Input
            label="Altura (cm)"
            name="altura_cm"
            type="number"
            step="0.1"
            min="20"
            max="300"
            placeholder="Ex: 178"
            defaultValue={assessment?.altura_cm ?? ""}
            error={state.fieldErrors?.altura_cm}
          />
          <Input
            label="Gordura corporal (%)"
            name="percentual_gordura"
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="Ex: 18,5"
            defaultValue={assessment?.percentual_gordura ?? ""}
            error={state.fieldErrors?.percentual_gordura}
          />
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-slate-900">Circunferências (cm)</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Cintura" name="cintura_cm" type="number" step="0.1" min="1" max="500" defaultValue={assessment?.cintura_cm ?? ""} error={state.fieldErrors?.cintura_cm} />
          <Input label="Quadril" name="quadril_cm" type="number" step="0.1" min="1" max="500" defaultValue={assessment?.quadril_cm ?? ""} error={state.fieldErrors?.quadril_cm} />
          <Input label="Peito" name="peito_cm" type="number" step="0.1" min="1" max="500" defaultValue={assessment?.peito_cm ?? ""} error={state.fieldErrors?.peito_cm} />
          <Input label="Braço direito" name="braco_direito_cm" type="number" step="0.1" min="1" max="500" defaultValue={assessment?.braco_direito_cm ?? ""} error={state.fieldErrors?.braco_direito_cm} />
          <Input label="Braço esquerdo" name="braco_esquerdo_cm" type="number" step="0.1" min="1" max="500" defaultValue={assessment?.braco_esquerdo_cm ?? ""} error={state.fieldErrors?.braco_esquerdo_cm} />
          <Input label="Coxa direita" name="coxa_direita_cm" type="number" step="0.1" min="1" max="500" defaultValue={assessment?.coxa_direita_cm ?? ""} error={state.fieldErrors?.coxa_direita_cm} />
          <Input label="Coxa esquerda" name="coxa_esquerda_cm" type="number" step="0.1" min="1" max="500" defaultValue={assessment?.coxa_esquerda_cm ?? ""} error={state.fieldErrors?.coxa_esquerda_cm} />
          <Input label="Panturrilha direita" name="panturrilha_direita_cm" type="number" step="0.1" min="1" max="500" defaultValue={assessment?.panturrilha_direita_cm ?? ""} error={state.fieldErrors?.panturrilha_direita_cm} />
          <Input label="Panturrilha esquerda" name="panturrilha_esquerda_cm" type="number" step="0.1" min="1" max="500" defaultValue={assessment?.panturrilha_esquerda_cm ?? ""} error={state.fieldErrors?.panturrilha_esquerda_cm} />
        </div>
      </div>

      <Textarea
        label="Observações"
        name="observacoes"
        placeholder="Ex: condições da avaliação, objetivo atual, observações relevantes..."
        defaultValue={assessment?.observacoes ?? ""}
      />

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end pt-1">
        <Button type="submit" loading={pending}>
          {assessment ? "Salvar alterações" : "Registrar avaliação"}
        </Button>
      </div>
    </form>
  );
}