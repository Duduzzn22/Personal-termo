export interface Exercise {
  id: string;
  trainer_id: string;
  nome: string;
  grupo_muscular: string | null;
  equipamento: string | null;
  instrucoes: string | null;
  video_url: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutPlan {
  id: string;
  trainer_id: string;
  student_id: string;
  nome: string;
  objetivo: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  status: "ativo" | "arquivado";
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutPlanItem {
  id: string;
  trainer_id: string;
  workout_plan_id: string;
  exercise_id: string;
  bloco: string | null;
  ordem: number;
  series: number | null;
  repeticoes: string | null;
  carga: string | null;
  descanso_segundos: number | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutPlanItemWithExercise extends WorkoutPlanItem {
  exercise: Exercise;
}

export interface WorkoutPlanWithStudent extends WorkoutPlan {
  student: {
    id: string;
    nome_completo: string;
    status: string;
  };
  items_count: number;
}

export interface WorkoutPlanDetail extends WorkoutPlanWithStudent {
  items: WorkoutPlanItemWithExercise[];
}