import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente administrativo (service role) — usa privilégios elevados e IGNORA
 * as políticas de RLS. Uso restrito ao servidor.
 *
 * Único cenário de uso legítimo neste projeto: a página pública de aceite
 * (/aceite/[token]), onde o "segredo" que autoriza a leitura/escrita é o
 * próprio token do convite (validado manualmente no código), não uma sessão
 * de usuário autenticado — o aluno não possui login.
 *
 * NUNCA importe este arquivo em um componente client ("use client") nem
 * exponha SUPABASE_SERVICE_ROLE_KEY para o navegador.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
