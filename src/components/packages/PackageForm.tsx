"use client";

import { useActionState, useEffect } from "react";
import { createPackageAction, updatePackageAction, type PackageActionState } from "@/lib/actions/packages.actions";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatCurrencyFromCents } from "@/lib/utils/format";
import type { Package } from "@/types/database";

const initialState: PackageActionState = {};

export function PackageForm({ pkg, onSuccess }: { pkg?: Package; onSuccess: () => void }) {
  const action = pkg ? updatePackageAction.bind(null, pkg.id) : createPackageAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const { showToast } = useToast();

  useEffect(() => {
    if (state.success) {
      showToast(pkg ? "Pacote atualizado com sucesso." : "Pacote criado com sucesso.");
      onSuccess();
    }
  }, [state.success]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={formAction} className="space-y-4">
      <Input
        label="Nome do pacote"
        name="nome"
        required
        placeholder="Ex: Pacote 12 aulas"
        defaultValue={pkg?.nome}
        error={state.fieldErrors?.nome}
      />
      <Textarea label="Descrição" name="descricao" defaultValue={pkg?.descricao ?? ""} />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Quantidade de aulas"
          name="quantidade_aulas"
          type="number"
          min={1}
          required
          defaultValue={pkg?.quantidade_aulas}
          error={state.fieldErrors?.quantidade_aulas}
        />
        <Input
          label="Duração (minutos)"
          name="duracao_minutos"
          type="number"
          min={1}
          required
          defaultValue={pkg?.duracao_minutos ?? 60}
          error={state.fieldErrors?.duracao_minutos}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Valor (R$)"
          name="valor"
          required
          placeholder="800,00"
          defaultValue={pkg ? formatCurrencyFromCents(pkg.valor_centavos).replace("R$", "").trim() : ""}
          error={state.fieldErrors?.valor_centavos}
        />
        <Input
          label="Validade (dias)"
          name="validade_dias"
          type="number"
          min={1}
          required
          defaultValue={pkg?.validade_dias ?? 30}
          error={state.fieldErrors?.validade_dias}
        />
      </div>
      <Select label="Status" name="status" defaultValue={pkg?.status ?? "ativo"}>
        <option value="ativo">Ativo</option>
        <option value="inativo">Inativo</option>
      </Select>
      <Textarea label="Observações" name="observacoes" defaultValue={pkg?.observacoes ?? ""} />

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" loading={pending}>
          {pkg ? "Salvar alterações" : "Criar pacote"}
        </Button>
      </div>
    </form>
  );
}
