import { Activity, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { LeadsTable } from "@/components/LeadsTable";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { getDashboardData } from "@/lib/db/data";
import { requireCurrentUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const { business, leads, conversations, faqs, metrics } = await getDashboardData(user.businessSlug);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Control room"
        title={`${business.name} lead capture`}
        description="Monitor FAQ replies, captured leads, conversation handoffs, and follow-up readiness from one dashboard."
        action={
          <a
            href="/test-dm"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-slate-200"
          >
            Test lead flow
            <ArrowUpRight className="h-4 w-4" />
          </a>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Priority leads</h2>
          </div>
          <LeadsTable items={leads} />
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-mint/10 text-mint">
                <Activity className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-white">Automation health</h2>
                <p className="text-sm text-slate-400">Responder systems are active</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {["Lead capture", "FAQ matching", "Human handoff"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-lg bg-white/[0.04] p-3">
                  <span className="text-sm text-slate-300">{item}</span>
                  <CheckCircle2 className="h-5 w-5 text-mint" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold text-white">Coverage snapshot</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/[0.04] p-4">
                <p className="text-2xl font-semibold text-white">{conversations.length}</p>
                <p className="mt-1 text-xs text-slate-500">Conversation threads</p>
              </div>
              <div className="rounded-lg bg-white/[0.04] p-4">
                <p className="text-2xl font-semibold text-white">{faqs.length}</p>
                <p className="mt-1 text-xs text-slate-500">Active FAQs</p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
