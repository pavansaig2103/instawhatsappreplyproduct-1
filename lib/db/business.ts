import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { DEMO_BUSINESSES, getDemoBusiness } from "@/lib/db/powerfit";

const STALE_DEMO_FAQ_QUESTIONS = [
  "Do I need an appointment?",
  "Do you offer teeth cleaning?",
  "Do you handle dental emergencies?"
];

async function syncDemoFaqs(businessId: string, faqs: Array<{ question: string; answer: string }>) {
  await prisma.fAQ.deleteMany({
    where: {
      businessId,
      question: {
        in: STALE_DEMO_FAQ_QUESTIONS
      }
    }
  });

  for (const faq of faqs) {
    const existing = await prisma.fAQ.findFirst({
      where: {
        businessId,
        question: faq.question
      }
    });

    if (existing) {
      await prisma.fAQ.update({
        where: { id: existing.id },
        data: {
          answer: faq.answer,
          isActive: true
        }
      });
    } else {
      await prisma.fAQ.create({
        data: {
          ...faq,
          businessId
        }
      });
    }
  }
}

function demoSettings(demoBusiness: (typeof DEMO_BUSINESSES)[number]) {
  return {
    businessType: demoBusiness.category,
    location: demoBusiness.settings.location,
    timings: demoBusiness.settings.timings,
    services: demoBusiness.settings.services,
    pricingNotes: demoBusiness.settings.pricingNotes,
    staffNotificationPhone: demoBusiness.settings.staffNotificationPhone,
    staffNotificationEmail: demoBusiness.settings.staffNotificationEmail,
    aiTone: demoBusiness.settings.aiTone
  };
}

function demoOwnerEmail(demoBusiness: (typeof DEMO_BUSINESSES)[number]) {
  if (demoBusiness.slug === "powerfit") {
    return "owner@powerfit.com";
  }

  if (demoBusiness.slug === "glowstudio") {
    return "owner@glowstudio.com";
  }

  return "owner@brightsmile.com";
}

async function syncMissingDemoSettings(businessId: string, demoBusiness: (typeof DEMO_BUSINESSES)[number]) {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId }
  });
  const defaults = demoSettings(demoBusiness);

  await prisma.business.update({
    where: { id: businessId },
    data: {
      businessType: business.businessType || defaults.businessType,
      location: business.location || defaults.location,
      timings: business.timings || defaults.timings,
      services: business.services || defaults.services,
      pricingNotes: business.pricingNotes || defaults.pricingNotes,
      staffNotificationPhone: business.staffNotificationPhone || defaults.staffNotificationPhone,
      staffNotificationEmail: business.staffNotificationEmail || defaults.staffNotificationEmail,
      aiTone: business.aiTone || defaults.aiTone
    }
  });
}

export async function ensureDemoBusinesses() {
  for (const demoBusiness of DEMO_BUSINESSES) {
    const business = await prisma.business.upsert({
      where: { instagramHandle: demoBusiness.handle },
      update: {},
      create: {
        name: demoBusiness.name,
        instagramHandle: demoBusiness.handle,
        ...demoSettings(demoBusiness),
        users: {
          create: {
            name: "Workspace Owner",
            email: demoOwnerEmail(demoBusiness),
            password: hashPassword("password123"),
            role: "OWNER"
          }
        }
      }
    });

    await syncMissingDemoSettings(business.id, demoBusiness);
    await prisma.user.upsert({
      where: { email: demoOwnerEmail(demoBusiness) },
      update: {
        businessId: business.id,
        password: hashPassword("password123"),
        role: "OWNER"
      },
      create: {
        businessId: business.id,
        name: "Workspace Owner",
        email: demoOwnerEmail(demoBusiness),
        password: hashPassword("password123"),
        role: "OWNER"
      }
    });
    await syncDemoFaqs(business.id, [...demoBusiness.faqs]);
  }
}

export async function getSelectedBusiness(slug?: string) {
  const demoBusiness = getDemoBusiness(slug);
  const existingBusiness = await prisma.business.findUnique({
    where: { instagramHandle: demoBusiness.handle }
  });
  const business = existingBusiness ?? (await createMissingDemoBusiness(demoBusiness));

  return {
    ...business,
    slug: demoBusiness.slug,
    category: business.businessType || demoBusiness.category
  };
}

export async function getOrCreateWorkspace() {
  return getSelectedBusiness();
}

async function createMissingDemoBusiness(demoBusiness: (typeof DEMO_BUSINESSES)[number]) {
  await ensureDemoBusinesses();

  return prisma.business.findUniqueOrThrow({
    where: { instagramHandle: demoBusiness.handle }
  });
}
