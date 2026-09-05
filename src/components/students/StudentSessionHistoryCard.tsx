import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDateBR } from "@/lib/utils/format";
import { formatTimeShort } from "@/lib/utils/agenda";
import type { TrainingSessionWithPackage } from "@/lib/repositories/agenda.repository";

export function StudentSessionHistoryCard({ sessions }: { sessions: TrainingSessionWithPackage[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de aulas</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {sessions.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={CalendarClock}
              title="Nenhuma aula registrada"
              description="As aulas concluídas, canceladas ou ajustadas na agenda aparecerão aqui."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Horário</th>
                  <th className="px-5 py-3 font-medium">Pacote</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Observação</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3 font-medium text-slate-700">{formatDateBR(session.data)}</td>
                    <td className="px-5 py-3 text-slate-600">{formatTimeShort(session.horario)}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {session.student_packages?.packages?.nome ?? (session.status === "concluido" ? "—" : "Não consumiu pacote")}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={session.status} />
                    </td>
                    <td className="max-w-[260px] px-5 py-3 text-slate-500">{session.observacoes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
