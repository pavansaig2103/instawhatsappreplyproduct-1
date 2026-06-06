import { Database } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireCurrentUser } from "@/lib/auth/session";
import { checkCoreTables, checkDatabaseConnection, getCoreCounts } from "@/lib/system/health";

export const dynamic = "force-dynamic";

export default async function DatabaseHealthPage() {
  await requireCurrentUser();
  const [database, tables, counts] = await Promise.all([
    checkDatabaseConnection(),
    checkCoreTables(),
    getCoreCounts()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System"
        title="Database health"
        description="Check the active PostgreSQL connection and core table counts."
      />

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-white/[0.05] text-brand-500">
              <Database className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-white">{database.ok ? "Database online" : "Database unavailable"}</p>
              <p className="mt-1 text-sm text-slate-400">{database.ok ? "Supabase PostgreSQL is reachable." : database.message}</p>
            </div>
          </div>
          <span className={database.ok ? "text-sm font-semibold text-emerald-300" : "text-sm font-semibold text-amber"}>
            {database.message}
          </span>
        </div>
      </Card>

      <Card className="p-5">
        <p className="font-semibold text-white">{tables.ok ? "Core tables found" : "Missing core tables"}</p>
        <p className="mt-2 text-sm text-slate-400">
          {tables.ok ? "All required tables exist." : `Missing: ${tables.missingTables.join(", ")}`}
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(counts).map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{value.toLocaleString()}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
