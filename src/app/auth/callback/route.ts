import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next") || "/portal";
  const next = requestedNext.startsWith("/portal") ? requestedNext : "/portal";

  if (!code) {
    return NextResponse.redirect(new URL("/portal/login?error=auth", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/portal/login?error=auth", request.url));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.role === "student") {
    return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
