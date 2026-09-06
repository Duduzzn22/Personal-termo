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
  if (user?.app_metadata?.role === "student") {
    return NextResponse.redirect(new URL(portalNext, request.url));
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
