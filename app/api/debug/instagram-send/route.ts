import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { sendInstagramMessage } from "@/lib/integrations/instagram";
import { logInstagramEvent } from "@/lib/integrations/instagramDiagnostics";

export async function POST(request: Request) {
  const user = await requireApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    recipientId?: string;
    text?: string;
  };
  const recipientId = body.recipientId?.trim();
  const text = body.text?.trim() || "Test message from AeroCore InstaReply AI";

  if (!recipientId) {
    return NextResponse.json({ error: "Recipient ID is required." }, { status: 400 });
  }

  const business = await prisma.business.findUniqueOrThrow({
    where: { id: user.businessId }
  });

  if (!business.instagramAccessToken) {
    const error = "Instagram access token is missing.";
    await logInstagramEvent({
      businessId: business.id,
      eventType: "OUTBOUND_SEND_ATTEMPT",
      payload: {
        recipientId,
        text,
        source: "manual-debug"
      },
      status: "FAILED",
      error
    });

    return NextResponse.json({ error }, { status: 400 });
  }

  try {
    await sendInstagramMessage({
      recipientId,
      text,
      accessToken: business.instagramAccessToken
    });

    await logInstagramEvent({
      businessId: business.id,
      eventType: "OUTBOUND_SEND_ATTEMPT",
      payload: {
        recipientId,
        text,
        source: "manual-debug"
      },
      status: "SENT"
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Instagram send failed";

    await logInstagramEvent({
      businessId: business.id,
      eventType: "OUTBOUND_SEND_ATTEMPT",
      payload: {
        recipientId,
        text,
        source: "manual-debug"
      },
      status: "FAILED",
      error: message
    });

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
