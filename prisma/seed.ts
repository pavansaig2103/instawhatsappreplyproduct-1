import { ensureDemoBusinesses } from "../lib/db/business";
import { prisma } from "../lib/db/prisma";

async function main() {
  await ensureDemoBusinesses();
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
