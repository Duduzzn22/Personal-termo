"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStudentPortal } from "@/lib/auth/current-student";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { AgendaRepository } from "@/lib/repositories/agenda.repository";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function portalError(message: string): never {
  redirect(`/portal/agenda?erro=${encodeURIComponent(message)}`);
}

export async function requestSessionChangeAction(formData: FormData) {
  const { db, student, trainer } = await requireStudentPortal();
  const requestType = text(formData, "request_type");
  const scheduleId = text(formData, "schedule_id") || null;
  const sessionId = text(formData, "session_id") || null;
  const occurrenceDate = text(formData, "occurrence_date");
  const occurrenceTime = text(formData, "occurrence_time");
  const requestedDate = text(formData, "requested_date") || null;
  const requestedTime = text(formData, "requested_time") || null;
  const reason = text(formData, "reason") || null;

  if (!['cancelamento', 'remarcacao'].includes(requestType)) portalError("Tipo de solicitação inválido.");
  if (!occurrenceDate || !occurrenceTime) portalError("Aula inválida.");
  if (requestType === 'remarcacao' && (!requestedDate || !requestedTime)) portalError("Informe a nova data e horário.");

  const occurrenceAt = Date.parse(`${occurrenceDate}T${occurrenceTime.slice(0, 5)}:00-03:00`);
  const noticeMs = Number(trainer.cancelamento_antecedencia_horas ?? 24) * 60 * 60 * 1000;
  if (!Number.isFinite(occurrenceAt) || occurrenceAt < Date.now() + noticeMs) {
    portalError(`A alteração precisa ser solicitada com pelo menos ${trainer.cancelamento_antecedencia_horas ?? 24}h de antecedência.`);
  }

  const { error } = await db.from("session_change_requests").insert({
    trainer_id: trainer.id,
    student_id: student.id,
    schedule_id: scheduleId,
    session_id: sessionId,
    occurrence_date: occurrenceDate,
    occurrence_time: occurrenceTime,
    request_type: requestType,
    requested_date: requestType === 'remarcacao' ? requestedDate : null,
    requested_time: requestType === 'remarcacao' ? requestedTime : null,
    reason,
    status: 'pendente',
  });

  if (error) {
    const msg = error.message.includes("idx_session_change_requests_one_pending_occurrence")
      ? "Já existe uma solicitação pendente para esta aula."
      : error.message.includes("Prazo mínimo")
        ? `A alteração precisa respeitar ${trainer.cancelamento_antecedencia_horas ?? 24}h de antecedência.`
        : "Não foi possível registrar a solicitação.";
    portalError(msg);
  }

  redirect("/portal/agenda?sucesso=1");
}

export async function reviewSessionChangeRequestAction(requestId: string, decision: "aprovar" | "rejeitar") {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const agenda = new AgendaRepository(db);

  const { data: request, error } = await db
    .from("session_change_requests")
    .select("*")
    .eq("trainer_id", userId)
    .eq("id", requestId)
    .eq("status", "pendente")
    .maybeSingle();

  if (error || !request) return;

  if (decision === "rejeitar") {
    await db.from("session_change_requests").update({
      status: "rejeitado",
      reviewed_at: new Date().toISOString(),
      reviewed_by: (await db.auth.getUser()).data.user?.id ?? null,
    }).eq("id", requestId).eq("trainer_id", userId);
    revalidatePath("/solicitacoes");
    revalidatePath("/portal/agenda");
    return;
  }

  if (request.session_id) {
    await agenda.updateSession(userId, request.session_id, { status: "cancelado" });
  } else if (request.schedule_id) {
    await agenda.upsertSessionForSchedule(userId, {
      schedule_id: request.schedule_id,
      student_id: request.student_id,
      data: request.occurrence_date,
      horario: request.occurrence_time,
      status: "cancelado",
      observacoes: request.request_type === "remarcacao" ? "Ocorrência original remarcada pelo aluno." : "Cancelamento solicitado pelo aluno.",
    });
  }

  let resultSessionId: string | null = null;
  if (request.request_type === "remarcacao" && request.requested_date && request.requested_time) {
    const created = await agenda.createSession(userId, {
      student_id: request.student_id,
      schedule_id: null,
      data: request.requested_date,
      horario: request.requested_time,
      status: "agendado",
      observacoes: `Remarcação aprovada. Solicitação ${request.id}.`,
    });
    resultSessionId = created.id;
  }

  await db.from("session_change_requests").update({
    status: "aprovado",
    result_session_id: resultSessionId,
    reviewed_at: new Date().toISOString(),
    reviewed_by: (await db.auth.getUser()).data.user?.id ?? null,
  }).eq("id", requestId).eq("trainer_id", userId);

  revalidatePath("/solicitacoes");
  revalidatePath("/agenda");
  revalidatePath(`/alunos/${request.student_id}`);
  revalidatePath("/portal/agenda");
}
