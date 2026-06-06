import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function splitSql(sql: string) {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function main() {
  const sql = await readFile(join(process.cwd(), "prisma", "migrations", "0001_init", "migration.sql"), "utf8");

  for (const statement of splitSql(sql)) {
    await prisma.$executeRawUnsafe(statement);
  }

  await ensureColumn("Business", "businessType", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("Business", "location", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("Business", "timings", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("Business", "services", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("Business", "pricingNotes", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("Business", "staffNotificationPhone", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("Business", "staffNotificationEmail", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("Business", "aiTone", "TEXT NOT NULL DEFAULT 'Friendly and concise'");
  await ensureColumn("User", "password", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn("Lead", "phone", "TEXT");
  await ensureColumn("Lead", "serviceInterest", "TEXT");
  await ensureColumn("Conversation", "channel", "TEXT NOT NULL DEFAULT 'INSTAGRAM'");
  await ensureColumn("Conversation", "leadState", "TEXT NOT NULL DEFAULT 'AWAITING_NAME'");
  await ensureColumn("Conversation", "noMatchCount", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn("Message", "channel", "TEXT NOT NULL DEFAULT 'INSTAGRAM'");
  await ensureNotificationTable();

  console.log("SQLite schema is ready.");
}

async function ensureColumn(table: string, column: string, definition: string) {
  const rows = await prisma.$queryRawUnsafe<Array<{ name: string }>>(`PRAGMA table_info("${table}")`);
  const exists = rows.some((row) => row.name === column);

  if (!exists) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`);
  }
}

async function ensureNotificationTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Notification" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "businessId" TEXT NOT NULL,
      "leadId" TEXT NOT NULL,
      "channel" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Notification_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Notification_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Notification_leadId_title_key" ON "Notification"("leadId", "title")`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
