"use client";

import { useActionState } from "react";
import { Sparkles, Send, Copy } from "lucide-react";
import { askPersonalAiAction, type PersonalAiState } from "@/lib/actions/personal-ai.actions";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const initialState: PersonalAiState = {};
const presets = [
  "Faça um resumo do que merece minha atenção hoje e ordene por prioridade.",
  "Quais alunos estão com maior risco de abandono e por quê?",
  "Crie mensagens curtas de WhatsApp para os alunos que precisam de contato, sem enviar nada.",
  "Resuma as pendências financeiras e sugira uma ordem de contato.",
  "Analise agenda, pacotes e solicitações e monte minhas prioridades para os próximos 7 dias.",
];

export function PersonalAIClient({ configured }: { configured: boolean }) {
  const [state, formAction, pending] = useActionState(askPersonalAiAction, initialState);
  return <div className="space-y-4">
    {!configured && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">A interface está pronta, mas falta configurar <code>AI_GATEWAY_API_KEY</code> na Vercel para ativar as respostas.</div>}
    <Card><CardHeader><CardTitle>Pergunte à IA do Personal</CardTitle><Sparkles className="h-5 w-5 text-slate-400"/></CardHeader><CardContent className="space-y-4">
      <div className="flex flex-wrap gap-2">{presets.map(preset => <form key={preset} action={formAction}><input type="hidden" name="question" value={preset}/><button type="submit" disabled={pending || !configured} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">{preset}</button></form>)}</div>
      <form action={formAction} className="space-y-3"><textarea name="question" maxLength={2500} rows={5} placeholder="Ex: Quem eu deveria procurar hoje e qual abordagem você sugere?" className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"/><div className="flex justify-end"><Button type="submit" loading={pending} disabled={!configured}><Send className="h-4 w-4"/> Analisar</Button></div></form>
      {state.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
    </CardContent></Card>
    {state.answer && <Card><CardHeader><div><CardTitle>Análise</CardTitle>{state.question && <p className="mt-1 text-xs text-slate-500">Pedido: {state.question}</p>}</div><button type="button" onClick={() => navigator.clipboard.writeText(state.answer || '')} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"><Copy className="h-3.5 w-3.5"/> Copiar</button></CardHeader><CardContent><div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{state.answer}</div></CardContent></Card>}
  </div>;
}
