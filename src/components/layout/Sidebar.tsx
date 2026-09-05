"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Package, FileText, CheckSquare, Calendar, CalendarClock, AlertTriangle, Settings, Dumbbell, WalletCards, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/alunos", label: "Alunos", icon: Users },
  { href: "/radar", label: "Radar de Alunos", icon: AlertTriangle },
  { href: "/pacotes", label: "Pacotes", icon: Package },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/solicitacoes", label: "Solicitações", icon: CalendarClock },
  { href: "/treinos", label: "Treinos", icon: Dumbbell },
  { href: "/financeiro", label: "Financeiro", icon: WalletCards },
  { href: "/termos", label: "Termos", icon: FileText },
  { href: "/aceites", label: "Aceites", icon: CheckSquare },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <div className="flex h-full flex-col"><div className="flex items-center gap-2.5 px-5 py-5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900"><Dumbbell className="h-4.5 w-4.5 text-white" /></div><div><p className="text-sm font-semibold text-slate-900">Personal Trainer</p><p className="text-xs text-slate-500">Painel de gestão</p></div></div><nav className="flex-1 space-y-1 px-3">{NAV_ITEMS.map(item => { const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)); return <Link key={item.href} href={item.href} onClick={onNavigate} className={cn("flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")}><span className="flex items-center gap-2.5"><item.icon className="h-4.5 w-4.5" />{item.label}</span></Link>; })}</nav><div className="px-3 pb-5 pt-2"><p className="px-3 text-[11px] text-slate-400">Termo de Ciência e Aceite · registro eletrônico</p></div></div>;
}
export function Sidebar() { return <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block"><div className="sticky top-0 h-screen"><SidebarContent /></div></aside>; }
export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) { if (!open) return null; return <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-slate-900/50" onClick={onClose} /><div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl"><button onClick={onClose} className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Fechar menu"><X className="h-5 w-5" /></button><SidebarContent onNavigate={onClose} /></div></div>; }
