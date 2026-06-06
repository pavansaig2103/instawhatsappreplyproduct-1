import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastProps = {
  message: string;
  tone?: "success" | "error";
};

export function Toast({ message, tone = "success" }: ToastProps) {
  if (!message) {
    return null;
  }

  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={cn(
        "fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-xl",
        tone === "success"
          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
          : "border-amber/30 bg-amber/15 text-amber"
      )}
      role="status"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
