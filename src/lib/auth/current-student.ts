import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Student, TrainerProfile } from "@/types/database";
import type { StudentPortalAccount } from "@/types/student-portal";

export async function requireStudentPortal() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();

  if (!user || user.app_metadata?.role !== "student") {
    redirect("/portal/login");
  }

  const { data, error } = await db
    .from("student_portal_accounts")
    .select("*, student:students(*), trainer:trainer_profiles(*)")
    .eq("auth_user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  if (error || !data) {
    await db.auth.signOut();
    redirect("/portal/login?disabled=1");
  }

  const account = data as unknown as StudentPortalAccount & {
    student: Student;
    trainer: TrainerProfile;
  };

  return {
    db,
    user,
    account,
    student: account.student,
    trainer: account.trainer,
  };
}
