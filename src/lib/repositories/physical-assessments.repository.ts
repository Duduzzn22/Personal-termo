import type { SupabaseClient } from "@supabase/supabase-js";
import type { PhysicalAssessment, PhysicalAssessmentInput } from "@/types/assessment";

export class PhysicalAssessmentsRepository {
  constructor(private db: SupabaseClient) {}

  async listByStudent(trainerId: string, studentId: string) {
    const { data, error } = await this.db
      .from("physical_assessments")
      .select("*")
      .eq("trainer_id", trainerId)
      .eq("student_id", studentId)
      .order("data_avaliacao", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as PhysicalAssessment[];
  }

  async create(trainerId: string, studentId: string, input: PhysicalAssessmentInput) {
    const { data, error } = await this.db
      .from("physical_assessments")
      .insert({ ...input, trainer_id: trainerId, student_id: studentId })
      .select("*")
      .single();

    if (error) throw error;
    return data as PhysicalAssessment;
  }

  async update(trainerId: string, studentId: string, id: string, input: PhysicalAssessmentInput) {
    const { data, error } = await this.db
      .from("physical_assessments")
      .update(input)
      .eq("trainer_id", trainerId)
      .eq("student_id", studentId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return data as PhysicalAssessment;
  }
}