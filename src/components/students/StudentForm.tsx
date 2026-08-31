"use client";

import { useActionState, useEffect } from "react";
import {
  createStudentAction,
  updateStudentAction,
  type StudentActionState,
} from "@/lib/actions/students.actions";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { Student } from "@/types/database";

const initialState: StudentActionState = {};

export function StudentForm({ student, onSuccess }: { student?: Student; onSuccess: () => void }) {
  const action = student
    ? updateStudentAction.bind(null, student.id)
    : createStudentAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const { showToast } = useToast();

  useEffect(() => {
    if (state.success) {
      showToast(student ? "Aluno atualizado com sucesso." : "Aluno cadastrado com sucesso.");
      onSuccess();
    }
  }, [state.success]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={formAction} className="space-y-4">
      <Input
        label="Nome completo"
        name="nome_completo"
        required
        defaultValue={student?.nome_completo}
        error={state.fieldErrors?.nome_completo}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="CPF"
          name="cpf"
          placeholder="Opcional"
          defaultValue={student?.cpf ?? ""}
          error={state.fieldErrors?.cpf}
        />
        <Input
          label="Data de nascimento"
          name="data_nascimento"
          type="date"
          defaultValue={student?.data_nascimento ?? ""}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Telefone" name="telefone" defaultValue={student?.telefone ?? ""} />
        <Input label="WhatsApp" name="whatsapp" defaultValue={student?.whatsapp ?? ""} />
      </div>
      <Input
        label="E-mail"
        name="email"
        type="email"
        defaultValue={student?.email ?? ""}
        error={state.fieldErrors?.email}
      />
      <Textarea label="Observações" name="observacoes" defaultValue={student?.observacoes ?? ""} />
      <Select label="Status" name="status" defaultValue={student?.status ?? "ativo"}>
        <option value="ativo">Ativo</option>
        <option value="inativo">Inativo</option>
        <option value="arquivado">Arquivado</option>
      </Select>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" loading={pending}>
          {student ? "Salvar alterações" : "Cadastrar aluno"}
        </Button>
      </div>
    </form>
  );
}
