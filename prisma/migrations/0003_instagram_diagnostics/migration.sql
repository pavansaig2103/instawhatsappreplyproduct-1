CREATE TABLE IF NOT EXISTS "InstagramWebhookEvent" (
  "id" TEXT NOT NULL,
  "businessId" TEXT,
  "eventType" TEXT NOT NULL,
  "payloadJson" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InstagramWebhookEvent_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'InstagramWebhookEvent_businessId_fkey'
  ) THEN
    ALTER TABLE "InstagramWebhookEvent" ADD CONSTRAINT "InstagramWebhookEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
