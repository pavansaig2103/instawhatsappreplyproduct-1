import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

type MetricCardProps = {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
};

export function MetricCard({ label, value, change, icon: Icon }: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5">
          <Icon className="h-5 w-5 text-brand-500" />
        </span>
      </div>
      <p className="mt-4 text-sm text-mint">{change}</p>
    </Card>
  );
}
