"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { StudentsRepository } from "@/lib/repositories/students.repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendStudentPortalWelcomeEmail } from "@/lib/services/student-portal-email.service";

export interface StudentPortalActionState {
  success?: boolean;
  error?: string;
  message?: string;
}

async function requestOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const protocol = h.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

export async function enableStudentPortalAction(
  studentId: string,
  _prevState: StudentPortalActionState,
  _formData: FormData
): Promise<StudentPortalActionState> {
  try {
    const { userId, profile } = await requireTrainer();
    const db = await createClient();
    const student = await new StudentsRepository(db).getById(userId, studentId);

    if (!student) return { error: "Aluno não encontrado." };
    if (!student.email) return { error: "Cadastre um e-mail no aluno antes de habilitar o portal." };

    const admin = createAdminClient();
    const { data: existingAccount } = await admin
      .from("student_portal_accounts")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle();

    if (existingAccount) {
      await admin
        .from("student_portal_accounts")
        .update({ enabled: true })
        .eq("id", existingAccount.id);

      await sendStudentPortalWelcomeEmail({
        email: existingAccount.email,
        studentName: student.nome_completo,
        trainerName: profile.nome_profissional,
      });

      revalidatePath(`/alunos/${studentId}`);
      return { success: true, message: "Acesso reativado e instruções reenviadas." };
    }

    let authUserId: string | null = null;
    const created = await admin.auth.admin.createUser({
      email: student.email,
      email_confirm: true,
      app_metadata: { role: "student" },
      user_metadata: { nome_completo: student.nome_completo },
    });

    if (created.data.user) {
      authUserId = created.data.user.id;
    } else {
      const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = listed.data.users.find(
        (user) => user.email?.toLowerCase() === student.email?.toLowerCase()
      );

      if (!found) return { error: "Não foi possível criar a conta de acesso do aluno." };
      if (found.app_metadata?.role !== "student") {
        return { error: "Este e-mail já está vinculado a outro tipo de conta no sistema." };
      }
      authUserId = found.id;
    }

    const { data: linkedElsewhere } = await admin
      .from("student_portal_accounts")
      .select("student_id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (linkedElsewhere && linkedElsewhere.student_id !== studentId) {
      return { error: "Este e-mail já está vinculado ao portal de outro aluno." };
    }

    const { error: insertError } = await admin.from("student_portal_accounts").insert({
      trainer_id: userId,
      student_id: studentId,
      auth_user_id: authUserId,
      email: student.email.toLowerCase(),
      enabled: true,
    });

    if (insertError) return { error: "Não foi possível vincular a conta ao aluno." };

    await sendStudentPortalWelcomeEmail({
      email: student.email,
      studentName: student.nome_completo,
      trainerName: profile.nome_profissional,
    });

    revalidatePath(`/alunos/${studentId}`);
    return { success: true, message: "Portal habilitado. O aluno recebeu as instruções por e-mail." };
  } catch (error) {
    console.error("Falha ao habilitar portal do aluno:", error);
    return { error: "Não foi possível habilitar o portal do aluno." };
  }
}

export async function disableStudentPortalAction(
  studentId: string,
  _prevState: StudentPortalActionState,
  _formData: FormData
): Promise<StudentPortalActionState> {
  try {
    const { userId } = await requireTrainer();
    const db = await createClient();
    const { error } = await db
      .from("student_portal_accounts")
      .update({ enabled: false })
      .eq("trainer_id", userId)
      .eq("student_id", studentId);

    if (error) throw error;
    revalidatePath(`/alunos/${studentId}`);
    return { success: true, message: "Acesso do aluno desativado." };
  } catch {
    return { error: "Não foi possível desativar o acesso." };
  }
}

export async function resendStudentPortalInstructionsAction(
  studentId: string,
  _prevState: StudentPortalActionState,
  _formData: FormData
): Promise<StudentPortalActionState> {
  try {
    const { userId, profile } = await requireTrainer();
    const db = await createClient();
    const student = await new StudentsRepository(db).getById(userId, studentId);
    if (!student) return { error: "Aluno não encontrado." };

    const { data: account } = await db
      .from("student_portal_accounts")
      .select("email,enabled")
      .eq("trainer_id", userId)
      .eq("student_id", studentId)
      .maybeSingle();

    if (!account?.enabled) return { error: "O portal deste aluno não está ativo." };

    const result = await sendStudentPortalWelcomeEmail({
      email: account.email,
      studentName: student.nome_completo,
      trainerName: profile.nome_profissional,
    });

    return result.sent
      ? { success: true, message: "Instruções reenviadas por e-mail." }
      : { error: "Não foi possível enviar o e-mail. Verifique a configuração do Resend." };
  } catch {
    return { error: "Não foi possível reenviar as instruções." };
  }
}

export async function requestStudentMagicLinkAction(
  _prevState: StudentPortalActionState,
  formData: FormData
): Promise<StudentPortalActionState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return { error: "Informe um e-mail válido." };

  const supabase = await createClient();
  const origin = await requestOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback?next=/portal`,
    },
  });

  if (error) console.error("Falha ao solicitar magic link do aluno:", error.message);

  return {
    success: true,
    message: "Se este e-mail tiver acesso habilitado, enviaremos um link para entrar no portal.",
  };
}

export async function studentPortalSignOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/portal/login");
}
