import { NextResponse } from "next/server";

// Rota de diagnóstico desativada. Pode apagar esta pasta com segurança
// (src/app/api/debug-auth) quando quiser.
export async function GET() {
  return new NextResponse(null, { status: 404 });
}
