import Link from "next/link";
import { CalendarClock } from "lucide-react";

export function PortalAgendaLink() {
  return <Link href="/portal/agenda" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"><CalendarClock className="h-4 w-4"/> Cancelar ou remarcar aula</Link>;
}
