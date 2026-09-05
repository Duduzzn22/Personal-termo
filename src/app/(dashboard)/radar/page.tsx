import Link from "next/link";
import { AlertTriangle, ShieldCheck, Users, ArrowRight } from "lucide-react";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { buildStudentRadar } from "@/lib/services/student-risk.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrencyFromCents } from "@/lib/utils/format";

function levelClasses(level: string) {
  return level === "alto" ? "bg-red-100 text-red-700" : level === "medio" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700";
}

export default async function RadarPage() {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const radar = await buildStudentRadar(db, userId);
  const high = radar.filter(r => r.level === 'alto').length;
  const medium = radar.filter(r => r.level === 'medio').length;
  const healthy = radar.filter(r => r.level === 'baixo').length;

  return <div className="space-y-4">
    <div><h1 className="text-2xl font-semibold tracking-tight text-slate-900">Radar de Alunos</h1><p className="mt-1 text-sm text-slate-500">Prioridades calculadas por comportamento, frequência, pacote e financeiro. O score não usa IA.</p></div>
    <div className="grid gap-3 sm:grid-cols-3">
      <Card><CardContent><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Risco alto</p><p className="mt-1 text-3xl font-semibold text-red-600">{high}</p></CardContent></Card>
      <Card><CardContent><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Atenção</p><p className="mt-1 text-3xl font-semibold text-amber-600">{medium}</p></CardContent></Card>
      <Card><CardContent><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Baixo risco</p><p className="mt-1 text-3xl font-semibold text-emerald-600">{healthy}</p></CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Prioridades</CardTitle><AlertTriangle className="h-5 w-5 text-slate-400"/></CardHeader><CardContent className="space-y-3">
      {radar.length === 0 && <div className="py-8 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-slate-300"/><p className="mt-2 text-sm text-slate-500">Nenhum aluno ativo para analisar.</p></div>}
      {radar.map(item => <div key={item.studentId} className="rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900">{item.studentName}</p><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${levelClasses(item.level)}`}>{item.level === 'alto' ? 'Alto risco' : item.level === 'medio' ? 'Atenção' : 'Baixo risco'} · {item.score}</span></div>
            <div className="mt-3 flex flex-wrap gap-2">{item.reasons.length === 0 ? <span className="text-sm text-slate-500">Sem sinais relevantes no momento.</span> : item.reasons.map(r => <span key={r.code} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600">{r.label} <strong>+{r.points}</strong></span>)}</div>
            <p className="mt-3 text-sm text-slate-600">{item.recommendation}</p>
            {item.overdueAmountCents > 0 && <p className="mt-1 text-xs font-medium text-red-600">Em atraso: {formatCurrencyFromCents(item.overdueAmountCents)}</p>}
          </div>
          <Link href={`/alunos/${item.studentId}`} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-950">Ver aluno <ArrowRight className="h-4 w-4"/></Link>
        </div>
      </div>)}
    </CardContent></Card>
    <p className="flex items-center gap-2 text-xs text-slate-400"><Users className="h-4 w-4"/> O score serve para priorização operacional; ele não é avaliação clínica ou diagnóstico.</p>
  </div>;
}
