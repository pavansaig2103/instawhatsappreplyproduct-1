import { prisma } from "@/lib/db/prisma";

type LogInstagramEventInput = {
  businessId?: string | null;
  eventType: string;
  payload: unknown;
  status: string;
  error?: string | null;
};

export async function logInstagramEvent({ businessId, eventType, payload, status, error }: LogInstagramEventInput) {
  return prisma.instagramWebhookEvent.create({
    data: {
      businessId: businessId || null,
      eventType,
      payloadJson: JSON.stringify(payload),
      status,
      error: error || null
    }
  });
}

export async function updateInstagramEvent(
  id: string,
  data: {
    businessId?: string | null;
    status?: string;
    error?: string | null;
  }
) {
  return prisma.instagramWebhookEvent.update({
    where: { id },
    data
  });
}
