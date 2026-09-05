export interface PhysicalAssessment {
  id: string;
  trainer_id: string;
  student_id: string;
  data_avaliacao: string;
  peso_kg: number | null;
  altura_cm: number | null;
  percentual_gordura: number | null;
  cintura_cm: number | null;
  quadril_cm: number | null;
  peito_cm: number | null;
  braco_direito_cm: number | null;
  braco_esquerdo_cm: number | null;
  coxa_direita_cm: number | null;
  coxa_esquerda_cm: number | null;
  panturrilha_direita_cm: number | null;
  panturrilha_esquerda_cm: number | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export type PhysicalAssessmentInput = Pick<
  PhysicalAssessment,
  | "data_avaliacao"
  | "peso_kg"
  | "altura_cm"
  | "percentual_gordura"
  | "cintura_cm"
  | "quadril_cm"
  | "peito_cm"
  | "braco_direito_cm"
  | "braco_esquerdo_cm"
  | "coxa_direita_cm"
  | "coxa_esquerda_cm"
  | "panturrilha_direita_cm"
  | "panturrilha_esquerda_cm"
  | "observacoes"
>;

export function calculateAssessmentBMI(assessment: Pick<PhysicalAssessment, "peso_kg" | "altura_cm">) {
  if (!assessment.peso_kg || !assessment.altura_cm) return null;
  const heightMeters = assessment.altura_cm / 100;
  if (heightMeters <= 0) return null;
  return assessment.peso_kg / (heightMeters * heightMeters);
}