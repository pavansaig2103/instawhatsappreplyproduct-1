export const DEFAULT_BUSINESS_SLUG = "powerfit";

export const DEMO_BUSINESSES = [
  {
    slug: "powerfit",
    name: "PowerFit Gym",
    handle: "@powerfitgym",
    category: "Gym",
    settings: {
      location: "Near main road, Proddatur",
      timings: "Open 5 AM to 10 PM",
      services: "Memberships, personal training, fitness goals, trial workouts",
      pricingNotes: "Plans start from \u20b9999/month",
      staffNotificationPhone: "",
      staffNotificationEmail: "",
      aiTone: "Friendly, energetic, and concise"
    },
    faqs: [
      {
        question: "What is the gym pricing?",
        answer: "Plans start from \u20b9999/month"
      },
      {
        question: "What are the gym timings?",
        answer: "Open 5 AM to 10 PM"
      },
      {
        question: "Do you offer a trial?",
        answer: "One-day free trial available"
      },
      {
        question: "Do you have personal trainers?",
        answer: "Personal trainers available"
      },
      {
        question: "Where is PowerFit Gym located?",
        answer: "Near main road, Proddatur"
      }
    ]
  },
  {
    slug: "glowstudio",
    name: "Glow Studio Salon",
    handle: "@glowstudiosalon",
    category: "Salon",
    settings: {
      location: "Near Gandhi Road, Proddatur",
      timings: "Open 10 AM to 8 PM",
      services: "Haircuts, bridal makeup, facials, salon appointments",
      pricingNotes: "Haircuts start from \u20b9299. Facials start from \u20b9799. Bridal packages are available",
      staffNotificationPhone: "",
      staffNotificationEmail: "",
      aiTone: "Warm, polished, and concise"
    },
    faqs: [
      {
        question: "What are your salon prices?",
        answer: "Haircuts start from \u20b9299 and bridal packages are available"
      },
      {
        question: "What are the salon timings?",
        answer: "Open 10 AM to 8 PM"
      },
      {
        question: "Do you take bridal bookings?",
        answer: "Bridal makeup packages are available"
      },
      {
        question: "Do you offer facials?",
        answer: "Facials start from \u20b9799"
      },
      {
        question: "Where is Glow Studio Salon located?",
        answer: "Near Gandhi Road, Proddatur"
      }
    ]
  },
  {
    slug: "brightsmile",
    name: "BrightSmile Clinic",
    handle: "@brightsmileclinic",
    category: "Clinic",
    settings: {
      location: "Near RTC Bus Stand, Proddatur",
      timings: "Open 9 AM to 7 PM",
      services: "Dental cleaning, braces consultation, root canal consultation, appointments",
      pricingNotes: "Consultation starts from \u20b9300",
      staffNotificationPhone: "",
      staffNotificationEmail: "",
      aiTone: "Professional, reassuring, and concise"
    },
    faqs: [
      {
        question: "What is the consultation fee?",
        answer: "Consultation starts from \u20b9300"
      },
      {
        question: "What are the clinic timings?",
        answer: "Open 9 AM to 7 PM"
      },
      {
        question: "Can I book an appointment?",
        answer: "Appointments can be booked through DM"
      },
      {
        question: "What dental services are available?",
        answer: "Dental cleaning, braces consultation, and root canal consultation available"
      },
      {
        question: "Where is BrightSmile Clinic located?",
        answer: "Near RTC Bus Stand, Proddatur"
      }
    ]
  }
] as const;

export type DemoBusinessSlug = (typeof DEMO_BUSINESSES)[number]["slug"];

export function getDemoBusiness(slug?: string) {
  const normalizedSlug = slug === "glow" ? "glowstudio" : slug;

  return DEMO_BUSINESSES.find((business) => business.slug === normalizedSlug) ?? DEMO_BUSINESSES[0];
}

export function getDemoBusinessByHandle(handle: string) {
  return DEMO_BUSINESSES.find((business) => business.handle === handle) ?? DEMO_BUSINESSES[0];
}
