import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getDemoBusinessByHandle } from "@/lib/db/powerfit";

export const SESSION_COOKIE = "instareply_session";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const globalForAuth = globalThis as unknown as {
  authStartupLogged?: boolean;
};

if (!globalForAuth.authStartupLogged) {
  console.log("Auth initialized");
  globalForAuth.authStartupLogged = true;
}

function getSessionSecret() {
  return process.env.AUTH_SECRET || "instareply-dev-secret";
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function encodeSession(userId: string) {
  const payload = Buffer.from(JSON.stringify({ userId })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(value?: string) {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { userId?: string };
  } catch {
    return null;
  }
}

export function setSessionCookie(userId: string) {
  cookies().set(SESSION_COOKIE, encodeSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/"
  });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const session = decodeSession(cookies().get(SESSION_COOKIE)?.value);

  if (!session?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { business: true }
  });

  if (!user) {
    return null;
  }

  const demoBusiness = getDemoBusinessByHandle(user.business.instagramHandle);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    businessId: user.businessId,
    businessSlug: demoBusiness.slug,
    business: {
      ...user.business,
      slug: demoBusiness.slug,
      category: user.business.businessType || demoBusiness.category
    }
  };
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireApiUser() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return user;
}
