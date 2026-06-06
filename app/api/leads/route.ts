import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const user = await requireApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leads = await prisma.lead.findMany({
    where: { businessId: user.businessId },
    orderBy: [{ status: "asc" }, { lastSeenAt: "desc" }]
  });

  return NextResponse.json({ leads });
}
