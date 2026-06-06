import { LeadsTable } from "@/components/LeadsTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { getLeads } from "@/lib/db/data";
import { requireCurrentUser } from "@/lib/auth/session";

export default async function LeadsPage() {
  const user = await requireCurrentUser();
  const leads = await getLeads(user.businessSlug);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pipeline"
        title="Leads"
        description={`Review captured ${user.business.name} leads by status, interest, estimated value, and recency.`}
      />
      <LeadsTable items={leads} />
    </div>
  );
}
