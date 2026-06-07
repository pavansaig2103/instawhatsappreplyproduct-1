import { ChannelsDebugActions } from "@/components/ChannelsDebugActions";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireCurrentUser } from "@/lib/auth/session";
import { Channel } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

function preview(value?: string | null) {
  if (!value) {
    return "-";
  }

  try {
    return JSON.stringify(JSON.parse(value)).slice(0, 180);
  } catch {
    return value.slice(0, 180);
  }
}

function connectionFor(
  connections: Array<{
    channel: string;
    externalAccountId: string;
    externalBusinessAccountId: string;
    accessToken: string;
    isConnected: boolean;
  }>,
  channel: string
) {
  return connections.find((connection) => connection.channel === channel);
}

export default async function ChannelsDebugPage() {
  const user = await requireCurrentUser();
  const [connections, webhookEvents, sendAttempts] = await Promise.all([
    prisma.channelConnection.findMany({
      where: { businessId: user.businessId },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.channelWebhookEvent.findMany({
      where: {
        OR: [{ businessId: user.businessId }, { businessId: null }]
      },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.channelSendAttempt.findMany({
      where: { businessId: user.businessId },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);
  const instagram = connectionFor(connections, Channel.INSTAGRAM);
  const whatsapp = connectionFor(connections, Channel.WHATSAPP);
  const instagramWebhookUrl = `${appUrl()}/api/webhook/instagram`;
  const whatsappWebhookUrl = `${appUrl()}/api/webhook/whatsapp`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Diagnostics"
        title="Channels Debug"
        description="Inspect Meta channel setup, webhook events, send attempts, and pipeline simulations."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold text-white">Webhook URLs</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="text-slate-500">Instagram</p>
              <p className="mt-1 break-all rounded-lg border border-white/10 bg-ink-900 px-4 py-3 text-slate-300">{instagramWebhookUrl}</p>
            </div>
            <div>
              <p className="text-slate-500">WhatsApp</p>
              <p className="mt-1 break-all rounded-lg border border-white/10 bg-ink-900 px-4 py-3 text-slate-300">{whatsappWebhookUrl}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-white">Verify tokens</h2>
          <div className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Instagram verify token</span>
              <Badge tone={process.env.INSTAGRAM_VERIFY_TOKEN ? "green" : "slate"}>{process.env.INSTAGRAM_VERIFY_TOKEN ? "Yes" : "No"}</Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">WhatsApp verify token</span>
              <Badge tone={process.env.WHATSAPP_VERIFY_TOKEN ? "green" : "slate"}>{process.env.WHATSAPP_VERIFY_TOKEN ? "Yes" : "No"}</Badge>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {[{ label: "Instagram", connection: instagram }, { label: "WhatsApp", connection: whatsapp }].map((item) => (
          <Card key={item.label} className="p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-semibold text-white">{item.label} connection</h2>
              <Badge tone={item.connection?.isConnected ? "green" : "slate"}>{item.connection?.isConnected ? "Connected" : "Not connected"}</Badge>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">External account ID</span>
                <span className="font-medium text-white">{item.connection?.externalAccountId || "Not saved"}</span>
              </div>
              {item.label === "WhatsApp" ? (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Business account ID</span>
                  <span className="font-medium text-white">{item.connection?.externalBusinessAccountId || "Not saved"}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Token exists</span>
                <Badge tone={item.connection?.accessToken ? "green" : "slate"}>{item.connection?.accessToken ? "Yes" : "No"}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <ChannelsDebugActions />
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-semibold text-white">Last 20 webhook events</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Created</th>
                <th className="px-5 py-4 font-medium">Channel</th>
                <th className="px-5 py-4 font-medium">Type</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Message ID</th>
                <th className="px-5 py-4 font-medium">Payload</th>
                <th className="px-5 py-4 font-medium">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {webhookEvents.length ? (
                webhookEvents.map((event) => (
                  <tr key={event.id} className="text-slate-300">
                    <td className="px-5 py-4">{formatDate(event.createdAt)}</td>
                    <td className="px-5 py-4">{event.channel}</td>
                    <td className="px-5 py-4">{event.eventType}</td>
                    <td className="px-5 py-4"><Badge tone={event.status === "FAILED" ? "amber" : "green"}>{event.status}</Badge></td>
                    <td className="px-5 py-4">{event.externalMessageId || "-"}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">{preview(event.payloadJson)}</td>
                    <td className="px-5 py-4">{event.error || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-400">No webhook events yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-semibold text-white">Last 20 send attempts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Created</th>
                <th className="px-5 py-4 font-medium">Channel</th>
                <th className="px-5 py-4 font-medium">Recipient</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Message</th>
                <th className="px-5 py-4 font-medium">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {sendAttempts.length ? (
                sendAttempts.map((attempt) => (
                  <tr key={attempt.id} className="text-slate-300">
                    <td className="px-5 py-4">{formatDate(attempt.createdAt)}</td>
                    <td className="px-5 py-4">{attempt.channel}</td>
                    <td className="px-5 py-4">{attempt.recipientId}</td>
                    <td className="px-5 py-4"><Badge tone={attempt.status === "SUCCESS" ? "green" : "amber"}>{attempt.status}</Badge></td>
                    <td className="px-5 py-4">{attempt.messageText}</td>
                    <td className="px-5 py-4">{attempt.error || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">No send attempts yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
