"use client";

import { useActionState, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { acceptInvitationAction, type AcceptActionState } from "@/lib/actions/acceptance.actions";

const initialState: AcceptActionState = {};

export function AcceptanceForm({ token }: { token: string }) {
  const action = acceptInvitationAction.bind(null, token);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [checked, setChecked] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <Checkbox
          name="checkbox_confirmado"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          label="Li integralmente as informações apresentadas acima, estou ciente das condições do serviço e concordo com os termos apresentados."
        />
      </div>

      {state.error && (
        <p className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-600">{state.error}</p>
      )}

      <Button type="submit" fullWidth size="lg" disabled={!checked} loading={pending}>
        <ShieldCheck className="h-5 w-5" /> Aceitar e Confirmar
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
        Registro eletrônico de aceite — data, horário e protocolo serão gerados automaticamente.
      </p>
    </form>
  );
}
