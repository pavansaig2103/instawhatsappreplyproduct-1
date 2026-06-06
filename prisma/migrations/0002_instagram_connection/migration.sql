ALTER TABLE "Business"
ADD COLUMN "instagramPageId" TEXT NOT NULL DEFAULT '',
ADD COLUMN "instagramAccessToken" TEXT NOT NULL DEFAULT '',
ADD COLUMN "instagramConnected" BOOLEAN NOT NULL DEFAULT false;
