"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScheduleForm } from "./ScheduleForm";
import { deleteScheduleAction } from "@/lib/actions/agenda.actions";
import { DIAS_SEMANA, formatTimeShort } from "@/lib/utils/agenda";
import type { TrainingSchedule } from "@/types/database";

export function StudentScheduleCard({ studentId, schedules }: { studentId: string; schedules: TrainingSchedule[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingSchedule | null>(null);
  const [toDelete, setToDelete] = useState<TrainingSchedule | null>(null);
  const [isPending, startTransition] = useTransition();

  const sorted = [...schedules].sort((a, b) => a.dia_semana - b.dia_semana || a.horario.localeCompare(b.horario));

  function confirmDelete() {
    if (!toDelete) return;
    const id = toDelete.id;
    startTransition(async () => {
      await deleteScheduleAction(id, studentId);
      setToDelete(null);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horários de treino</CardTitle>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> Adicionar horário
        </Button>
      </CardHeader>
      <CardContent className={sorted.length === 0 ? "p-0" : undefined}>
        {sorted.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Clock}
              title="Nenhum horário fixo cadastrado"
              description="Defina os dias e horários semanais em que este aluno treina para que eles apareçam na Agenda."
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sorted.map((s) => (
              <li key={s.id} className="group flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {DIAS_SEMANA[s.dia_semana]} · {formatTimeShort(s.horario)}
                  </p>
                  {s.observacoes && <p className="mt-0.5 text-xs text-slate-500">{s.observacoes}</p>}
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => setEditing(s)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setToDelete(s)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Adicionar horário fixo" size="sm">
        <ScheduleForm studentId={studentId} onSuccess={() => setFormOpen(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar horário" size="sm">
        {editing && <ScheduleForm studentId={studentId} schedule={editing} onSuccess={() => setEditing(null)} />}
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Remover horário" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Remover {toDelete && DIAS_SEMANA[toDelete.dia_semana]} às {toDelete && formatTimeShort(toDelete.horario)}?
            Ele deixará de aparecer na agenda a partir de agora.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={isPending}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={isPending}>
              <Trash2 className="h-4 w-4" /> Remover
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
