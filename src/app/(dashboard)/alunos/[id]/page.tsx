import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { StudentsRepository } from "@/lib/repositories/students.repository";
import { InvitationsRepository } from "@/lib/repositories/invitations.repository";
import { AgendaRepository } from "@/lib/repositories/agenda.repository";
import { StudentDetailClient } from "@/components/students/StudentDetailClient";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await requireTrainer();
  const db = await createClient();
  const students = new StudentsRepository(db);
  const invitations = new InvitationsRepository(db);
  const agenda = new AgendaRepository(db);

  const student = await students.getById(userId, id);
  if (!student) notFound();

  const [studentInvitations, schedules] = await Promise.all([
    invitations.list(userId).then((all) => all.filter((inv: { student_id: string }) => inv.student_id === id)),
    agenda.listSchedulesByStudent(userId, id),
  ]);

  return (
    <div className="space-y-4">
      <Link href="/alunos" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para alunos
      </Link>
      <StudentDetailClient student={student} invitations={studentInvitations} schedules={schedules} />
    </div>
  );
}
