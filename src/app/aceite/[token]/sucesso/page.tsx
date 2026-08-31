import { notFound } from "next/navigation";
import { CheckCircle2, Download } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { InvitationsRepository } from "@/lib/repositories/invitations.repository";
import { PublicHeader } from "@/components/public-accept/PublicHeader";
import { formatDateBR, formatTimeBR } from "@/lib/utils/format";
import type { TrainerProfile } from "@/types/database";

export default async function AcceptanceSuccessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const adminDb = createAdminClient();
  const invitations = new InvitationsRepository(adminDb);

  const invitation = await invitations.getByToken(adminDb, token);
  if (!invitation || invitation.status !== "aceito") notFound();

  const { data: acceptance } = await adminDb
    .from("acceptances")
    .select("*")
    .eq("invitation_id", invitation.id)
    .maybeSingle();

  if (!acceptance) notFound();

  const trainer = invitation.trainer_profiles as TrainerProfile;
  const snapshot = invitation.document_snapshot;

  return (
    <div>
      <PublicHeader trainerName={trainer.nome_profissional} companyName={trainer.nome_empresa} />
      <main className="mx-auto max-w-md px-4 py-10 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-9 w-9 text-emerald-600" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">Aceite registrado com sucesso</h1>
        <p className="mt-1 text-sm text-slate-500">{snapshot.aluno.nome_completo}</p>

        <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-left text-sm">
          <Row label="Termo" value={snapshot.termo_titulo} />
          <Row label="Versão" value={snapshot.termo_versao} />
          <Row label="Data" value={formatDateBR(acceptance.accepted_at)} />
          <Row label="Horário" value={formatTimeBR(acceptance.accepted_at)} />
          <Row label="Protocolo" value={acceptance.protocolo} mono />
        </div>

        <a
          href={`/api/pdf/${acceptance.id}`}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-medium text-white hover:bg-slate-800"
        >
          <Download className="h-4 w-4" /> Baixar comprovante
        </a>

        <p className="mt-6 text-xs leading-relaxed text-slate-400">
          Um e-mail de confirmação foi enviado, quando aplicável. Guarde o número do protocolo para
          referência futura.
        </p>
      </main>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
      <span className="text-slate-400">{label}</span>
      <span className={mono ? "font-mono text-xs font-medium text-slate-800" : "font-medium text-slate-800"}>
        {value}
      </span>
    </div>
  );
}
