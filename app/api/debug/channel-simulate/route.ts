import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { Channel, type Channel as ChannelType } from "@/lib/db/enums";
import { processInboundMessage } from "@/lib/messages/processInboundMessage";

function normalizeChannel(channel?: string): ChannelType {
  return channel === Channel.WHATSAPP ? Channel.WHATSAPP : Channel.INSTAGRAM;
}

export async function POST(request: Request) {
  const user = await requireApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    channel?: string;
    messageText?: string;
    fakeSenderId?: string;
  };
  const channel = normalizeChannel(body.channel);
  const messageText = body.messageText?.trim() || "Hi, I want to book an appointment";
  const fakeSenderId = body.fakeSenderId?.trim() || `debug_${channel.toLowerCase()}_${Date.now()}`;

  const result = await processInboundMessage({
    businessId: user.businessId,
    channel,
    externalUserId: fakeSenderId,
    messageText,
    externalMessageId: `debug_${Date.now()}`,
    contactName: channel === Channel.WHATSAPP ? "WhatsApp Debug Lead" : "Instagram Debug Lead"
  });

  return NextResponse.json({
    ok: true,
    conversationId: result.conversationId,
    replyText: result.replyText,
    replyType: result.replyType,
    confidence: result.confidence
  });
}
