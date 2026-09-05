import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildStudentRadar } from "@/lib/services/student-risk.service";
import { addDaysISO, todayISO } from "@/lib/utils/agenda";
import { formatCurrencyFromCents } from "@/lib/utils/format";

export type StudentAlias = {
  studentId: string;
  alias: string;
  realName: string;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceCaseInsensitive(text: string, from: string, to: string) {
  if (!from.trim()) return text;
  return text.replace(new RegExp(escapeRegExp(from), "gi"), to);
}

function anonymizeText(text: string, aliases: StudentAlias[]) {
  return [...aliases]
    .sort((a, b) => b.realName.length - a.realName.length)
    .reduce((result, item) => replaceCaseInsensitive(result, item.realName, item.alias), text);
}

function restoreStudentNames(text: string, aliases: StudentAlias[]) {
  return [...aliases]
    .sort((a, b) => b.alias.length - a.alias.length)
    .reduce((result, item) => replaceCaseInsensitive(result, item.alias, item.realName), text);
}

export async function buildPersonalAiContext(db: SupabaseClient, trainerId: string) {
  const today = todayISO();
  const weekEnd = addDaysISO(today, 7);
  const [studentsRes, radar, sessionsRes, schedulesRes, paymentsRes, packagesRes, requestsRes] = await Promise.all([
    db.from("students").select("id,nome_completo").eq("trainer_id", trainerId).order("nome_completo"),
    buildStudentRadar(db, trainerId),
    db.from("training_sessions").select("student_id,data,horario,status").eq("trainer_id", trainerId).gte("data", today).lte("data", weekEnd).order("data").order("horario"),
    db.from("training_schedules").select("student_id,dia_semana,horario").eq("trainer_id", trainerId).eq("ativo", true).order("dia_semana").order("horario"),
    db.from("payments").select("student_id,status,valor_centavos,data_vencimento").eq("trainer_id", trainerId).eq("status", "pendente"),
    db.from("student_packages").select("student_id,status,aulas_realizadas,data_validade_final,packages(nome,quantidade_aulas)").eq("trainer_id", trainerId).order("created_at", { ascending: false }),
    db.from("session_change_requests").select("student_id,request_type,status,occurrence_date,requested_date").eq("trainer_id", trainerId).eq("status", "pendente").order("created_at", { ascending: false }).limit(30),
  ]);

  const queryError = [studentsRes.error, sessionsRes.error, schedulesRes.error, paymentsRes.error, packagesRes.error, requestsRes.error].find(Boolean);
  if (queryError) throw new Error("Não foi possível montar o contexto da IA agora.");

  const aliases: StudentAlias[] = (studentsRes.data ?? []).map((student, index) => ({
    studentId: String(student.id),
    alias: `Aluno ${index + 1}`,
    realName: String(student.nome_completo || `Aluno ${index + 1}`),
  }));
  const aliasByStudentId = new Map(aliases.map((item) => [item.studentId, item.alias]));
  const aliasFor = (studentId: unknown) => aliasByStudentId.get(String(studentId ?? "")) ?? "Aluno";

  const pendingPayments = (paymentsRes.data ?? []).map((p) => ({
    aluno: aliasFor(p.student_id),
    valor: formatCurrencyFromCents(Number(p.valor_centavos ?? 0)),
    vencimento: p.data_vencimento,
    atrasado: p.data_vencimento < today,
  }));

  const packageRows = (packagesRes.data ?? []).slice(0, 100).map((p) => {
    const pkg = firstRelation<{ nome?: string; quantidade_aulas?: number }>(p.packages);
    const total = Number(pkg?.quantidade_aulas ?? 0);
    return {
      aluno: aliasFor(p.student_id),
      pacote: pkg?.nome ?? "Pacote",
      status: p.status,
      realizadas: Number(p.aulas_realizadas ?? 0),
      restantes: Math.max(total - Number(p.aulas_realizadas ?? 0), 0),
      validade: p.data_validade_final,
    };
  });

  const context = {
    data_atual: today,
    personal: "Personal",
    radar: radar.slice(0, 30).map((r) => ({
      aluno: aliasFor(r.studentId),
      score: r.score,
      nivel: r.level,
      motivos: r.reasons.map((reason) => reason.label),
      recomendacao_regra: r.recommendation,
    })),
    agenda_sessoes_7_dias: (sessionsRes.data ?? []).map((s) => ({
      aluno: aliasFor(s.student_id),
      data: s.data,
      horario: s.horario,
      status: s.status,
    })),
    horarios_fixos: (schedulesRes.data ?? []).map((s) => ({
      aluno: aliasFor(s.student_id),
      dia_semana: s.dia_semana,
      horario: s.horario,
    })),
    financeiro_pendente: pendingPayments,
    pacotes: packageRows,
    solicitacoes_agenda_pendentes: (requestsRes.data ?? []).map((r) => ({
      aluno: aliasFor(r.student_id),
      tipo: r.request_type,
      status: r.status,
      data_original: r.occurrence_date,
      nova_data: r.requested_date,
    })),
  };

  return { context, aliases };
}

export async function askPersonalAi(input: {
  question: string;
  context: unknown;
  aliases: StudentAlias[];
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");

  const system = `Você é a IA operacional de um personal trainer. Responda em português do Brasil, de forma prática e objetiva. Use SOMENTE os dados estruturados fornecidos no contexto. Os alunos foram anonimizados como Aluno 1, Aluno 2 etc.; preserve exatamente esses identificadores na resposta. Não invente alunos, pagamentos, aulas, medidas ou fatos ausentes. O Radar é uma priorização operacional determinística; não trate o score como diagnóstico. Não faça diagnóstico médico, prescrição clínica, aconselhamento jurídico ou decisões financeiras automáticas. Você pode resumir o dia ou a semana, apontar prioridades, sugerir próximos passos e redigir mensagens que o personal poderá revisar antes de enviar. Quando faltar dado, diga explicitamente que o dado não está disponível.`;
  const anonymizedQuestion = anonymizeText(input.question, input.aliases);
  const prompt = `CONTEXTO DO SAAS:\n${JSON.stringify(input.context)}\n\nPEDIDO DO PERSONAL:\n${anonymizedQuestion}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: system }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1400,
      },
    }),
  });

  const json = await response.json().catch(() => ({})) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };

  if (!response.ok) throw new Error(json.error?.message || `Gemini API HTTP ${response.status}`);

  const anonymizedAnswer = json.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!anonymizedAnswer) throw new Error("A IA não retornou conteúdo.");

  return {
    answer: restoreStudentNames(anonymizedAnswer, input.aliases),
    model,
  };
}
