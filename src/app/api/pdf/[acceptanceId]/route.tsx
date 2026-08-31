import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createAdminClient } from "@/lib/supabase/admin";
import { AcceptancePdfDocument } from "@/pdf/AcceptancePdfDocument";
import { AuditRepository } from "@/lib/repositories/audit.repository";
import type { Acceptance } from "@/types/database";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ acceptanceId: string }> }
) {
  const { acceptanceId } = await params;
  const db = createAdminClient();

  const { data: acceptance } = await db
    .from("acceptances")
    .select("*")
    .eq("id", acceptanceId)
    .maybeSingle();

  if (!acceptance) {
    return NextResponse.json({ error: "Comprovante não encontrado." }, { status: 404 });
  }

  const typedAcceptance = acceptance as Acceptance;
  const buffer = await renderToBuffer(
    <AcceptancePdfDocument acceptance={typedAcceptance} snapshot={typedAcceptance.document_snapshot} />
  );

  const audit = new AuditRepository(db);
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
    },
  });
}
