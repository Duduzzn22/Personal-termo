import { CalendarClock, Check, X } from "lucide-react";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { reviewSessionChangeRequestAction } from "@/lib/actions/session-change-requests.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function brDate(value: string) { const [y,m,d] = value.split('-'); return `${d}/${m}/${y}`; }

export default async function SolicitacoesPage() {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const { data } = await db.from('session_change_requests').select('*, student:students(nome_completo)').eq('trainer_id', userId).order('created_at', { ascending: false }).limit(100);
  const requests = data ?? [];
  const pending = requests.filter(r => r.status === 'pendente');

  return <div className="space-y-4">
    <div><h1 className="text-2xl font-semibold tracking-tight text-slate-900">Solicitações de agenda</h1><p className="mt-1 text-sm text-slate-500">Aprove ou rejeite pedidos de cancelamento e remarcação enviados pelos alunos.</p></div>
    <Card><CardHeader><CardTitle>Pendentes ({pending.length})</CardTitle><CalendarClock className="h-5 w-5 text-slate-400"/></CardHeader><CardContent className="space-y-3">
      {pending.length === 0 && <p className="text-sm text-slate-500">Nenhuma solicitação pendente.</p>}
      {pending.map(r => <div key={r.id} className="rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="font-semibold text-slate-900">{r.student?.nome_completo ?? 'Aluno'}</p><p className="mt-1 text-sm text-slate-600">{r.request_type === 'remarcacao' ? 'Remarcação' : 'Cancelamento'} da aula de {brDate(r.occurrence_date)} às {String(r.occurrence_time).slice(0,5)}</p>{r.request_type === 'remarcacao' && <p className="mt-1 text-sm font-medium text-slate-800">Nova opção: {brDate(r.requested_date)} às {String(r.requested_time).slice(0,5)}</p>}{r.reason && <p className="mt-2 text-xs text-slate-500">Motivo: {r.reason}</p>}</div>
        <div className="flex gap-2"><form action={reviewSessionChangeRequestAction.bind(null, r.id, 'rejeitar')}><Button type="submit" variant="outline" size="sm"><X className="h-4 w-4"/> Rejeitar</Button></form><form action={reviewSessionChangeRequestAction.bind(null, r.id, 'aprovar')}><Button type="submit" size="sm"><Check className="h-4 w-4"/> Aprovar</Button></form></div></div>
      </div>)}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Histórico</CardTitle></CardHeader><CardContent className="space-y-2">{requests.filter(r => r.status !== 'pendente').slice(0,30).map(r => <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm"><span>{r.student?.nome_completo ?? 'Aluno'} · {r.request_type === 'remarcacao' ? 'Remarcação' : 'Cancelamento'} · {brDate(r.occurrence_date)}</span><span className={r.status === 'aprovado' ? 'font-medium text-emerald-700' : 'font-medium text-red-600'}>{r.status}</span></div>)}</CardContent></Card>
  </div>;
}
