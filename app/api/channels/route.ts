import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { Channel } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";

function normalizeChannel(channel?: string) {
  return channel === Channel.WHATSAPP ? Channel.WHATSAPP : Channel.INSTAGRAM;
}

function serializeConnection(connection?: {
  channel: string;
  externalAccountId: string;
  externalBusinessAccountId: string;
  accessToken: string;
  isConnected: boolean;
} | null) {
  return {
    externalAccountId: connection?.externalAccountId ?? "",
    externalBusinessAccountId: connection?.externalBusinessAccountId ?? "",
    tokenExists: Boolean(connection?.accessToken),
    isConnected: Boolean(connection?.isConnected)
  };
}

export async function GET() {
  const user = await requireApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await prisma.channelConnection.findMany({
    where: { businessId: user.businessId }
  });

  return NextResponse.json({
    connections: {
      INSTAGRAM: serializeConnection(connections.find((connection) => connection.channel === Channel.INSTAGRAM)),
      WHATSAPP: serializeConnection(connections.find((connection) => connection.channel === Channel.WHATSAPP))
    }
  });
}

export async function PATCH(request: Request) {
  const user = await requireApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    channel?: string;
    externalAccountId?: string;
    externalBusinessAccountId?: string;
    accessToken?: string;
  };
  const channel = normalizeChannel(body.channel);
  const externalAccountId = body.externalAccountId?.trim() ?? "";
  const externalBusinessAccountId = body.externalBusinessAccountId?.trim() ?? "";
  const accessToken = body.accessToken?.trim();

  if (!externalAccountId) {
    return NextResponse.json({ error: "Account ID is required." }, { status: 400 });
  }

  const existing = await prisma.channelConnection.findUnique({
    where: {
      businessId_channel: {
        businessId: user.businessId,
        channel
      }
    }
  });
  const tokenToSave = accessToken || existing?.accessToken || "";

  const connection = await prisma.channelConnection.upsert({
    where: {
      businessId_channel: {
        businessId: user.businessId,
        channel
      }
    },
    update: {
      externalAccountId,
      externalBusinessAccountId,
      accessToken: tokenToSave,
      isConnected: Boolean(externalAccountId && tokenToSave)
    },
    create: {
      businessId: user.businessId,
      channel,
      externalAccountId,
      externalBusinessAccountId,
      accessToken: tokenToSave,
      isConnected: Boolean(externalAccountId && tokenToSave)
    }
  });

  return NextResponse.json({
    connection: serializeConnection(connection)
  });
}
