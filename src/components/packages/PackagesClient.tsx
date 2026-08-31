"use client";

import { useState } from "react";
import { Plus, Package as PackageIcon, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PackageForm } from "./PackageForm";
import { togglePackageStatusAction } from "@/lib/actions/packages.actions";
import { formatCurrencyFromCents } from "@/lib/utils/format";
import type { Package } from "@/types/database";

export function PackagesClient({ packages }: { packages: Package[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);

  function openEdit(pkg: Package) {
    setEditing(pkg);
    setModalOpen(true);
  }

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{packages.length} pacote(s) cadastrado(s)</p>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Novo pacote
        </Button>
      </div>

      {packages.length === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title="Nenhum pacote cadastrado"
          description="Crie pacotes de aulas para associar aos seus alunos e utilizar nos termos."
          action={
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" /> Novo pacote
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{pkg.nome}</h3>
                <Badge tone={pkg.status === "ativo" ? "green" : "slate"}>
                  {pkg.status === "ativo" ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              {pkg.descricao && <p className="text-sm text-slate-500">{pkg.descricao}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-400" /> {pkg.quantidade_aulas} aulas
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> {pkg.duracao_minutos} min
                </span>
              </div>
              <p className="text-lg font-semibold text-slate-900">
                {formatCurrencyFromCents(pkg.valor_centavos)}
              </p>
              <p className="text-xs text-slate-500">Validade: {pkg.validade_dias} dias</p>
              <div className="mt-2 flex gap-2 border-t border-slate-100 pt-3">
                <Button variant="outline" size="sm" fullWidth onClick={() => openEdit(pkg)}>
                  Editar
                </Button>
                <form
                  action={togglePackageStatusAction.bind(
                    null,
                    pkg.id,
                    pkg.status === "ativo" ? "inativo" : "ativo"
                  )}
                  className="w-full"
                >
                  <Button variant="ghost" size="sm" fullWidth type="submit">
                    {pkg.status === "ativo" ? "Desativar" : "Ativar"}
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar pacote" : "Novo pacote"}>
        <PackageForm pkg={editing ?? undefined} onSuccess={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
