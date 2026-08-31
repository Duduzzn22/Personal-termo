import type { SupabaseClient } from "@supabase/supabase-js";
import type { Package, PackageStatus } from "@/types/database";

export class PackagesRepository {
  constructor(private db: SupabaseClient) {}

  async list(trainerId: string, opts?: { status?: PackageStatus }) {
    let query = this.db
      .from("packages")
      .select("*")
      .eq("trainer_id", trainerId)
      .order("created_at", { ascending: false });
    if (opts?.status) query = query.eq("status", opts.status);
    const { data, error } = await query;
    if (error) throw error;
    return data as Package[];
  }

  async getById(trainerId: string, id: string) {
    const { data, error } = await this.db
      .from("packages")
      .select("*")
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as Package | null;
  }

  async create(trainerId: string, input: Partial<Package>) {
    const { data, error } = await this.db
      .from("packages")
      .insert({ ...input, trainer_id: trainerId })
      .select("*")
      .single();
    if (error) throw error;
    return data as Package;
  }

  async update(trainerId: string, id: string, input: Partial<Package>) {
    const { data, error } = await this.db
      .from("packages")
      .update(input)
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as Package;
  }

  async countByStatus(trainerId: string, status: PackageStatus) {
    const { count, error } = await this.db
      .from("packages")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", trainerId)
      .eq("status", status);
    if (error) throw error;
    return count ?? 0;
  }
}
