"use client";

import { useState } from "react";
import { Pencil, Send, Archive } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { StudentForm } from "./StudentForm";
import { StudentScheduleCard } from "./StudentScheduleCard";
import { StudentPackagesCard } from "./StudentPackagesCard";
import { StudentSessionHistoryCard } from "./StudentSessionHistoryCard";
import { SendTermModal } from "@/components/invitations/SendTermModal";
import { archiveStudentAction } from "@/lib/actions/students.actions";
import { formatCPF, formatDateBR, formatPhone, initials } from "@/lib/utils/format";
import type { StudentPackageWithPackage } from "@/lib/repositories/student-packages.repository";
import type { TrainingSessionWithPackage } from "@/lib/repositories/agenda.repository";
import type { Student, TrainingSchedule } from "@/types/database";

interface InvitationRow {
  id: string;
  status: string;
  created_at: string;
  packages?: { nome: string } | null;
  term_versions?: { versao: string; term_templates?: { titulo: string } | null } | null;
}

export function StudentDetailClient({
  student,
  invitations,
  schedules,
  studentPackages,
  sessions,
}: {
  student: Student;
  invitations: InvitationRow[];
  schedules: TrainingSchedule[];
  studentPackages: StudentPackageWithPackage[];
  sessions: TrainingSessionWithPackage[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [renewalPackageId, setRenewalPackageId] = useState<string | undefined>();

  function openRegularTerm() {
    setRenewalPackageId(undefined);
    setSendOpen(true);
  }

  function openRenewal(packageId: string) {
    setRenewalPackageId(packageId);
    setSendOpen(true);
  }

  function closeSendModal() {
    setSendOpen(false);
    setRenewalPackageId(undefined);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {initials(student.nome_completo)}
            </div>
            <div>
              <CardTitle>{student.nome_completo}</CardTitle>
              <StatusBadge status={student.status} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
            {student.status !== "arquivado" && (
              <form action={archiveStudentAction.bind(null, student.id)}>
                <Button variant="outline" size="sm" type="submit">
                  <Archive className="h-4 w-4" /> Arquivar
                </Button>
              </form>
            )}
            <Button size="sm" onClick={openRegularTerm}>
              <Send className="h-4 w-4" /> Enviar Termo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">CPF</dt>
              <dd className="mt-0.5 text-sm text-slate-700">{formatCPF(student.cpf)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Nascimento</dt>
              <dd className="mt-0.5 text-sm text-slate-700">{formatDateBR(student.data_nascimento)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Telefone</dt>
              <dd className="mt-0.5 text-sm text-slate-700">{formatPhone(student.telefone)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">WhatsApp</dt>
              <dd className="mt-0.5 text-sm text-slate-700">{formatPhone(student.whatsapp)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">E-mail</dt>
              <dd className="mt-0.5 text-sm text-slate-700">{student.email || "—"}</dd>
            </div>
          </dl>
          {student.observacoes && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Observações</dt>
              <dd className="mt-0.5 text-sm text-slate-700">{student.observacoes}</dd>
            </div>
          )}
        </CardContent>
      </Card>

      <StudentPackagesCard packages={studentPackages} onRenew={openRenewal} />

      <StudentScheduleCard studentId={student.id} schedules={schedules} />

      <StudentSessionHistoryCard sessions={sessions} />

      <Card>
        <CardHeader>
          <CardTitle>Termos enviados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invitations.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={Send}
                title="Nenhum termo enviado"
                description="Envie um termo de ciência e aceite para este aluno."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3 font-medium">Termo</th>
                    <th className="px-5 py-3 font-medium">Pacote</th>
                    <th className="px-5 py-3 font-medium">Enviado em</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3 text-slate-700">
                        {inv.term_versions?.term_templates?.titulo} · v{inv.term_versions?.versao}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{inv.packages?.nome}</td>
                      <td className="px-5 py-3 text-slate-600">{formatDateBR(inv.created_at)}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={inv.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar aluno">
        <StudentForm student={student} onSuccess={() => setEditOpen(false)} />
      </Modal>

      <SendTermModal
        open={sendOpen}
        onClose={closeSendModal}
        preselectedStudentId={student.id}
        preselectedPackageId={renewalPackageId}
      />
    </div>
  );
}
