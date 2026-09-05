import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { StudentsRepository } from "@/lib/repositories/students.repository";
import { ExercisesRepository } from "@/lib/repositories/exercises.repository";
import { WorkoutPlansRepository } from "@/lib/repositories/workout-plans.repository";
import { WorkoutsClient } from "@/components/workouts/WorkoutsClient";

export default async function TreinosPage() {
  const { userId } = await requireTrainer();
  const db = await createClient();

  const [plans, exercises, students] = await Promise.all([
    new WorkoutPlansRepository(db).list(userId),
    new ExercisesRepository(db).list(userId),
    new StudentsRepository(db).list(userId, { status: "ativo" }),
  ]);

  return <WorkoutsClient plans={plans} exercises={exercises} students={students} />;
}
