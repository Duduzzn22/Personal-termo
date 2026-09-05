import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildStudentRadar } from "@/lib/services/student-risk.service";
import { addDaysISO, todayISO } from "@/lib/utils/agenda";
import { formatCurrencyFromCents } from "@/lib/utils/format";

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function buildPersonalAiContext(db: SupabaseClient, trainerId: string, trainerName: string) {
  const today = todayISO();
  const weekEnd = addDaysISO(today, 7);
  const [radar, sessionsRes, schedulesRes, paymentsRes, packagesRes, requestsRes] = await Promise.all([
    buildStudentRadar(db, trainerId),
    db.from("training_sessions").select("data,horario,status,students(nome_completo)").eq("trainer_id", trainerId).gte("data", today).lte("data", weekEnd).order("data").order("horario"),
    db.from("training_schedules").select("dia_semana,horario,students(nome_completo)").eq("trainer_id", trainerId).eq("ativo", true).order("dia_semana").order("horario"),
    db.from("payments").select("student_id,status,valor_centavos,data_vencimento,students(nome_completo)").eq("trainer_id", trainerId).eq("status", "pendente"),
    db.from("student_packages").select("student_id,status,aulas_realizadas,data_validade_final,packages(nome,quantidade_aulas),students(nome_completo)").eq("trainer_id", trainerId).order("created_at", { ascending: false }),
    db.from("session_change_requests").select("request_type,status,occurrence_date,requested_date,students(nome_completo)").eq("trainer_id", trainerId).eq("status", "pendente").order("created_at", { ascending: false }).limit(30),
  ]);

  const pendingPayments = (paymentsRes.data ?? []).map((p) => {
    const student = firstRelation<{ nome_completo?: string }>(p.students);
    return {
      aluno: student?.nome_completo ?? "Aluno",
      valor: formatCurrencyFromCents(Number(p.valor_centavos ?? 0)),
      vencimento: p.data_vencimento,
      atrasado: p.data_vencimento < today,
    };
  });

  const packageRows = (packagesRes.data ?? []).slice(0, 100).map((p) => {
    const pkg = firstRelation<{ nome?: string; quantidade_aulas?: number }>(p.packages);
    const student = firstRelation<{ nome_completo?: string }>(p.students);
    const total = Number(pkg?.quantidade_aulas ?? 0);
    return {
      aluno: student?.nome_completo ?? "Aluno",
      pacote: pkg?.nome ?? "Pacote",
      status: p.status,
      realizadas: Number(p.aulas_realizadas ?? 0),
      restantes: Math.max(total - Number(p.aulas_realizadas ?? 0), 0),
      validade: p.data_validade_final,
    };
  });

  return {
    data_atual: today,
    personal: trainerName,
    radar: radar.slice(0, 30).map((r) => ({
      aluno: r.studentName,
      score: r.score,
      nivel: r.level,
      motivos: r.reasons.map(reason => reason.label),
      recomendacao_regra: r.recommendation,
    })),
    agenda_sessoes_7_dias: sessionsRes.data ?? [],
    horarios_fixos: schedulesRes.data ?? [],
    financeiro_pendente: pendingPayments,
    pacotes: packageRows,
    solicitacoes_agenda_pendentes: requestsRes.data ?? [],
  };
}

export async function askPersonalAi(input: {
  question: string;
  context: unknown;
  trainerId: string;
}) {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  const model = process.env.AI_GATEWAY_MODEL || "openai/gpt-5.4";
  if (!apiKey) throw new Error("AI_GATEWAY_API_KEY não configurada.");

  const system = `Você é a IA operacional de um personal trainer. Responda em português do Brasil, de forma prática e objetiva. Use SOMENTE os dados estruturados fornecidos no contexto. Não invente alunos, pagamentos, aulas, medidas ou fatos ausentes. O Radar é uma priorização operacional determinística; não trate o score como diagnóstico. Não faça diagnóstico médico, prescrição clínica, aconselhamento jurídico ou decisões financeiras automáticas. Você pode: resumir o dia/semana, apontar prioridades, sugerir próximos passos e redigir mensagens que o personal poderá revisar antes de enviar. Quando faltar dado, diga explicitamente que o dado não está disponível.`;

  const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `CONTEXTO DO SAAS:\n${JSON.stringify(input.context)}\n\nPEDIDO DO PERSONAL:\n${input.question}` },
      ],
    }),
  });

  const json = await response.json().catch(() => ({})) as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
  if (!response.ok) throw new Error(json.error?.message || `AI Gateway HTTP ${response.status}`);
  const answer = json.choices?.[0]?.message?.content?.trim();
  if (!answer) throw new Error("A IA não retornou conteúdo.");
  return { answer, model };
}
