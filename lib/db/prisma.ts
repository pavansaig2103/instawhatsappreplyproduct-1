import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaStartupLogged?: boolean;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (!globalForPrisma.prismaStartupLogged) {
  console.log("Prisma initialized");
  console.log("Database connection check available at /dashboard/health");
  globalForPrisma.prismaStartupLogged = true;
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
