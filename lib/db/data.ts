import { BarChart3, Bot, MessageSquareText, Users } from "lucide-react";
import { Channel, Direction, ReplyType, type LeadStatus as LeadStatusType } from "@/lib/db/enums";
import { getSelectedBusiness } from "@/lib/db/business";
import { prisma } from "@/lib/db/prisma";

export type UiLead = {
  name: string;
  handle: string;
  channel: "Instagram" | "WhatsApp";
  intent: string;
  status: "Hot" | "Warm" | "Open" | "Nurture";
  value: string;
  lastSeen: string;
};

export type UiFaq = {
  id: string;
  question: string;
  answer: string;
  usage: string;
};

export type UiConversation = {
  id: string;
  contact: string;
  handle: string;
  channel: "Instagram" | "WhatsApp";
  status: string;
  messages: Array<{
    from: "user" | "bot";
    text: string;
    replyType: string;
  }>;
};

export type UiMetric = {
  label: string;
  value: string;
  change: string;
  icon: typeof MessageSquareText;
};

export type UiNotification = {
  id: string;
  title: string;
  business: string;
  leadName: string;
  phone: string;
  channel: "Instagram" | "WhatsApp";
  status: string;
  createdAt: string;
};

export type SelectedBusiness = Awaited<ReturnType<typeof getSelectedBusiness>>;

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(cents / 100);
}

function formatRelative(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.round(minutes / 60);
  return `${hours} hr${hours === 1 ? "" : "s"} ago`;
}

function mapLeadStatus(status: string): UiLead["status"] {
  const statusMap: Record<LeadStatusType, UiLead["status"]> = {
    NEW: "Open",
    WARM: "Warm",
    HOT: "Hot",
    ESCALATED: "Hot",
    RESOLVED: "Nurture"
  };

  return statusMap[status as LeadStatusType] ?? "Open";
}

function mapChannel(channel?: string): "Instagram" | "WhatsApp" {
  return channel === Channel.WHATSAPP ? "WhatsApp" : "Instagram";
}

export async function getDashboardData(businessSlug?: string) {
  const business = await getSelectedBusiness(businessSlug);
  const leads = await getLeads(business.slug);
  const conversations = await getConversations(business.slug);
  const faqs = await getFaqs(business.slug);
  const metrics = await getDashboardMetrics(business.slug);

  return { business, leads, conversations, faqs, metrics };
}

export async function getDashboardMetrics(businessSlug?: string): Promise<UiMetric[]> {
  try {
    const business = await getSelectedBusiness(businessSlug);
    const [instagramConversations, whatsappConversations, totalLeads, outboundReplies, faqMatchedReplies] = await Promise.all([
      prisma.conversation.count({ where: { businessId: business.id, channel: Channel.INSTAGRAM } }),
      prisma.conversation.count({ where: { businessId: business.id, channel: Channel.WHATSAPP } }),
      prisma.lead.count({ where: { businessId: business.id } }),
      prisma.message.count({ where: { direction: Direction.OUTBOUND, conversation: { businessId: business.id } } }),
      prisma.message.count({
        where: {
          conversation: { businessId: business.id },
          direction: Direction.OUTBOUND,
          replyType: ReplyType.FAQ_MATCH
        }
      })
    ]);
    const matchRate = outboundReplies > 0 ? Math.round((faqMatchedReplies / outboundReplies) * 100) : 0;

    return [
      { label: "Instagram conversations", value: instagramConversations.toLocaleString(), change: "Live workspace", icon: MessageSquareText },
      { label: "WhatsApp conversations", value: whatsappConversations.toLocaleString(), change: "Live workspace", icon: Bot },
      { label: "Total leads", value: totalLeads.toLocaleString(), change: "Live workspace", icon: Users },
      { label: "FAQ match rate", value: `${matchRate}%`, change: "Live workspace", icon: BarChart3 }
    ];
  } catch {
    return [
      { label: "Instagram conversations", value: "0", change: "Live workspace", icon: MessageSquareText },
      { label: "WhatsApp conversations", value: "0", change: "Live workspace", icon: Bot },
      { label: "Total leads", value: "0", change: "Live workspace", icon: Users },
      { label: "FAQ match rate", value: "0%", change: "Live workspace", icon: BarChart3 }
    ];
  }
}

export async function getLeads(businessSlug?: string): Promise<UiLead[]> {
  try {
    const business = await getSelectedBusiness(businessSlug);
    const leads = await prisma.lead.findMany({
      where: { businessId: business.id },
      include: {
        conversations: {
          orderBy: { updatedAt: "desc" },
          take: 1
        }
      },
      orderBy: [{ status: "asc" }, { lastSeenAt: "desc" }],
      take: 20
    });

    return leads.map((lead) => ({
      name: lead.name,
      handle: lead.instagramHandle,
      channel: mapChannel(lead.conversations[0]?.channel),
      intent: lead.serviceInterest ?? lead.intent,
      status: mapLeadStatus(lead.status),
      value: formatCurrency(lead.valueCents),
      lastSeen: formatRelative(lead.lastSeenAt)
    }));
  } catch {
    return [];
  }
}

export async function getFaqs(businessSlug?: string): Promise<UiFaq[]> {
  try {
    const business = await getSelectedBusiness(businessSlug);
    const faqs = await prisma.fAQ.findMany({
      where: { businessId: business.id, isActive: true },
      orderBy: { usageCount: "desc" }
    });

    return faqs.map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      usage: `${faq.usageCount} matches`
    }));
  } catch {
    return [];
  }
}

export async function getConversations(businessSlug?: string): Promise<UiConversation[]> {
  try {
    const business = await getSelectedBusiness(businessSlug);
    const conversations = await prisma.conversation.findMany({
      where: { businessId: business.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 20
    });

    return conversations.map((conversation) => ({
      id: conversation.id,
      contact: conversation.contactName,
      handle: conversation.instagramHandle,
      channel: mapChannel(conversation.channel),
      status: conversation.status.replace("_", " ").toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase()),
      messages: conversation.messages.map((message) => ({
        from: message.direction === Direction.OUTBOUND ? "bot" : "user",
        text: message.content,
        replyType: message.replyType
      }))
    }));
  } catch {
    return [];
  }
}

export async function getNotifications(businessSlug?: string): Promise<UiNotification[]> {
  try {
    const business = await getSelectedBusiness(businessSlug);
    const notifications = await prisma.notification.findMany({
      where: { businessId: business.id },
      include: {
        business: true,
        lead: true
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    return notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      business: notification.business.name,
      leadName: notification.lead.name,
      phone: notification.lead.phone ?? "Not provided",
      channel: mapChannel(notification.channel),
      status: notification.status,
      createdAt: formatRelative(notification.createdAt)
    }));
  } catch {
    return [];
  }
}
