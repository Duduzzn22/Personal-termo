"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { InvitationsRepository } from "@/lib/repositories/invitations.repository";
import { AuditRepository } from "@/lib/repositories/audit.repository";
import { invitationSchema } from "@/lib/validation/invitation.schema";
import { createInvitation } from "@/lib/services/invitations.service";
import { StudentsRepository } from "@/lib/repositories/students.repository";
import { PackagesRepository } from "@/lib/repositories/packages.repository";
import { TermsRepository } from "@/lib/repositories/terms.repository";

export async function getInvitationFormOptionsAction() {
  const { userId } = await requireTrainer();
  const db = await createClient();

  const [students, packages, versions] = await Promise.all([
    new StudentsRepository(db).list(userId, { status: "ativo" }),
    new PackagesRepository(db).list(userId, { status: "ativo" }),
    new TermsRepository(db).listPublishedVersions(userId),
  ]);

  return {
    students: students.map((s) => ({ id: s.id, nome_completo: s.nome_completo })),
    packages: packages.map((p) => ({ id: p.id, nome: p.nome })),
    versions: versions.map((v) => ({
      id: v.id,
      label: `${v.term_templates?.titulo ?? "Termo"} · v${v.versao}`,
    })),
  };
}

export interface InvitationActionState {
  error?: string;
  success?: boolean;
  link?: string;
  invitationId?: string;
}

export async function createInvitationAction(
  _prevState: InvitationActionState,
  formData: FormData
): Promise<InvitationActionState> {
  const parsed = invitationSchema.safeParse({
    student_id: formData.get("student_id"),
    package_id: formData.get("package_id"),
    term_version_id: formData.get("term_version_id"),
    data_inicio: formData.get("data_inicio"),
    informacoes_adicionais: formData.get("informacoes_adicionais"),
    expires_in_days: formData.get("expires_in_days") || 30,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Preencha todos os campos obrigatórios." };
  }

  const { userId, profile } = await requireTrainer();
  const db = await createClient();

  try {
    const invitation = await createInvitation(db, {
      trainerId: userId,
      trainerProfile: profile,
      studentId: parsed.data.student_id,
      packageId: parsed.data.package_id,
      termVersionId: parsed.data.term_version_id,
      dataInicio: parsed.data.data_inicio,
      informacoesAdicionais: parsed.data.informacoes_adicionais,
      expiresInDays: parsed.data.expires_in_days,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const link = `${appUrl}/aceite/${invitation.token}`;

    revalidatePath("/aceites");
    revalidatePath(`/alunos/${parsed.data.student_id}`);
    return { success: true, link, invitationId: invitation.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível gerar o convite." };
  }
}

export async function markInvitationSentAction(invitationId: string) {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const invitations = new InvitationsRepository(db);
  const audit = new AuditRepository(db);

  await invitations.markSent(userId, invitationId);
  await audit.log({
    trainer_id: userId,
    entity_type: "term_invitation",
    entity_id: invitationId,
    event_type: "convite_enviado",
    description: "Link copiado/reenviado ao aluno.",
  });

  revalidatePath("/aceites");
}

export async function cancelInvitationAction(invitationId: string) {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const invitations = new InvitationsRepository(db);
  const audit = new AuditRepository(db);

  await invitations.updateStatus(userId, invitationId, "cancelado");
  await audit.log({
    trainer_id: userId,
    entity_type: "term_invitation",
    entity_id: invitationId,
    event_type: "convite_cancelado",
    description: "Convite cancelado pelo personal.",
  });

  revalidatePath("/aceites");
}
