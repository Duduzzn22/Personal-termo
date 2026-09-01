import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { requireTrainer } from "@/lib/auth/current-trainer";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, isAdmin } = await requireTrainer();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar trainerName={profile.nome_profissional} isAdmin={isAdmin} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
