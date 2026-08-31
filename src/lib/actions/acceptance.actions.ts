"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { acceptInvitation } from "@/lib/services/acceptance.service";
import { sendAcceptanceConfirmationEmail } from "@/lib/services/email.service";
import { acceptanceSchema } from "@/lib/validation/invitation.schema";

export interface AcceptActionState {
  error?: string;
}

function getClientIp(h: Headers): string | null {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip");
}

export async function acceptInvitationAction(
  token: string,
  _prevState: AcceptActionState,
  formData: FormData
): Promise<AcceptActionState> {
  const parsed = acceptanceSchema.safeParse({
    token,
    checkbox_confirmado: formData.get("checkbox_confirmado") === "on",
  });

  if (!parsed.success) {
    return { error: "É necessário marcar a confirmação de leitura para prosseguir." };
  }

  const h = await headers();
  const adminDb = createAdminClient();

  try {
    const { acceptance } = await acceptInvitation(adminDb, {
      token,
      ipAddress: getClientIp(h),
      userAgent: h.get("user-agent"),
      timezone: process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || "America/Sao_Paulo",
    });
    // Falha no envio de e-mail nunca deve impedir a confirmação do aceite.
    await sendAcceptanceConfirmationEmail(acceptance).catch(() => null);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível registrar o aceite." };
  }

  redirect(`/aceite/${token}/sucesso`);
}
