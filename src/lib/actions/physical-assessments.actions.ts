"use server";

import { revalidatePath } from "next/cache";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { PhysicalAssessmentsRepository } from "@/lib/repositories/physical-assessments.repository";
import type { PhysicalAssessmentInput } from "@/types/assessment";

export interface AssessmentActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

const METRICS = [
  ["peso_kg", "Peso", 0.1, 500],
  ["altura_cm", "Altura", 20, 300],
  ["percentual_gordura", "Gordura corporal", 0, 100],
  ["cintura_cm", "Cintura", 1, 500],
  ["quadril_cm", "Quadril", 1, 500],
  ["peito_cm", "Peito", 1, 500],
  ["braco_direito_cm", "Braço direito", 1, 500],
  ["braco_esquerdo_cm", "Braço esquerdo", 1, 500],
  ["coxa_direita_cm", "Coxa direita", 1, 500],
  ["coxa_esquerda_cm", "Coxa esquerda", 1, 500],
  ["panturrilha_direita_cm", "Panturrilha direita", 1, 500],
  ["panturrilha_esquerda_cm", "Panturrilha esquerda", 1, 500],
] as const;

type MetricKey = (typeof METRICS)[number][0];

function parseAssessmentForm(formData: FormData): {
  data?: PhysicalAssessmentInput;
  fieldErrors: Record<string, string>;
} {
  const fieldErrors: Record<string, string> = {};
  const dataAvaliacao = String(formData.get("data_avaliacao") ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataAvaliacao)) {
    fieldErrors.data_avaliacao = "Informe uma data válida.";
  }

  const parsedMetrics = {} as Record<MetricKey, number | null>;
  let metricCount = 0;

  for (const [key, label, min, max] of METRICS) {
    const raw = String(formData.get(key) ?? "").trim();
    if (!raw) {
      parsedMetrics[key] = null;
      continue;
    }

    const value = Number(raw.replace(",", "."));
    if (!Number.isFinite(value) || value < min || value > max) {
      fieldErrors[key] = `${label}: informe um valor entre ${min} e ${max}.`;
      parsedMetrics[key] = null;
      continue;
    }

    parsedMetrics[key] = Math.round(value * 100) / 100;
    metricCount += 1;
  }

  if (metricCount === 0 && Object.keys(fieldErrors).length === 0) {
    fieldErrors.peso_kg = "Informe pelo menos uma medida corporal.";
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const observacoes = String(formData.get("observacoes") ?? "").trim();

  return {
    fieldErrors,
    data: {
      data_avaliacao: dataAvaliacao,
      ...parsedMetrics,
      observacoes: observacoes || null,
    },
  };
}

export async function createPhysicalAssessmentAction(
  studentId: string,
  _prevState: AssessmentActionState,
  formData: FormData
): Promise<AssessmentActionState> {
  const parsed = parseAssessmentForm(formData);
  if (!parsed.data) return { error: "Revise os campos da avaliação.", fieldErrors: parsed.fieldErrors };

  try {
    const { userId } = await requireTrainer();
    const db = await createClient();
    await new PhysicalAssessmentsRepository(db).create(userId, studentId, parsed.data);
    revalidatePath(`/alunos/${studentId}`);
    return { success: true };
  } catch {
    return { error: "Não foi possível salvar a avaliação física." };
  }
}

export async function updatePhysicalAssessmentAction(
  studentId: string,
  assessmentId: string,
  _prevState: AssessmentActionState,
  formData: FormData
): Promise<AssessmentActionState> {
  const parsed = parseAssessmentForm(formData);
  if (!parsed.data) return { error: "Revise os campos da avaliação.", fieldErrors: parsed.fieldErrors };

  try {
    const { userId } = await requireTrainer();
    const db = await createClient();
    await new PhysicalAssessmentsRepository(db).update(userId, studentId, assessmentId, parsed.data);
    revalidatePath(`/alunos/${studentId}`);
    return { success: true };
  } catch {
    return { error: "Não foi possível atualizar a avaliação física." };
  }
}