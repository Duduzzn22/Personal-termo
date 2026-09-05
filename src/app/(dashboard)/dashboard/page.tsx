import Link from "next/link";
import {
  Users,
  UserCheck,
  Clock,
  CheckCircle2,
  Package as PackageIcon,
  Send,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/services/dashboard.service";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTimeBR } from "@/lib/utils/format";

export default async function DashboardPage() {
  const { userId, profile } = await requireTrainer();
  const supabase = await createClient();
  const stats = await getDashboardStats(supabase, userId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-slate-500">
          Bem-vindo de volta, <span className="font-medium text-slate-700">{profile.nome_profissional}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label="Total de alunos" value={stats.totalAlunos} icon={Users} tone="slate" />
        <StatCard label="Alunos ativos" value={stats.alunosAtivos} icon={UserCheck} tone="blue" />
        <StatCard label="Aguardando aceite" value={stats.termosAguardando} icon={Clock} tone="amber" />
        <StatCard label="Termos aceitos" value={stats.termosAceitos} icon={CheckCircle2} tone="green" />
        <StatCard label="Pacotes ativos" value={stats.pacotesAtivos} icon={PackageIcon} tone="slate" />
        <StatCard label="Renovações" value={stats.renovacoesPendentes} icon={AlertTriangle} tone="amber" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/alunos">
          <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <Users className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Cadastrar aluno</p>
              <p className="text-xs text-slate-500">Novo aluno no sistema</p>
            </div>
          </Card>
        </Link>
        <Link href="/termos">
          <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <Send className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Enviar termo</p>
              <p className="text-xs text-slate-500">Gerar link de aceite</p>
            </div>
          </Card>
        </Link>
        <Link href="/pacotes">
          <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <PackageIcon className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Criar pacote</p>
              <p className="text-xs text-slate-500">Novo pacote de aulas</p>
            </div>
          </Card>
        </Link>
      </div>

      {stats.renewalCandidates.length > 0 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Renovações próximas</CardTitle>
              <p className="mt-1 text-xs text-slate-500">Alunos com 2 ou menos aulas restantes, ou pacote já concluído.</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {stats.renewalCandidates.map((candidate) => (
                <Link
                  key={candidate.id}
                  href={`/alunos/${candidate.students?.id ?? candidate.student_id}`}
                  className="flex flex-col gap-2 px-5 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                      <RotateCcw className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{candidate.students?.nome_completo ?? "Aluno"}</p>
                      <p className="text-xs text-slate-500">{candidate.packages?.nome ?? "Pacote"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-12 sm:pl-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-amber-800">{candidate.aulas_restantes}</p>
                      <p className="text-[11px] text-slate-500">aulas restantes</p>
                    </div>
                    <StatusBadge status={candidate.status} />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Aceites recentes</CardTitle>
          <Link
            href="/aceites"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Ver todos
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {stats.recentAcceptances.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={CheckCircle2}
                title="Nenhum aceite registrado ainda"
                description="Assim que um aluno confirmar um termo, ele aparecerá aqui."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3 font-medium">Aluno</th>
                    <th className="px-5 py-3 font-medium">Pacote</th>
                    <th className="px-5 py-3 font-medium">Termo</th>
                    <th className="px-5 py-3 font-medium">Versão</th>
                    <th className="px-5 py-3 font-medium">Data</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {stats.recentAcceptances.map((a: any) => (
                    <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-medium text-slate-800">{a.students?.nome_completo}</td>
                      <td className="px-5 py-3 text-slate-600">{a.packages?.nome}</td>
                      <td className="px-5 py-3 text-slate-600">{a.term_versions?.term_templates?.titulo}</td>
                      <td className="px-5 py-3 text-slate-600">{a.term_versions?.versao}</td>
                      <td className="px-5 py-3 text-slate-600">{formatDateTimeBR(a.accepted_at)}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status="aceito" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
