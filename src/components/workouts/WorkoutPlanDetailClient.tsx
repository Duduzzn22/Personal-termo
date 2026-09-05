"use client";

import { useState } from "react";
import { Archive, ExternalLink, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { WorkoutPlanForm } from "./WorkoutPlanForm";
import { AddWorkoutItemForm } from "./AddWorkoutItemForm";
import { archiveWorkoutPlanAction, removeWorkoutItemAction } from "@/lib/actions/workouts.actions";
import type { Student } from "@/types/database";
import type { Exercise, WorkoutPlanDetail, WorkoutPlanItemWithExercise } from "@/types/workout";

function formatDate(value: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function prescription(item: WorkoutPlanItemWithExercise) {
  const parts = [];
  if (item.series) parts.push(`${item.series} série${item.series === 1 ? "" : "s"}`);
  if (item.repeticoes) parts.push(`${item.repeticoes} reps`);
  return parts.length ? parts.join(" × ") : "Prescrição livre";
}

export function WorkoutPlanDetailClient({
  plan,
  exercises,
  students,
}: {
  plan: WorkoutPlanDetail;
  exercises: Exercise[];
  students: Student[];
}) {
  const [editPlanOpen, setEditPlanOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkoutPlanItemWithExercise | undefined>();

  function openNewItem() {
    setEditingItem(undefined);
    setItemOpen(true);
  }

  function openEditItem(item: WorkoutPlanItemWithExercise) {
    setEditingItem(item);
    setItemOpen(true);
  }

  function closeItemModal() {
    setItemOpen(false);
    setEditingItem(undefined);
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{plan.nome}</CardTitle>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${plan.status === "ativo" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {plan.status === "ativo" ? "Ativo" : "Arquivado"}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">Aluno: {plan.student.nome_completo}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditPlanOpen(true)}>
              <Pencil className="h-4 w-4" /> Editar plano
            </Button>
            <form action={archiveWorkoutPlanAction.bind(null, plan.id, plan.status === "ativo")}>
              <Button variant="outline" size="sm" type="submit">
                {plan.status === "ativo" ? <Archive className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                {plan.status === "ativo" ? "Arquivar" : "Reativar"}
              </Button>
            </form>
            <Button size="sm" onClick={openNewItem} disabled={exercises.length === 0}>
              <Plus className="h-4 w-4" /> Adicionar exercício
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Objetivo</dt>
              <dd className="mt-1 text-sm text-slate-700">{plan.objetivo || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Início</dt>
              <dd className="mt-1 text-sm text-slate-700">{formatDate(plan.data_inicio)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Fim</dt>
              <dd className="mt-1 text-sm text-slate-700">{formatDate(plan.data_fim)}</dd>
            </div>
          </dl>
          {plan.observacoes && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Orientações gerais</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{plan.observacoes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Exercícios do treino</CardTitle>
            <p className="mt-1 text-xs text-slate-500">{plan.items.length} exercício(s) na prescrição</p>
          </div>
          <Button size="sm" onClick={openNewItem} disabled={exercises.length === 0}>
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {exercises.length === 0 ? (
            <EmptyState
              icon={Plus}
              title="Cadastre exercícios primeiro"
              description="A biblioteca ainda está vazia. Volte para Treinos → Biblioteca e cadastre os exercícios que deseja reutilizar."
            />
          ) : plan.items.length === 0 ? (
            <EmptyState
              icon={Plus}
              title="Treino ainda sem exercícios"
              description="Adicione o primeiro exercício e defina séries, repetições, carga e descanso."
              action={<Button onClick={openNewItem}><Plus className="h-4 w-4" /> Adicionar exercício</Button>}
            />
          ) : (
            <div className="space-y-3">
              {plan.items.map((item, index) => (
                <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="flex min-w-0 gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{item.exercise.nome}</h3>
                          {item.bloco && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Bloco {item.bloco}</span>}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {[item.exercise.grupo_muscular, item.exercise.equipamento].filter(Boolean).join(" · ") || "Sem classificação"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditItem(item)}>
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </Button>
                      <form action={removeWorkoutItemAction.bind(null, plan.id, item.id)}>
                        <Button variant="ghost" size="sm" type="submit">
                          <Trash2 className="h-3.5 w-3.5" /> Remover
                        </Button>
                      </form>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Séries × reps</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-800">{prescription(item)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Carga</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-800">{item.carga || "—"}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Descanso</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-800">{item.descanso_segundos !== null ? `${item.descanso_segundos}s` : "—"}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Referência</p>
                      {item.exercise.video_url ? (
                        <a href={item.exercise.video_url} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium text-slate-800 hover:underline">
                          Ver vídeo <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <p className="mt-0.5 text-sm font-medium text-slate-800">—</p>
                      )}
                    </div>
                  </div>

                  {(item.observacoes || item.exercise.instrucoes) && (
                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
                      {item.observacoes && <p><span className="font-medium text-slate-700">Prescrição:</span> {item.observacoes}</p>}
                      {item.exercise.instrucoes && <p><span className="font-medium text-slate-700">Execução:</span> {item.exercise.instrucoes}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={editPlanOpen} onClose={() => setEditPlanOpen(false)} title="Editar plano de treino" size="lg">
        <WorkoutPlanForm students={students} plan={plan} onSuccess={() => setEditPlanOpen(false)} />
      </Modal>

      <Modal
        open={itemOpen}
        onClose={closeItemModal}
        title={editingItem ? "Editar prescrição" : "Adicionar exercício ao treino"}
        description="Defina a prescrição específica deste exercício dentro do plano."
        size="lg"
      >
        <AddWorkoutItemForm planId={plan.id} exercises={exercises} item={editingItem} onSuccess={closeItemModal} />
      </Modal>
    </div>
  );
}