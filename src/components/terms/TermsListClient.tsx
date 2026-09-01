"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, FileText, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TermTemplateForm } from "./TermTemplateForm";
import { createTemplateWithDefaultContentAction, deleteTemplateAction } from "@/lib/actions/terms.actions";
import { formatDateBR } from "@/lib/utils/format";
import type { TermTemplate } from "@/types/database";

interface TemplateWithCounts extends TermTemplate {
  versionCount: number;
  publishedVersion?: string;
}

export function TermsListClient({ templates }: { templates: TemplateWithCounts[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<TemplateWithCounts | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    if (!templateToDelete) return;
    const id = templateToDelete.id;
    startTransition(async () => {
      await deleteTemplateAction(id);
      setTemplateToDelete(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">{templates.length} modelo(s) de termo</p>
        <div className="flex gap-2">
          <form action={createTemplateWithDefaultContentAction}>
            <Button variant="outline" type="submit">
              <Sparkles className="h-4 w-4" /> Usar modelo padrão
            </Button>
          </form>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Novo termo em branco
          </Button>
        </div>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum termo criado ainda"
          description="Comece a partir do modelo padrão de 16 cláusulas (totalmente editável) ou crie um termo em branco."
          action={
            <div className="flex gap-2">
              <form action={createTemplateWithDefaultContentAction}>
                <Button type="submit">
                  <Sparkles className="h-4 w-4" /> Usar modelo padrão
                </Button>
              </form>
              <Button variant="outline" onClick={() => setModalOpen(true)}>
                Criar em branco
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {templates.map((t) => (
            <div key={t.id} className="group relative">
              <Link href={`/termos/${t.id}`}>
                <Card className="flex flex-col gap-2 p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="pr-7 text-sm font-semibold text-slate-900">{t.titulo}</h3>
                    {t.publishedVersion ? (
                      <Badge tone="green">v{t.publishedVersion}</Badge>
                    ) : (
                      <Badge tone="amber">Sem versão publicada</Badge>
                    )}
                  </div>
                  {t.descricao && <p className="text-sm text-slate-500 line-clamp-2">{t.descricao}</p>}
                  <p className="mt-2 text-xs text-slate-400">
                    {t.versionCount} versão(ões) publicada(s) · Criado em {formatDateBR(t.created_at)}
                  </p>
                </Card>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTemplateToDelete(t);
                }}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-300 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                title="Excluir termo"
                aria-label="Excluir termo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo termo em branco">
        <TermTemplateForm onSuccess={() => setModalOpen(false)} />
      </Modal>

      <Modal
        open={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
        title="Excluir termo"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Tem certeza que deseja excluir <strong>{templateToDelete?.titulo}</strong>? Ele deixará de
            aparecer nesta lista, mas o histórico de aceites de alunos que já assinaram alguma versão
            dele é mantido.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTemplateToDelete(null)} disabled={isPending}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={isPending}>
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
