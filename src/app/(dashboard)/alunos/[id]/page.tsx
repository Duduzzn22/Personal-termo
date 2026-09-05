import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { StudentsRepository } from "@/lib/repositories/students.repository";
import { InvitationsRepository } from "@/lib/repositories/invitations.repository";
import { AgendaRepository } from "@/lib/repositories/agenda.repository";
import { StudentPackagesRepository } from "@/lib/repositories/student-packages.repository";
import { PhysicalAssessmentsRepository } from "@/lib/repositories/physical-assessments.repository";
import { WorkoutPlansRepository } from "@/lib/repositories/workout-plans.repository";
import { StudentDetailClient } from "@/components/students/StudentDetailClient";
import { StudentPortalAccessCard } from "@/components/portal/StudentPortalAccessCard";
import type { StudentPortalAccount } from "@/types/student-portal";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await requireTrainer();
  const db = await createClient();
  const students = new StudentsRepository(db);
  const invitations = new InvitationsRepository(db);
  const agenda = new AgendaRepository(db);
  const studentPackages = new StudentPackagesRepository(db);
  const physicalAssessments = new PhysicalAssessmentsRepository(db);
  const workoutPlans = new WorkoutPlansRepository(db);

  const student = await students.getById(userId, id);
  if (!student) notFound();

  const [studentInvitations, schedules, contractedPackages, sessions, assessments, workouts, portalResult] = await Promise.all([
    invitations.list(userId).then((all) => all.filter((inv: { student_id: string }) => inv.student_id === id)),
    agenda.listSchedulesByStudent(userId, id),
    studentPackages.listByStudent(userId, id),
    agenda.listSessionsByStudent(userId, id),
    physicalAssessments.listByStudent(userId, id),
    workoutPlans.listByStudent(userId, id),
    db.from("student_portal_accounts").select("*").eq("trainer_id", userId).eq("student_id", id).maybeSingle(),
  ]);

  return (
    <div className="space-y-4">
      <Link href="/alunos" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para alunos
      </Link>
      <StudentDetailClient
        student={student}
        invitations={studentInvitations}
        schedules={schedules}
        studentPackages={contractedPackages}
        sessions={sessions}
        assessments={assessments}
        workouts={workouts}
      />
      <StudentPortalAccessCard
        student={student}
        account={(portalResult.data as StudentPortalAccount | null) ?? null}
      />
    </div>
  );
}
