import { Channel, NotificationStatus, type Channel as ChannelType } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";

const HOT_LEAD_TITLE = "🔥 New HOT Lead";

function formatChannel(channel: string) {
  return channel === Channel.WHATSAPP ? "WhatsApp" : "Instagram";
}

type DispatchHotLeadNotificationInput = {
  businessId: string;
  leadId: string;
  channel: ChannelType;
};

export async function dispatchHotLeadNotification({
  businessId,
  leadId,
  channel
}: DispatchHotLeadNotificationInput) {
  const existing = await prisma.notification.findUnique({
    where: {
      leadId_title: {
        leadId,
        title: HOT_LEAD_TITLE
      }
    }
  });

  if (existing) {
    return existing;
  }

  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      businessId
    },
    include: {
      business: true
    }
  });

  if (!lead) {
    return null;
  }

  return prisma.notification.create({
    data: {
      businessId,
      leadId,
      channel,
      title: HOT_LEAD_TITLE,
      message: [
        `Business: ${lead.business.name}`,
        `Lead: ${lead.name}`,
        `Phone: ${lead.phone ?? "Not provided"}`,
        `Service interest: ${lead.serviceInterest ?? lead.intent}`,
        `Source channel: ${formatChannel(channel)}`
      ].join("\n"),
      status: NotificationStatus.SENT
    }
  });
}
