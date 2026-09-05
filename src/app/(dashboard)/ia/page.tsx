import { BrainCircuit } from "lucide-react";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { PersonalAIClient } from "@/components/ai/PersonalAIClient";

export default async function IaPage() {
  await requireTrainer();
  return <div className="space-y-4">
    <div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white"><BrainCircuit className="h-5 w-5"/></div><div><h1 className="text-2xl font-semibold tracking-tight text-slate-900">IA do Personal</h1><p className="mt-1 text-sm text-slate-500">Consulta Radar, agenda, pacotes, financeiro e solicitações para ajudar você a decidir o que fazer primeiro.</p></div></div>
    <PersonalAIClient configured={Boolean(process.env.GEMINI_API_KEY)} />
    <p className="text-xs text-slate-400">A IA é consultiva: não altera alunos, pagamentos, agenda ou mensagens automaticamente. Os nomes dos alunos são anonimizados antes do envio ao Gemini e restaurados apenas no servidor.</p>
  </div>;
}
