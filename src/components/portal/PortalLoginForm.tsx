"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  requestStudentMagicLinkAction,
  type StudentPortalActionState,
} from "@/lib/actions/student-portal.actions";

const initialState: StudentPortalActionState = {};

export function PortalLoginForm() {
  const [state, formAction, pending] = useActionState(requestStudentMagicLinkAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <Input
        label="Seu e-mail"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="voce@exemplo.com"
      />

      {state.error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <div className="flex gap-2">
            <Mail className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{state.message}</p>
          </div>
        </div>
      )}

      <Button type="submit" fullWidth loading={pending}>
        Enviar link de acesso
      </Button>
    </form>
  );
}
