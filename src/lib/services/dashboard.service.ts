import type { SupabaseClient } from "@supabase/supabase-js";
import { StudentsRepository } from "@/lib/repositories/students.repository";
import { PackagesRepository } from "@/lib/repositories/packages.repository";
import { InvitationsRepository } from "@/lib/repositories/invitations.repository";
import { AcceptancesRepository } from "@/lib/repositories/acceptances.repository";
import { StudentPackagesRepository } from "@/lib/repositories/student-packages.repository";

export async function getDashboardStats(db: SupabaseClient, trainerId: string) {
  const students = new StudentsRepository(db);
  const packages = new PackagesRepository(db);
  const invitations = new InvitationsRepository(db);
  const acceptances = new AcceptancesRepository(db);
  const studentPackages = new StudentPackagesRepository(db);

  const [totalAlunos, alunosAtivos, pacotesAtivos, aguardando, aceitos, recentAcceptances, renewalCandidates] =
    await Promise.all([
      db.from("students").select("id", { count: "exact", head: true }).eq("trainer_id", trainerId),
      students.countByStatus(trainerId, "ativo"),
      packages.countByStatus(trainerId, "ativo"),
      invitations.countByStatus(trainerId, "pendente"),
      invitations.countByStatus(trainerId, "aceito"),
      acceptances.list(trainerId),
      studentPackages.listRenewalCandidates(trainerId),
    ]);

  return {
    totalAlunos: totalAlunos.count ?? 0,
    alunosAtivos,
    pacotesAtivos,
    termosAguardando: aguardando,
    termosAceitos: aceitos,
    recentAcceptances: (recentAcceptances ?? []).slice(0, 8),
    renovacoesPendentes: renewalCandidates.length,
    renewalCandidates: renewalCandidates.slice(0, 8),
  };
}
