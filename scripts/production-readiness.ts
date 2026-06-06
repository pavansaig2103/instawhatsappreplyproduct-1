import { prisma } from "../lib/db/prisma";
import { checkCoreTables, checkDatabaseConnection, checkGroqConnection, checkSeedUsers } from "../lib/system/health";

type Check = {
  label: string;
  ok: boolean;
  detail: string;
};

function hasPostgresUrl(value?: string) {
  return Boolean(value?.startsWith("postgresql://") || value?.startsWith("postgres://"));
}

async function main() {
  const checks: Check[] = [
    {
      label: "DATABASE_URL",
      ok: hasPostgresUrl(process.env.DATABASE_URL),
      detail: hasPostgresUrl(process.env.DATABASE_URL) ? "PostgreSQL URL configured" : "Missing or not PostgreSQL"
    },
    {
      label: "DIRECT_URL",
      ok: hasPostgresUrl(process.env.DIRECT_URL),
      detail: hasPostgresUrl(process.env.DIRECT_URL) ? "Direct PostgreSQL URL configured" : "Missing or not PostgreSQL"
    },
    {
      label: "GROQ_API_KEY",
      ok: Boolean(process.env.GROQ_API_KEY),
      detail: process.env.GROQ_API_KEY ? "Configured" : "Missing"
    },
    {
      label: "AUTH_SECRET",
      ok: Boolean(process.env.AUTH_SECRET),
      detail: process.env.AUTH_SECRET ? "Configured" : "Missing; required for production"
    }
  ];

  const database = await checkDatabaseConnection();
  checks.push({
    label: "Database connection",
    ok: database.ok,
    detail: database.message
  });

  const tables = await checkCoreTables();
  checks.push({
    label: "Core tables",
    ok: tables.ok,
    detail: tables.ok ? "All core tables found" : `Missing: ${tables.missingTables.join(", ")}`
  });

  const seedUsers = await checkSeedUsers();
  checks.push({
    label: "Seeded owners",
    ok: seedUsers.ok,
    detail: seedUsers.ok ? "All demo owners found" : `Missing: ${seedUsers.missingUsers.join(", ")}`
  });

  const groq = await checkGroqConnection();
  checks.push({
    label: "Groq connection",
    ok: groq.ok,
    detail: groq.message
  });

  for (const check of checks) {
    console.log(`${check.ok ? "OK" : "FAIL"} ${check.label}: ${check.detail}`);
  }

  if (checks.some((check) => !check.ok)) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
