import { Calendar } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AgendaPage() {
  return (
    <EmptyState
      icon={Calendar}
      title="Agenda — Em breve"
      description="O módulo de agenda, horários e controle de aulas está planejado para uma próxima versão. A estrutura do sistema já está preparada para recebê-lo."
    />
  );
}
