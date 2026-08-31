"use client";

import { useActionState, useEffect } from "react";
import { createTemplateAction, updateTemplateAction, type TermActionState } from "@/lib/actions/terms.actions";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { TermTemplate } from "@/types/database";

const initialState: TermActionState = {};

export function TermTemplateForm({ template, onSuccess }: { template?: TermTemplate; onSuccess: () => void }) {
  const action = template ? updateTemplateAction.bind(null, template.id) : createTemplateAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const { showToast } = useToast();

  useEffect(() => {
    if (state.success) {
      showToast("Termo salvo com sucesso.");
      onSuccess();
    }
  }, [state.success]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={formAction} className="space-y-4">
      <Input
        label="Título do termo"
        name="titulo"
        required
        placeholder="Ex: Termo de Ciência e Aceite das Condições do Serviço"
        defaultValue={template?.titulo}
        error={state.fieldErrors?.titulo}
      />
      <Textarea label="Descrição (uso interno)" name="descricao" defaultValue={template?.descricao ?? ""} />
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" loading={pending}>
          {template ? "Salvar" : "Criar termo em branco"}
        </Button>
      </div>
    </form>
  );
}
