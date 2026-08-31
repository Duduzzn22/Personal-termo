"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso em Client Components.
 * Usa a anon key pública — a segurança de acesso aos dados é garantida
 * pelas políticas de Row Level Security (ver supabase/migrations/0002_rls_policies.sql).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
