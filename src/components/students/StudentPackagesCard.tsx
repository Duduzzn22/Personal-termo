import { Dumbbell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDateBR } from "@/lib/utils/format";
import type { StudentPackageWithPackage } from "@/lib/repositories/student-packages.repository";

export function StudentPackagesCard({ packages }: { packages: StudentPackageWithPackage[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pacotes e saldo de aulas</CardTitle>
      </CardHeader>
      <CardContent>
        {packages.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="Nenhum pacote contratado"
            description="Quando o aluno aceitar um termo com pacote, o saldo de aulas aparecerá aqui."
          />
        ) : (
          <div className="space-y-3">
            {packages.map((studentPackage) => {
              const total = studentPackage.packages?.quantidade_aulas ?? 0;
              const used = studentPackage.aulas_realizadas;
              const remaining = Math.max(total - used, 0);
              const percent = total > 0 ? Math.min(Math.round((used / total) * 100), 100) : 0;

              return (
                <div key={studentPackage.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {studentPackage.packages?.nome ?? "Pacote"}
                        </p>
                        <StatusBadge status={studentPackage.status} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {studentPackage.data_inicio ? `Início: ${formatDateBR(studentPackage.data_inicio)}` : "Início não informado"}
                        {studentPackage.data_validade_final
                          ? ` · Validade: ${formatDateBR(studentPackage.data_validade_final)}`
                          : ""}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-2xl font-semibold tracking-tight text-slate-900">{remaining}</p>
                      <p className="text-xs text-slate-500">aulas restantes</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
                      <span>{used} realizadas</span>
                      <span>{total} no pacote</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
