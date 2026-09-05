import type { SupabaseClient } from "@supabase/supabase-js";
import type { Package, StudentPackage } from "@/types/database";

export type StudentPackageWithPackage = StudentPackage & {
  packages: Package | null;
};

export class StudentPackagesRepository {
  constructor(private db: SupabaseClient) {}

  async listByStudent(trainerId: string, studentId: string) {
    const { data, error } = await this.db
      .from("student_packages")
      .select("*, packages(*)")
      .eq("trainer_id", trainerId)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as StudentPackageWithPackage[];
  }

  async getById(trainerId: string, id: string) {
    const { data, error } = await this.db
      .from("student_packages")
      .select("*, packages(*)")
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data as StudentPackageWithPackage | null;
  }
}
