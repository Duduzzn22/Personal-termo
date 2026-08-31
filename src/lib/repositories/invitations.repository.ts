import type { SupabaseClient } from "@supabase/supabase-js";
import type { TermInvitation, InvitationStatus } from "@/types/database";

export class InvitationsRepository {
  constructor(private db: SupabaseClient) {}

  async list(trainerId: string, opts?: { status?: InvitationStatus; search?: string }) {
    let query = this.db
      .from("term_invitations")
      .select(
        "*, students(nome_completo), packages(nome), term_versions(versao, term_templates(titulo)), acceptances(id, protocolo, accepted_at)"
      )
      .eq("trainer_id", trainerId)
      .order("created_at", { ascending: false });
    if (opts?.status) query = query.eq("status", opts.status);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getByIdWithAcceptance(trainerId: string, id: string) {
    const { data, error } = await this.db
      .from("term_invitations")
      .select(
        "*, students(*), packages(*), term_versions(*, term_templates(titulo)), acceptances(*)"
      )
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async getById(trainerId: string, id: string) {
    const { data, error } = await this.db
      .from("term_invitations")
      .select(
        "*, students(*), packages(*), term_versions(*, term_templates(titulo))"
      )
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  /** Busca por token — usada SOMENTE via cliente admin na página pública. */
  async getByToken(db: SupabaseClient, token: string) {
    const { data, error } = await db
      .from("term_invitations")
      .select("*, students(*), packages(*), term_versions(*, term_templates(titulo)), trainer_profiles(*)")
      .eq("token", token)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async create(trainerId: string, input: Partial<TermInvitation>) {
    const { data, error } = await this.db
      .from("term_invitations")
      .insert({ ...input, trainer_id: trainerId })
      .select("*")
      .single();
    if (error) throw error;
    return data as TermInvitation;
  }

  async updateStatus(trainerId: string, id: string, status: InvitationStatus) {
    const { error } = await this.db
      .from("term_invitations")
      .update({ status })
      .eq("trainer_id", trainerId)
      .eq("id", id);
    if (error) throw error;
  }

  /** Atualização usada pela rota pública (cliente admin, sem trainer_id na query). */
  async updateStatusPublic(db: SupabaseClient, id: string, status: InvitationStatus) {
    const { error } = await db.from("term_invitations").update({ status }).eq("id", id);
    if (error) throw error;
  }

  async markSent(trainerId: string, id: string) {
    const { error } = await this.db
      .from("term_invitations")
      .update({ sent_at: new Date().toISOString() })
      .eq("trainer_id", trainerId)
      .eq("id", id);
    if (error) throw error;
  }

  /** Alunos com um aceite ('aceito') para QUALQUER versão publicada deste template. */
  async listAcceptedStudentsForTemplate(trainerId: string, templateId: string) {
    const { data, error } = await this.db
      .from("term_invitations")
      .select("student_id, students(id, nome_completo), term_versions!inner(template_id)")
      .eq("trainer_id", trainerId)
      .eq("status", "aceito")
      .eq("term_versions.template_id", templateId);
    if (error) throw error;
    const seen = new Map<string, { id: string; nome_completo: string }>();
    for (const row of (data ?? []) as unknown as {
      students: { id: string; nome_completo: string } | null;
    }[]) {
      if (row.students) seen.set(row.students.id, row.students);
    }
    return Array.from(seen.values());
  }

  async countByStatus(trainerId: string, status: InvitationStatus) {
    const { count, error } = await this.db
      .from("term_invitations")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", trainerId)
      .eq("status", status);
    if (error) throw error;
    return count ?? 0;
  }
}
