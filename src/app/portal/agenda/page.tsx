import Link from "next/link";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { requireStudentPortal } from "@/lib/auth/current-student";
import { requestSessionChangeAction } from "@/lib/actions/session-change-requests.actions";
import { addDaysISO, todayISO, weekdayOfISODate } from "@/lib/utils/agenda";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Occurrence = { key: string; scheduleId: string | null; sessionId: string | null; date: string; time: string; status: string; note?: string | null };

function brDate(value: string) {
  const [y,m,d] = value.split('-');
  return `${d}/${m}/${y}`;
}

export default async function PortalAgendaPage({ searchParams }: { searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const params = await searchParams;
  const { db, student, trainer } = await requireStudentPortal();
  const start = todayISO();
  const end = addDaysISO(start, 30);

  const [{ data: schedules }, { data: sessions }, { data: requests }] = await Promise.all([
    db.from('training_schedules').select('*').eq('student_id', student.id).eq('ativo', true),
    db.from('training_sessions').select('*').eq('student_id', student.id).gte('data', start).lte('data', end),
    db.from('session_change_requests').select('*').eq('student_id', student.id).order('created_at', { ascending: false }).limit(20),
  ]);

  const byScheduleDate = new Map((sessions ?? []).filter(s => s.schedule_id).map(s => [`${s.schedule_id}:${s.data}`, s]));
  const occurrences: Occurrence[] = [];

  for (let i = 0; i <= 30; i++) {
    const date = addDaysISO(start, i);
    const weekday = weekdayOfISODate(date);
    for (const schedule of schedules ?? []) {
      if (Number(schedule.dia_semana) !== weekday) continue;
      const exception = byScheduleDate.get(`${schedule.id}:${date}`);
      const status = exception?.status ?? 'agendado';
      if (status === 'cancelado' || status === 'concluido') continue;
      occurrences.push({
        key: exception?.id ?? `${schedule.id}:${date}`,
        scheduleId: schedule.id,
        sessionId: exception?.id ?? null,
        date,
        time: exception?.horario ?? schedule.horario,
        status,
        note: exception?.observacoes ?? schedule.observacoes,
      });
    }
  }

  for (const session of (sessions ?? []).filter(s => !s.schedule_id && s.status === 'agendado')) {
    occurrences.push({ key: session.id, scheduleId: null, sessionId: session.id, date: session.data, time: session.horario, status: session.status, note: session.observacoes });
  }
  occurrences.sort((a,b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  const pendingKeys = new Set((requests ?? []).filter(r => r.status === 'pendente').map(r => `${r.schedule_id ?? ''}:${r.session_id ?? ''}:${r.occurrence_date}`));

  return <main className="min-h-screen bg-slate-50 p-4 sm:p-6">
    <div className="mx-auto max-w-5xl space-y-4">
      <Link href="/portal" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4"/> Voltar</Link>
      <Card>
        <CardHeader><div><CardTitle>Cancelamento e remarcação</CardTitle><p className="mt-1 text-sm text-slate-500">Solicitações devem ser feitas com pelo menos {trainer.cancelamento_antecedencia_horas ?? 24}h de antecedência.</p></div><CalendarClock className="h-5 w-5 text-slate-400"/></CardHeader>
        <CardContent className="space-y-4">
          {params.sucesso && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Solicitação enviada ao personal.</p>}
          {params.erro && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{params.erro}</p>}
          {occurrences.length === 0 && <p className="text-sm text-slate-500">Nenhuma aula futura encontrada nos próximos 30 dias.</p>}
          {occurrences.map(o => {
            const pending = pendingKeys.has(`${o.scheduleId ?? ''}:${o.sessionId ?? ''}:${o.date}`);
            return <div key={o.key} className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-4 flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{brDate(o.date)} às {o.time.slice(0,5)}</p>{o.note && <p className="mt-1 text-xs text-slate-500">{o.note}</p>}</div>{pending && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">Solicitação pendente</span>}</div>
              {!pending && <div className="grid gap-3 lg:grid-cols-2">
                <form action={requestSessionChangeAction} className="rounded-xl bg-slate-50 p-3">
                  <input type="hidden" name="request_type" value="cancelamento"/><input type="hidden" name="schedule_id" value={o.scheduleId ?? ''}/><input type="hidden" name="session_id" value={o.sessionId ?? ''}/><input type="hidden" name="occurrence_date" value={o.date}/><input type="hidden" name="occurrence_time" value={o.time}/>
                  <Input name="reason" label="Motivo (opcional)" placeholder="Ex: compromisso de trabalho"/>
                  <Button type="submit" variant="outline" className="mt-3">Solicitar cancelamento</Button>
                </form>
                <form action={requestSessionChangeAction} className="rounded-xl bg-slate-50 p-3">
                  <input type="hidden" name="request_type" value="remarcacao"/><input type="hidden" name="schedule_id" value={o.scheduleId ?? ''}/><input type="hidden" name="session_id" value={o.sessionId ?? ''}/><input type="hidden" name="occurrence_date" value={o.date}/><input type="hidden" name="occurrence_time" value={o.time}/>
                  <div className="grid grid-cols-2 gap-2"><Input name="requested_date" type="date" label="Nova data" required/><Input name="requested_time" type="time" label="Novo horário" required/></div>
                  <Input name="reason" label="Motivo (opcional)" placeholder="Ex: preciso mudar o horário" className="mt-2"/>
                  <Button type="submit" className="mt-3">Solicitar remarcação</Button>
                </form>
              </div>}
            </div>;
          })}
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Histórico de solicitações</CardTitle></CardHeader><CardContent className="space-y-2">{(requests ?? []).length === 0 ? <p className="text-sm text-slate-500">Nenhuma solicitação enviada.</p> : (requests ?? []).map(r => <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm"><span>{r.request_type === 'remarcacao' ? 'Remarcação' : 'Cancelamento'} · {brDate(r.occurrence_date)} {String(r.occurrence_time).slice(0,5)}</span><span className={r.status === 'aprovado' ? 'font-medium text-emerald-700' : r.status === 'rejeitado' ? 'font-medium text-red-600' : 'font-medium text-amber-700'}>{r.status}</span></div>)}</CardContent></Card>
    </div>
  </main>;
}
