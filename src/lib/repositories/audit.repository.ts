import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditEventType } from "@/types/database";

export class AuditRepository {
  constructor(private db: SupabaseClient) {}

  async log(entry: {
    trainer_id: string;
    entity_type: string;
    entity_id?: string | null;
    event_type: AuditEventType;
    description: string;
    metadata?: Record<string, unknown>;
  }) {
    const { error } = await this.db.from("audit_logs").insert({
      trainer_id: entry.trainer_id,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      event_type: entry.event_type,
      description: entry.description,
      metadata: entry.metadata ?? {},
    });
    if (error) throw error;
  }

  async listRecent(trainerId: string, limit = 50) {
    const { data, error } = await this.db
      .from("audit_logs")
      .select("*")
      .eq("trainer_id", trainerId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  }

  async listForEntity(trainerId: string, entityType: string, entityId: string) {
    const { data, error } = await this.db
      .from("audit_logs")
      .select("*")
      .eq("trainer_id", trainerId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }
}
