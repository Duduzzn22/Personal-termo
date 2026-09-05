import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppAutomation } from "@/lib/services/whatsapp.service";
import { addDaysISO, todayISO, weekdayOfISODate } from "@/lib/utils/agenda";
import { formatCurrencyFromCents } from "@/lib/utils/format";

function brDate(value: string) { const [y,m,d] = value.split('-'); return `${d}/${m}/${y}`; }
function firstName(value: string) { return value.trim().split(/\s+/)[0] || value; }

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const today = todayISO();
  const tomorrow = addDaysISO(today, 1);
  const weekday = weekdayOfISODate(tomorrow);
  const { data: settingsRows } = await db.from("whatsapp_automation_settings").select("*").eq("enabled", true);
  let processed = 0;

  for (const settings of settingsRows ?? []) {
    const trainerId = settings.trainer_id;
    const languageCode = settings.language_code || "pt_BR";

    if (settings.reminder_enabled) {
      const [{ data: schedules }, { data: sessions }] = await Promise.all([
        db.from("training_schedules").select("*, student:students(id,nome_completo,whatsapp,telefone)").eq("trainer_id", trainerId).eq("dia_semana", weekday).eq("ativo", true),
        db.from("training_sessions").select("*, student:students(id,nome_completo,whatsapp,telefone)").eq("trainer_id", trainerId).eq("data", tomorrow),
      ]);
      const exceptions = new Map((sessions ?? []).filter(s => s.schedule_id).map(s => [s.schedule_id, s]));
      for (const schedule of schedules ?? []) {
        const exception = exceptions.get(schedule.id);
        if (exception?.status === "cancelado" || exception?.status === "concluido") continue;
        const student = exception?.student ?? schedule.student;
        if (!student) continue;
        await sendWhatsAppAutomation(db, {
          trainerId, studentId: student.id, automationType: "lembrete_aula",
          dedupeKey: `lembrete:${trainerId}:${student.id}:${tomorrow}:${schedule.id}`,
          phone: student.whatsapp || student.telefone,
          templateName: settings.reminder_template,
          languageCode,
          parameters: [firstName(student.nome_completo), brDate(tomorrow), String(exception?.horario ?? schedule.horario).slice(0,5)],
        });
        processed++;
      }
      for (const session of (sessions ?? []).filter(s => !s.schedule_id && s.status === "agendado")) {
        const student = session.student;
        if (!student) continue;
        await sendWhatsAppAutomation(db, {
          trainerId, studentId: student.id, automationType: "lembrete_aula",
          dedupeKey: `lembrete:${trainerId}:${student.id}:${tomorrow}:${session.id}`,
          phone: student.whatsapp || student.telefone,
          templateName: settings.reminder_template,
          languageCode,
          parameters: [firstName(student.nome_completo), brDate(tomorrow), String(session.horario).slice(0,5)],
        });
        processed++;
      }
    }

    if (settings.low_balance_enabled) {
      const { data: packages } = await db.from("student_packages").select("*, package:packages(quantidade_aulas), student:students(id,nome_completo,whatsapp,telefone)").eq("trainer_id", trainerId).eq("status", "ativo");
      for (const row of packages ?? []) {
        const total = Number(row.package?.quantidade_aulas ?? 0);
        const remaining = Math.max(total - Number(row.aulas_realizadas ?? 0), 0);
        if (remaining > 2 || !row.student) continue;
        await sendWhatsAppAutomation(db, {
          trainerId, studentId: row.student.id, automationType: "saldo_baixo",
          dedupeKey: `saldo:${trainerId}:${row.id}:${remaining}`,
          phone: row.student.whatsapp || row.student.telefone,
          templateName: settings.low_balance_template,
          languageCode,
          parameters: [firstName(row.student.nome_completo), String(remaining)],
        });
        processed++;
      }
    }

    if (settings.overdue_enabled) {
      const { data: payments } = await db.from("payments").select("*, student:students(id,nome_completo,whatsapp,telefone)").eq("trainer_id", trainerId).eq("status", "pendente").lt("data_vencimento", today);
      for (const payment of payments ?? []) {
        if (!payment.student) continue;
        await sendWhatsAppAutomation(db, {
          trainerId, studentId: payment.student.id, automationType: "cobranca_atrasada",
          dedupeKey: `atraso:${trainerId}:${payment.id}:${today}`,
          phone: payment.student.whatsapp || payment.student.telefone,
          templateName: settings.overdue_template,
          languageCode,
          parameters: [firstName(payment.student.nome_completo), formatCurrencyFromCents(Number(payment.valor_centavos ?? 0)), brDate(payment.data_vencimento)],
        });
        processed++;
      }
    }
  }

  return NextResponse.json({ ok: true, processed });
}
