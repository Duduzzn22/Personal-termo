import { redirect } from "next/navigation";
import { AlertTriangle, Ban, Clock } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupInvitationByToken, logLinkAccessed } from "@/lib/services/acceptance.service";
import { PublicHeader } from "@/components/public-accept/PublicHeader";
import { DocumentPreview } from "@/components/public-accept/DocumentPreview";
import { StudentConfirmation } from "@/components/public-accept/StudentConfirmation";
import { AcceptanceForm } from "@/components/public-accept/AcceptanceForm";
import type { TermInvitation, TrainerProfile } from "@/types/database";

function StatusMessage({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof AlertTriangle;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-7 w-7 text-slate-500" />
      </div>
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export default async function AcceptancePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const adminDb = createAdminClient();
  const result = await lookupInvitationByToken(adminDb, token);

  if (result.status === "not_found") {
    return (
      <StatusMessage
        icon={AlertTriangle}
        title="Link não encontrado"
        description="Verifique se o link foi copiado corretamente ou solicite um novo link ao seu personal trainer."
      />
    );
  }

  if (result.status === "cancelled") {
    return (
      <StatusMessage
        icon={Ban}
        title="Convite cancelado"
        description="Este convite foi cancelado pelo personal trainer. Solicite um novo link, se necessário."
      />
    );
  }

  if (result.status === "expired") {
    return (
      <StatusMessage
        icon={Clock}
        title="Link expirado"
        description="Este link de aceite não está mais válido. Solicite um novo link ao seu personal trainer."
      />
    );
  }

  if (result.status === "already_accepted") {
    redirect(`/aceite/${token}/sucesso`);
  }

  const invitation = result.invitation as TermInvitation & { trainer_profiles: TrainerProfile };
  await logLinkAccessed(adminDb, invitation);

  const snapshot = invitation.document_snapshot;

  return (
    <div>
      <PublicHeader
        trainerName={invitation.trainer_profiles.nome_profissional}
        companyName={invitation.trainer_profiles.nome_empresa}
      />
      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:py-8">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Termo de Ciência e Aceite</h1>
          <p className="mt-1 text-sm text-slate-500">
            Leia atentamente as condições abaixo antes de confirmar.
          </p>
        </div>

        <StudentConfirmation
          nome={snapshot.aluno.nome_completo}
          cpf={snapshot.aluno.cpf}
          email={snapshot.aluno.email}
          telefone={snapshot.aluno.telefone}
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <DocumentPreview snapshot={snapshot} />
        </div>

        <AcceptanceForm token={token} />
      </main>
    </div>
  );
}
