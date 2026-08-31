import type { SupabaseClient } from "@supabase/supabase-js";
import type { TermTemplate, TermClause, TermVersion, TermVersionClause } from "@/types/database";

export class TermsRepository {
  constructor(private db: SupabaseClient) {}

  // ---- Templates ----

  async listTemplates(trainerId: string) {
    const { data, error } = await this.db
      .from("term_templates")
      .select("*")
      .eq("trainer_id", trainerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as TermTemplate[];
  }

  async getTemplate(trainerId: string, id: string) {
    const { data, error } = await this.db
      .from("term_templates")
      .select("*")
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as TermTemplate | null;
  }

  async createTemplate(trainerId: string, input: Partial<TermTemplate>) {
    const { data, error } = await this.db
      .from("term_templates")
      .insert({ ...input, trainer_id: trainerId })
      .select("*")
      .single();
    if (error) throw error;
    return data as TermTemplate;
  }

  async updateTemplate(trainerId: string, id: string, input: Partial<TermTemplate>) {
    const { data, error } = await this.db
      .from("term_templates")
      .update(input)
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as TermTemplate;
  }

  // ---- Draft clauses ----

  async listClauses(trainerId: string, templateId: string) {
    const { data, error } = await this.db
      .from("term_clauses")
      .select("*")
      .eq("trainer_id", trainerId)
      .eq("template_id", templateId)
      .order("posicao", { ascending: true });
    if (error) throw error;
    return data as TermClause[];
  }

  async createClause(trainerId: string, input: Partial<TermClause>) {
    const { data, error } = await this.db
      .from("term_clauses")
      .insert({ ...input, trainer_id: trainerId })
      .select("*")
      .single();
    if (error) throw error;
    return data as TermClause;
  }

  async updateClause(trainerId: string, id: string, input: Partial<TermClause>) {
    const { data, error } = await this.db
      .from("term_clauses")
      .update(input)
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as TermClause;
  }

  async deleteClause(trainerId: string, id: string) {
    const { error } = await this.db
      .from("term_clauses")
      .delete()
      .eq("trainer_id", trainerId)
      .eq("id", id);
    if (error) throw error;
  }

  async reorderClauses(trainerId: string, ordered: { id: string; posicao: number }[]) {
    await Promise.all(
      ordered.map(({ id, posicao }) =>
        this.db
          .from("term_clauses")
          .update({ posicao })
          .eq("trainer_id", trainerId)
          .eq("id", id)
      )
    );
  }

  // ---- Versions (imutáveis após publicação) ----

  async listVersions(trainerId: string, templateId: string) {
    const { data, error } = await this.db
      .from("term_versions")
      .select("*")
      .eq("trainer_id", trainerId)
      .eq("template_id", templateId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as TermVersion[];
  }

  async listPublishedVersions(trainerId: string) {
    const { data, error } = await this.db
      .from("term_versions")
      .select("*, term_templates(titulo)")
      .eq("trainer_id", trainerId)
      .eq("status", "publicado")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return data as (TermVersion & { term_templates: { titulo: string } })[];
  }

  async getVersion(trainerId: string, id: string) {
    const { data, error } = await this.db
      .from("term_versions")
      .select("*")
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as TermVersion | null;
  }

  async createVersion(trainerId: string, input: Partial<TermVersion>) {
    const { data, error } = await this.db
      .from("term_versions")
      .insert({ ...input, trainer_id: trainerId })
      .select("*")
      .single();
    if (error) throw error;
    return data as TermVersion;
  }

  async getVersionClauses(versionId: string) {
    const { data, error } = await this.db
      .from("term_version_clauses")
      .select("*")
      .eq("term_version_id", versionId)
      .order("posicao", { ascending: true });
    if (error) throw error;
    return data as TermVersionClause[];
  }

  async insertVersionClauses(rows: Partial<TermVersionClause>[]) {
    if (rows.length === 0) return;
    const { error } = await this.db.from("term_version_clauses").insert(rows);
    if (error) throw error;
  }
}
