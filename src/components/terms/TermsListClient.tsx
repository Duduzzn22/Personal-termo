"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TermTemplateForm } from "./TermTemplateForm";
import { createTemplateWithDefaultContentAction } from "@/lib/actions/terms.actions";
import { formatDateBR } from "@/lib/utils/format";
import type { TermTemplate } from "@/types/database";

interface TemplateWithCounts extends TermTemplate {
  versionCount: number;
  publishedVersion?: string;
}

export function TermsListClient({ templates }: { templates: TemplateWithCounts[] }) {
  const [modalOpen, setModalOpen] = useState(false);

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
            <Link key={t.id} href={`/termos/${t.id}`}>
              <Card className="flex flex-col gap-2 p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{t.titulo}</h3>
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
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo termo em branco">
        <TermTemplateForm onSuccess={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
