"use client";

import { useState, useTransition } from "react";
import { GripVertical, ChevronUp, ChevronDown, Pencil, Trash2, EyeOff, Eye } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ClauseForm } from "./ClauseForm";
import {
  deleteClauseAction,
  reorderClausesAction,
  toggleClauseActiveAction,
} from "@/lib/actions/terms.actions";
import { cn } from "@/lib/utils/cn";
import type { TermClause } from "@/types/database";

export function ClauseList({ templateId, clauses }: { templateId: string; clauses: TermClause[] }) {
  const [items, setItems] = useState(clauses);
  const [syncedClauses, setSyncedClauses] = useState(clauses);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState<TermClause | null>(null);
  const [, startTransition] = useTransition();

  // Mantém sincronizado quando o servidor revalida (nova cláusula criada/excluída/editada).
  // Ajuste de estado durante a renderização (padrão recomendado pelo React em vez de useEffect).
  if (clauses !== syncedClauses) {
    setSyncedClauses(clauses);
    setItems(clauses);
  }

  function persistOrder(newItems: TermClause[]) {
    setItems(newItems);
    startTransition(() => {
      reorderClausesAction(
        templateId,
        newItems.map((c, idx) => ({ id: c.id, posicao: idx }))
      );
    });
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    persistOrder(next);
  }

  function onDrop(index: number) {
    if (dragIndex === null || dragIndex === index) return;
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setDragIndex(null);
    persistOrder(next);
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed p-8 text-center text-sm text-slate-500">
        Nenhuma cláusula adicionada. Clique em &quot;Adicionar condição&quot; para começar.
      </Card>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((clause, index) => (
        <div
          key={clause.id}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onDrop(index)}
          className={cn(
            "group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-shadow",
            !clause.ativo && "opacity-60",
            dragIndex === index && "opacity-40"
          )}
        >
          <div className="flex flex-col items-center gap-1 pt-0.5 text-slate-300">
            <GripVertical className="h-4 w-4 cursor-grab active:cursor-grabbing" />
            <div className="flex flex-col">
              <button
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="rounded p-0.5 hover:bg-slate-100 disabled:opacity-30"
                aria-label="Mover para cima"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                className="rounded p-0.5 hover:bg-slate-100 disabled:opacity-30"
                aria-label="Mover para baixo"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-900">{clause.titulo}</h4>
              {clause.obrigatoria ? (
                <Badge tone="slate">Obrigatória</Badge>
              ) : (
                <Badge tone="blue">Opcional</Badge>
              )}
              {!clause.ativo && <Badge tone="amber">Inativa</Badge>}
            </div>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{clause.conteudo}</p>
          </div>

          <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => toggleClauseActiveAction(templateId, clause.id, !clause.ativo)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              title={clause.ativo ? "Desativar" : "Ativar"}
            >
              {clause.ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setEditing(clause)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => deleteClauseAction(templateId, clause.id)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
              title="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar cláusula" size="lg">
        {editing && <ClauseForm templateId={templateId} clause={editing} onSuccess={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}
