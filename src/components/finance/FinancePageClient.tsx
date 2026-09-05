"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Banknote, CalendarClock, CheckCircle2, Pencil, RotateCcw, WalletCards, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatCard } from "@/components/ui/StatCard";
import {
  cancelPaymentAction,
  markPaymentPaidAction,
  reopenPaymentAction,
  updatePaymentDueDateAction,
  type PaymentActionState,
} from "@/lib/actions/payments.actions";
import { formatCurrencyFromCents, formatDateBR } from "@/lib/utils/format";
import type { PaymentWithDetails } from "@/types/finance";

type Filter = "todos" | "pendentes" | "vencidos" | "pagos" | "cancelados";

const METHOD_LABEL: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  transferencia: "Transferência",
  outro: "Outro",
};

function isOverdue(payment: PaymentWithDetails, today: string) {
  return payment.status === "pendente" && payment.data_vencimento < today;
}

export function FinancePageClient({ payments, today }: { payments: PaymentWithDetails[]; today: string }) {
  const [filter, setFilter] = useState<Filter>("todos");
  const [receiving, setReceiving] = useState<PaymentWithDetails | null>(null);
  const [editingDueDate, setEditingDueDate] = useState<PaymentWithDetails | null>(null);

  const stats = useMemo(() => {
    const month = today.slice(0, 7);
    let receivedMonth = 0;
    let receivedTotal = 0;
    let pendingTotal = 0;
    let overdueTotal = 0;
    let overdueCount = 0;

    for (const payment of payments) {
      if (payment.status === "pago") {
        receivedTotal += payment.valor_centavos;
        if (payment.data_pagamento?.startsWith(month)) receivedMonth += payment.valor_centavos;
      }
      if (payment.status === "pendente") {
        pendingTotal += payment.valor_centavos;
        if (isOverdue(payment, today)) {
          overdueTotal += payment.valor_centavos;
          overdueCount += 1;
        }
      }
    }

    return { receivedMonth, receivedTotal, pendingTotal, overdueTotal, overdueCount };
  }, [payments, today]);

  const filtered = useMemo(() => {
    return payments.filter((payment) => {
      if (filter === "todos") return true;
      if (filter === "pendentes") return payment.status === "pendente" && !isOverdue(payment, today);
      if (filter === "vencidos") return isOverdue(payment, today);
      if (filter === "pagos") return payment.status === "pago";
      return payment.status === "cancelado";
    });
  }, [filter, payments, today]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Financeiro</h1>
        <p className="mt-1 text-sm text-slate-500">Acompanhe cobranças geradas pelos pacotes contratados.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Recebido no mês"
          value={formatCurrencyFromCents(stats.receivedMonth)}
          icon={Banknote}
          tone="green"
        />
        <StatCard
          label="A receber"
          value={formatCurrencyFromCents(stats.pendingTotal)}
          icon={WalletCards}
          tone="blue"
        />
        <StatCard
          label={`Em atraso${stats.overdueCount ? ` (${stats.overdueCount})` : ""}`}
          value={formatCurrencyFromCents(stats.overdueTotal)}
          icon={CalendarClock}
          tone="amber"
        />
        <StatCard
          label="Recebido total"
          value={formatCurrencyFromCents(stats.receivedTotal)}
          icon={CheckCircle2}
          tone="slate"
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Cobranças</CardTitle>
            <p className="mt-1 text-xs text-slate-500">Cada pacote contratado gera uma cobrança individual.</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3">
            {([
              ["todos", "Todos"],
              ["pendentes", "Pendentes"],
              ["vencidos", "Vencidos"],
              ["pagos", "Pagos"],
              ["cancelados", "Cancelados"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={WalletCards}
                title="Nenhuma cobrança neste filtro"
                description="As cobranças aparecem automaticamente quando um aluno contrata um pacote."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3 font-medium">Aluno</th>
                    <th className="px-5 py-3 font-medium">Pacote</th>
                    <th className="px-5 py-3 font-medium">Valor</th>
                    <th className="px-5 py-3 font-medium">Vencimento</th>
                    <th className="px-5 py-3 font-medium">Pagamento</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((payment) => {
                    const overdue = isOverdue(payment, today);
                    return (
                      <tr key={payment.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td className="px-5 py-3 font-medium text-slate-800">
                          {payment.students?.nome_completo ?? "Aluno"}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {payment.student_packages?.packages?.nome ?? "Pacote"}
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-800">
                          {formatCurrencyFromCents(payment.valor_centavos)}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <span className={overdue ? "font-medium text-red-600" : ""}>
                              {formatDateBR(payment.data_vencimento)}
                            </span>
                            {payment.status === "pendente" && (
                              <button
                                onClick={() => setEditingDueDate(payment)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                title="Alterar vencimento"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {payment.status === "pago" ? (
                            <div>
                              <p>{formatDateBR(payment.data_pagamento)}</p>
                              <p className="text-xs text-slate-400">{METHOD_LABEL[payment.metodo ?? ""] ?? "—"}</p>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {overdue ? <Badge tone="red">Vencido</Badge> : <StatusBadge status={payment.status} />}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1.5">
                            {payment.status === "pendente" && (
                              <>
                                <Button size="sm" onClick={() => setReceiving(payment)}>
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Receber
                                </Button>
                                <form action={cancelPaymentAction.bind(null, payment.id)}>
                                  <Button size="sm" variant="ghost" type="submit">
                                    <X className="h-3.5 w-3.5" /> Cancelar
                                  </Button>
                                </form>
                              </>
                            )}
                            {payment.status === "pago" && (
                              <form action={reopenPaymentAction.bind(null, payment.id)}>
                                <Button size="sm" variant="outline" type="submit">
                                  <RotateCcw className="h-3.5 w-3.5" /> Reabrir
                                </Button>
                              </form>
                            )}
                            {payment.status === "cancelado" && (
                              <form action={reopenPaymentAction.bind(null, payment.id)}>
                                <Button size="sm" variant="outline" type="submit">
                                  <RotateCcw className="h-3.5 w-3.5" /> Reativar
                                </Button>
                              </form>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {receiving && (
        <ReceivePaymentModal payment={receiving} today={today} onClose={() => setReceiving(null)} />
      )}
      {editingDueDate && (
        <DueDateModal payment={editingDueDate} onClose={() => setEditingDueDate(null)} />
      )}
    </div>
  );
}

const initialState: PaymentActionState = {};

function ReceivePaymentModal({
  payment,
  today,
  onClose,
}: {
  payment: PaymentWithDetails;
  today: string;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(markPaymentPaidAction.bind(null, payment.id), initialState);

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <Modal open onClose={onClose} title="Registrar pagamento" size="sm">
      <form action={action} className="space-y-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-sm font-medium text-slate-900">{payment.students?.nome_completo ?? "Aluno"}</p>
          <p className="mt-0.5 text-xs text-slate-500">{payment.student_packages?.packages?.nome ?? "Pacote"}</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatCurrencyFromCents(payment.valor_centavos)}
          </p>
        </div>
        <Input label="Data do pagamento" name="data_pagamento" type="date" defaultValue={today} required />
        <Select label="Forma de pagamento" name="metodo" defaultValue="pix" required>
          <option value="pix">PIX</option>
          <option value="dinheiro">Dinheiro</option>
          <option value="cartao">Cartão</option>
          <option value="transferencia">Transferência</option>
          <option value="outro">Outro</option>
        </Select>
        <Textarea label="Observações (opcional)" name="observacoes" defaultValue={payment.observacoes ?? ""} />
        {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Voltar
          </Button>
          <Button type="submit" loading={pending}>
            Confirmar pagamento
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DueDateModal({ payment, onClose }: { payment: PaymentWithDetails; onClose: () => void }) {
  const [state, action, pending] = useActionState(updatePaymentDueDateAction.bind(null, payment.id), initialState);

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <Modal open onClose={onClose} title="Alterar vencimento" size="sm">
      <form action={action} className="space-y-4">
        <Input
          label="Nova data de vencimento"
          name="data_vencimento"
          type="date"
          defaultValue={payment.data_vencimento}
          required
        />
        {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" loading={pending}>
            Salvar vencimento
          </Button>
        </div>
      </form>
    </Modal>
  );
}
