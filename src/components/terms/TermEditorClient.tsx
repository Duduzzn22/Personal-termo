"use client";

import { useState } from "react";
import { Plus, Eye, UploadCloud, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { ClauseForm } from "./ClauseForm";
import { ClauseList } from "./ClauseList";
import { TermTemplateForm } from "./TermTemplateForm";
import { PublishVersionModal } from "./PublishVersionModal";
import { PreviewAsStudentModal } from "./PreviewAsStudentModal";
import { VersionHistory } from "./VersionHistory";
import type { TermTemplate, TermClause, TermVersion, TermVersionClause } from "@/types/database";

function nextVersionSuggestion(versions: TermVersion[]): string {
  if (versions.length === 0) return "1.0";
  const latest = versions[0]?.versao ?? "1.0";
  const [major, minor] = latest.split(".").map(Number);
  return `${major}.${(minor || 0) + 1}`;
}

export function TermEditorClient({
  template,
  clauses,
  versions,
  clausesByVersion,
  studentsWithAcceptedTerm,
}: {
  template: TermTemplate;
  clauses: TermClause[];
  versions: TermVersion[];
  clausesByVersion: Record<string, TermVersionClause[]>;
  studentsWithAcceptedTerm: { id: string; nome_completo: string }[];
}) {
  const [addClauseOpen, setAddClauseOpen] = useState(false);
  const [editTemplateOpen, setEditTemplateOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{template.titulo}</h2>
          {template.descricao && <p className="mt-1 text-sm text-slate-500">{template.descricao}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditTemplateOpen(true)}>
            <Pencil className="h-4 w-4" /> Editar título
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4" /> Visualizar como aluno
          </Button>
          <Button size="sm" onClick={() => setPublishOpen(true)}>
            <UploadCloud className="h-4 w-4" /> Publicar nova versão
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cláusulas (rascunho)</CardTitle>
          <Button size="sm" onClick={() => setAddClauseOpen(true)}>
            <Plus className="h-4 w-4" /> Adicionar condição
          </Button>
        </CardHeader>
        <CardContent>
          <ClauseList templateId={template.id} clauses={clauses} />
        </CardContent>
      </Card>

      <VersionHistory versions={versions} clausesByVersion={clausesByVersion} />

      <Modal open={addClauseOpen} onClose={() => setAddClauseOpen(false)} title="Adicionar condição" size="lg">
        <ClauseForm templateId={template.id} onSuccess={() => setAddClauseOpen(false)} />
      </Modal>

      <Modal open={editTemplateOpen} onClose={() => setEditTemplateOpen(false)} title="Editar termo">
        <TermTemplateForm template={template} onSuccess={() => setEditTemplateOpen(false)} />
      </Modal>

      <PublishVersionModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        templateId={template.id}
        suggestedVersion={nextVersionSuggestion(versions)}
        studentsWithAcceptedTerm={studentsWithAcceptedTerm}
      />

      <PreviewAsStudentModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        templateTitle={template.titulo}
        clauses={clauses}
      />
    </div>
  );
}
