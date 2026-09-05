import type { SupabaseClient } from "@supabase/supabase-js";
import type { Package, StudentPackage } from "@/types/database";

export type StudentPackageWithPackage = StudentPackage & {
  packages: Package | null;
};

export type RenewalCandidate = StudentPackage & {
  students: { id: string; nome_completo: string } | null;
  packages: { id: string; nome: string; quantidade_aulas: number } | null;
  aulas_restantes: number;
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

  async listRenewalCandidates(trainerId: string, threshold = 2) {
    const { data, error } = await this.db
      .from("student_packages")
      .select("*, students(id, nome_completo), packages(id, nome, quantidade_aulas)")
      .eq("trainer_id", trainerId)
      .in("status", ["ativo", "concluido"])
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return ((data ?? []) as unknown as Omit<RenewalCandidate, "aulas_restantes">[])
      .map((row) => ({
        ...row,
        aulas_restantes: Math.max((row.packages?.quantidade_aulas ?? 0) - row.aulas_realizadas, 0),
      }))
      .filter((row) => row.status === "concluido" || row.aulas_restantes <= threshold)
      .sort((a, b) => a.aulas_restantes - b.aulas_restantes);
  }
}
