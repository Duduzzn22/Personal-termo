import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { StudentsRepository } from "@/lib/repositories/students.repository";
import { getAgendaForDate } from "@/lib/services/agenda.service";
import { AgendaPageClient } from "@/components/agenda/AgendaPageClient";
import { todayISO } from "@/lib/utils/agenda";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const { data: dataParam } = await searchParams;
  const data = dataParam && /^\d{4}-\d{2}-\d{2}$/.test(dataParam) ? dataParam : todayISO();

  const { userId } = await requireTrainer();
  const db = await createClient();
  const students = new StudentsRepository(db);

  const [occurrences, activeStudents] = await Promise.all([
    getAgendaForDate(db, userId, data),
    students.list(userId, { status: "ativo" }),
  ]);

  return (
    <AgendaPageClient
      data={data}
      occurrences={occurrences}
      students={activeStudents.map((s) => ({ id: s.id, nome_completo: s.nome_completo }))}
    />
  );
}
