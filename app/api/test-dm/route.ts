import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { Channel, type Channel as ChannelType } from "@/lib/db/enums";
import { processInboundMessage } from "@/lib/messages/processInboundMessage";

function normalizeChannel(channel?: string): ChannelType {
  return channel?.toUpperCase() === Channel.WHATSAPP ? Channel.WHATSAPP : Channel.INSTAGRAM;
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    message?: string;
    conversationId?: string;
    instagramHandle?: string;
    contactName?: string;
    channel?: string;
  };
  const inboundText = body.message?.trim();

  if (!inboundText) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const user = await requireApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const channel = normalizeChannel(body.channel);
  const externalUserId = body.instagramHandle?.trim() || `@${user.business.slug}_${channel.toLowerCase()}_test_lead`;
  const result = await processInboundMessage({
    businessId: user.businessId,
    channel,
    externalUserId,
    messageText: inboundText,
    conversationId: body.conversationId,
    contactName: body.contactName?.trim() || "New Lead"
  });

  return NextResponse.json({
    conversationId: result.conversationId,
    reply: result.replyText,
    aiConfidence: result.confidence,
    leadState: result.leadState,
    messages: result.messages,
    latest: result.latest
  });
}
