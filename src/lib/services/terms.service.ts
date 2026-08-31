import type { SupabaseClient } from "@supabase/supabase-js";
import { TermsRepository } from "@/lib/repositories/terms.repository";
import { InvitationsRepository } from "@/lib/repositories/invitations.repository";
import { AuditRepository } from "@/lib/repositories/audit.repository";

/**
 * Publica uma nova versão de um termo: copia (snapshot) as cláusulas ativas
 * do rascunho atual para term_version_clauses, que a partir daí é IMUTÁVEL.
 * Alterações futuras no template nunca afetam versões já publicadas.
 */
export async function publishTermVersion(
  db: SupabaseClient,
  params: {
    trainerId: string;
    templateId: string;
    versao: string;
    exigirNovoAceite: boolean;
    alunosParaNotificar: string[];
  }
) {
  const terms = new TermsRepository(db);
  const invitations = new InvitationsRepository(db);
  const audit = new AuditRepository(db);

  const template = await terms.getTemplate(params.trainerId, params.templateId);
  if (!template) throw new Error("Termo não encontrado.");

  const clauses = (await terms.listClauses(params.trainerId, params.templateId)).filter(
    (c) => c.ativo
  );
  if (clauses.length === 0) {
    throw new Error("Adicione pelo menos uma cláusula ativa antes de publicar.");
  }

  const version = await terms.createVersion(params.trainerId, {
    template_id: params.templateId,
    versao: params.versao,
    titulo_snapshot: template.titulo,
    status: "publicado",
    published_at: new Date().toISOString(),
  });

  await terms.insertVersionClauses(
    clauses.map((c) => ({
      term_version_id: version.id,
      titulo: c.titulo,
      conteudo: c.conteudo,
      posicao: c.posicao,
      obrigatoria: c.obrigatoria,
    }))
  );

  await audit.log({
    trainer_id: params.trainerId,
    entity_type: "term_version",
    entity_id: version.id,
    event_type: "versao_publicada",
    description: `Versão ${params.versao} do termo "${template.titulo}" publicada.`,
    metadata: { clausulas: clauses.length },
  });

  if (params.exigirNovoAceite && params.alunosParaNotificar.length > 0) {
    // Marca os convites aceitos anteriores (deste template) dos alunos selecionados
    // como "nova_versao_pendente". O aceite original permanece intacto e imutável.
    const allInvitations = await invitations.list(params.trainerId, { status: "aceito" });
    const toFlag = (allInvitations ?? []).filter(
      (inv: { student_id: string; term_versions?: { term_templates?: unknown } | null }) =>
        params.alunosParaNotificar.includes(inv.student_id)
    );
    for (const inv of toFlag as { id: string }[]) {
      await invitations.updateStatus(params.trainerId, inv.id, "nova_versao_pendente");
    }
    await audit.log({
      trainer_id: params.trainerId,
      entity_type: "term_version",
      entity_id: version.id,
      event_type: "nova_versao_solicitada",
      description: `Novo aceite solicitado a ${params.alunosParaNotificar.length} aluno(s) para a versão ${params.versao}.`,
    });
  }

  return version;
}
