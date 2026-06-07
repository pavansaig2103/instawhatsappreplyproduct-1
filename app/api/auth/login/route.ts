import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { ensureDemoBusinesses } from "@/lib/db/business";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  let body: {
    email?: string;
    password?: string;
  };

  try {
    body = (await request.json()) as {
      email?: string;
      password?: string;
    };
  } catch {
    return NextResponse.json({ error: "Invalid login request." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  let user = await prisma.user.findUnique({
    where: { email },
    include: { business: true }
  });

  if (!user) {
    await ensureDemoBusinesses();
    user = await prisma.user.findUnique({
      where: { email },
      include: { business: true }
    });
  }

  if (!user || !verifyPassword(password, user.password)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  setSessionCookie(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      businessName: user.business.name
    }
  });
}
