"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { StudentsRepository } from "@/lib/repositories/students.repository";
import { AuditRepository } from "@/lib/repositories/audit.repository";
import { studentSchema } from "@/lib/validation/student.schema";

export interface StudentActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

function parseStudentForm(formData: FormData) {
  const raw = {
    nome_completo: formData.get("nome_completo"),
    cpf: formData.get("cpf"),
    data_nascimento: formData.get("data_nascimento"),
    telefone: formData.get("telefone"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
    observacoes: formData.get("observacoes"),
    status: formData.get("status") || "ativo",
  };
  return studentSchema.safeParse(raw);
}

export async function createStudentAction(
  _prevState: StudentActionState,
  formData: FormData
): Promise<StudentActionState> {
  const parsed = parseStudentForm(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Verifique os campos destacados.", fieldErrors };
  }

  const { userId } = await requireTrainer();
  const db = await createClient();
  const students = new StudentsRepository(db);
  const audit = new AuditRepository(db);

  const student = await students.create(userId, parsed.data);
  await audit.log({
    trainer_id: userId,
    entity_type: "student",
    entity_id: student.id,
    event_type: "aluno_criado",
    description: `Aluno "${student.nome_completo}" cadastrado.`,
  });

  revalidatePath("/alunos");
  return { success: true };
}

export async function updateStudentAction(
  studentId: string,
  _prevState: StudentActionState,
  formData: FormData
): Promise<StudentActionState> {
  const parsed = parseStudentForm(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Verifique os campos destacados.", fieldErrors };
  }

  const { userId } = await requireTrainer();
  const db = await createClient();
  const students = new StudentsRepository(db);
  const audit = new AuditRepository(db);

  const student = await students.update(userId, studentId, parsed.data);
  await audit.log({
    trainer_id: userId,
    entity_type: "student",
    entity_id: student.id,
    event_type: "aluno_atualizado",
    description: `Aluno "${student.nome_completo}" atualizado.`,
  });

  revalidatePath("/alunos");
  return { success: true };
}

export async function archiveStudentAction(studentId: string) {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const students = new StudentsRepository(db);
  const audit = new AuditRepository(db);

  const student = await students.update(userId, studentId, { status: "arquivado" });
  await audit.log({
    trainer_id: userId,
    entity_type: "student",
    entity_id: student.id,
    event_type: "aluno_arquivado",
    description: `Aluno "${student.nome_completo}" arquivado.`,
  });

  revalidatePath("/alunos");
}

export async function setStudentStatusAction(studentId: string, status: "ativo" | "inativo" | "arquivado") {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const students = new StudentsRepository(db);
  await students.update(userId, studentId, { status });
  revalidatePath("/alunos");
}
