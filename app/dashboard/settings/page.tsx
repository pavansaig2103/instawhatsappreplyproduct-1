import { ShieldCheck } from "lucide-react";
import { BusinessSettingsForm } from "@/components/BusinessSettingsForm";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireCurrentUser } from "@/lib/auth/session";

export default async function SettingsPage() {
  const user = await requireCurrentUser();
  const business = user.business;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Business Settings"
        description={`Configure ${business.name}'s assistant profile, staff notifications, and AI response style.`}
      />

      <BusinessSettingsForm
        business={{
          slug: business.slug,
          name: business.name,
          businessType: business.businessType,
          location: business.location,
          timings: business.timings,
          services: business.services,
          pricingNotes: business.pricingNotes,
          staffNotificationPhone: business.staffNotificationPhone,
          staffNotificationEmail: business.staffNotificationEmail,
          aiTone: business.aiTone
        }}
      />

      <Card className="p-5">
        <div className="flex items-start gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-mint/10 text-mint">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold text-white">Integration status</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Instagram and WhatsApp are still demo channels. No real external APIs, credentials, or webhooks are connected yet.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
