"use client";

import { useState } from "react";
import { Activity, Pencil, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { AssessmentForm } from "./AssessmentForm";
import { AssessmentTrendChart } from "./AssessmentTrendChart";
import { calculateAssessmentBMI, type PhysicalAssessment } from "@/types/assessment";

function formatWallDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatMetric(value: number | null, unit: string, digits = 1) {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })}${unit}`;
}

function formatBMI(assessment: PhysicalAssessment) {
  const bmi = calculateAssessmentBMI(assessment);
  if (bmi === null) return "—";
  return bmi.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function deltaLabel(current: number | null, previous: number | null, unit: string) {
  if (current === null || previous === null || current === undefined || previous === undefined) return null;
  const delta = Number(current) - Number(previous);
  if (Math.abs(delta) < 0.05) return "Sem alteração";
  const formatted = Math.abs(delta).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  return `${delta > 0 ? "+" : "−"}${formatted}${unit} desde a anterior`;
}

function MetricCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 min-h-4 text-xs text-slate-500">{delta ?? " "}</p>
    </div>
  );
}

export function StudentAssessmentsCard({
  studentId,
  assessments,
}: {
  studentId: string;
  assessments: PhysicalAssessment[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PhysicalAssessment | undefined>();
  const latest = assessments[0];
  const previous = assessments[1];

  function openNew() {
    setEditing(undefined);
    setOpen(true);
  }

  function openEdit(assessment: PhysicalAssessment) {
    setEditing(assessment);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditing(undefined);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Avaliação física e evolução</CardTitle>
            {latest && (
              <p className="mt-1 text-xs text-slate-500">
                Última avaliação em {formatWallDate(latest.data_avaliacao)}
              </p>
            )}
          </div>
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" /> Nova avaliação
          </Button>
        </CardHeader>
        <CardContent>
          {!latest ? (
            <EmptyState
              icon={Activity}
              title="Nenhuma avaliação física registrada"
              description="Registre peso, medidas e composição corporal para acompanhar a evolução deste aluno."
              action={
                <Button onClick={openNew}>
                  <Plus className="h-4 w-4" /> Registrar primeira avaliação
                </Button>
              }
            />
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard
                  label="Peso"
                  value={formatMetric(latest.peso_kg, " kg")}
                  delta={deltaLabel(latest.peso_kg, previous?.peso_kg ?? null, " kg")}
                />
                <MetricCard
                  label="Gordura corporal"
                  value={formatMetric(latest.percentual_gordura, "%")}
                  delta={deltaLabel(latest.percentual_gordura, previous?.percentual_gordura ?? null, " p.p.")}
                />
                <MetricCard
                  label="Cintura"
                  value={formatMetric(latest.cintura_cm, " cm")}
                  delta={deltaLabel(latest.cintura_cm, previous?.cintura_cm ?? null, " cm")}
                />
                <MetricCard label="IMC" value={formatBMI(latest)} />
              </div>

              {assessments.length >= 2 && (
                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-900">Tendência</p>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                    <AssessmentTrendChart assessments={assessments} metric="peso_kg" label="Peso" unit=" kg" />
                    <AssessmentTrendChart assessments={assessments} metric="percentual_gordura" label="Gordura corporal" unit="%" />
                    <AssessmentTrendChart assessments={assessments} metric="cintura_cm" label="Cintura" unit=" cm" />
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-3 font-medium">Data</th>
                      <th className="px-4 py-3 font-medium">Peso</th>
                      <th className="px-4 py-3 font-medium">Gordura</th>
                      <th className="px-4 py-3 font-medium">Cintura</th>
                      <th className="px-4 py-3 font-medium">Quadril</th>
                      <th className="px-4 py-3 font-medium">IMC</th>
                      <th className="px-4 py-3 text-right font-medium">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.map((assessment) => (
                      <tr key={assessment.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                          {formatWallDate(assessment.data_avaliacao)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatMetric(assessment.peso_kg, " kg")}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatMetric(assessment.percentual_gordura, "%")}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatMetric(assessment.cintura_cm, " cm")}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatMetric(assessment.quadril_cm, " cm")}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatBMI(assessment)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(assessment)}>
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {latest.observacoes && (
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Observação da última avaliação</p>
                  <p className="mt-1 text-sm text-slate-700">{latest.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={open}
        onClose={closeModal}
        title={editing ? "Editar avaliação física" : "Nova avaliação física"}
        description="Registre os indicadores disponíveis. Você não precisa preencher todas as medidas."
        size="lg"
      >
        <AssessmentForm studentId={studentId} assessment={editing} onSuccess={closeModal} />
      </Modal>
    </>
  );
}
