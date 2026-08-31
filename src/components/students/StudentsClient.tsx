"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { StudentForm } from "./StudentForm";
import { formatPhone } from "@/lib/utils/format";
import { initials } from "@/lib/utils/format";
import type { Student } from "@/types/database";

export function StudentsClient({ students }: { students: Student[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = s.nome_completo.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "todos" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [students, search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="arquivado">Arquivado</option>
          </Select>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Novo aluno
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={students.length === 0 ? "Nenhum aluno cadastrado" : "Nenhum aluno encontrado"}
          description={
            students.length === 0
              ? "Cadastre seu primeiro aluno para começar a enviar termos de aceite."
              : "Ajuste a busca ou o filtro de status."
          }
          action={
            students.length === 0 && (
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" /> Novo aluno
              </Button>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Aluno</th>
                  <th className="px-5 py-3 font-medium">Contato</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link href={`/alunos/${s.id}`} className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {initials(s.nome_completo)}
                        </div>
                        <span className="font-medium text-slate-800 hover:underline">{s.nome_completo}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {s.email || formatPhone(s.whatsapp || s.telefone)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo aluno" size="md">
        <StudentForm onSuccess={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
