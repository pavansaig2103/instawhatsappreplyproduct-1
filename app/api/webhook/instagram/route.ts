import { NextResponse } from "next/server";
import { Channel } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import { logChannelSendAttempt, logChannelWebhookEvent, updateChannelWebhookEvent } from "@/lib/integrations/channelDiagnostics";
import { sendInstagramMessage } from "@/lib/integrations/metaChannels";
import { processInboundMessage } from "@/lib/messages/processInboundMessage";

type InstagramMessagingEvent = {
  sender?: { id?: string };
  recipient?: { id?: string };
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

async function processInstagramEvent(event: InstagramMessagingEvent, payload: InstagramWebhookPayload) {
  const externalAccountId = event.recipient?.id;
  const externalUserId = event.sender?.id;
  const messageText = event.message?.text?.trim();
  const externalMessageId = event.message?.mid;
  const eventType = event.message?.is_echo ? "MESSAGE_ECHO" : messageText ? "MESSAGE_TEXT" : "MESSAGE_IGNORED";

  const existingEvent = externalMessageId
    ? await prisma.channelWebhookEvent.findUnique({
        where: {
          channel_externalMessageId: {
            channel: Channel.INSTAGRAM,
            externalMessageId
          }
        }
      })
    : null;

  if (existingEvent) {
    await logChannelWebhookEvent({
      channel: Channel.INSTAGRAM,
      eventType,
      externalAccountId,
      externalUserId,
      payload,
      status: "IGNORED",
      error: `Duplicate message already received: ${externalMessageId}`
    });
    return;
  }

  const rawEvent = await logChannelWebhookEvent({
    channel: Channel.INSTAGRAM,
    eventType,
    externalAccountId,
    externalUserId,
    externalMessageId,
    payload,
    status: "RECEIVED"
  });

  console.log(`[Instagram webhook] Event type: ${eventType}`);

  if (!externalAccountId || !externalUserId || !messageText || event.message?.is_echo) {
    await updateChannelWebhookEvent(rawEvent.id, {
      status: "IGNORED",
      error: !messageText ? "No text message found" : null
    });
    return;
  }

  const connection = await prisma.channelConnection.findUnique({
    where: {
      channel_externalAccountId: {
        channel: Channel.INSTAGRAM,
        externalAccountId
      }
    }
  });

  if (!connection) {
    await updateChannelWebhookEvent(rawEvent.id, {
      status: "IGNORED",
      error: `No Instagram connection found for account ${externalAccountId}`
    });
    return;
  }

  try {
    await updateChannelWebhookEvent(rawEvent.id, {
      businessId: connection.businessId,
      status: "RECEIVED"
    });

    const result = await processInboundMessage({
      businessId: connection.businessId,
      channel: Channel.INSTAGRAM,
      externalUserId,
      externalMessageId,
      messageText,
      contactName: "Instagram Lead"
    });

    try {
      const response = await sendInstagramMessage({
        recipientId: externalUserId,
        text: result.replyText,
        accessToken: connection.accessToken
      });

      await logChannelSendAttempt({
        businessId: connection.businessId,
        channel: Channel.INSTAGRAM,
        recipientId: externalUserId,
        messageText: result.replyText,
        status: "SUCCESS",
        response
      });

      await updateChannelWebhookEvent(rawEvent.id, {
        businessId: connection.businessId,
        status: "PROCESSED"
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Instagram send failed";

      await logChannelSendAttempt({
        businessId: connection.businessId,
        channel: Channel.INSTAGRAM,
        recipientId: externalUserId,
        messageText: result.replyText,
        status: "FAILED",
        error: message
      });

      await updateChannelWebhookEvent(rawEvent.id, {
        businessId: connection.businessId,
        status: "FAILED",
        error: message
      });
    }
  } catch (error) {
    await updateChannelWebhookEvent(rawEvent.id, {
      businessId: connection.businessId,
      status: "FAILED",
      error: error instanceof Error ? error.message : "Instagram processing failed"
    });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as InstagramWebhookPayload;
    const events = payload.entry?.flatMap((entry) => entry.messaging ?? []) ?? [];

    for (const event of events) {
      await processInstagramEvent(event, payload);
    }

    if (!events.length) {
      await logChannelWebhookEvent({
        channel: Channel.INSTAGRAM,
        eventType: payload.object || "instagram_webhook",
        payload,
        status: "IGNORED",
        error: "No messaging events found"
      });
    }
  } catch (error) {
    console.error("[Instagram webhook] Processing failed", error instanceof Error ? error.message : error);
  }

  return NextResponse.json({ ok: true });
}
