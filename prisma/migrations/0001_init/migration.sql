CREATE TABLE "Business" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "instagramHandle" TEXT NOT NULL,
  "businessType" TEXT NOT NULL DEFAULT '',
  "location" TEXT NOT NULL DEFAULT '',
  "timings" TEXT NOT NULL DEFAULT '',
  "services" TEXT NOT NULL DEFAULT '',
  "pricingNotes" TEXT NOT NULL DEFAULT '',
  "staffNotificationPhone" TEXT NOT NULL DEFAULT '',
  "staffNotificationEmail" TEXT NOT NULL DEFAULT '',
  "aiTone" TEXT NOT NULL DEFAULT 'Friendly and concise',
  "instagramPageId" TEXT NOT NULL DEFAULT '',
  "instagramAccessToken" TEXT NOT NULL DEFAULT '',
  "instagramConnected" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL DEFAULT '',
  "role" TEXT NOT NULL DEFAULT 'OWNER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FAQ" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Conversation" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "leadId" TEXT,
  "contactName" TEXT NOT NULL,
  "instagramHandle" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'INSTAGRAM',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "leadState" TEXT NOT NULL DEFAULT 'AWAITING_NAME',
  "noMatchCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Message" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'INSTAGRAM',
  "replyType" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Lead" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "serviceInterest" TEXT,
  "instagramHandle" TEXT NOT NULL,
  "intent" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "valueCents" INTEGER NOT NULL DEFAULT 0,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Business_instagramHandle_key" ON "Business"("instagramHandle");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Lead_businessId_instagramHandle_key" ON "Lead"("businessId", "instagramHandle");
CREATE UNIQUE INDEX "Notification_leadId_title_key" ON "Notification"("leadId", "title");

ALTER TABLE "User" ADD CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FAQ" ADD CONSTRAINT "FAQ_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
