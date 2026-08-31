import { Dumbbell } from "lucide-react";

export function PublicHeader({ trainerName, companyName }: { trainerName: string; companyName?: string | null }) {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4 sm:py-5">
      <div className="mx-auto flex max-w-2xl items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900">
          <Dumbbell className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{companyName || trainerName}</p>
          <p className="text-xs text-slate-500">Personal Trainer</p>
        </div>
      </div>
    </header>
  );
}
