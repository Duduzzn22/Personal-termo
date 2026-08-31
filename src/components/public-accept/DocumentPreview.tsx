import { formatCurrencyFromCents, formatDateBR } from "@/lib/utils/format";
import type { DocumentSnapshot } from "@/types/database";

/** Renderização somente-leitura de um snapshot de documento (usado no preview e nos detalhes de aceite). */
export function DocumentPreview({ snapshot }: { snapshot: DocumentSnapshot }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Termo de Ciência e Aceite</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">{snapshot.termo_titulo}</h2>
        <p className="text-sm text-slate-500">Versão {snapshot.termo_versao}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
        <Field label="Aluno" value={snapshot.aluno.nome_completo} />
        <Field label="Personal Trainer" value={snapshot.personal.nome_profissional} />
        <Field label="Pacote" value={snapshot.pacote.nome} />
        <Field label="Duração da aula" value={`${snapshot.pacote.duracao_minutos} minutos`} />
        <Field label="Quantidade de aulas" value={String(snapshot.pacote.quantidade_aulas)} />
        <Field label="Validade" value={`${snapshot.pacote.validade_dias} dias`} />
        <Field label="Valor" value={formatCurrencyFromCents(snapshot.pacote.valor_centavos)} />
        <Field label="Data de início" value={snapshot.data_inicio ? formatDateBR(snapshot.data_inicio) : "A combinar"} />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Condições do serviço
        </h3>
        <div className="space-y-4">
          {snapshot.clausulas.map((clause, idx) => (
            <div key={idx}>
              <h4 className="text-sm font-semibold text-slate-900">{clause.titulo}</h4>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {clause.conteudo}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  );
}
