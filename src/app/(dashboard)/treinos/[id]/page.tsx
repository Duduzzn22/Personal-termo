import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { StudentsRepository } from "@/lib/repositories/students.repository";
import { ExercisesRepository } from "@/lib/repositories/exercises.repository";
import { WorkoutPlansRepository } from "@/lib/repositories/workout-plans.repository";
import { WorkoutPlanDetailClient } from "@/components/workouts/WorkoutPlanDetailClient";

export default async function WorkoutPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await requireTrainer();
  const db = await createClient();

  const plansRepo = new WorkoutPlansRepository(db);
  const plan = await plansRepo.getById(userId, id);
  if (!plan) notFound();

  const [exercises, students] = await Promise.all([
    new ExercisesRepository(db).list(userId, { activeOnly: true }),
    new StudentsRepository(db).list(userId),
  ]);

  return (
    <div className="space-y-4">
      <Link href="/treinos" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para treinos
      </Link>
      <WorkoutPlanDetailClient plan={plan} exercises={exercises} students={students} />
    </div>
  );
}
