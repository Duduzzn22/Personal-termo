import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { InvitationsRepository } from "@/lib/repositories/invitations.repository";
import { AcceptancesClient, type InvitationListItem } from "@/components/acceptances/AcceptancesClient";

export default async function AceitesPage() {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const invitations = await new InvitationsRepository(db).list(userId);

  return <AcceptancesClient invitations={(invitations ?? []) as unknown as InvitationListItem[]} />;
}
