import type { SupabaseClient } from "@supabase/supabase-js";
import type { Student, StudentStatus } from "@/types/database";

export class StudentsRepository {
  constructor(private db: SupabaseClient) {}

  async list(trainerId: string, opts?: { status?: StudentStatus; search?: string }) {
    let query = this.db
      .from("students")
      .select("*")
      .eq("trainer_id", trainerId)
      .order("nome_completo", { ascending: true });

    if (opts?.status) query = query.eq("status", opts.status);
    if (opts?.search) query = query.ilike("nome_completo", `%${opts.search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return data as Student[];
  }

  async getById(trainerId: string, id: string) {
    const { data, error } = await this.db
      .from("students")
      .select("*")
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as Student | null;
  }

  async create(trainerId: string, input: Partial<Student>) {
    const { data, error } = await this.db
      .from("students")
      .insert({ ...input, trainer_id: trainerId })
      .select("*")
      .single();
    if (error) throw error;
    return data as Student;
  }

  async update(trainerId: string, id: string, input: Partial<Student>) {
    const { data, error } = await this.db
      .from("students")
      .update(input)
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as Student;
  }

  async countByStatus(trainerId: string, status: StudentStatus) {
    const { count, error } = await this.db
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", trainerId)
      .eq("status", status);
    if (error) throw error;
    return count ?? 0;
  }
}
