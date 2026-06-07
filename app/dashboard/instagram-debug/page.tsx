import { headers } from "next/headers";
import { InstagramDebugActions } from "@/components/InstagramDebugActions";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

function getWebhookUrl() {
  const headerStore = headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host") || "localhost:3000";
  const proto = headerStore.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");

  return `${proto}://${host}/api/webhook/instagram`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

function previewPayload(payloadJson: string) {
  try {
    const parsed = JSON.parse(payloadJson) as unknown;
    return JSON.stringify(parsed).slice(0, 180);
  } catch {
    return payloadJson.slice(0, 180);
  }
}

export default async function InstagramDebugPage() {
  const user = await requireCurrentUser();
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: user.businessId }
  });
  const [webhookEvents, outboundAttempts, lastError] = await Promise.all([
    prisma.instagramWebhookEvent.findMany({
      where: {
        eventType: {
          not: "OUTBOUND_SEND_ATTEMPT"
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.instagramWebhookEvent.findMany({
      where: {
        eventType: "OUTBOUND_SEND_ATTEMPT"
      },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.instagramWebhookEvent.findFirst({
      where: {
        error: {
          not: null
        }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Diagnostics"
        title="Instagram Debug"
        description="Inspect Instagram webhook setup, recent events, and outbound send attempts."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold text-white">Connection</h2>
          <div className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Saved Instagram Account ID</span>
              <span className="font-medium text-white">{business.instagramPageId || "Not saved"}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Token exists</span>
              <Badge tone={business.instagramAccessToken ? "green" : "slate"}>
                {business.instagramAccessToken ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Verify token exists</span>
              <Badge tone={process.env.INSTAGRAM_VERIFY_TOKEN ? "green" : "slate"}>
                {process.env.INSTAGRAM_VERIFY_TOKEN ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-white">Webhook URL</h2>
          <p className="mt-4 break-all rounded-lg border border-white/10 bg-ink-900 px-4 py-3 text-sm text-slate-300">
            {getWebhookUrl()}
          </p>
          <h3 className="mt-5 text-sm font-semibold text-white">Last error</h3>
          <p className="mt-2 text-sm text-slate-400">{lastError?.error || "No errors logged."}</p>
        </Card>
      </div>

      <Card className="p-5">
        <InstagramDebugActions />
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-semibold text-white">Last 10 webhook events received</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Created</th>
                <th className="px-5 py-4 font-medium">Type</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Payload</th>
                <th className="px-5 py-4 font-medium">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {webhookEvents.length ? (
                webhookEvents.map((event) => (
                  <tr key={event.id} className="text-slate-300">
                    <td className="px-5 py-4">{formatDate(event.createdAt)}</td>
                    <td className="px-5 py-4">{event.eventType}</td>
                    <td className="px-5 py-4">
                      <Badge tone={event.status.includes("FAILED") ? "amber" : "green"}>{event.status}</Badge>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">{previewPayload(event.payloadJson)}</td>
                    <td className="px-5 py-4">{event.error || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-400">
                    No webhook events received yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-semibold text-white">Last 10 Instagram outbound send attempts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Created</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Payload</th>
                <th className="px-5 py-4 font-medium">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {outboundAttempts.length ? (
                outboundAttempts.map((attempt) => (
                  <tr key={attempt.id} className="text-slate-300">
                    <td className="px-5 py-4">{formatDate(attempt.createdAt)}</td>
                    <td className="px-5 py-4">
                      <Badge tone={attempt.status === "SENT" ? "green" : "amber"}>{attempt.status}</Badge>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">{previewPayload(attempt.payloadJson)}</td>
                    <td className="px-5 py-4">{attempt.error || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-400">
                    No outbound attempts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
