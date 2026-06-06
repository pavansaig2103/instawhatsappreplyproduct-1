import { Channel } from "@/lib/db/enums";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const PRIMARY_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama-3.1-8b-instant";
const isDevelopment = process.env.NODE_ENV === "development";
const globalForGroq = globalThis as unknown as {
  groqStartupLogged?: boolean;
};

if (!globalForGroq.groqStartupLogged) {
  console.log("Groq initialized");
  globalForGroq.groqStartupLogged = true;
}

type BusinessForGroq = {
  name: string;
  businessType: string;
  location: string;
  timings: string;
  services: string;
  pricingNotes: string;
  aiTone: string;
};

type ConversationHistoryMessage = {
  direction: string;
  content: string;
};

type GroqReplyInput = {
  business: BusinessForGroq;
  message: string;
  conversationHistory: ConversationHistoryMessage[];
  channel?: string;
};

export type GroqReply = {
  answer: string;
  confidence: number;
  usedMockAI: boolean;
  error: string | null;
};

function isRetryableGroqError(reply: GroqReply | null) {
  return !reply || reply.error?.startsWith("Groq ") || reply.error === "Groq did not return a usable response";
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function clampConfidence(value: unknown, fallback = 0.75) {
  const confidence = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(0, Math.min(1, confidence));
}

function parseGroqReply(text: string): GroqReply {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Partial<GroqReply>;

    const reply = {
      answer: typeof parsed.answer === "string" && parsed.answer.trim() ? parsed.answer.trim() : cleaned,
      confidence: clampConfidence(parsed.confidence),
      usedMockAI: false,
      error: null
    };
    if (isDevelopment) {
      console.log("[AI fallback] Parsed answer and confidence", {
        answer: reply.answer,
        confidence: reply.confidence
      });
    }

    return reply;
  } catch {
    const reply = {
      answer: cleaned || "Our team will assist you shortly.",
      confidence: 0.75,
      usedMockAI: false,
      error: "Invalid JSON returned by Groq"
    };
    if (isDevelopment) {
      console.log("[AI fallback] Parsed answer and confidence", {
        answer: reply.answer,
        confidence: reply.confidence
      });
    }

    return reply;
  }
}

