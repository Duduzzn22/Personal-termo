import { LucideIcon } from "lucide-react";
import { Card } from "./Card";
import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "slate" | "green" | "amber" | "blue";
}

const toneClasses = {
  slate: "bg-slate-100 text-slate-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
};

export function StatCard({ label, value, icon: Icon, tone = "slate" }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", toneClasses[tone])}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
    </Card>
  );
}
