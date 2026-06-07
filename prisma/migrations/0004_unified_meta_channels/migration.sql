DROP TABLE IF EXISTS "InstagramWebhookEvent";

CREATE TABLE IF NOT EXISTS "ChannelConnection" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "externalAccountId" TEXT NOT NULL,
  "externalBusinessAccountId" TEXT NOT NULL DEFAULT '',
  "accessToken" TEXT NOT NULL,
  "isConnected" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ChannelConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ChannelWebhookEvent" (
  "id" TEXT NOT NULL,
  "businessId" TEXT,
  "channel" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "externalAccountId" TEXT,
  "externalUserId" TEXT,
  "externalMessageId" TEXT,
  "payloadJson" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ChannelWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ChannelSendAttempt" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "messageText" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "responseJson" TEXT,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ChannelSendAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ChannelConnection_businessId_channel_key" ON "ChannelConnection"("businessId", "channel");
CREATE UNIQUE INDEX IF NOT EXISTS "ChannelConnection_channel_externalAccountId_key" ON "ChannelConnection"("channel", "externalAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "ChannelWebhookEvent_channel_externalMessageId_key" ON "ChannelWebhookEvent"("channel", "externalMessageId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ChannelConnection_businessId_fkey'
  ) THEN
    ALTER TABLE "ChannelConnection" ADD CONSTRAINT "ChannelConnection_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ChannelWebhookEvent_businessId_fkey'
  ) THEN
    ALTER TABLE "ChannelWebhookEvent" ADD CONSTRAINT "ChannelWebhookEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ChannelSendAttempt_businessId_fkey'
  ) THEN
    ALTER TABLE "ChannelSendAttempt" ADD CONSTRAINT "ChannelSendAttempt_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
