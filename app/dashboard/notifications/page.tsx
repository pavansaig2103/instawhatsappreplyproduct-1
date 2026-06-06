import { BellRing } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireCurrentUser } from "@/lib/auth/session";
import { getNotifications } from "@/lib/db/data";

const toneByChannel = {
  Instagram: "pink",
  WhatsApp: "green"
} as const;

export default async function NotificationsPage() {
  const user = await requireCurrentUser();
  const notifications = await getNotifications(user.businessSlug);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Alerts"
        title="Notifications"
        description={`Track HOT lead alerts for ${user.business.name}.`}
      />

      {!notifications.length ? (
        <Card className="p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-white/[0.05] text-brand-500">
            <BellRing className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-semibold text-white">No notifications yet</h3>
          <p className="mt-2 text-sm text-slate-400">HOT lead alerts will appear here after a lead capture flow is completed.</p>
        </Card>
      ) : (
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Title</th>
                <th className="px-5 py-4 font-medium">Business</th>
                <th className="px-5 py-4 font-medium">Lead</th>
                <th className="px-5 py-4 font-medium">Phone</th>
                <th className="px-5 py-4 font-medium">Channel</th>
                <th className="px-5 py-4 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {notifications.map((notification) => (
                  <tr key={notification.id} className="text-slate-300">
                    <td className="px-5 py-4 font-medium text-white">{notification.title}</td>
                    <td className="px-5 py-4">{notification.business}</td>
                    <td className="px-5 py-4">{notification.leadName}</td>
                    <td className="px-5 py-4">{notification.phone}</td>
                    <td className="px-5 py-4">
                      <Badge tone={toneByChannel[notification.channel]}>{notification.channel}</Badge>
                    </td>
                    <td className="px-5 py-4">{notification.createdAt}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
      )}
    </div>
  );
}
