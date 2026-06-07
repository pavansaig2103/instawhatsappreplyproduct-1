import { NextResponse } from "next/server";
import { Channel } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import { sendInstagramMessage } from "@/lib/integrations/instagram";
import { logInstagramEvent, updateInstagramEvent } from "@/lib/integrations/instagramDiagnostics";
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

async function handleMessagingEvent(event: InstagramMessagingEvent, rawEventId?: string) {
  const senderId = event.sender?.id;
  const recipientId = event.recipient?.id;
  const messageText = event.message?.text?.trim();
  const externalMessageId = event.message?.mid;
  const eventType = event.message?.is_echo ? "MESSAGE_ECHO" : messageText ? "MESSAGE_TEXT" : "MESSAGE_IGNORED";

  console.log(`[Instagram webhook] Event type: ${eventType}`);

  if (!senderId || !recipientId || !messageText || event.message?.is_echo) {
    if (rawEventId) {
      await updateInstagramEvent(rawEventId, {
        status: "IGNORED",
        error: !messageText ? "No text message found" : null
      });
    }
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
    if (rawEventId) {
      await updateInstagramEvent(rawEventId, {
        status: "NO_BUSINESS",
        error: `No business found for page ${recipientId}`
      });
    }
    return;
  }

  if (rawEventId) {
    await updateInstagramEvent(rawEventId, {
      businessId: business.id,
      status: "PROCESSING"
    });
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
    if (rawEventId) {
      await updateInstagramEvent(rawEventId, {
        businessId: business.id,
        status: "PROCESSED_NO_SEND",
        error: "Missing Instagram access token"
      });
    }
    return;
  }

  try {
    await sendInstagramMessage({
      recipientId: senderId,
      text: result.replyText,
      accessToken: business.instagramAccessToken
    });
    await logInstagramEvent({
      businessId: business.id,
      eventType: "OUTBOUND_SEND_ATTEMPT",
      payload: {
        recipientId: senderId,
        text: result.replyText,
        source: "webhook"
      },
      status: "SENT"
    });
    if (rawEventId) {
      await updateInstagramEvent(rawEventId, {
        businessId: business.id,
        status: "PROCESSED"
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Instagram reply send failed";
    console.error("[Instagram webhook] Reply send failed", message);
    await logInstagramEvent({
      businessId: business.id,
      eventType: "OUTBOUND_SEND_ATTEMPT",
      payload: {
        recipientId: senderId,
        text: result.replyText,
        source: "webhook"
      },
      status: "FAILED",
      error: message
    });
    if (rawEventId) {
      await updateInstagramEvent(rawEventId, {
        businessId: business.id,
        status: "PROCESSED_SEND_FAILED",
        error: message
      });
    }
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as InstagramWebhookPayload;
    const events = payload.entry?.flatMap((entry) => entry.messaging ?? []) ?? [];
    const rawEvent = await logInstagramEvent({
      eventType: payload.object || "instagram_webhook",
      payload,
      status: "RECEIVED"
    });

    console.log(`[Instagram webhook] Event type: ${payload.object || "instagram_webhook"}`);

    for (const event of events) {
      await handleMessagingEvent(event, rawEvent.id);
    }

    if (!events.length) {
      await updateInstagramEvent(rawEvent.id, {
        status: "IGNORED",
        error: "No messaging events found"
      });
    }
  } catch (error) {
    console.error("[Instagram webhook] Processing failed", error instanceof Error ? error.message : error);
  }

  return NextResponse.json({ ok: true });
}
