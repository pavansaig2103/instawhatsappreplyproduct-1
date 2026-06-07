import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { Channel as ChannelType } from "@/lib/db/enums";

type LogWebhookEventInput = {
  businessId?: string | null;
  channel: ChannelType;
  eventType: string;
  externalAccountId?: string | null;
  externalUserId?: string | null;
  externalMessageId?: string | null;
  payload: unknown;
  status: string;
  error?: string | null;
};

type LogSendAttemptInput = {
  businessId: string;
  channel: ChannelType;
  recipientId: string;
  messageText: string;
  status: string;
  response?: unknown;
  error?: string | null;
};

export async function logChannelWebhookEvent(input: LogWebhookEventInput) {
  const externalMessageId = input.externalMessageId || `raw_${randomUUID()}`;

  return prisma.channelWebhookEvent.upsert({
    where: {
      channel_externalMessageId: {
        channel: input.channel,
        externalMessageId
      }
    },
    update: {
      businessId: input.businessId || null,
      eventType: input.eventType,
      externalAccountId: input.externalAccountId || null,
      externalUserId: input.externalUserId || null,
      payloadJson: JSON.stringify(input.payload),
      status: input.status,
      error: input.error || null
    },
    create: {
      businessId: input.businessId || null,
      channel: input.channel,
      eventType: input.eventType,
      externalAccountId: input.externalAccountId || null,
      externalUserId: input.externalUserId || null,
      externalMessageId,
      payloadJson: JSON.stringify(input.payload),
      status: input.status,
      error: input.error || null
    }
  });
}

export async function updateChannelWebhookEvent(
  id: string,
  data: {
    businessId?: string | null;
    status?: string;
    error?: string | null;
  }
) {
  return prisma.channelWebhookEvent.update({
    where: { id },
    data
  });
}

export async function logChannelSendAttempt(input: LogSendAttemptInput) {
  return prisma.channelSendAttempt.create({
    data: {
      businessId: input.businessId,
      channel: input.channel,
      recipientId: input.recipientId,
      messageText: input.messageText,
      status: input.status,
      responseJson: input.response ? JSON.stringify(input.response) : null,
      error: input.error || null
    }
  });
}
