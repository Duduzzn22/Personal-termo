"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { TermsRepository } from "@/lib/repositories/terms.repository";
import { AuditRepository } from "@/lib/repositories/audit.repository";
import { termTemplateSchema, termClauseSchema, publishVersionSchema } from "@/lib/validation/term.schema";
import { publishTermVersion } from "@/lib/services/terms.service";
import { DEFAULT_TERM_CLAUSES, DEFAULT_TERM_TITLE } from "@/lib/services/default-term";
import { redirect } from "next/navigation";

export interface TermActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

// ---- Templates ----

export async function createTemplateAction(
  _prevState: TermActionState,
  formData: FormData
): Promise<TermActionState> {
  const parsed = termTemplateSchema.safeParse({
    titulo: formData.get("titulo"),
    descricao: formData.get("descricao"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Verifique os campos destacados.", fieldErrors };
  }

  const { userId } = await requireTrainer();
  const db = await createClient();
  const terms = new TermsRepository(db);
  const audit = new AuditRepository(db);

  const template = await terms.createTemplate(userId, parsed.data);
  await audit.log({
    trainer_id: userId,
    entity_type: "term_template",
    entity_id: template.id,
    event_type: "termo_criado",
    description: `Termo "${template.titulo}" criado.`,
  });

  revalidatePath("/termos");
  redirect(`/termos/${template.id}`);
}

export async function createTemplateWithDefaultContentAction(): Promise<void> {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const terms = new TermsRepository(db);
  const audit = new AuditRepository(db);

  const template = await terms.createTemplate(userId, {
    titulo: DEFAULT_TERM_TITLE,
    descricao: "Modelo de demonstração — edite livremente antes de publicar.",
  });

  for (let i = 0; i < DEFAULT_TERM_CLAUSES.length; i++) {
    const c = DEFAULT_TERM_CLAUSES[i];
    await terms.createClause(userId, {
      template_id: template.id,
      titulo: c.titulo,
      conteudo: c.conteudo,
      posicao: i,
      obrigatoria: true,
      ativo: true,
    });
  }

  await audit.log({
    trainer_id: userId,
    entity_type: "term_template",
    entity_id: template.id,
    event_type: "termo_criado",
    description: `Termo "${template.titulo}" criado a partir do modelo padrão.`,
  });

  revalidatePath("/termos");
  redirect(`/termos/${template.id}`);
}

export async function updateTemplateAction(
  templateId: string,
  _prevState: TermActionState,
  formData: FormData
): Promise<TermActionState> {
  const parsed = termTemplateSchema.safeParse({
    titulo: formData.get("titulo"),
    descricao: formData.get("descricao"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Verifique os campos destacados.", fieldErrors };
  }

  const { userId } = await requireTrainer();
  const db = await createClient();
  const terms = new TermsRepository(db);
  const audit = new AuditRepository(db);

  const template = await terms.updateTemplate(userId, templateId, parsed.data);
  await audit.log({
    trainer_id: userId,
    entity_type: "term_template",
    entity_id: template.id,
    event_type: "termo_atualizado",
    description: `Termo "${template.titulo}" atualizado.`,
  });

  revalidatePath(`/termos/${templateId}`);
  return { success: true };
}

/**
 * "Exclui" um termo (modelo) da listagem em /termos. Não é uma remoção
 * definitiva do banco: apenas marca ativo=false (ver TermsRepository.deactivateTemplate),
 * preservando o histórico de qualquer aluno que já tenha aceitado uma versão dele.
 */
export async function deleteTemplateAction(templateId: string) {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const terms = new TermsRepository(db);
  const audit = new AuditRepository(db);

  const template = await terms.deactivateTemplate(userId, templateId);
  await audit.log({
    trainer_id: userId,
    entity_type: "term_template",
    entity_id: template.id,
    event_type: "termo_excluido",
    description: `Termo "${template.titulo}" excluído.`,
  });

  revalidatePath("/termos");
}

// ---- Clauses (rascunho mutável) ----

export async function createClauseAction(
  templateId: string,
  _prevState: TermActionState,
  formData: FormData
): Promise<TermActionState> {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const terms = new TermsRepository(db);
  const audit = new AuditRepository(db);

  const existing = await terms.listClauses(userId, templateId);
  const parsed = termClauseSchema.safeParse({
    titulo: formData.get("titulo"),
    conteudo: formData.get("conteudo"),
    posicao: existing.length,
    obrigatoria: formData.get("obrigatoria") === "on",
    ativo: true,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Verifique os campos destacados.", fieldErrors };
  }

  const clause = await terms.createClause(userId, { ...parsed.data, template_id: templateId });
  await audit.log({
    trainer_id: userId,
    entity_type: "term_clause",
    entity_id: clause.id,
    event_type: "clausula_criada",
    description: `Cláusula "${clause.titulo}" adicionada.`,
  });

  revalidatePath(`/termos/${templateId}`);
  return { success: true };
}

export async function updateClauseAction(
  templateId: string,
  clauseId: string,
  _prevState: TermActionState,
  formData: FormData
): Promise<TermActionState> {
  const parsed = termClauseSchema.partial({ posicao: true }).safeParse({
    titulo: formData.get("titulo"),
    conteudo: formData.get("conteudo"),
    obrigatoria: formData.get("obrigatoria") === "on",
    ativo: formData.get("ativo") !== "off",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Verifique os campos destacados.", fieldErrors };
  }

  const { userId } = await requireTrainer();
  const db = await createClient();
  const terms = new TermsRepository(db);
  const audit = new AuditRepository(db);

  const clause = await terms.updateClause(userId, clauseId, parsed.data);
  await audit.log({
    trainer_id: userId,
    entity_type: "term_clause",
    entity_id: clause.id,
    event_type: "clausula_atualizada",
    description: `Cláusula "${clause.titulo}" atualizada.`,
  });

  revalidatePath(`/termos/${templateId}`);
  return { success: true };
}

export async function deleteClauseAction(templateId: string, clauseId: string) {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const terms = new TermsRepository(db);
  const audit = new AuditRepository(db);

  await terms.deleteClause(userId, clauseId);
  await audit.log({
    trainer_id: userId,
    entity_type: "term_clause",
    entity_id: clauseId,
    event_type: "clausula_removida",
    description: "Cláusula removida do rascunho.",
  });

  revalidatePath(`/termos/${templateId}`);
}

export async function toggleClauseActiveAction(templateId: string, clauseId: string, ativo: boolean) {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const terms = new TermsRepository(db);
  await terms.updateClause(userId, clauseId, { ativo });
  revalidatePath(`/termos/${templateId}`);
}

export async function reorderClausesAction(templateId: string, ordered: { id: string; posicao: number }[]) {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const terms = new TermsRepository(db);
  const audit = new AuditRepository(db);

  await terms.reorderClauses(userId, ordered);
  await audit.log({
    trainer_id: userId,
    entity_type: "term_template",
    entity_id: templateId,
    event_type: "clausula_reordenada",
    description: "Ordem das cláusulas atualizada.",
  });

  revalidatePath(`/termos/${templateId}`);
}

// ---- Versions ----

export interface PublishActionState {
  error?: string;
  success?: boolean;
}

export async function publishVersionAction(
  templateId: string,
  _prevState: PublishActionState,
  formData: FormData
): Promise<PublishActionState> {
  const alunos = formData.getAll("alunos_para_notificar").map(String);
  const parsed = publishVersionSchema.safeParse({
    versao: formData.get("versao"),
    exigir_novo_aceite: formData.get("exigir_novo_aceite") === "on",
    alunos_para_notificar: alunos,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Dados inválidos." };
  }

  const { userId } = await requireTrainer();
  const db = await createClient();

  try {
    await publishTermVersion(db, {
      trainerId: userId,
      templateId,
      versao: parsed.data.versao,
      exigirNovoAceite: parsed.data.exigir_novo_aceite,
      alunosParaNotificar: parsed.data.alunos_para_notificar,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível publicar a versão." };
  }

  revalidatePath(`/termos/${templateId}`);
  return { success: true };
}
