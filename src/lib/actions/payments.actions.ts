"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { PaymentsRepository } from "@/lib/repositories/payments.repository";
import { todayISO } from "@/lib/utils/agenda";
import type { PaymentMethod } from "@/types/finance";

const paymentSchema = z.object({
  data_pagamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."),
  metodo: z.enum(["pix", "dinheiro", "cartao", "transferencia", "outro"]),
  observacoes: z.string().trim().max(1000).optional(),
});

const dueDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.");

export interface PaymentActionState {
  success?: boolean;
  error?: string;
}

function revalidateFinance() {
  revalidatePath("/financeiro");
  revalidatePath("/dashboard");
}

export async function markPaymentPaidAction(
  paymentId: string,
  _prevState: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const parsed = paymentSchema.safeParse({
    data_pagamento: formData.get("data_pagamento") || todayISO(),
    metodo: formData.get("metodo"),
    observacoes: formData.get("observacoes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Verifique os dados do pagamento." };
  }

  const { userId } = await requireTrainer();
  const db = await createClient();
  const payments = new PaymentsRepository(db);

  try {
    await payments.markPaid(userId, paymentId, {
      data_pagamento: parsed.data.data_pagamento,
      metodo: parsed.data.metodo as PaymentMethod,
      observacoes: parsed.data.observacoes || null,
    });
    revalidateFinance();
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível registrar o pagamento." };
  }
}

export async function reopenPaymentAction(paymentId: string) {
  const { userId } = await requireTrainer();
  const db = await createClient();
  await new PaymentsRepository(db).reopen(userId, paymentId);
  revalidateFinance();
}

export async function cancelPaymentAction(paymentId: string) {
  const { userId } = await requireTrainer();
  const db = await createClient();
  await new PaymentsRepository(db).cancel(userId, paymentId);
  revalidateFinance();
}

export async function updatePaymentDueDateAction(
  paymentId: string,
  _prevState: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const parsed = dueDateSchema.safeParse(String(formData.get("data_vencimento") || ""));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Informe uma data válida." };

  const { userId } = await requireTrainer();
  const db = await createClient();

  try {
    await new PaymentsRepository(db).updateDueDate(userId, paymentId, parsed.data);
    revalidateFinance();
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível alterar o vencimento." };
  }
}
