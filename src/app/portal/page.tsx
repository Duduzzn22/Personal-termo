import { CalendarDays, CreditCard, Dumbbell, LogOut, Ruler, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { studentPortalSignOutAction } from "@/lib/actions/student-portal.actions";
import { requireStudentPortal } from "@/lib/auth/current-student";
import { DIAS_SEMANA } from "@/lib/utils/agenda";
import { formatCurrencyFromCents } from "@/lib/utils/format";

function wallDate(value: string | null | undefined) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function shortTime(value: string | null | undefined) {
  return value ? value.slice(0, 5) : "—";
}

function metric(value: number | null | undefined, unit: string) {
  return value === null || value === undefined
    ? "—"
    : `${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}${unit}`;
}

export default async function StudentPortalPage() {
  const { db, student, trainer } = await requireStudentPortal();

  const [packagesResult, schedulesResult, assessmentsResult, plansResult, paymentsResult] = await Promise.all([
    db.from("student_packages").select("*, package:packages(*)").eq("student_id", student.id).order("created_at", { ascending: false }),
    db.from("training_schedules").select("*").eq("student_id", student.id).eq("ativo", true).order("dia_semana").order("horario"),
    db.from("physical_assessments").select("*").eq("student_id", student.id).order("data_avaliacao", { ascending: false }).limit(2),
    db.from("workout_plans").select("*").eq("student_id", student.id).eq("status", "ativo").order("created_at", { ascending: false }),
    db.from("payments").select("*").eq("student_id", student.id).order("data_vencimento", { ascending: false }).limit(8),
  ]);

  const studentPackages = packagesResult.data ?? [];
  const schedules = schedulesResult.data ?? [];
  const assessments = assessmentsResult.data ?? [];
  const plans = plansResult.data ?? [];
  const payments = paymentsResult.data ?? [];

  const activePackage = studentPackages.find((item) => item.status === "ativo") ?? studentPackages[0];
  const packageInfo = activePackage?.package as { nome?: string; quantidade_aulas?: number; valor_centavos?: number } | null | undefined;
  const totalClasses = Number(packageInfo?.quantidade_aulas ?? 0);
  const usedClasses = Number(activePackage?.aulas_realizadas ?? 0);
  const remainingClasses = Math.max(totalClasses - usedClasses, 0);
  const latestAssessment = assessments[0];
  const previousAssessment = assessments[1];
  const pendingPayments = payments.filter((payment) => payment.status === "pendente");
  const pendingTotal = pendingPayments.reduce((sum, payment) => sum + Number(payment.valor_centavos ?? 0), 0);

  const planIds = plans.map((plan) => plan.id);
  const itemsResult = planIds.length
    ? await db
        .from("workout_plan_items")
        .select("*, exercise:exercises(*)")
        .in("workout_plan_id", planIds)
        .order("ordem", { ascending: true })
    : { data: [] };
  const workoutItems = itemsResult.data ?? [];

  const firstName = student.nome_completo.split(" ")[0];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col justify-between gap-4 rounded-2xl bg-slate-900 p-5 text-white sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-300">Área do Aluno · {trainer.nome_profissional}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Olá, {firstName}</h1>
            <p className="mt-1 text-sm text-slate-300">Aqui está um resumo atualizado do seu acompanhamento.</p>
          </div>
          <form action={studentPortalSignOutAction}>
            <Button type="submit" variant="outline" size="sm" className="border-slate-600 bg-transparent text-white hover:bg-slate-800 hover:text-white">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </form>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Pacote atual</CardTitle><WalletCards className="h-5 w-5 text-slate-400" /></CardHeader>
            <CardContent>
              {activePackage ? (
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-slate-900">{packageInfo?.nome || "Pacote contratado"}</p>
                    <p className="mt-1 text-sm text-slate-500">Validade até {wallDate(activePackage.data_validade_final)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-3xl font-semibold tracking-tight text-slate-900">{remainingClasses}</p>
                    <p className="text-xs text-slate-500">aula(s) restante(s) · {usedClasses}/{totalClasses} utilizadas</p>
                  </div>
                </div>
              ) : <p className="text-sm text-slate-500">Nenhum pacote registrado.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Financeiro</CardTitle><CreditCard className="h-5 w-5 text-slate-400" /></CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight text-slate-900">{formatCurrencyFromCents(pendingTotal)}</p>
              <p className="mt-1 text-xs text-slate-500">em cobrança pendente</p>
              <div className="mt-4 space-y-2">
                {payments.slice(0, 3).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="text-slate-600">Venc. {wallDate(payment.data_vencimento)}</span>
                    <span className={payment.status === "pago" ? "font-medium text-emerald-700" : payment.status === "cancelado" ? "font-medium text-slate-400" : "font-medium text-amber-700"}>
                      {payment.status === "pago" ? "Pago" : payment.status === "cancelado" ? "Cancelado" : formatCurrencyFromCents(Number(payment.valor_centavos))}
                    </span>
                  </div>
                ))}
                {payments.length === 0 && <p className="text-sm text-slate-500">Nenhuma cobrança registrada.</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Última avaliação</CardTitle><Ruler className="h-5 w-5 text-slate-400" /></CardHeader>
            <CardContent>
              {latestAssessment ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Avaliado em {wallDate(latestAssessment.data_avaliacao)}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-400">Peso</p><p className="mt-1 font-semibold text-slate-800">{metric(latestAssessment.peso_kg, " kg")}</p></div>
                    <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-400">Gordura</p><p className="mt-1 font-semibold text-slate-800">{metric(latestAssessment.percentual_gordura, "%")}</p></div>
                    <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-400">Cintura</p><p className="mt-1 font-semibold text-slate-800">{metric(latestAssessment.cintura_cm, " cm")}</p></div>
                  </div>
                  {previousAssessment?.peso_kg != null && latestAssessment.peso_kg != null && (
                    <p className="text-xs text-slate-500">Variação de peso desde a anterior: {(Number(latestAssessment.peso_kg) - Number(previousAssessment.peso_kg)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</p>
                  )}
                </div>
              ) : <p className="text-sm text-slate-500">Nenhuma avaliação física registrada.</p>}
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Seus horários</CardTitle><CalendarDays className="h-5 w-5 text-slate-400" /></CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum horário fixo cadastrado.</p>
              ) : (
                <div className="space-y-2">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800">{DIAS_SEMANA[Number(schedule.dia_semana)]}</p>
                        {schedule.observacoes && <p className="mt-0.5 text-xs text-slate-500">{schedule.observacoes}</p>}
                      </div>
                      <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white">{shortTime(schedule.horario)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Seus treinos</CardTitle><Dumbbell className="h-5 w-5 text-slate-400" /></CardHeader>
            <CardContent>
              {plans.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum plano de treino ativo.</p>
              ) : (
                <div className="space-y-4">
                  {plans.map((plan) => {
                    const items = workoutItems.filter((item) => item.workout_plan_id === plan.id);
                    return (
                      <div key={plan.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="mb-3">
                          <p className="font-semibold text-slate-900">{plan.nome}</p>
                          {plan.objetivo && <p className="mt-0.5 text-sm text-slate-500">{plan.objetivo}</p>}
                        </div>
                        <div className="space-y-2">
                          {items.map((item, index) => {
                            const exercise = item.exercise as { nome?: string; grupo_muscular?: string } | null;
                            return (
                              <div key={item.id} className="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-900 text-xs font-semibold text-white">{index + 1}</span>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-800">{exercise?.nome || "Exercício"}</p>
                                  <p className="text-xs text-slate-500">{[item.series ? `${item.series} séries` : null, item.repeticoes ? `${item.repeticoes} reps` : null, item.carga || null, item.descanso_segundos != null ? `${item.descanso_segundos}s descanso` : null].filter(Boolean).join(" · ") || "Sem prescrição detalhada"}</p>
                                </div>
                              </div>
                            );
                          })}
                          {items.length === 0 && <p className="text-sm text-slate-500">O treino ainda não possui exercícios.</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
