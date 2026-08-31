import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { TermsRepository } from "@/lib/repositories/terms.repository";
import { TermsListClient } from "@/components/terms/TermsListClient";

export default async function TermosPage() {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const terms = new TermsRepository(db);
  const templates = await terms.listTemplates(userId);

  const withCounts = await Promise.all(
    templates.map(async (t) => {
      const versions = await terms.listVersions(userId, t.id);
      const published = versions.filter((v) => v.status === "publicado");
      return {
        ...t,
        versionCount: published.length,
        publishedVersion: published[0]?.versao,
      };
    })
  );

  return <TermsListClient templates={withCounts} />;
}
