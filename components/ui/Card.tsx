import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-lg border border-white/10 bg-white/[0.045] shadow-glow backdrop-blur", className)}
      {...props}
    />
  );
}
