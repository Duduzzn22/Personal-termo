"use server";

import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { askPersonalAi, buildPersonalAiContext } from "@/lib/services/personal-ai.service";

export interface PersonalAiState {
  answer?: string;
  error?: string;
  question?: string;
}

export async function askPersonalAiAction(_prev: PersonalAiState, formData: FormData): Promise<PersonalAiState> {
  const question = String(formData.get("question") ?? "").trim();
  if (!question) return { error: "Escreva o que você quer analisar." };
  if (question.length > 2500) return { error: "A pergunta está muito longa. Limite: 2500 caracteres." };

  const { userId, profile } = await requireTrainer();
  const db = await createClient();
  const model = process.env.AI_GATEWAY_MODEL || "openai/gpt-5.4";

  try {
    const context = await buildPersonalAiContext(db, userId, profile.nome_profissional);
    const result = await askPersonalAi({ question, context, trainerId: userId });
    await db.from("ai_personal_logs").insert({
      trainer_id: userId,
      model: result.model,
      request_type: "consulta",
      input_chars: question.length + JSON.stringify(context).length,
      output_chars: result.answer.length,
      status: "sucesso",
    });
    return { answer: result.answer, question };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao consultar a IA.";
    try {
      await db.from("ai_personal_logs").insert({
        trainer_id: userId,
        model,
        request_type: "consulta",
        input_chars: question.length,
        output_chars: 0,
        status: "erro",
        error_message: message.slice(0, 500),
      });
    } catch {
      // O log nunca deve impedir a resposta amigável da interface.
    }
    return {
      error: message.includes("AI_GATEWAY_API_KEY")
        ? "A IA ainda não foi configurada no ambiente da Vercel."
        : "Não foi possível gerar a análise agora.",
      question,
    };
  }
}
