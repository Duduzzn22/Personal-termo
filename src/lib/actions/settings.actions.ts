"use server";

import { createClient } from "@/lib/supabase/server";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { revalidatePath } from "next/cache";

export interface SettingsActionState {
  error?: string;
  success?: boolean;
}

export async function updateTrainerProfileAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const { userId } = await requireTrainer();
  const supabase = await createClient();

  const nome_profissional = String(formData.get("nome_profissional") || "").trim();
  if (!nome_profissional) {
    return { error: "Informe o nome profissional." };
  }

  const { error } = await supabase
    .from("trainer_profiles")
    .update({
      nome_profissional,
      nome_empresa: String(formData.get("nome_empresa") || "").trim() || null,
      cref: String(formData.get("cref") || "").trim() || null,
      email_contato: String(formData.get("email_contato") || "").trim() || null,
      telefone: String(formData.get("telefone") || "").trim() || null,
      whatsapp: String(formData.get("whatsapp") || "").trim() || null,
      cor_principal: String(formData.get("cor_principal") || "#0f172a"),
    })
    .eq("id", userId);

  if (error) {
    return { error: "Não foi possível salvar as configurações." };
  }

  revalidatePath("/configuracoes");
  return { success: true };
}
