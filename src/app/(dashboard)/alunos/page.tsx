import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { StudentsRepository } from "@/lib/repositories/students.repository";
import { StudentsClient } from "@/components/students/StudentsClient";

export default async function AlunosPage() {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const students = await new StudentsRepository(db).list(userId);

  return <StudentsClient students={students} />;
}
