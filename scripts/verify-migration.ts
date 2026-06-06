import { prisma } from "../lib/db/prisma";
import { checkCoreTables, checkDatabaseConnection, checkSeedUsers } from "../lib/system/health";

async function main() {
  console.log("Verifying Supabase PostgreSQL migration...");

  const database = await checkDatabaseConnection();
  console.log(`Database connection: ${database.ok ? "OK" : "FAILED"}`);

  if (!database.ok) {
    console.error(database.message);
    process.exitCode = 1;
    return;
  }

  const tables = await checkCoreTables();
  console.log(`Table existence: ${tables.ok ? "OK" : "FAILED"}`);

  if (!tables.ok) {
    console.error(`Missing tables: ${tables.missingTables.join(", ")}`);
    process.exitCode = 1;
  }

  const seedUsers = await checkSeedUsers();
  console.log(`Seed users: ${seedUsers.ok ? "OK" : "FAILED"}`);

  if (!seedUsers.ok) {
    console.error(`Missing users: ${seedUsers.missingUsers.join(", ")}`);
    process.exitCode = 1;
  }

  const counts = await Promise.all([
    prisma.business.count(),
    prisma.user.count(),
    prisma.lead.count(),
    prisma.conversation.count()
  ]);

  console.log(
    JSON.stringify(
      {
        businesses: counts[0],
        users: counts[1],
        leads: counts[2],
        conversations: counts[3]
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