function businessKind(business: BusinessForGroq) {
  const text = normalizeText(`${business.name} ${business.businessType} ${business.services}`);

  if (text.includes("salon") || text.includes("beauty") || text.includes("bridal") || text.includes("facial")) {
    return "salon";
  }

  if (text.includes("clinic") || text.includes("dental") || text.includes("dentist") || text.includes("braces")) {
    return "clinic";
  }

  return "gym";
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export function mockAIReply({ business, message }: GroqReplyInput): GroqReply {
  if (isDevelopment) {
    console.log("Using mock AI fallback because GROQ_API_KEY is missing");
  }

  const normalized = normalizeText(message);
  const kind = businessKind(business);
  const location = business.location || "our location";
  const timings = business.timings || "our listed business hours";
  const pricing = business.pricingNotes || "pricing details are available with our team";

  if (includesAny(normalized, ["timing", "timings", "hours", "open", "close"])) {
    return { answer: `${business.name} is open ${timings}.`, confidence: 0.9, usedMockAI: true, error: null };
  }

  if (includesAny(normalized, ["location", "address", "where", "near"])) {
    return { answer: `${business.name} is located ${location}.`, confidence: 0.9, usedMockAI: true, error: null };
  }

  if (includesAny(normalized, ["price", "pricing", "fee", "cost", "package", "packages", "plan", "membership"])) {
    return { answer: pricing, confidence: 0.86, usedMockAI: true, error: null };
  }

  if (kind === "gym") {
    if (includesAny(normalized, ["weight", "loss", "fitness", "workout", "strength", "cardio"])) {
      return { answer: "Yes, we can help with fitness goals like weight loss, strength, and general conditioning.", confidence: 0.84, usedMockAI: true, error: null };
    }

    if (includesAny(normalized, ["trainer", "training", "coach", "personal"])) {
      return { answer: "Personal trainers are available. We can guide you based on your fitness goal.", confidence: 0.88, usedMockAI: true, error: null };
    }

    if (includesAny(normalized, ["trial", "demo"])) {
      return { answer: "Yes, a one-day free trial is available.", confidence: 0.88, usedMockAI: true, error: null };
    }
  }

  if (kind === "salon") {
    if (includesAny(normalized, ["haircut", "hair", "styling"])) {
      return { answer: "Haircuts and styling services are available. You can book a slot through DM.", confidence: 0.86, usedMockAI: true, error: null };
    }

    if (includesAny(normalized, ["facial", "skincare", "skin", "glow"])) {
      return { answer: "Facials and skincare services are available, including glow-focused treatments.", confidence: 0.86, usedMockAI: true, error: null };
    }

    if (includesAny(normalized, ["bridal", "makeup", "wedding"])) {
      return { answer: "Bridal makeup packages are available. Share your date and our team can help.", confidence: 0.88, usedMockAI: true, error: null };
    }
  }

  if (kind === "clinic") {
    if (includesAny(normalized, ["appointment", "book", "slot"])) {
      return { answer: "Appointments can be booked through DM. Share your name and phone number to continue.", confidence: 0.86, usedMockAI: true, error: null };
    }

    if (includesAny(normalized, ["consultation", "fee", "doctor"])) {
      return { answer: pricing, confidence: 0.86, usedMockAI: true, error: null };
    }

    if (includesAny(normalized, ["cleaning", "braces", "root", "canal", "dental", "tooth", "teeth"])) {
      return { answer: "Dental cleaning, braces consultation, and root canal consultation are available.", confidence: 0.88, usedMockAI: true, error: null };
    }
  }

  return {
    answer: "I can help with services, pricing, timings, location, appointments, and booking details.",
    confidence: 0.55,
    usedMockAI: true,
    error: null
  };
}

function getSystemPrompt(business: BusinessForGroq, channel?: string) {
  const selectedChannel = channel?.toUpperCase() === Channel.WHATSAPP ? "WhatsApp" : "Instagram";

  return [
    `You are the virtual assistant for ${business.name}.`,
    `Business type: ${business.businessType || "Local business"}.`,
    `Location: ${business.location || "Not specified"}.`,
    `Timings: ${business.timings || "Not specified"}.`,
    `Services: ${business.services || "Not specified"}.`,
    `Pricing notes: ${business.pricingNotes || "Not specified"}.`,
    `AI tone: ${business.aiTone || "Friendly and concise"}.`,
    `Selected channel: ${selectedChannel}.`,
    "Answer only questions related to this business, its services, pricing, timings, location, bookings, trials, appointments, and lead capture.",
    "Be short, helpful, and conversational.",
    'Return JSON only in this exact shape: {"answer":"short helpful reply","confidence":0.0}.',
    "Use confidence below 0.6 if the customer asks something unrelated or you are unsure."
  ].join(" ");
}

function toGroqMessages({ business, message, conversationHistory, channel }: GroqReplyInput) {
  const history = conversationHistory.slice(-8).map((item) => ({
    role: item.direction === "OUTBOUND" ? "assistant" : "user",
    content: item.content
  }));

  return [
    { role: "system", content: getSystemPrompt(business, channel) },
    ...history,
    {
      role: "user",
      content: `Customer message: ${message}\n\nReturn JSON only.`
    }
  ];
}

async function requestGroq(input: GroqReplyInput, model: string) {
  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 250,
      response_format: { type: "json_object" },
      messages: toGroqMessages(input)
    })
  });
  const rawResponse = await response.text();

  if (isDevelopment) {
    console.log("[AI fallback] Groq response status", {
      model,
      status: response.status,
      ok: response.ok
    });
    console.log("[AI fallback] Groq raw response", rawResponse);
  }

  if (!response.ok) {
    return {
      answer: "Our team will assist you shortly.",
      confidence: 0,
      usedMockAI: false,
      error: `Groq ${model} request failed with status ${response.status}`
    };
  }

  const data = JSON.parse(rawResponse) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  return parseGroqReply(data.choices?.[0]?.message?.content ?? "");
}

export async function getGroqReply(input: GroqReplyInput): Promise<GroqReply> {
  if (isDevelopment) {
    console.log("[AI fallback] GROQ_API_KEY exists", Boolean(process.env.GROQ_API_KEY));
  }

  if (!process.env.GROQ_API_KEY) {
    return mockAIReply(input);
  }

  try {
    const primaryReply = await requestGroq(input, PRIMARY_MODEL);

    if (primaryReply && !isRetryableGroqError(primaryReply)) {
      return primaryReply;
    }

    const fallbackReply = await requestGroq(input, FALLBACK_MODEL);

    if (fallbackReply && !isRetryableGroqError(fallbackReply)) {
      return fallbackReply;
    }

    return fallbackReply ?? primaryReply ?? {
      answer: "Our team will assist you shortly.",
      confidence: 0,
      usedMockAI: false,
      error: "Groq did not return a usable response"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Groq error";
    if (isDevelopment) {
      console.log("[AI fallback] Groq error", message);
    }

    return {
      answer: "Our team will assist you shortly.",
      confidence: 0,
      usedMockAI: false,
      error: message
    };
  }

  return {
    answer: "Our team will assist you shortly.",
    confidence: 0,
    usedMockAI: false,
    error: "Groq did not return a usable response"
  };
}
