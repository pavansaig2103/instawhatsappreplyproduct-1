import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { Channel } from "@/lib/db/enums";
import { processInboundMessage } from "@/lib/messages/processInboundMessage";

export async function POST(request: Request) {
  const user = await requireApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    messageText?: string;
    fakeSenderId?: string;
  };
  const messageText = body.messageText?.trim() || "Hi, I want to book an appointment";
  const fakeSenderId = body.fakeSenderId?.trim() || `debug_instagram_${Date.now()}`;

  const result = await processInboundMessage({
    businessId: user.businessId,
    channel: Channel.INSTAGRAM,
    externalUserId: fakeSenderId,
    messageText,
    externalMessageId: `debug_${Date.now()}`,
    contactName: "Instagram Debug Lead"
  });

  return NextResponse.json({
    ok: true,
    conversationId: result.conversationId,
    replyText: result.replyText,
    replyType: result.replyType,
    confidence: result.confidence
  });
}
