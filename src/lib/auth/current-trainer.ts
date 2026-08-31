import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { TrainerProfile } from "@/types/database";

/**
 * Recupera o usuário autenticado e seu perfil de personal trainer.
 * Redireciona para /login quando não há sessão válida — usada em toda
 * página protegida do painel (defesa em profundidade além do middleware).
 */
export async function requireTrainer(): Promise<{ userId: string; profile: TrainerProfile }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("trainer_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    // Segurança extra: caso o trigger de criação automática ainda não tenha rodado.
    const { data: created, error } = await supabase
      .from("trainer_profiles")
      .insert({
        id: user.id,
        nome_profissional: (user.user_metadata?.nome_profissional as string) || user.email || "Personal",
        email_contato: user.email,
      })
      .select("*")
      .single();
    if (error || !created) redirect("/login");
    return { userId: user.id, profile: created as TrainerProfile };
  }

  return { userId: user.id, profile: profile as TrainerProfile };
}
