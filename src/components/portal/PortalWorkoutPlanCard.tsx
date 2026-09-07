import { DIAS_SEMANA_ABREV } from "@/lib/utils/agenda";
import { ExerciseVideoButton } from "@/components/workouts/ExerciseVideoButton";

interface PortalPlan {
  id: string;
  nome: string;
  objetivo?: string | null;
  dias_semana?: number[] | null;
}

interface PortalExercise {
  nome?: string;
  grupo_muscular?: string | null;
  video_url?: string | null;
  video_path?: string | null;
}

interface PortalWorkoutItem {
  id: string;
  workout_plan_id: string;
  series?: number | null;
  repeticoes?: string | null;
  carga?: string | null;
  descanso_segundos?: number | null;
  exercise?: PortalExercise | null;
}

function weekdayLabel(days: number[] | null | undefined) {
  const validDays = (days ?? []).map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  return validDays.length ? validDays.map((day) => DIAS_SEMANA_ABREV[day]).join(" · ") : "Dias ainda não definidos";
}

export function PortalWorkoutPlanCard({
  plan,
  items,
  highlight = false,
  showDays = false,
}: {
  plan: PortalPlan;
  items: PortalWorkoutItem[];
  highlight?: boolean;
  showDays?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200"}`}>
      <div className="mb-3">
        <p className={`font-semibold ${highlight ? "text-white" : "text-slate-900"}`}>{plan.nome}</p>
        {plan.objetivo && <p className={`mt-0.5 text-sm ${highlight ? "text-slate-300" : "text-slate-500"}`}>{plan.objetivo}</p>}
        {showDays && <p className={`mt-1 text-xs ${highlight ? "text-slate-400" : "text-slate-400"}`}>{weekdayLabel(plan.dias_semana)}</p>}
      </div>

      <div className="space-y-2">
        {items.map((item, index) => {
          const exercise = item.exercise ?? null;
          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${highlight ? "bg-white/10" : "bg-slate-50"}`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${highlight ? "bg-white text-slate-900" : "bg-slate-900 text-white"}`}>
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${highlight ? "text-white" : "text-slate-800"}`}>{exercise?.nome || "Exercício"}</p>
                <p className={`text-xs ${highlight ? "text-slate-300" : "text-slate-500"}`}>
                  {[item.series ? `${item.series} séries` : null, item.repeticoes ? `${item.repeticoes} reps` : null, item.carga || null, item.descanso_segundos != null ? `${item.descanso_segundos}s descanso` : null]
                    .filter(Boolean)
                    .join(" · ") || "Sem prescrição detalhada"}
                </p>
                {(exercise?.video_path || exercise?.video_url) && (
                  <div className="mt-2">
                    <ExerciseVideoButton
                      exerciseName={exercise.nome || "Exercício"}
                      videoPath={exercise.video_path}
                      externalUrl={exercise.video_url}
                      compact
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {items.length === 0 && <p className={`text-sm ${highlight ? "text-slate-300" : "text-slate-500"}`}>O treino ainda não possui exercícios.</p>}
      </div>
    </div>
  );
}
