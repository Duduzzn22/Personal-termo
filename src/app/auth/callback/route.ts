import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next") || "/dashboard";
  const isPortalRequest = requestedNext.startsWith("/portal");
  const portalNext = isPortalRequest ? requestedNext : "/portal";
  const authErrorPath = isPortalRequest ? "/portal/login?error=auth" : "/login?error=auth";

  if (!code) {
    return NextResponse.redirect(new URL(authErrorPath, request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(authErrorPath, request.url));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL(authErrorPath, request.url));
  }

  const { data: portalAccount } = await supabase
    .from("student_portal_accounts")
    .select("id,enabled")
    .eq("auth_user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  // O vínculo em student_portal_accounts é a fonte de verdade para contas de aluno.
  // O app_metadata.role continua sendo usado como defesa extra e compatibilidade.
  if (user.app_metadata?.role === "student" || portalAccount) {
    return NextResponse.redirect(new URL(portalNext, request.url));
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
