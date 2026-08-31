import { Dumbbell } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Personal Trainer</h1>
          <p className="text-sm text-slate-500">Gestão de alunos e termo digital de aceite</p>
        </div>
        {children}
      </div>
    </div>
  );
}
