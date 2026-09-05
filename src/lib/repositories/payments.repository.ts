import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentMethod, PaymentStatus, PaymentWithDetails } from "@/types/finance";

export class PaymentsRepository {
  constructor(private db: SupabaseClient) {}

  async list(trainerId: string) {
    const { data, error } = await this.db
      .from("payments")
      .select("*, students(id, nome_completo), student_packages(id, packages(id, nome))")
      .eq("trainer_id", trainerId)
      .order("data_vencimento", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as unknown as PaymentWithDetails[];
  }

  async markPaid(
    trainerId: string,
    id: string,
    input: { data_pagamento: string; metodo: PaymentMethod; observacoes?: string | null }
  ) {
    const { data, error } = await this.db
      .from("payments")
      .update({
        status: "pago" satisfies PaymentStatus,
        data_pagamento: input.data_pagamento,
        metodo: input.metodo,
        observacoes: input.observacoes ?? null,
      })
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async reopen(trainerId: string, id: string) {
    const { data, error } = await this.db
      .from("payments")
      .update({ status: "pendente", data_pagamento: null, metodo: null })
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async cancel(trainerId: string, id: string) {
    const { data, error } = await this.db
      .from("payments")
      .update({ status: "cancelado", data_pagamento: null, metodo: null })
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async updateDueDate(trainerId: string, id: string, dataVencimento: string) {
    const { data, error } = await this.db
      .from("payments")
      .update({ data_vencimento: dataVencimento })
      .eq("trainer_id", trainerId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }
}
