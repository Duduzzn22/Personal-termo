import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { TrainerProfile } from "@/types/database";

/**
 * Recupera o usuário autenticado e o perfil de personal trainer que ele deve
 * enxergar/gerenciar. Redireciona para /login quando não há sessão válida —
 * usada em toda página protegida do painel (defesa em profundidade além do
 * middleware).
 *
 * Um administrador (tabela `admins`) tem prioridade sobre seu próprio
 * perfil: todo novo usuário autenticado ganha automaticamente um
 * trainer_profiles vazio (trigger de signup), inclusive o administrador —
 * mas quando ele está vinculado a um trainer gerenciado, é o perfil desse
 * trainer que deve ser usado em toda a aplicação, não o perfil vazio próprio.
 * `isAdmin: true` indica que o usuário logado não é o próprio trainer.
 */
export async function requireTrainer(): Promise<{
  userId: string;
  profile: TrainerProfile;
  isAdmin: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: adminLink } = await supabase
    .from("admins")
    .select("managed_trainer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminLink?.managed_trainer_id) {
    const { data: managedProfile } = await supabase
      .from("trainer_profiles")
      .select("*")
      .eq("id", adminLink.managed_trainer_id)
      .maybeSingle();
    if (managedProfile) {
      return { userId: managedProfile.id, profile: managedProfile as TrainerProfile, isAdmin: true };
    }
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
    return { userId: user.id, profile: created as TrainerProfile, isAdmin: false };
  }

  return { userId: user.id, profile: profile as TrainerProfile, isAdmin: false };
}
