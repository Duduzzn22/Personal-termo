import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AcceptancePdfDocument } from "@/pdf/AcceptancePdfDocument";
import { AuditRepository } from "@/lib/repositories/audit.repository";
import type { Acceptance } from "@/types/database";

export const runtime = "nodejs";

async function loadAuthorizedAcceptance(request: NextRequest, acceptanceId: string) {
  const token = request.nextUrl.searchParams.get("token");

  // Fluxo público: o bearer token do convite precisa pertencer exatamente ao
  // aceite solicitado. Sem ele, um UUID de aceite isolado nunca autoriza acesso.
  if (token) {
    const adminDb = createAdminClient();
    const { data: invitation } = await adminDb
      .from("term_invitations")
      .select("id,status")
      .eq("token", token)
      .maybeSingle();

    if (!invitation || invitation.status !== "aceito") return null;

    const { data: acceptance } = await adminDb
      .from("acceptances")
      .select("*")
      .eq("id", acceptanceId)
      .eq("invitation_id", invitation.id)
      .maybeSingle();

    return acceptance as Acceptance | null;
  }

  // Fluxo autenticado: usa o cliente normal e deixa as policies de RLS
  // decidirem se trainer/admin/aluno pode ler este aceite.
  const db = await createClient();
  const { data: acceptance } = await db
    .from("acceptances")
    .select("*")
    .eq("id", acceptanceId)
    .maybeSingle();

  return acceptance as Acceptance | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ acceptanceId: string }> }
) {
  const { acceptanceId } = await params;
  const typedAcceptance = await loadAuthorizedAcceptance(request, acceptanceId);

  if (!typedAcceptance) {
    return NextResponse.json({ error: "Comprovante não encontrado." }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    <AcceptancePdfDocument acceptance={typedAcceptance} snapshot={typedAcceptance.document_snapshot} />
  );

  // O log é gravado com service role somente depois da autorização acima.
  const auditDb = createAdminClient();
  const audit = new AuditRepository(auditDb);
  await audit.log({
    trainer_id: typedAcceptance.trainer_id,
    entity_type: "acceptance",
    entity_id: typedAcceptance.id,
    event_type: "pdf_gerado",
    description: `PDF do comprovante ${typedAcceptance.protocolo} gerado.`,
  });

  return new NextResponse(new Blob([new Uint8Array(buffer)]), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="comprovante-${typedAcceptance.protocolo}.pdf"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
