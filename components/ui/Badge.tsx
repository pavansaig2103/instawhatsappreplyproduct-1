import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  tone?: "pink" | "green" | "amber" | "slate";
};

const tones = {
  pink: "border-brand-500/30 bg-brand-500/10 text-pink-100",
  green: "border-mint/30 bg-mint/10 text-emerald-100",
  amber: "border-amber/30 bg-amber/10 text-amber-100",
  slate: "border-white/10 bg-white/5 text-slate-200"
};

export function Badge({ children, tone = "slate" }: BadgeProps) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}
