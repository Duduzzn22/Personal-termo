"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Select, Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createAvulsaSessionAction, type AgendaActionState } from "@/lib/actions/agenda.actions";

const initialState: AgendaActionState = {};

export function AddAvulsaSessionModal({
  open,
  onClose,
  students,
  defaultData,
}: {
  open: boolean;
  onClose: () => void;
  students: { id: string; nome_completo: string }[];
  defaultData: string;
}) {
  // Só monta o formulário quando o modal está aberto, garantindo estado limpo a cada abertura.
  if (!open) return null;
  return <AddAvulsaSessionForm onClose={onClose} students={students} defaultData={defaultData} />;
}

function AddAvulsaSessionForm({
  onClose,
  students,
  defaultData,
}: {
  onClose: () => void;
  students: { id: string; nome_completo: string }[];
  defaultData: string;
}) {
  const [state, formAction, pending] = useActionState(createAvulsaSessionAction, initialState);
  const { showToast } = useToast();

  useEffect(() => {
    if (state.success) {
      showToast("Sessão adicionada à agenda.");
      onClose();
    }
  }, [state.success]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal
      open
      onClose={onClose}
      title="Adicionar sessão avulsa"
      description="Um treino fora do horário fixo semanal, só para esta data."
      size="sm"
    >
      <form action={formAction} className="space-y-4">
        <Select label="Aluno" name="student_id" required defaultValue="" error={state.fieldErrors?.student_id}>
          <option value="" disabled>
            Selecione um aluno
          </option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome_completo}
            </option>
          ))}
        </Select>
        <Input
          label="Data"
          name="data"
          type="date"
          required
          defaultValue={defaultData}
          error={state.fieldErrors?.data}
        />
        <Input label="Horário" name="horario" type="time" required error={state.fieldErrors?.horario} />
        <Textarea label="Observações (opcional)" name="observacoes" />
        {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" loading={pending}>
            Adicionar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
