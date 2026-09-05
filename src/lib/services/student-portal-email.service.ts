import "server-only";
import { Resend } from "resend";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendStudentPortalWelcomeEmail(params: {
  email: string;
  studentName: string;
  trainerName: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false as const, reason: "resend_nao_configurado" as const };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const portalUrl = `${appUrl.replace(/\/$/, "")}/portal/login`;
  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Personal Trainer <termos@resend.dev>",
      to: params.email,
      subject: `Seu acesso ao portal de ${params.trainerName}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:520px;margin:0 auto;color:#0f172a">
          <h2 style="font-size:20px">Seu portal do aluno está disponível</h2>
          <p style="font-size:14px;line-height:1.6;color:#475569">
            Olá, ${escapeHtml(params.studentName)}. ${escapeHtml(params.trainerName)} habilitou seu acesso ao portal.
            Você poderá consultar seu pacote, horários, avaliações, treinos e situação financeira.
          </p>
          <a href="${portalUrl}" style="display:inline-block;margin-top:12px;background:#0f172a;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:600">
            Acessar meu portal
          </a>
          <p style="margin-top:20px;font-size:12px;line-height:1.5;color:#94a3b8">
            Para entrar, informe este e-mail no portal. Você receberá um link de acesso temporário, sem precisar criar senha.
          </p>
        </div>`,
    });
    return { sent: true as const };
  } catch (error) {
    console.error("Falha ao enviar acesso do portal do aluno:", error);
    return { sent: false as const, reason: "erro_envio" as const };
  }
}
