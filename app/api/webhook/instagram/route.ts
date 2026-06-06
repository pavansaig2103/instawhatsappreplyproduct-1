import { NextResponse } from "next/server";
import { Channel } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import { sendInstagramMessage } from "@/lib/integrations/instagram";
import { processInboundMessage } from "@/lib/messages/processInboundMessage";

type InstagramMessagingEvent = {
  sender?: {
    id?: string;
  };
  recipient?: {
    id?: string;
  };
  timestamp?: number;
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
  };
};

type InstagramWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    time?: number;
    messaging?: InstagramMessagingEvent[];
  }>;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.INSTAGRAM_VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

async function handleMessagingEvent(event: InstagramMessagingEvent) {
  const senderId = event.sender?.id;
  const recipientId = event.recipient?.id;
  const messageText = event.message?.text?.trim();
  const externalMessageId = event.message?.mid;

  if (!senderId || !recipientId || !messageText || event.message?.is_echo) {
    return;
  }

  if (senderId === recipientId) {
    return;
  }

  const business = await prisma.business.findFirst({
    where: {
      instagramPageId: recipientId
    }
  });

  if (!business) {
    console.warn(`[Instagram webhook] No business found for page ${recipientId}`);
    return;
  }

  const result = await processInboundMessage({
    businessId: business.id,
    channel: Channel.INSTAGRAM,
    externalUserId: senderId,
    messageText,
    externalMessageId,
    contactName: "Instagram Lead"
  });

  if (!business.instagramAccessToken) {
    console.warn(`[Instagram webhook] Missing access token for business ${business.id}`);
    return;
  }

  try {
    await sendInstagramMessage({
      recipientId: senderId,
      text: result.replyText,
      accessToken: business.instagramAccessToken
    });
  } catch (error) {
    console.error("[Instagram webhook] Reply send failed", error instanceof Error ? error.message : error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as InstagramWebhookPayload;
    const events = payload.entry?.flatMap((entry) => entry.messaging ?? []) ?? [];

    for (const event of events) {
      await handleMessagingEvent(event);
    }
  } catch (error) {
    console.error("[Instagram webhook] Processing failed", error instanceof Error ? error.message : error);
  }

  return NextResponse.json({ ok: true });
}
