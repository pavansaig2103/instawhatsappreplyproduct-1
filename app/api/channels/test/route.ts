import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { Channel } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import { testMetaConnection } from "@/lib/integrations/metaChannels";

function normalizeChannel(channel?: string) {
  return channel === Channel.WHATSAPP ? Channel.WHATSAPP : Channel.INSTAGRAM;
}

export async function POST(request: Request) {
  const user = await requireApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    channel?: string;
  };
  const channel = normalizeChannel(body.channel);
  const connection = await prisma.channelConnection.findUnique({
    where: {
      businessId_channel: {
        businessId: user.businessId,
        channel
      }
    }
  });

  if (!connection?.externalAccountId || !connection.accessToken) {
    return NextResponse.json({ error: "Save account ID and access token first." }, { status: 400 });
  }

  try {
    const response = await testMetaConnection({
      externalAccountId: connection.externalAccountId,
      accessToken: connection.accessToken
    });

    await prisma.channelConnection.update({
      where: { id: connection.id },
      data: { isConnected: true }
    });

    return NextResponse.json({ ok: true, response });
  } catch (error) {
    await prisma.channelConnection.update({
      where: { id: connection.id },
      data: { isConnected: false }
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Connection test failed." },
      { status: 502 }
    );
  }
}
