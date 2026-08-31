"use client";

import { Modal } from "@/components/ui/Modal";
import { DocumentPreview } from "@/components/public-accept/DocumentPreview";
import { resolveVariables } from "@/lib/utils/variables";
import type { TermClause, DocumentSnapshot } from "@/types/database";

const SAMPLE_CONTEXT = {
  aluno: { nome_completo: "João da Silva", cpf: null, email: null, telefone: null },
  personal: { nome_profissional: "Carlos Souza", nome_empresa: null },
  pacote: {
    nome: "Personal 12 aulas",
    quantidade_aulas: 12,
    duracao_minutos: 60,
    valor_centavos: 110000,
    validade_dias: 45,
  },
  data_inicio: new Date().toISOString().slice(0, 10),
};

export function PreviewAsStudentModal({
  open,
  onClose,
  templateTitle,
  clauses,
}: {
  open: boolean;
  onClose: () => void;
  templateTitle: string;
  clauses: TermClause[];
}) {
  const snapshot: DocumentSnapshot = {
    termo_titulo: templateTitle,
    termo_versao: "pré-visualização",
    personal: {
      nome_profissional: SAMPLE_CONTEXT.personal.nome_profissional,
      nome_empresa: null,
      cref: null,
      whatsapp: null,
      email_contato: null,
    },
    aluno: SAMPLE_CONTEXT.aluno,
    pacote: SAMPLE_CONTEXT.pacote,
    data_inicio: SAMPLE_CONTEXT.data_inicio,
    clausulas: clauses
      .filter((c) => c.ativo)
      .map((c) => ({
        titulo: c.titulo,
        conteudo: resolveVariables(c.conteudo, SAMPLE_CONTEXT),
        posicao: c.posicao,
        obrigatoria: c.obrigatoria,
      })),
    gerado_em: new Date().toISOString(),
  };

  return (
    <Modal open={open} onClose={onClose} title="Pré-visualização" description="É assim que o aluno verá o termo, com dados de exemplo." size="lg">
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
        Dados ilustrativos — nenhum vínculo real com aluno ou pacote.
      </div>
      <div className="mt-4">
        <DocumentPreview snapshot={snapshot} />
      </div>
    </Modal>
  );
}
