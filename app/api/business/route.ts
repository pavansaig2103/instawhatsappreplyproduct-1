import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

type BusinessSettingsPayload = {
  id: string;
  slug: string;
  name: string;
  businessType: string;
  location: string;
  timings: string;
  services: string;
  pricingNotes: string;
  staffNotificationPhone: string;
  staffNotificationEmail: string;
  aiTone: string;
  instagramPageId: string;
  instagramAccessToken: string;
  instagramConnected: boolean;
};

function serializeBusiness(business: BusinessSettingsPayload) {
  return {
    id: business.id,
    slug: business.slug,
    name: business.name,
    businessType: business.businessType,
    location: business.location,
    timings: business.timings,
    services: business.services,
    pricingNotes: business.pricingNotes,
    staffNotificationPhone: business.staffNotificationPhone,
    staffNotificationEmail: business.staffNotificationEmail,
    aiTone: business.aiTone,
    instagramPageId: business.instagramPageId,
    instagramAccessToken: business.instagramAccessToken,
    instagramConnected: business.instagramConnected
  };
}

export async function GET(request: Request) {
  const user = await requireApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ business: serializeBusiness(user.business) });
}

export async function PATCH(request: Request) {
  const user = await requireApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    businessType?: string;
    location?: string;
    timings?: string;
    services?: string;
    pricingNotes?: string;
    staffNotificationPhone?: string;
    staffNotificationEmail?: string;
    aiTone?: string;
    instagramPageId?: string;
    instagramAccessToken?: string;
  };

  if (!body.name?.trim() || !body.businessType?.trim()) {
    return NextResponse.json({ error: "Business name and type are required." }, { status: 400 });
  }

  const updatedBusiness = await prisma.business.update({
    where: { id: user.businessId },
    data: {
      name: body.name.trim(),
      businessType: body.businessType.trim(),
      location: body.location?.trim() ?? "",
      timings: body.timings?.trim() ?? "",
      services: body.services?.trim() ?? "",
      pricingNotes: body.pricingNotes?.trim() ?? "",
      staffNotificationPhone: body.staffNotificationPhone?.trim() ?? "",
      staffNotificationEmail: body.staffNotificationEmail?.trim() ?? "",
      aiTone: body.aiTone?.trim() || "Friendly and concise",
      instagramPageId: body.instagramPageId?.trim() ?? "",
      instagramAccessToken: body.instagramAccessToken?.trim() ?? "",
      instagramConnected: Boolean(body.instagramPageId?.trim() && body.instagramAccessToken?.trim())
    }
  });

  return NextResponse.json({
    business: serializeBusiness({
      ...updatedBusiness,
      slug: user.businessSlug
    })
  });
}
