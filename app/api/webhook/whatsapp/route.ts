import { NextResponse } from "next/server";
import { Channel } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import { logChannelSendAttempt, logChannelWebhookEvent, updateChannelWebhookEvent } from "@/lib/integrations/channelDiagnostics";
import { sendWhatsAppMessage } from "@/lib/integrations/metaChannels";
import { processInboundMessage } from "@/lib/messages/processInboundMessage";

type WhatsAppMessage = {
  from?: string;
  id?: string;
  timestamp?: string;
  text?: {
    body?: string;
  };
  type?: string;
};

type WhatsAppValue = {
  metadata?: {
    phone_number_id?: string;
  };
  messages?: WhatsAppMessage[];
};

type WhatsAppWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: WhatsAppValue;
    }>;
  }>;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

async function processWhatsAppMessage(input: {
  phoneNumberId?: string;
  message: WhatsAppMessage;
  payload: WhatsAppWebhookPayload;
}) {
  const externalAccountId = input.phoneNumberId;
  const externalUserId = input.message.from;
  const messageText = input.message.text?.body?.trim();
  const externalMessageId = input.message.id;
  const eventType = messageText ? "MESSAGE_TEXT" : "MESSAGE_IGNORED";

  const existingProcessed = externalMessageId
    ? await prisma.channelWebhookEvent.findUnique({
        where: {
          channel_externalMessageId: {
            channel: Channel.WHATSAPP,
            externalMessageId
          }
        }
      })
    : null;

  if (existingProcessed?.status === "PROCESSED") {
    await logChannelWebhookEvent({
      channel: Channel.WHATSAPP,
      eventType,
      externalAccountId,
      externalUserId,
      payload: input.payload,
      status: "IGNORED",
      error: `Duplicate message already processed: ${externalMessageId}`
    });
    return;
  }

  const rawEvent = await logChannelWebhookEvent({
    channel: Channel.WHATSAPP,
    eventType,
    externalAccountId,
    externalUserId,
    externalMessageId,
    payload: input.payload,
    status: "RECEIVED"
  });

  console.log(`[WhatsApp webhook] Event type: ${eventType}`);

  if (!externalAccountId || !externalUserId || !messageText) {
    await updateChannelWebhookEvent(rawEvent.id, {
      status: "IGNORED",
      error: !messageText ? "No text message found" : null
    });
    return;
  }

  const connection = await prisma.channelConnection.findUnique({
    where: {
      channel_externalAccountId: {
        channel: Channel.WHATSAPP,
        externalAccountId
      }
    }
  });

  if (!connection) {
    await updateChannelWebhookEvent(rawEvent.id, {
      status: "IGNORED",
      error: `No WhatsApp connection found for phone number ${externalAccountId}`
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
      channel: Channel.WHATSAPP,
      externalUserId,
      externalMessageId,
      messageText,
      contactName: "WhatsApp Lead"
    });

    try {
      const response = await sendWhatsAppMessage({
        phoneNumberId: externalAccountId,
        recipientId: externalUserId,
        text: result.replyText,
        accessToken: connection.accessToken
      });

      await logChannelSendAttempt({
        businessId: connection.businessId,
        channel: Channel.WHATSAPP,
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
      const message = error instanceof Error ? error.message : "WhatsApp send failed";

      await logChannelSendAttempt({
        businessId: connection.businessId,
        channel: Channel.WHATSAPP,
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
      error: error instanceof Error ? error.message : "WhatsApp processing failed"
    });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as WhatsAppWebhookPayload;
    const messages =
      payload.entry?.flatMap((entry) =>
        entry.changes?.flatMap((change) =>
          (change.value?.messages ?? []).map((message) => ({
            phoneNumberId: change.value?.metadata?.phone_number_id,
            message
          }))
        ) ?? []
      ) ?? [];

    for (const item of messages) {
      await processWhatsAppMessage({
        ...item,
        payload
      });
    }

    if (!messages.length) {
      await logChannelWebhookEvent({
        channel: Channel.WHATSAPP,
        eventType: payload.object || "whatsapp_webhook",
        payload,
        status: "IGNORED",
        error: "No text messages found"
      });
    }
  } catch (error) {
    console.error("[WhatsApp webhook] Processing failed", error instanceof Error ? error.message : error);
  }

  return NextResponse.json({ ok: true });
}
