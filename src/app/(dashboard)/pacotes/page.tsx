import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { PackagesRepository } from "@/lib/repositories/packages.repository";
import { PackagesClient } from "@/components/packages/PackagesClient";

export default async function PacotesPage() {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const packages = await new PackagesRepository(db).list(userId);

  return <PackagesClient packages={packages} />;
}
