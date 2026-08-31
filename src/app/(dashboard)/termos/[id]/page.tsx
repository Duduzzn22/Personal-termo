import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { TermsRepository } from "@/lib/repositories/terms.repository";
import { InvitationsRepository } from "@/lib/repositories/invitations.repository";
import { TermEditorClient } from "@/components/terms/TermEditorClient";
import type { TermVersionClause } from "@/types/database";

export default async function TermEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await requireTrainer();
  const db = await createClient();
  const terms = new TermsRepository(db);
  const invitations = new InvitationsRepository(db);

  const template = await terms.getTemplate(userId, id);
  if (!template) notFound();

  const [clauses, versions, studentsWithAcceptedTerm] = await Promise.all([
    terms.listClauses(userId, id),
    terms.listVersions(userId, id),
    invitations.listAcceptedStudentsForTemplate(userId, id),
  ]);

  const clausesByVersion: Record<string, TermVersionClause[]> = {};
  await Promise.all(
    versions.map(async (v) => {
      clausesByVersion[v.id] = await terms.getVersionClauses(v.id);
    })
  );

  return (
    <div className="space-y-4">
      <Link href="/termos" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para termos
      </Link>
      <TermEditorClient
        template={template}
        clauses={clauses}
        versions={versions}
        clausesByVersion={clausesByVersion}
        studentsWithAcceptedTerm={studentsWithAcceptedTerm}
      />
    </div>
  );
}
