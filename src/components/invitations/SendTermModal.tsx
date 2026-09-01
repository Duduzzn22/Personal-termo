"use client";

import { useActionState, useEffect, useState } from "react";
import { Copy, CheckCircle2, MessageCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Select, Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  createInvitationAction,
  getInvitationFormOptionsAction,
  markInvitationSentAction,
  type InvitationActionState,
} from "@/lib/actions/invitations.actions";

interface Options {
  students: { id: string; nome_completo: string }[];
  packages: { id: string; nome: string }[];
  versions: { id: string; label: string }[];
}

const initialState: InvitationActionState = {};

export function SendTermModal({
  open,
  onClose,
  preselectedStudentId,
  preselectedTermVersionId,
}: {
  open: boolean;
  onClose: () => void;
  preselectedStudentId?: string;
  preselectedTermVersionId?: string;
}) {
  // Só monta o conteúdo quando o modal está aberto: isso garante que cada
  // abertura comece com estado limpo (sem precisar "resetar" via effect).
  if (!open) return null;
  return (
    <SendTermModalContent
      onClose={onClose}
      preselectedStudentId={preselectedStudentId}
      preselectedTermVersionId={preselectedTermVersionId}
    />
  );
}

function SendTermModalContent({
  onClose,
  preselectedStudentId,
  preselectedTermVersionId,
}: {
  onClose: () => void;
  preselectedStudentId?: string;
  preselectedTermVersionId?: string;
}) {
  const open = true;
  const [options, setOptions] = useState<Options | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, formAction, pending] = useActionState(createInvitationAction, initialState);
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getInvitationFormOptionsAction()
      .then(setOptions)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (state.error) showToast(state.error, "error");
  }, [state.error]); // eslint-disable-line react-hooks/exhaustive-deps

  async function copyLink() {
    if (!state.link) return;
    try {
      await navigator.clipboard.writeText(state.link);
      setCopied(true);
      showToast("Link copiado para a área de transferência.");
    } catch {
      showToast("Não foi possível copiar automaticamente. Selecione o link manualmente.", "error");
    }
  }

  function sendViaWhatsApp() {
    if (!state.link) return;
    const mensagem = `Olá! Segue o link para você revisar e confirmar o termo de ciência e aceite:\n${state.link}`;
    // Sem número fixo: o WhatsApp abre e o próprio usuário escolhe o contato/conversa
    // para onde enviar, com a mensagem já pré-preenchida.
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, "_blank", "noopener,noreferrer");
  }

  if (state.success && state.link) {
    return (
      <Modal open={open} onClose={onClose} title="Convite gerado com sucesso">
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            Link individual de aceite gerado. Envie ao aluno pelo WhatsApp, e-mail ou onde preferir.
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <code className="flex-1 overflow-x-auto whitespace-nowrap text-xs text-slate-700">{state.link}</code>
            <button
              onClick={copyLink}
              className="shrink-0 rounded-lg bg-slate-900 p-2 text-white hover:bg-slate-800"
              title="Copiar link"
            >
              {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <Button
            variant="outline"
            fullWidth
            onClick={async () => {
              sendViaWhatsApp();
              if (state.invitationId) await markInvitationSentAction(state.invitationId);
            }}
          >
            <MessageCircle className="h-4 w-4" /> Enviar por WhatsApp
          </Button>
          <div className="flex justify-end">
            <Button
              onClick={async () => {
                if (state.invitationId) await markInvitationSentAction(state.invitationId);
                onClose();
              }}
            >
              Concluir
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Enviar Termo" description="Gere um link individual e seguro de aceite." size="md">
      {loading || !options ? (
        <p className="py-6 text-center text-sm text-slate-500">Carregando opções…</p>
      ) : options.versions.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-800">
          Nenhum termo publicado ainda. Publique uma versão em <strong>Termos</strong> antes de enviar um convite.
        </p>
      ) : (
        <form action={formAction} className="space-y-4">
          <Select label="Aluno" name="student_id" required defaultValue={preselectedStudentId ?? ""}>
            <option value="" disabled>
              Selecione um aluno
            </option>
            {options.students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome_completo}
              </option>
            ))}
          </Select>
          <Select label="Pacote" name="package_id" required defaultValue="">
            <option value="" disabled>
              Selecione um pacote
            </option>
            {options.packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
          <Select
            label="Modelo do termo / versão"
            name="term_version_id"
            required
            defaultValue={preselectedTermVersionId ?? ""}
          >
            <option value="" disabled>
              Selecione um termo publicado
            </option>
            {options.versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </Select>
          <Input label="Data de início (opcional)" name="data_inicio" type="date" />
          <Textarea label="Informações adicionais (opcional)" name="informacoes_adicionais" />
          <Input
            label="Link válido por (dias)"
            name="expires_in_days"
            type="number"
            min={1}
            defaultValue={30}
          />

          {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" loading={pending}>
              Gerar link
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
