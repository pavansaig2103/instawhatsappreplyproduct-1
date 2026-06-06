import { prisma } from "@/lib/db/prisma";

export type AppHealth = {
  database: {
    ok: boolean;
    message: string;
  };
  groq: {
    ok: boolean;
    message: string;
  };
  auth: {
    ok: boolean;
    message: string;
  };
  counts: {
    businesses: number;
    users: number;
    leads: number;
    conversations: number;
  };
};

const ownerEmails = ["owner@powerfit.com", "owner@glowstudio.com", "owner@brightsmile.com"];

export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connected");
    return { ok: true, message: "Connected" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Database connection failed"
    };
  }
}

export async function checkCoreTables() {
  const tableNames = ["Business", "User", "FAQ", "Lead", "Conversation", "Message", "Notification"];

  try {
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('Business', 'User', 'FAQ', 'Lead', 'Conversation', 'Message', 'Notification')
    `;
    const existingTables = new Set(tables.map((table) => table.table_name));
    const missingTables = tableNames.filter((table) => !existingTables.has(table));

    return {
      ok: missingTables.length === 0,
      missingTables
    };
  } catch {
    return {
      ok: false,
      missingTables: tableNames
    };
  }
}

export async function checkSeedUsers() {
  try {
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: ownerEmails
        }
      },
      select: {
        email: true
      }
    });
    const existingEmails = new Set(users.map((user) => user.email));
    const missingUsers = ownerEmails.filter((email) => !existingEmails.has(email));

    return {
      ok: missingUsers.length === 0,
      missingUsers
    };
  } catch {
    return {
      ok: false,
      missingUsers: ownerEmails
    };
  }
}

export async function getCoreCounts() {
  try {
    const [businesses, users, leads, conversations] = await Promise.all([
      prisma.business.count(),
      prisma.user.count(),
      prisma.lead.count(),
      prisma.conversation.count()
    ]);

    return {
      businesses,
      users,
      leads,
      conversations
    };
  } catch {
    return {
      businesses: 0,
      users: 0,
      leads: 0,
      conversations: 0
    };
  }
}

export async function checkGroqConnection() {
  if (!process.env.GROQ_API_KEY) {
    return {
      ok: false,
      message: "GROQ_API_KEY is missing"
    };
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `Groq returned ${response.status}`
      };
    }

    return {
      ok: true,
      message: "Connected"
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Groq connection failed"
    };
  }
}

export function checkAuthReadiness() {
  if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
    return {
      ok: false,
      message: "AUTH_SECRET is required in production"
    };
  }

  return {
    ok: true,
    message: process.env.AUTH_SECRET ? "Configured" : "Using development fallback"
  };
}

export async function getAppHealth(): Promise<AppHealth> {
  const [database, groq, counts] = await Promise.all([
    checkDatabaseConnection(),
    checkGroqConnection(),
    getCoreCounts()
  ]);

  return {
    database,
    groq,
    auth: checkAuthReadiness(),
    counts
  };
}
