import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { StudentsRepository } from "@/lib/repositories/students.repository";
import { PackagesRepository } from "@/lib/repositories/packages.repository";
import { TermsRepository } from "@/lib/repositories/terms.repository";
import { InvitationsRepository } from "@/lib/repositories/invitations.repository";
import { AuditRepository } from "@/lib/repositories/audit.repository";
import { generateSecureToken } from "@/lib/utils/security";
import { resolveVariables } from "@/lib/utils/variables";
import type { DocumentSnapshot, TrainerProfile } from "@/types/database";

/**
 * Cria um convite de aceite: monta e persiste o snapshot COMPLETO do
 * documento a ser apresentado ao aluno (não apenas IDs), gera um token
 * seguro e registra o evento no histórico.
 */
export async function createInvitation(
  db: SupabaseClient,
  params: {
    trainerId: string;
    trainerProfile: TrainerProfile;
    studentId: string;
    packageId: string;
    termVersionId: string;
    dataInicio?: string;
    informacoesAdicionais?: string;
    expiresInDays: number;
  }
) {
  const students = new StudentsRepository(db);
  const packages = new PackagesRepository(db);
  const terms = new TermsRepository(db);
  const invitations = new InvitationsRepository(db);
  const audit = new AuditRepository(db);

  const [student, pkg, version] = await Promise.all([
    students.getById(params.trainerId, params.studentId),
    packages.getById(params.trainerId, params.packageId),
    terms.getVersion(params.trainerId, params.termVersionId),
  ]);

  if (!student) throw new Error("Aluno não encontrado.");
  if (!pkg) throw new Error("Pacote não encontrado.");
  if (!version || version.status !== "publicado") {
    throw new Error("Selecione uma versão de termo publicada.");
  }

  const versionClauses = await terms.getVersionClauses(version.id);

  const variableCtx = {
    aluno: { nome_completo: student.nome_completo, cpf: student.cpf, email: student.email },
    personal: {
      nome_profissional: params.trainerProfile.nome_profissional,
      nome_empresa: params.trainerProfile.nome_empresa,
    },
    pacote: {
      nome: pkg.nome,
      quantidade_aulas: pkg.quantidade_aulas,
      duracao_minutos: pkg.duracao_minutos,
      valor_centavos: pkg.valor_centavos,
      validade_dias: pkg.validade_dias,
    },
    data_inicio: params.dataInicio ?? null,
  };

  const snapshot: DocumentSnapshot = {
    termo_titulo: version.titulo_snapshot,
    termo_versao: version.versao,
    personal: {
      nome_profissional: params.trainerProfile.nome_profissional,
      nome_empresa: params.trainerProfile.nome_empresa,
      cref: params.trainerProfile.cref,
      whatsapp: params.trainerProfile.whatsapp,
      email_contato: params.trainerProfile.email_contato,
    },
    aluno: {
      nome_completo: student.nome_completo,
      cpf: student.cpf,
      email: student.email,
      telefone: student.telefone,
    },
    pacote: {
      nome: pkg.nome,
      quantidade_aulas: pkg.quantidade_aulas,
      duracao_minutos: pkg.duracao_minutos,
      valor_centavos: pkg.valor_centavos,
      validade_dias: pkg.validade_dias,
    },
    data_inicio: params.dataInicio ?? null,
    clausulas: versionClauses.map((c) => ({
      titulo: c.titulo,
      conteudo: resolveVariables(c.conteudo, variableCtx),
      posicao: c.posicao,
      obrigatoria: c.obrigatoria,
    })),
    gerado_em: new Date().toISOString(),
  };

  const token = generateSecureToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + params.expiresInDays);

  const invitation = await invitations.create(params.trainerId, {
    student_id: params.studentId,
    package_id: params.packageId,
    term_version_id: params.termVersionId,
    token,
    data_inicio: params.dataInicio ?? null,
    informacoes_adicionais: params.informacoesAdicionais ?? null,
    document_snapshot: snapshot,
    status: "pendente",
    expires_at: expiresAt.toISOString(),
  });

  await audit.log({
    trainer_id: params.trainerId,
    entity_type: "term_invitation",
    entity_id: invitation.id,
    event_type: "convite_gerado",
    description: `Convite gerado para "${student.nome_completo}" (${pkg.nome}, v${version.versao}).`,
  });

  return invitation;
}
