import { formatCPF, formatPhone } from "@/lib/utils/format";

export function StudentConfirmation({
  nome,
  cpf,
  email,
  telefone,
}: {
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
        Confirmando o aceite em nome de
      </p>
      <p className="text-base font-semibold text-slate-900">{nome}</p>
      <div className="mt-2 space-y-0.5 text-sm text-slate-500">
        {cpf && <p>CPF: {formatCPF(cpf)}</p>}
        {email && <p>E-mail: {email}</p>}
        {telefone && <p>Telefone: {formatPhone(telefone)}</p>}
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Se estes dados não pertencem a você, entre em contato com o profissional responsável antes
        de prosseguir.
      </p>
    </div>
  );
}
