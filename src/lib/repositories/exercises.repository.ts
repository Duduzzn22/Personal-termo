import type { SupabaseClient } from "@supabase/supabase-js";
import type { Exercise } from "@/types/workout";

export class ExercisesRepository {
  constructor(private db: SupabaseClient) {}

  async list(trainerId: string, opts?: { activeOnly?: boolean; search?: string }) {
    let query = this.db
      .from("exercises")
      .select("*")
      .eq("trainer_id", trainerId)
      .order("nome", { ascending: true });

    if (opts?.activeOnly) query = query.eq("ativo", true);
    if (opts?.search) query = query.ilike("nome", `%${opts.search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Exercise[];
  }

  async create(trainerId: string, input: Partial<Exercise>) {
    const { data, error } = await this.db
      .from("exercises")
      .insert({ ...input, trainer_id: trainerId })
      .select("*")
      .single();
    if (error) throw error;
    return data as Exercise;
  }

  async update(trainerId: string, id: string, input: Partial<Exercise>) {
    const { data, error } = await this.db
      .from("exercises")
      .update(input)
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as Exercise;
  }
}