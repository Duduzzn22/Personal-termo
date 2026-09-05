export type StudentRiskLevel = "alto" | "medio" | "baixo";

export interface StudentRiskReason {
  code: string;
  label: string;
  points: number;
}

export interface StudentRisk {
  studentId: string;
  studentName: string;
  whatsapp: string | null;
  score: number;
  level: StudentRiskLevel;
  reasons: StudentRiskReason[];
  recommendation: string;
  remainingClasses: number | null;
  daysWithoutTraining: number | null;
  overdueAmountCents: number;
  packageExpiresInDays: number | null;
  cancellations30d: number;
}
