"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDateTimeBR } from "@/lib/utils/format";
import type { TermVersion, TermVersionClause } from "@/types/database";

export function VersionHistory({
  versions,
  clausesByVersion,
}: {
  versions: TermVersion[];
  clausesByVersion: Record<string, TermVersionClause[]>;
}) {
  const [viewing, setViewing] = useState<TermVersion | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Versões publicadas</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {versions.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Nenhuma versão publicada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Versão</th>
                  <th className="px-5 py-3 font-medium">Publicada em</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Cláusulas</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3 font-medium text-slate-800">v{v.versao}</td>
                    <td className="px-5 py-3 text-slate-600">{formatDateTimeBR(v.published_at)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="px-5 py-3 text-slate-600">{clausesByVersion[v.id]?.length ?? 0}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setViewing(v)}
                        className="flex items-center gap-1 text-slate-500 hover:text-slate-900"
                      >
                        <Eye className="h-4 w-4" /> Ver conteúdo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? `${viewing.titulo_snapshot} — v${viewing.versao}` : ""}
        description="Conteúdo imutável, exatamente como foi publicado."
        size="lg"
      >
        <div className="space-y-4">
          {viewing &&
            clausesByVersion[viewing.id]?.map((c) => (
              <div key={c.id}>
                <h4 className="text-sm font-semibold text-slate-900">{c.titulo}</h4>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{c.conteudo}</p>
              </div>
            ))}
        </div>
      </Modal>
    </Card>
  );
}
