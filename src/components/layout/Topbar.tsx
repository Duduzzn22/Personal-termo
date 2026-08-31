"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { MobileSidebar } from "./Sidebar";
import { signOutAction } from "@/lib/actions/auth.actions";
import { initials } from "@/lib/utils/format";

const TITLES: { prefix: string; title: string }[] = [
  { prefix: "/dashboard", title: "Visão Geral" },
  { prefix: "/alunos", title: "Alunos" },
  { prefix: "/pacotes", title: "Pacotes" },
  { prefix: "/termos", title: "Termos" },
  { prefix: "/aceites", title: "Aceites" },
  { prefix: "/agenda", title: "Agenda" },
  { prefix: "/configuracoes", title: "Configurações" },
];

function pageTitleFromPath(pathname: string) {
  return TITLES.find((t) => pathname.startsWith(t.prefix))?.title ?? "Painel";
}

export function Topbar({ trainerName }: { trainerName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = pageTitleFromPath(pathname);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold text-slate-900 sm:text-lg">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              {initials(trainerName || "PT")}
            </div>
            <span className="text-sm font-medium text-slate-700">{trainerName}</span>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </form>
        </div>
      </header>
      <MobileSidebar open={open} onClose={() => setOpen(false)} />
    </>
  );
}
