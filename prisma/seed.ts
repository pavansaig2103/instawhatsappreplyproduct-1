import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { DEMO_BUSINESSES } from "../lib/db/powerfit";

const prisma = new PrismaClient();

function ownerEmail(slug: string) {
  if (slug === "powerfit") {
    return "owner@powerfit.com";
  }

  if (slug === "glowstudio") {
    return "owner@glowstudio.com";
  }

  return "owner@brightsmile.com";
}

async function main() {
  await prisma.business.deleteMany();

  for (const business of DEMO_BUSINESSES) {
    await prisma.business.create({
      data: {
        name: business.name,
        instagramHandle: business.handle,
        businessType: business.category,
        location: business.settings.location,
        timings: business.settings.timings,
        services: business.settings.services,
        pricingNotes: business.settings.pricingNotes,
        staffNotificationPhone: business.settings.staffNotificationPhone,
        staffNotificationEmail: business.settings.staffNotificationEmail,
        aiTone: business.settings.aiTone,
        users: {
          create: {
            name: "Workspace Owner",
            email: ownerEmail(business.slug),
            password: hashPassword("password123"),
            role: "OWNER"
          }
        },
        faqs: {
          create: business.faqs.map((faq) => ({
            ...faq,
            usageCount: 0
          }))
        }
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
