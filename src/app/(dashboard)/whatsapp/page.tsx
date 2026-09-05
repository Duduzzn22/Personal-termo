import { MessageCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { createClient } from "@/lib/supabase/server";
import { saveWhatsAppSettingsAction } from "@/lib/actions/whatsapp.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default async function WhatsAppPage() {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const [{ data: settings }, { data: logs }] = await Promise.all([
    db.from("whatsapp_automation_settings").select("*").eq("trainer_id", userId).maybeSingle(),
    db.from("whatsapp_message_logs").select("*, student:students(nome_completo)").eq("trainer_id", userId).order("created_at", { ascending: false }).limit(50),
  ]);

  return <div className="space-y-4">
    <div><h1 className="text-2xl font-semibold tracking-tight text-slate-900">WhatsApp Automático</h1><p className="mt-1 text-sm text-slate-500">Automatize lembretes de aula, saldo baixo e cobranças atrasadas usando templates aprovados na Meta.</p></div>
    <Card><CardHeader><CardTitle>Configuração</CardTitle><MessageCircle className="h-5 w-5 text-slate-400"/></CardHeader><CardContent>
      <form action={saveWhatsAppSettingsAction} className="space-y-5">
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"><input type="checkbox" name="enabled" defaultChecked={settings?.enabled ?? false}/><div><p className="text-sm font-semibold text-slate-900">Ativar automações</p><p className="text-xs text-slate-500">O envio também exige credenciais da Meta nas variáveis de ambiente.</p></div></label>
        <Input label="Código de idioma dos templates" name="language_code" defaultValue={settings?.language_code ?? "pt_BR"}/>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-4"><label className="mb-3 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="reminder_enabled" defaultChecked={settings?.reminder_enabled ?? true}/> Lembrete de aula</label><Input label="Template" name="reminder_template" defaultValue={settings?.reminder_template ?? ""} placeholder="lembrete_aula_24h" hint="Parâmetros: nome, data, horário"/></div>
          <div className="rounded-xl border border-slate-200 p-4"><label className="mb-3 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="low_balance_enabled" defaultChecked={settings?.low_balance_enabled ?? true}/> Saldo baixo</label><Input label="Template" name="low_balance_template" defaultValue={settings?.low_balance_template ?? ""} placeholder="saldo_aulas_baixo" hint="Parâmetros: nome, aulas restantes"/></div>
          <div className="rounded-xl border border-slate-200 p-4"><label className="mb-3 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="overdue_enabled" defaultChecked={settings?.overdue_enabled ?? true}/> Cobrança atrasada</label><Input label="Template" name="overdue_template" defaultValue={settings?.overdue_template ?? ""} placeholder="cobranca_atrasada" hint="Parâmetros: nome, valor, vencimento"/></div>
        </div>
        <Button type="submit">Salvar configuração</Button>
      </form>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Últimos envios</CardTitle></CardHeader><CardContent className="space-y-2">
      {(logs ?? []).length === 0 && <p className="text-sm text-slate-500">Nenhum envio processado ainda.</p>}
      {(logs ?? []).map(log => <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm"><div><p className="font-medium text-slate-800">{log.student?.nome_completo ?? "Aluno"}</p><p className="text-xs text-slate-500">{log.automation_type.replaceAll('_',' ')} · {log.template_name || 'sem template'}</p>{log.error_message && <p className="mt-1 text-xs text-red-600">{log.error_message}</p>}</div><span className={log.status === 'enviado' ? 'inline-flex items-center gap-1 text-emerald-700' : log.status === 'erro' ? 'inline-flex items-center gap-1 text-red-600' : 'inline-flex items-center gap-1 text-slate-500'}>{log.status === 'enviado' ? <CheckCircle2 className="h-4 w-4"/> : <AlertCircle className="h-4 w-4"/>}{log.status}</span></div>)}
    </CardContent></Card>
  </div>;
}
