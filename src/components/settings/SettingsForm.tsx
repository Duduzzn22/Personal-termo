"use client";

import { useActionState, useEffect } from "react";
import { updateTrainerProfileAction, type SettingsActionState } from "@/lib/actions/settings.actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { TrainerProfile } from "@/types/database";

const initialState: SettingsActionState = {};

export function SettingsForm({ profile }: { profile: TrainerProfile }) {
  const [state, formAction, pending] = useActionState(updateTrainerProfileAction, initialState);
  const { showToast } = useToast();

  useEffect(() => {
    if (state.success) showToast("Configurações salvas com sucesso.");
    if (state.error) showToast(state.error, "error");
  }, [state, showToast]);

  return (
    <form action={formAction} className="space-y-4">
      <Input
        label="Nome profissional"
        name="nome_profissional"
        defaultValue={profile.nome_profissional}
        required
      />
      <Input label="Nome da empresa" name="nome_empresa" defaultValue={profile.nome_empresa ?? ""} />
      <Input label="CREF" name="cref" defaultValue={profile.cref ?? ""} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="E-mail de contato"
          name="email_contato"
          type="email"
          defaultValue={profile.email_contato ?? ""}
        />
        <Input label="Telefone" name="telefone" defaultValue={profile.telefone ?? ""} />
      </div>
      <Input label="WhatsApp" name="whatsapp" defaultValue={profile.whatsapp ?? ""} />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Cor principal</label>
        <input
          type="color"
          name="cor_principal"
          defaultValue={profile.cor_principal}
          className="h-11 w-20 cursor-pointer rounded-lg border border-slate-300"
        />
      </div>
      <Button type="submit" loading={pending}>
        Salvar alterações
      </Button>
    </form>
  );
}
