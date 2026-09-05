import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { PaymentsRepository } from "@/lib/repositories/payments.repository";
import { FinancePageClient } from "@/components/finance/FinancePageClient";
import { todayISO } from "@/lib/utils/agenda";

export default async function FinanceiroPage() {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const payments = await new PaymentsRepository(db).list(userId);

  return <FinancePageClient payments={payments} today={todayISO()} />;
}
