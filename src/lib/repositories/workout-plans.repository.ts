import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Exercise,
  WorkoutPlan,
  WorkoutPlanDetail,
  WorkoutPlanItemWithExercise,
  WorkoutPlanWithStudent,
} from "@/types/workout";

interface WorkoutItemInput {
  exercise_id: string;
  bloco?: string | null;
  series?: number | null;
  repeticoes?: string | null;
  carga?: string | null;
  descanso_segundos?: number | null;
  observacoes?: string | null;
}

export class WorkoutPlansRepository {
  constructor(private db: SupabaseClient) {}

  async list(trainerId: string) {
    const [{ data: plans, error: plansError }, { data: itemRows, error: itemsError }] = await Promise.all([
      this.db
        .from("workout_plans")
        .select("*, student:students(id,nome_completo,status)")
        .eq("trainer_id", trainerId)
        .order("created_at", { ascending: false }),
      this.db
        .from("workout_plan_items")
        .select("workout_plan_id")
        .eq("trainer_id", trainerId),
    ]);

    if (plansError) throw plansError;
    if (itemsError) throw itemsError;

    const counts = new Map<string, number>();
    for (const row of itemRows ?? []) {
      counts.set(row.workout_plan_id, (counts.get(row.workout_plan_id) ?? 0) + 1);
    }

    return (plans ?? []).map((plan) => ({
      ...(plan as WorkoutPlan & { student: WorkoutPlanWithStudent["student"] }),
      items_count: counts.get(plan.id) ?? 0,
    })) as WorkoutPlanWithStudent[];
  }

  async listByStudent(trainerId: string, studentId: string) {
    const { data, error } = await this.db
      .from("workout_plans")
      .select("*, student:students(id,nome_completo,status)")
      .eq("trainer_id", trainerId)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const plans = (data ?? []) as Array<WorkoutPlan & { student: WorkoutPlanWithStudent["student"] }>;
    if (plans.length === 0) return [];

    const { data: itemRows, error: itemsError } = await this.db
      .from("workout_plan_items")
      .select("workout_plan_id")
      .eq("trainer_id", trainerId)
      .in("workout_plan_id", plans.map((plan) => plan.id));

    if (itemsError) throw itemsError;

    const counts = new Map<string, number>();
    for (const row of itemRows ?? []) {
      counts.set(row.workout_plan_id, (counts.get(row.workout_plan_id) ?? 0) + 1);
    }

    return plans.map((plan) => ({ ...plan, items_count: counts.get(plan.id) ?? 0 })) as WorkoutPlanWithStudent[];
  }

  async getById(trainerId: string, id: string) {
    const { data: plan, error } = await this.db
      .from("workout_plans")
      .select("*, student:students(id,nome_completo,status)")
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!plan) return null;

    const { data: items, error: itemsError } = await this.db
      .from("workout_plan_items")
      .select("*, exercise:exercises(*)")
      .eq("trainer_id", trainerId)
      .eq("workout_plan_id", id)
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: true });

    if (itemsError) throw itemsError;

    return {
      ...(plan as WorkoutPlan & { student: WorkoutPlanWithStudent["student"] }),
      items_count: items?.length ?? 0,
      items: (items ?? []).map((item) => ({
        ...item,
        exercise: item.exercise as unknown as Exercise,
      })) as WorkoutPlanItemWithExercise[],
    } as WorkoutPlanDetail;
  }

  async create(trainerId: string, input: Partial<WorkoutPlan>) {
    const { data, error } = await this.db
      .from("workout_plans")
      .insert({ ...input, trainer_id: trainerId })
      .select("*")
      .single();
    if (error) throw error;
    return data as WorkoutPlan;
  }

  async update(trainerId: string, id: string, input: Partial<WorkoutPlan>) {
    const { data, error } = await this.db
      .from("workout_plans")
      .update(input)
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as WorkoutPlan;
  }

  async addItem(trainerId: string, planId: string, input: WorkoutItemInput) {
    const { count, error: countError } = await this.db
      .from("workout_plan_items")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", trainerId)
      .eq("workout_plan_id", planId);

    if (countError) throw countError;

    const { data, error } = await this.db
      .from("workout_plan_items")
      .insert({
        ...input,
        trainer_id: trainerId,
        workout_plan_id: planId,
        ordem: count ?? 0,
      })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async updateItem(trainerId: string, planId: string, itemId: string, input: WorkoutItemInput) {
    const { data, error } = await this.db
      .from("workout_plan_items")
      .update(input)
      .eq("trainer_id", trainerId)
      .eq("workout_plan_id", planId)
      .eq("id", itemId)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  async removeItem(trainerId: string, planId: string, itemId: string) {
    const { error } = await this.db
      .from("workout_plan_items")
      .delete()
      .eq("trainer_id", trainerId)
      .eq("workout_plan_id", planId)
      .eq("id", itemId);
    if (error) throw error;
  }
}