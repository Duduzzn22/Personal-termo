import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { InvitationsRepository } from "@/lib/repositories/invitations.repository";
import { AcceptancesRepository } from "@/lib/repositories/acceptances.repository";
import { AuditRepository } from "@/lib/repositories/audit.repository";
import { generateProtocol, hashDocument } from "@/lib/utils/security";
import type { Acceptance, TermInvitation } from "@/types/database";

export type InvitationLookupResult =
  | { status: "ok"; invitation: TermInvitation & { trainer_profiles: unknown } }
  | { status: "not_found" }
  | { status: "expired" }
  | { status: "cancelled" }
  | { status: "already_accepted"; acceptance: Acceptance };

/**
 * Busca um convite pelo token (rota pública) e classifica seu estado atual.
 * Usa o cliente admin: o token é o único segredo que autoriza este acesso.
 */
export async function lookupInvitationByToken(
  adminDb: SupabaseClient,
  token: string
): Promise<InvitationLookupResult> {
  const invitations = new InvitationsRepository(adminDb);
  const acceptances = new AcceptancesRepository(adminDb);

  const invitation = await invitations.getByToken(adminDb, token);
  if (!invitation) return { status: "not_found" };

  if (invitation.status === "cancelado") return { status: "cancelled" };

  if (invitation.status === "aceito") {
    const acceptance = await acceptances.getByIdPublic(adminDb, invitation.id).then(async () => {
      // acceptances.invitation_id é único — buscamos diretamente.
      const { data } = await adminDb
        .from("acceptances")
        .select("*")
        .eq("invitation_id", invitation.id)
        .maybeSingle();
      return data as Acceptance;
    });
    if (acceptance) return { status: "already_accepted", acceptance };
  }

  if (invitation.expires_at && new Date(invitation.expires_at).getTime() < Date.now()) {
    if (invitation.status !== "expirado") {
      await invitations.updateStatusPublic(adminDb, invitation.id, "expirado");
    }
    return { status: "expired" };
  }

  // pendente ou nova_versao_pendente -> ok para aceitar
  return { status: "ok", invitation: invitation as TermInvitation & { trainer_profiles: unknown } };
}

export async function logLinkAccessed(adminDb: SupabaseClient, invitation: TermInvitation) {
  const audit = new AuditRepository(adminDb);
  await audit.log({
    trainer_id: invitation.trainer_id,
    entity_type: "term_invitation",
    entity_id: invitation.id,
    event_type: "link_acessado",
    description: "Aluno acessou o link do termo.",
  });
}

/**
 * Registra o aceite eletrônico: gera protocolo único, calcula o hash SHA-256
 * do snapshot já congelado no convite, grava o registro imutável e marca o
 * convite como aceito.
 */
export async function acceptInvitation(
  adminDb: SupabaseClient,
  params: {
    token: string;
    ipAddress: string | null;
    userAgent: string | null;
    timezone: string;
  }
): Promise<{ acceptance: Acceptance; invitation: TermInvitation }> {
  const invitations = new InvitationsRepository(adminDb);
  const acceptances = new AcceptancesRepository(adminDb);
  const audit = new AuditRepository(adminDb);

  const invitation = await invitations.getByToken(adminDb, params.token);
  if (!invitation) throw new Error("Convite não encontrado.");
  if (invitation.status === "cancelado") throw new Error("Este convite foi cancelado.");
  if (invitation.status === "aceito") throw new Error("Este termo já foi aceito anteriormente.");
  if (invitation.expires_at && new Date(invitation.expires_at).getTime() < Date.now()) {
    await invitations.updateStatusPublic(adminDb, invitation.id, "expirado");
    throw new Error("Este link expirou. Solicite um novo link ao seu personal trainer.");
  }

  const documentHash = hashDocument(invitation.document_snapshot);
  const protocolo = generateProtocol();

  const acceptance = await acceptances.create(adminDb, {
    invitation_id: invitation.id,
    trainer_id: invitation.trainer_id,
    student_id: invitation.student_id,
    term_id: (invitation.term_versions as { template_id?: string })?.template_id,
    term_version_id: invitation.term_version_id,
    package_id: invitation.package_id,
    protocolo,
    document_snapshot: invitation.document_snapshot,
    document_hash: documentHash,
    checkbox_confirmado: true,
    timezone: params.timezone,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
    status: "ativo",
  });

  await invitations.updateStatusPublic(adminDb, invitation.id, "aceito");

  await audit.log({
    trainer_id: invitation.trainer_id,
    entity_type: "acceptance",
    entity_id: acceptance.id,
    event_type: "termo_aceito",
    description: `Termo aceito. Protocolo ${protocolo}.`,
    metadata: { protocolo },
  });

  return { acceptance, invitation };
}
