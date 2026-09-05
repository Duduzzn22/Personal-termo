"use server";

import { revalidatePath } from "next/cache";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";

export async function saveWhatsAppSettingsAction(formData: FormData) {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const value = (key: string) => String(formData.get(key) ?? "").trim() || null;

  await db.from("whatsapp_automation_settings").upsert({
    trainer_id: userId,
    enabled: formData.get("enabled") === "on",
    reminder_enabled: formData.get("reminder_enabled") === "on",
    reminder_template: value("reminder_template"),
    low_balance_enabled: formData.get("low_balance_enabled") === "on",
    low_balance_template: value("low_balance_template"),
    overdue_enabled: formData.get("overdue_enabled") === "on",
    overdue_template: value("overdue_template"),
    language_code: value("language_code") || "pt_BR",
  }, { onConflict: "trainer_id" });

  revalidatePath("/whatsapp");
}
