import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

function normalizePhone(value: string | null | undefined) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) return `55${digits}`;
  return digits;
}

export async function sendWhatsAppTemplate(input: {
  phone: string | null | undefined;
  templateName: string | null | undefined;
  languageCode: string;
  parameters: string[];
}) {
  const phone = normalizePhone(input.phone);
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const graphVersion = process.env.WHATSAPP_GRAPH_API_VERSION;

  if (!phone) return { ok: false as const, skipped: true as const, error: "Aluno sem telefone/WhatsApp válido." };
  if (!input.templateName) return { ok: false as const, skipped: true as const, error: "Template não configurado." };
  if (!token || !phoneNumberId || !graphVersion) return { ok: false as const, skipped: true as const, error: "Credenciais do WhatsApp não configuradas no ambiente." };

  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "template",
      template: {
        name: input.templateName,
        language: { code: input.languageCode || "pt_BR" },
        components: input.parameters.length ? [{
          type: "body",
          parameters: input.parameters.map((value) => ({ type: "text", text: String(value) })),
        }] : undefined,
      },
    }),
  });

  const body = await response.json().catch(() => ({})) as { messages?: Array<{ id?: string }>; error?: { message?: string } };
  if (!response.ok) return { ok: false as const, skipped: false as const, error: body.error?.message || `WhatsApp HTTP ${response.status}` };
  return { ok: true as const, messageId: body.messages?.[0]?.id ?? null };
}

export async function sendWhatsAppAutomation(db: SupabaseClient, input: {
  trainerId: string;
  studentId: string | null;
  automationType: "lembrete_aula" | "saldo_baixo" | "cobranca_atrasada";
  dedupeKey: string;
  phone: string | null | undefined;
  templateName: string | null | undefined;
  languageCode: string;
  parameters: string[];
}) {
  const { data: existing } = await db.from("whatsapp_message_logs").select("id").eq("dedupe_key", input.dedupeKey).maybeSingle();
  if (existing) return { ok: true as const, duplicate: true as const };

  const result = await sendWhatsAppTemplate({
    phone: input.phone,
    templateName: input.templateName,
    languageCode: input.languageCode,
    parameters: input.parameters,
  });

  await db.from("whatsapp_message_logs").insert({
    trainer_id: input.trainerId,
    student_id: input.studentId,
    automation_type: input.automationType,
    template_name: input.templateName ?? null,
    to_phone: normalizePhone(input.phone),
    status: result.ok ? "enviado" : result.skipped ? "ignorado" : "erro",
    provider_message_id: result.ok ? result.messageId : null,
    error_message: result.ok ? null : result.error,
    dedupe_key: input.dedupeKey,
  });

  return result;
}
