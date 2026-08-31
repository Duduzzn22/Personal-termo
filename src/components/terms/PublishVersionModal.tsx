"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { useToast } from "@/components/ui/Toast";
import { publishVersionAction, type PublishActionState } from "@/lib/actions/terms.actions";

interface StudentWithAcceptedVersion {
  id: string;
  nome_completo: string;
}

const initialState: PublishActionState = {};

export function PublishVersionModal({
  open,
  onClose,
  templateId,
  suggestedVersion,
  studentsWithAcceptedTerm,
}: {
  open: boolean;
  onClose: () => void;
  templateId: string;
  suggestedVersion: string;
  studentsWithAcceptedTerm: StudentWithAcceptedVersion[];
}) {
  const [requireNew, setRequireNew] = useState(false);
  const action = publishVersionAction.bind(null, templateId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const { showToast } = useToast();

  useEffect(() => {
    if (state.success) {
      showToast("Nova versão publicada com sucesso.");
      onClose();
    }
    if (state.error) showToast(state.error, "error");
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal open={open} onClose={onClose} title="Publicar nova versão" size="md">
      <form action={formAction} className="space-y-4">
        <Input
          label="Número da versão"
          name="versao"
          required
          defaultValue={suggestedVersion}
          hint="Formato X.Y — ex: 1.0, 1.1, 2.0"
        />
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
          Após publicada, esta versão fica <strong>imutável</strong>. Qualquer alteração futura no
          termo deverá gerar uma nova versão — o conteúdo já aceito por alunos nunca é modificado
          retroativamente.
        </div>

        {studentsWithAcceptedTerm.length > 0 && (
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <Checkbox
              name="exigir_novo_aceite"
              checked={requireNew}
              onChange={(e) => setRequireNew(e.target.checked)}
              label="Exigir novo aceite dos alunos existentes que já aceitaram uma versão anterior"
            />
            {requireNew && (
              <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200 p-3">
                {studentsWithAcceptedTerm.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" name="alunos_para_notificar" value={s.id} className="h-4 w-4 rounded border-slate-300" />
                    {s.nome_completo}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" loading={pending}>
            Publicar versão
          </Button>
        </div>
      </form>
    </Modal>
  );
}
