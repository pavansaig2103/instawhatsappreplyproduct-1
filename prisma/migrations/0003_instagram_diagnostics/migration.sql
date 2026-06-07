CREATE TABLE "InstagramWebhookEvent" (
  "id" TEXT NOT NULL,
  "businessId" TEXT,
  "eventType" TEXT NOT NULL,
  "payloadJson" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InstagramWebhookEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "InstagramWebhookEvent" ADD CONSTRAINT "InstagramWebhookEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
