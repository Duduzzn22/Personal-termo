"use client";

import { AlertTriangle, Dumbbell, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateBR } from "@/lib/utils/format";
import type { StudentPackageWithPackage } from "@/lib/repositories/student-packages.repository";

export function StudentPackagesCard({
  packages,
  onRenew,
}: {
  packages: StudentPackageWithPackage[];
  onRenew?: (packageId: string) => void;
}) {
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
              const lowBalance = studentPackage.status === "ativo" && remaining <= 2;
              const renewalRecommended = lowBalance || studentPackage.status === "concluido";

              return (
                <div
                  key={studentPackage.id}
                  className={`rounded-xl border p-4 ${lowBalance ? "border-amber-300 bg-amber-50/40" : "border-slate-200"}`}
                >
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

                  {lowBalance && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-100 px-3 py-2 text-xs font-medium text-amber-900">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      {remaining === 0
                        ? "Este pacote está sem saldo. Gere a renovação antes da próxima aula."
                        : `Atenção: restam apenas ${remaining} ${remaining === 1 ? "aula" : "aulas"}. Considere renovar o pacote.`}
                    </div>
                  )}

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
                      <span>{used} realizadas</span>
                      <span>{total} no pacote</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${percent}%` }} />
                    </div>
                  </div>

                  {renewalRecommended && studentPackage.packages?.id && onRenew && (
                    <div className="mt-4 flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => onRenew(studentPackage.packages!.id)}>
                        <RotateCcw className="h-3.5 w-3.5" /> Renovar pacote
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
