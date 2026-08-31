import "server-only";
import { Resend } from "resend";
import { formatDateBR } from "@/lib/utils/format";
import type { Acceptance, DocumentSnapshot } from "@/types/database";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function acceptanceEmailHtml(params: {
  alunoNome: string;
  protocolo: string;
  data: string;
  personalNome: string;
  comprovanteUrl: string;
}) {
  return `
  <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
    <h2 style="font-size: 18px; margin-bottom: 4px;">Seu aceite foi registrado</h2>
    <p style="font-size: 14px; color: #475569; line-height: 1.6;">
      Olá, ${params.alunoNome}.<br/><br/>
      Seu aceite das condições do serviço de Personal Training foi registrado com sucesso.
    </p>
    <table style="width: 100%; font-size: 13px; margin: 20px 0; border-collapse: collapse;">
      <tr>
        <td style="padding: 6px 0; color: #94a3b8;">Protocolo</td>
        <td style="padding: 6px 0; font-weight: 600;">${params.protocolo}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #94a3b8;">Data</td>
        <td style="padding: 6px 0; font-weight: 600;">${params.data}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #94a3b8;">Personal</td>
        <td style="padding: 6px 0; font-weight: 600;">${params.personalNome}</td>
      </tr>
    </table>
    <a href="${params.comprovanteUrl}" style="display: inline-block; background: #0f172a; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 600;">
      Ver / baixar comprovante
    </a>
    <p style="font-size: 11px; color: #94a3b8; margin-top: 24px;">
      Este é um registro eletrônico de aceite — não se trata de assinatura eletrônica certificada.
    </p>
  </div>`;
}

/**
 * Envia o e-mail de confirmação de aceite. Falha de forma silenciosa (apenas
 * loga) quando RESEND_API_KEY não está configurada ou o aluno não possui
 * e-mail — o registro do aceite em si nunca depende do envio de e-mail.
 */
export async function sendAcceptanceConfirmationEmail(acceptance: Acceptance) {
  const snapshot = acceptance.document_snapshot as DocumentSnapshot;
  if (!snapshot.aluno.email) return { sent: false, reason: "sem_email" as const };

  const resend = getResendClient();
  if (!resend) return { sent: false, reason: "resend_nao_configurado" as const };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const comprovanteUrl = `${appUrl}/api/pdf/${acceptance.id}`;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Personal Trainer <termos@resend.dev>",
      to: snapshot.aluno.email,
      subject: "Seu aceite foi registrado",
      html: acceptanceEmailHtml({
        alunoNome: snapshot.aluno.nome_completo,
        protocolo: acceptance.protocolo,
        data: formatDateBR(acceptance.accepted_at),
        personalNome: snapshot.personal.nome_profissional,
        comprovanteUrl,
      }),
    });
    return { sent: true as const };
  } catch (error) {
    console.error("Falha ao enviar e-mail de confirmação de aceite:", error);
    return { sent: false, reason: "erro_envio" as const };
  }
}
