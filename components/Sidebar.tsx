"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Sparkles } from "lucide-react";
import { navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SidebarProps = {
  businessName: string;
  userName: string;
};

export function Sidebar({ businessName, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="border-b border-white/10 bg-ink-950/90 px-4 py-4 backdrop-blur lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:border-b-0 lg:border-r lg:px-5">
      <Link href="/dashboard" className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-500 text-white">
          <Sparkles className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-base font-semibold text-white">InstaReply AI</span>
          <span className="block text-xs text-slate-400">Lead capture console</span>
        </span>
      </Link>

      <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3">
        <p className="text-sm font-semibold text-white">{businessName}</p>
        <p className="mt-1 text-xs text-slate-500">{userName}</p>
      </div>

      <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:mt-10 lg:flex-col lg:overflow-visible lg:pb-0">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-max items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-white text-ink-950"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={logout}
        className="mt-5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white lg:mt-10"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </aside>
  );
}
