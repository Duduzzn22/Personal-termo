"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, CheckSquare, Copy, Download, Ban, RotateCw } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { cancelInvitationAction } from "@/lib/actions/invitations.actions";
import { formatDateBR } from "@/lib/utils/format";

export interface InvitationListItem {
  id: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  token: string;
  students?: { nome_completo: string } | null;
  packages?: { nome: string } | null;
  term_versions?: { versao: string; term_templates?: { titulo: string } | null } | null;
  acceptances?: { id: string; protocolo: string; accepted_at: string } | { id: string; protocolo: string; accepted_at: string }[] | null;
}

function getAcceptance(inv: InvitationListItem) {
  if (!inv.acceptances) return null;
  return Array.isArray(inv.acceptances) ? inv.acceptances[0] ?? null : inv.acceptances;
}

const FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "aceito", label: "Aceitos" },
  { value: "pendente", label: "Pendentes" },
  { value: "expirado", label: "Expirados" },
  { value: "cancelado", label: "Cancelados" },
];

export function AcceptancesClient({ invitations }: { invitations: InvitationListItem[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const { showToast } = useToast();

  const filtered = useMemo(() => {
    return invitations.filter((inv) => {
      const matchesSearch = (inv.students?.nome_completo || "")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesFilter =
        filter === "todos" ||
        inv.status === filter ||
        (filter === "pendente" && inv.status === "nova_versao_pendente");
      return matchesSearch && matchesFilter;
    });
  }, [invitations, search, filter]);

  async function copyLink(token: string) {
    const url = `${window.location.origin}/aceite/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copiado.");
    } catch {
      showToast("Não foi possível copiar o link.", "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="sm:w-48">
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Nenhum aceite encontrado"
          description="Envie um termo a um aluno para começar a acompanhar aceites aqui."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Aluno</th>
                  <th className="px-5 py-3 font-medium">Termo</th>
                  <th className="px-5 py-3 font-medium">Versão</th>
                  <th className="px-5 py-3 font-medium">Pacote</th>
                  <th className="px-5 py-3 font-medium">Enviado</th>
                  <th className="px-5 py-3 font-medium">Aceito</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const acceptance = getAcceptance(inv);
                  return (
                    <tr key={inv.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <Link href={`/aceites/${inv.id}`} className="font-medium text-slate-800 hover:underline">
                          {inv.students?.nome_completo}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{inv.term_versions?.term_templates?.titulo}</td>
                      <td className="px-5 py-3 text-slate-600">v{inv.term_versions?.versao}</td>
                      <td className="px-5 py-3 text-slate-600">{inv.packages?.nome}</td>
                      <td className="px-5 py-3 text-slate-600">{formatDateBR(inv.sent_at || inv.created_at)}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {acceptance ? formatDateBR(acceptance.accepted_at) : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          {acceptance && (
                            <a
                              href={`/api/pdf/${acceptance.id}`}
                              target="_blank"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              title="Baixar PDF"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                          {(inv.status === "pendente" || inv.status === "nova_versao_pendente") && (
                            <>
                              <button
                                onClick={() => copyLink(inv.token)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                title="Copiar link"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => copyLink(inv.token)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                title="Reenviar (copiar novamente)"
                              >
                                <RotateCw className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => cancelInvitationAction(inv.id)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                title="Cancelar convite"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
