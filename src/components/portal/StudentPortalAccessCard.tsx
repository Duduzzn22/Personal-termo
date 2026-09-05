"use client";

import { useActionState, useEffect } from "react";
import { ExternalLink, KeyRound, Mail, ShieldCheck, ShieldOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  disableStudentPortalAction,
  enableStudentPortalAction,
  resendStudentPortalInstructionsAction,
  type StudentPortalActionState,
} from "@/lib/actions/student-portal.actions";
import type { Student } from "@/types/database";
import type { StudentPortalAccount } from "@/types/student-portal";

const initialState: StudentPortalActionState = {};

export function StudentPortalAccessCard({
  student,
  account,
}: {
  student: Student;
  account: StudentPortalAccount | null;
}) {
  const [enableState, enableAction, enablePending] = useActionState(
    enableStudentPortalAction.bind(null, student.id),
    initialState
  );
  const [disableState, disableAction, disablePending] = useActionState(
    disableStudentPortalAction.bind(null, student.id),
    initialState
  );
  const [resendState, resendAction, resendPending] = useActionState(
    resendStudentPortalInstructionsAction.bind(null, student.id),
    initialState
  );
  const { showToast } = useToast();

  useEffect(() => {
    const state = enableState.success ? enableState : disableState.success ? disableState : resendState.success ? resendState : null;
    if (state?.success && state.message) showToast(state.message);
  }, [enableState.success, disableState.success, resendState.success]); // eslint-disable-line react-hooks/exhaustive-deps

  const error = enableState.error || disableState.error || resendState.error;
  const active = Boolean(account?.enabled);
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/portal/login`;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Área do aluno</CardTitle>
          <p className="mt-1 text-xs text-slate-500">Acesso privado para consultar pacote, horários, evolução, treinos e financeiro.</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          {active ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
          {active ? "Acesso ativo" : "Sem acesso"}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">E-mail do acesso</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-800">
              <Mail className="h-4 w-4 text-slate-400" /> {account?.email || student.email || "E-mail não cadastrado"}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Portal</p>
            <a href={portalUrl || "/portal/login"} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-800 hover:underline">
              Abrir página de acesso <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap justify-end gap-2">
          {active ? (
            <>
              <form action={resendAction}>
                <Button type="submit" variant="outline" size="sm" loading={resendPending}>
                  <KeyRound className="h-4 w-4" /> Reenviar instruções
                </Button>
              </form>
              <form action={disableAction}>
                <Button type="submit" variant="outline" size="sm" loading={disablePending}>
                  Desativar acesso
                </Button>
              </form>
            </>
          ) : (
            <form action={enableAction}>
              <Button type="submit" size="sm" loading={enablePending} disabled={!student.email}>
                <ShieldCheck className="h-4 w-4" /> Habilitar área do aluno
              </Button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
