"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createClauseAction, updateClauseAction, type TermActionState } from "@/lib/actions/terms.actions";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { useToast } from "@/components/ui/Toast";
import { AVAILABLE_VARIABLES } from "@/lib/utils/variables";
import type { TermClause } from "@/types/database";

const initialState: TermActionState = {};

export function ClauseForm({
  templateId,
  clause,
  onSuccess,
}: {
  templateId: string;
  clause?: TermClause;
  onSuccess: () => void;
}) {
  const action = clause
    ? updateClauseAction.bind(null, templateId, clause.id)
    : createClauseAction.bind(null, templateId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const { showToast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(clause?.conteudo ?? "");

  useEffect(() => {
    if (state.success) {
      showToast("Cláusula salva com sucesso.");
      onSuccess();
    }
  }, [state.success]); // eslint-disable-line react-hooks/exhaustive-deps

  function insertVariable(key: string) {
    const textarea = textareaRef.current;
    const token = `{{${key}}}`;
    if (!textarea) {
      setContent((c) => c + token);
      return;
    }
    const start = textarea.selectionStart ?? content.length;
    const end = textarea.selectionEnd ?? content.length;
    const next = content.slice(0, start) + token + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + token.length;
    });
  }

  return (
    <form action={formAction} className="space-y-4">
      <Input
        label="Título da cláusula"
        name="titulo"
        required
        defaultValue={clause?.titulo}
        error={state.fieldErrors?.titulo}
      />
      <div>
        <Textarea
          ref={textareaRef}
          label="Conteúdo"
          name="conteudo"
          required
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          error={state.fieldErrors?.conteudo}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {AVAILABLE_VARIABLES.map((v) => (
            <button
              type="button"
              key={v.key}
              onClick={() => insertVariable(v.key)}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              title={v.label}
            >
              {`{{${v.key}}}`}
            </button>
          ))}
        </div>
      </div>
      <Checkbox
        name="obrigatoria"
        defaultChecked={clause?.obrigatoria ?? true}
        label="Cláusula obrigatória (não pode ser removida do aceite pelo aluno)"
      />
      {clause && (
        <Checkbox name="ativo" defaultChecked={clause.ativo} label="Cláusula ativa (visível para os alunos)" />
      )}
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" loading={pending}>
          {clause ? "Salvar cláusula" : "Adicionar condição"}
        </Button>
      </div>
    </form>
  );
}
