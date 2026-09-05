import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATH_PREFIXES = ["/login", "/cadastro", "/aceite", "/api/aceite", "/api/pdf", "/portal/login", "/auth/callback"];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Atualiza a sessão Supabase e separa os dois contextos autenticados:
 * personal/admin -> painel principal; aluno -> /portal.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  const isStudent = user?.app_metadata?.role === "student";

  if (!user) {
    if (pathname.startsWith("/portal") && pathname !== "/portal/login") {
      return NextResponse.redirect(new URL("/portal/login", request.url));
    }

    if (!isPublicPath(pathname)) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  }

  if (isStudent) {
    if (pathname === "/login" || pathname === "/cadastro" || pathname === "/portal/login") {
      return NextResponse.redirect(new URL("/portal", request.url));
    }

    if (!pathname.startsWith("/portal") && !isPublicPath(pathname)) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }

    return response;
  }

  if (pathname.startsWith("/portal")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/login" || pathname === "/cadastro") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
