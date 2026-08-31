import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { InvitationsRepository } from "@/lib/repositories/invitations.repository";
import { AuditRepository } from "@/lib/repositories/audit.repository";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { DocumentPreview } from "@/components/public-accept/DocumentPreview";
import { formatCPF, formatDateTimeBR, formatPhone } from "@/lib/utils/format";
import type { Acceptance, Student, Package as PackageType } from "@/types/database";

export default async function AcceptanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, profile } = await requireTrainer();
  const db = await createClient();
  const invitations = new InvitationsRepository(db);
  const audit = new AuditRepository(db);

  const invitation = await invitations.getByIdWithAcceptance(userId, id);
  if (!invitation) notFound();

  const student = invitation.students as Student;
  const pkg = invitation.packages as PackageType;
  const acceptanceRaw = invitation.acceptances;
  const acceptance = (Array.isArray(acceptanceRaw) ? acceptanceRaw[0] : acceptanceRaw) as
    | Acceptance
    | null
    | undefined;

  const historyEntity =
    acceptance
      ? await audit.listForEntity(userId, "acceptance", acceptance.id)
      : [];
  const invitationHistory = await audit.listForEntity(userId, "term_invitation", invitation.id);
  const history = [...invitationHistory, ...historyEntity].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-4">
      <Link href="/aceites" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para aceites
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{student.nome_completo}</h2>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={invitation.status} />
            {acceptance && <span className="font-mono text-xs text-slate-400">{acceptance.protocolo}</span>}
          </div>
        </div>
        {acceptance && (
          <a
            href={`/api/pdf/${acceptance.id}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Download className="h-4 w-4" /> Baixar PDF
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Dados do aluno</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Nome" value={student.nome_completo} />
            <InfoRow label="CPF" value={formatCPF(student.cpf)} />
            <InfoRow label="E-mail" value={student.email || "—"} />
            <InfoRow label="Telefone" value={formatPhone(student.telefone)} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Dados do personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Nome" value={profile.nome_profissional} />
            <InfoRow label="Empresa" value={profile.nome_empresa || "—"} />
            <InfoRow label="CREF" value={profile.cref || "—"} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Pacote e termo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Pacote" value={pkg.nome} />
            <InfoRow
              label="Termo / versão"
              value={`${invitation.term_versions?.term_templates?.titulo} · v${invitation.term_versions?.versao}`}
            />
            {acceptance && (
              <>
                <InfoRow label="Data/hora do aceite" value={formatDateTimeBR(acceptance.accepted_at)} />
                <InfoRow label="Fuso horário" value={acceptance.timezone} />
                <InfoRow label="IP" value={acceptance.ip_address || "—"} />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {acceptance && (
        <Card>
          <CardHeader>
            <CardTitle>Hash do documento (SHA-256)</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="block overflow-x-auto whitespace-nowrap rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              {acceptance.document_hash}
            </code>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Documento aceito (snapshot)</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentPreview snapshot={invitation.document_snapshot} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Nenhum evento registrado.</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span className="text-slate-700">{h.description}</span>
                  <span className="shrink-0 text-xs text-slate-400">{formatDateTimeBR(h.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}
