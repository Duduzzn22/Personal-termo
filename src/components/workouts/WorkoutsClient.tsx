"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Archive, Dumbbell, Library, Pencil, Plus, RotateCcw, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExerciseForm } from "./ExerciseForm";
import { WorkoutPlanForm } from "./WorkoutPlanForm";
import { archiveWorkoutPlanAction, toggleExerciseAction } from "@/lib/actions/workouts.actions";
import type { Student } from "@/types/database";
import type { Exercise, WorkoutPlanWithStudent } from "@/types/workout";

function formatDate(value: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function WorkoutsClient({
  plans,
  exercises,
  students,
}: {
  plans: WorkoutPlanWithStudent[];
  exercises: Exercise[];
  students: Student[];
}) {
  const [tab, setTab] = useState<"plans" | "library">("plans");
  const [planModal, setPlanModal] = useState(false);
  const [exerciseModal, setExerciseModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | undefined>();
  const [search, setSearch] = useState("");

  const filteredExercises = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return exercises;
    return exercises.filter((exercise) =>
      [exercise.nome, exercise.grupo_muscular, exercise.equipamento]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("pt-BR").includes(term))
    );
  }, [exercises, search]);

  function closeExerciseModal() {
    setExerciseModal(false);
    setEditingExercise(undefined);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Treinos</h1>
          <p className="mt-1 text-sm text-slate-500">Monte planos individuais e reutilize exercícios da sua biblioteca.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setEditingExercise(undefined); setExerciseModal(true); }}>
            <Plus className="h-4 w-4" /> Exercício
          </Button>
          <Button onClick={() => setPlanModal(true)}>
            <Plus className="h-4 w-4" /> Novo treino
          </Button>
        </div>
      </div>

      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
        <button
          onClick={() => setTab("plans")}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            tab === "plans" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Dumbbell className="h-4 w-4" /> Planos
        </button>
        <button
          onClick={() => setTab("library")}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            tab === "library" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Library className="h-4 w-4" /> Biblioteca
        </button>
      </div>

      {tab === "plans" ? (
        plans.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={Dumbbell}
                title="Nenhum plano de treino criado"
                description="Crie um plano para um aluno e depois adicione exercícios da biblioteca."
                action={<Button onClick={() => setPlanModal(true)}><Plus className="h-4 w-4" /> Criar primeiro treino</Button>}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className={plan.status === "arquivado" ? "opacity-70" : undefined}>
                <CardHeader>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle>{plan.nome}</CardTitle>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${plan.status === "ativo" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {plan.status === "ativo" ? "Ativo" : "Arquivado"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{plan.student.nome_completo}</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-400">Exercícios</p>
                      <p className="mt-0.5 font-semibold text-slate-800">{plan.items_count}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-400">Período</p>
                      <p className="mt-0.5 text-xs font-medium text-slate-700">{formatDate(plan.data_inicio)} → {formatDate(plan.data_fim)}</p>
                    </div>
                  </div>
                  {plan.objetivo && <p className="line-clamp-2 text-sm text-slate-600">{plan.objetivo}</p>}
                  <div className="flex justify-between gap-2 border-t border-slate-100 pt-3">
                    <form action={archiveWorkoutPlanAction.bind(null, plan.id, plan.status === "ativo")}>
                      <Button variant="ghost" size="sm" type="submit">
                        {plan.status === "ativo" ? <Archive className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                        {plan.status === "ativo" ? "Arquivar" : "Reativar"}
                      </Button>
                    </form>
                    <Link href={`/treinos/${plan.id}`}>
                      <Button size="sm">Abrir treino</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Biblioteca de exercícios</CardTitle>
              <p className="mt-1 text-xs text-slate-500">{exercises.length} exercício(s) cadastrado(s)</p>
            </div>
            <div className="w-full max-w-xs">
              <Input
                name="exercise_search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar exercício..."
                aria-label="Buscar exercício"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredExercises.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={Search}
                  title={exercises.length === 0 ? "Biblioteca vazia" : "Nenhum exercício encontrado"}
                  description={exercises.length === 0 ? "Cadastre exercícios para reutilizá-los nos planos dos alunos." : "Tente outro nome, grupo muscular ou equipamento."}
                  action={exercises.length === 0 ? <Button onClick={() => setExerciseModal(true)}><Plus className="h-4 w-4" /> Cadastrar exercício</Button> : undefined}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3 font-medium">Exercício</th>
                      <th className="px-5 py-3 font-medium">Grupo</th>
                      <th className="px-5 py-3 font-medium">Equipamento</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExercises.map((exercise) => (
                      <tr key={exercise.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-5 py-3 font-medium text-slate-800">{exercise.nome}</td>
                        <td className="px-5 py-3 text-slate-600">{exercise.grupo_muscular || "—"}</td>
                        <td className="px-5 py-3 text-slate-600">{exercise.equipamento || "—"}</td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${exercise.ativo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                            {exercise.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingExercise(exercise); setExerciseModal(true); }}>
                              <Pencil className="h-3.5 w-3.5" /> Editar
                            </Button>
                            <form action={toggleExerciseAction.bind(null, exercise.id, !exercise.ativo)}>
                              <Button variant="ghost" size="sm" type="submit">
                                {exercise.ativo ? "Inativar" : "Ativar"}
                              </Button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Modal open={planModal} onClose={() => setPlanModal(false)} title="Novo plano de treino" size="lg">
        <WorkoutPlanForm students={students} onSuccess={() => setPlanModal(false)} />
      </Modal>

      <Modal
        open={exerciseModal}
        onClose={closeExerciseModal}
        title={editingExercise ? "Editar exercício" : "Novo exercício"}
        size="lg"
      >
        <ExerciseForm exercise={editingExercise} onSuccess={closeExerciseModal} />
      </Modal>
    </div>
  );
}