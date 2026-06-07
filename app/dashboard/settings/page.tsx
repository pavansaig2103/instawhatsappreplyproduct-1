import { ShieldCheck } from "lucide-react";
import { BusinessSettingsForm } from "@/components/BusinessSettingsForm";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireCurrentUser } from "@/lib/auth/session";
import { Channel } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";

function serializeConnection(connection?: {
  externalAccountId: string;
  externalBusinessAccountId: string;
  accessToken: string;
  isConnected: boolean;
} | null) {
  return {
    externalAccountId: connection?.externalAccountId ?? "",
    externalBusinessAccountId: connection?.externalBusinessAccountId ?? "",
    tokenExists: Boolean(connection?.accessToken),
    isConnected: Boolean(connection?.isConnected)
  };
}

export default async function SettingsPage() {
  const user = await requireCurrentUser();
  const business = user.business;
  const connections = await prisma.channelConnection.findMany({
    where: { businessId: user.businessId }
  });

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
        channelConnections={{
          INSTAGRAM: serializeConnection(connections.find((connection) => connection.channel === Channel.INSTAGRAM)),
          WHATSAPP: serializeConnection(connections.find((connection) => connection.channel === Channel.WHATSAPP))
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
              Instagram and WhatsApp webhooks can be connected from this page.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
