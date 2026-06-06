import { Activity, Bot, Database, LockKeyhole, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAppHealth } from "@/lib/system/health";

export const dynamic = "force-dynamic";

function statusText(ok: boolean) {
  return ok ? "✅" : "❌";
}

export default async function HealthPage() {
  await requireCurrentUser();
  const health = await getAppHealth();

  const checks = [
    {
      label: "Database Connected",
      ok: health.database.ok,
      message: health.database.message,
      icon: Database
    },
    {
      label: "Groq Connected",
      ok: health.groq.ok,
      message: health.groq.message,
      icon: Bot
    },
    {
      label: "Auth Working",
      ok: health.auth.ok,
      message: health.auth.message,
      icon: LockKeyhole
    }
  ];

  const counts = [
    { label: "Total Businesses", value: health.counts.businesses, icon: Activity },
    { label: "Total Users", value: health.counts.users, icon: Users },
    { label: "Total Leads", value: health.counts.leads, icon: Users },
    { label: "Total Conversations", value: health.counts.conversations, icon: Activity }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System"
        title="Health"
        description="Verify production services, authentication readiness, and core database counts."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {checks.map((check) => {
          const Icon = check.icon;

          return (
            <Card key={check.label} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/[0.05] text-brand-500">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-xl" aria-label={check.ok ? "connected" : "not connected"}>
                  {statusText(check.ok)}
                </span>
              </div>
              <h3 className="mt-5 font-semibold text-white">{check.label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{check.message}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {counts.map((count) => {
          const Icon = count.icon;

          return (
            <Card key={count.label} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{count.label}</p>
                <Icon className="h-4 w-4 text-brand-500" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-white">{count.value.toLocaleString()}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
