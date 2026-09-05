"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Check, X, RotateCcw, Pencil, Trash2, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { AddAvulsaSessionModal } from "./AddAvulsaSessionModal";
import { upsertOccurrenceAction, deleteOccurrenceSessionAction } from "@/lib/actions/agenda.actions";
import { addDaysISO, formatTimeShort, relativeDayLabel, todayISO } from "@/lib/utils/agenda";
import type { AgendaOccurrence } from "@/lib/services/agenda.service";
import type { TrainingSessionStatus } from "@/types/database";

export function AgendaPageClient({
  data,
  occurrences,
  students,
}: {
  data: string;
  occurrences: AgendaOccurrence[];
  students: { id: string; nome_completo: string }[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<AgendaOccurrence | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/agenda?data=${addDaysISO(data, -1)}`}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Dia anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <p className="min-w-[190px] text-center text-sm font-semibold text-slate-900">{relativeDayLabel(data)}</p>
          <Link
            href={`/agenda?data=${addDaysISO(data, 1)}`}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Próximo dia"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
          {data !== todayISO() && (
            <Link href="/agenda" className="ml-1 text-xs font-medium text-slate-500 underline hover:text-slate-800">
              Ir para hoje
            </Link>
          )}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Sessão avulsa
        </Button>
      </div>

      {occurrences.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhum treino neste dia"
          description="Cadastre horários fixos na aba de cada aluno, ou adicione uma sessão avulsa para este dia."
        />
      ) : (
        <Card className="divide-y divide-slate-100">
          {occurrences.map((o) => (
            <OccurrenceRow key={o.key} occurrence={o} onEditTime={() => setEditing(o)} />
          ))}
        </Card>
      )}

      <AddAvulsaSessionModal open={addOpen} onClose={() => setAddOpen(false)} students={students} defaultData={data} />

      {editing && <EditTimeModal key={editing.key} occurrence={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function OccurrenceRow({ occurrence, onEditTime }: { occurrence: AgendaOccurrence; onEditTime: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  function setStatus(status: TrainingSessionStatus) {
    startTransition(async () => {
      setActionError(null);
      const result = await upsertOccurrenceAction({
        sessionId: occurrence.sessionId,
        scheduleId: occurrence.scheduleId,
        studentId: occurrence.studentId,
        data: occurrence.data,
        horario: occurrence.horario,
        status,
      });
      if (result.error) setActionError(result.error);
    });
  }

  function remove() {
    const sessionId = occurrence.sessionId;
    if (!sessionId) return;
    startTransition(async () => {
      setActionError(null);
      await deleteOccurrenceSessionAction(sessionId);
    });
  }

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
          {formatTimeShort(occurrence.horario)}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">{occurrence.studentName}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {occurrence.origem === "recorrente" ? "Horário fixo" : "Sessão avulsa"}
            {occurrence.ajustado && <span className="text-amber-600"> · ajustado hoje</span>}
          </p>
          {occurrence.observacoes && <p className="mt-0.5 text-xs text-slate-400">{occurrence.observacoes}</p>}
        </div>
      </div>
      <div className="flex flex-col items-start gap-1.5 sm:items-end">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={occurrence.status} />
          {occurrence.status !== "concluido" && (
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => setStatus("concluido")}>
              <Check className="h-3.5 w-3.5" /> Concluir
            </Button>
          )}
          {occurrence.status !== "cancelado" && (
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => setStatus("cancelado")}>
              <X className="h-3.5 w-3.5" /> Cancelar
            </Button>
          )}
          {occurrence.status !== "agendado" && (
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => setStatus("agendado")}>
              <RotateCcw className="h-3.5 w-3.5" /> Reabrir
            </Button>
          )}
          <button
            onClick={onEditTime}
            disabled={isPending}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            title="Alterar horário deste dia"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {occurrence.sessionId && (
            <button
              onClick={remove}
              disabled={isPending}
              className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              title={occurrence.origem === "recorrente" ? "Restaurar horário padrão" : "Remover sessão"}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        {actionError && <p className="max-w-md text-xs text-red-600">{actionError}</p>}
      </div>
    </div>
  );
}

function EditTimeModal({ occurrence, onClose }: { occurrence: AgendaOccurrence; onClose: () => void }) {
  const [horario, setHorario] = useState(occurrence.horario.slice(0, 5));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      setError(null);
      const result = await upsertOccurrenceAction({
        sessionId: occurrence.sessionId,
        scheduleId: occurrence.scheduleId,
        studentId: occurrence.studentId,
        data: occurrence.data,
        horario,
        status: occurrence.status,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal open onClose={onClose} title="Alterar horário deste dia" size="sm">
      <div className="space-y-4">
        <Input label="Novo horário" type="time" value={horario} onChange={(e) => setHorario(e.target.value)} />
        <p className="text-xs text-slate-500">
          Isso altera o horário só de {occurrence.studentName} neste dia — o padrão semanal continua o mesmo.
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={save} loading={isPending}>
            Salvar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
