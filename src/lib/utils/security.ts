import "server-only";
import { randomBytes, createHash } from "crypto";

/**
 * Gera um token de convite criptograficamente seguro (não sequencial, não
 * previsível) para compor a URL pública /aceite/[token].
 * 32 bytes aleatórios -> ~43 caracteres em base64url.
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Gera o protocolo único do aceite.
 * Formato: PT-AAAAMMDD-XXXXXXXX (não depende apenas da data para ser único —
 * o sufixo vem de bytes aleatórios criptográficos).
 */
export function generateProtocol(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const suffix = randomBytes(6)
    .toString("base64url")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 8);
  return `PT-${y}${m}${d}-${suffix}`;
}

/** Hash SHA-256 do snapshot completo do documento aceito (para detecção de alteração). */
export function hashDocument(snapshot: unknown): string {
  const canonical = JSON.stringify(snapshot);
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}
