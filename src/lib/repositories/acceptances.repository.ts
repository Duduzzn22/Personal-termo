import type { SupabaseClient } from "@supabase/supabase-js";
import type { Acceptance } from "@/types/database";

export class AcceptancesRepository {
  constructor(private db: SupabaseClient) {}

  async list(trainerId: string) {
    const { data, error } = await this.db
      .from("acceptances")
      .select(
        "*, students(nome_completo), packages(nome), term_versions(versao, term_templates(titulo))"
      )
      .eq("trainer_id", trainerId)
      .order("accepted_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  async getById(trainerId: string, id: string) {
    const { data, error } = await this.db
      .from("acceptances")
      .select(
        "*, students(*), packages(*), term_versions(*, term_templates(titulo)), trainer_profiles(*)"
      )
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async getByProtocolPublic(db: SupabaseClient, protocolo: string) {
    const { data, error } = await db
      .from("acceptances")
      .select(
        "*, students(*), packages(*), term_versions(*, term_templates(titulo)), trainer_profiles(*)"
      )
      .eq("protocolo", protocolo)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async getByIdPublic(db: SupabaseClient, id: string) {
    const { data, error } = await db
      .from("acceptances")
      .select(
        "*, students(*), packages(*), term_versions(*, term_templates(titulo)), trainer_profiles(*)"
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async create(db: SupabaseClient, input: Partial<Acceptance>) {
    const { data, error } = await db.from("acceptances").insert(input).select("*").single();
    if (error) throw error;
    return data as Acceptance;
  }

  async countRecent(trainerId: string) {
    const { count, error } = await this.db
      .from("acceptances")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", trainerId);
    if (error) throw error;
    return count ?? 0;
  }
}
