import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { WorkoutPlanWithStudent } from "@/types/workout";

function formatDate(value: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function StudentWorkoutsCard({ plans }: { plans: WorkoutPlanWithStudent[] }) {
  const active = plans.filter((plan) => plan.status === "ativo");

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Planos de treino</CardTitle>
          <p className="mt-1 text-xs text-slate-500">{active.length} plano(s) ativo(s)</p>
        </div>
        <Link href="/treinos">
          <Button variant="outline" size="sm">Gerenciar treinos</Button>
        </Link>
      </CardHeader>
      <CardContent>
        {plans.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="Nenhum treino atribuído"
            description="Crie um plano de treino e associe este aluno na área Treinos."
            action={<Link href="/treinos"><Button>Abrir Treinos</Button></Link>}
          />
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => (
              <div key={plan.id} className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{plan.nome}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${plan.status === "ativo" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {plan.status === "ativo" ? "Ativo" : "Arquivado"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {plan.items_count} exercício(s) · {formatDate(plan.data_inicio)} → {formatDate(plan.data_fim)}
                  </p>
                  {plan.objetivo && <p className="mt-1 line-clamp-1 text-sm text-slate-600">{plan.objetivo}</p>}
                </div>
                <Link href={`/treinos/${plan.id}`} className="shrink-0">
                  <Button size="sm">Abrir treino</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}