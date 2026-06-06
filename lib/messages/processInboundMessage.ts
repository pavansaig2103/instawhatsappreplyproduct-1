import { getGroqReply } from "@/lib/ai/groq";
import {
  Channel,
  ConversationStatus,
  Direction,
  LeadCaptureState,
  LeadStatus,
  ReplyType,
  type Channel as ChannelType,
  type ConversationStatus as ConversationStatusType,
  type LeadCaptureState as LeadCaptureStateType,
  type ReplyType as ReplyTypeType
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import { dispatchHotLeadNotification } from "@/lib/notifications/dispatch";
import { matchFaq } from "@/lib/rules/matcher";

const ASK_NAME_REPLY = "May I know your name?";
const ASK_PHONE_REPLY = "Could you share your phone number?";
const ASK_SERVICE_REPLY = "Which service are you interested in?";
const COMPLETE_REPLY = "Thanks! Our team will contact you shortly.";
const HUMAN_ASSIST_REPLY = "Our team will assist you shortly.";
const isDevelopment = process.env.NODE_ENV === "development";

type ProcessInboundMessageInput = {
  businessId: string;
  channel: ChannelType;
  externalUserId: string;
  messageText: string;
  externalMessageId?: string;
  conversationId?: string;
  contactName?: string;
};

type SerializedMessage = {
  id: string;
  from: "user" | "bot";
  text: string;
  replyType: string;
  confidence: number | null;
  timestamp: string;
};

export type ProcessInboundMessageResult = {
  conversationId: string;
  replyText: string;
  replyType: ReplyTypeType;
  confidence: number | null;
  leadState: LeadCaptureStateType;
  messages: SerializedMessage[];
  latest: SerializedMessage[];
};

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isGreeting(text: string) {
  return ["hi", "hello", "hey"].includes(normalizeText(text));
}

function getGreetingReply(businessName: string) {
  return `Hey! Welcome to ${businessName} 👋 How can I help you today?`;
}

function isLeadCaptureTrigger(text: string) {
  const normalized = normalizeText(text);
  const triggerPhrases = ["sign up", "contact me", "call me"];
  const triggerWords = ["interested", "join", "trial", "book", "appointment", "contact", "call", "signup", "membership", "trainer"];

  return (
    triggerPhrases.some((phrase) => normalized.includes(phrase)) ||
    triggerWords.some((word) => normalized.split(" ").includes(word))
  );
}

function looksLikeQuestion(text: string) {
  const normalized = normalizeText(text);
  const words = normalized.split(" ");

  return (
    text.includes("?") ||
    [
      "what",
      "when",
      "where",
      "how",
      "do",
      "does",
      "can",
      "is",
      "are",
      "price",
      "pricing",
      "cost",
      "fee",
      "timing",
      "timings",
      "hours",
      "location",
      "address"
    ].some((word) => words.includes(word))
  );
}

function isValidName(text: string) {
  const trimmed = text.trim();
  const normalized = normalizeText(trimmed);
  const blockedWords = ["price", "pricing", "timing", "timings", "trial", "trainer", "location", "membership", "appointment"];

  return (
    /^[a-zA-Z][a-zA-Z .'-]{1,58}$/.test(trimmed) &&
    trimmed.split(/\s+/).length >= 2 &&
    !looksLikeQuestion(trimmed) &&
    !isGreeting(trimmed) &&
    !blockedWords.some((word) => normalized.split(" ").includes(word))
  );
}

function isValidPhone(text: string) {
  const digits = text.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function isValidServiceInterest(text: string) {
  const trimmed = text.trim();
  const normalized = normalizeText(trimmed);
  const words = normalized.split(" ").filter(Boolean);
  const uniqueLetters = new Set(normalized.replace(/[^a-z]/g, "").split(""));
  const knownServiceWords = new Set([
    "training",
    "trainer",
    "personal",
    "membership",
    "gym",
    "fitness",
    "weight",
    "loss",
    "strength",
    "cardio",
    "yoga",
    "trial",
    "workout",
    "zumba",
    "pilates",
    "haircut",
    "haircuts",
    "bridal",
    "makeup",
    "facial",
    "facials",
    "salon",
    "cleaning",
    "dental",
    "braces",
    "root",
    "canal",
    "consultation",
    "appointment"
  ]);

  return (
    trimmed.length >= 3 &&
    trimmed.length <= 80 &&
    uniqueLetters.size >= 3 &&
    (words.length > 1 || words.some((word) => knownServiceWords.has(word))) &&
    !looksLikeQuestion(trimmed) &&
    !isGreeting(trimmed)
  );
}

function inferIntent(text: string) {
  const normalized = normalizeText(text);

  if (["price", "pricing", "fee", "fees", "cost", "membership", "plan"].some((word) => normalized.includes(word))) {
    return "Pricing";
  }

  if (["timing", "timings", "hours", "open", "close"].some((word) => normalized.includes(word))) {
    return "Timings";
  }

  if (["trial", "preview", "test"].some((word) => normalized.includes(word))) {
    return "Trial";
  }

  if (["trainer", "training", "coach"].some((word) => normalized.includes(word))) {
    return "Trainer";
  }

  if (["location", "address", "where"].some((word) => normalized.includes(word))) {
    return "Location";
  }

  return "General inquiry";
}

function nextState(state: string): LeadCaptureStateType {
  if (state === LeadCaptureState.AWAITING_NAME) {
    return LeadCaptureState.AWAITING_PHONE;
  }

  if (state === LeadCaptureState.AWAITING_PHONE) {
    return LeadCaptureState.AWAITING_SERVICE;
  }

  return LeadCaptureState.COMPLETE;
}

function serializeMessage(message: {
  id: string;
  direction: string;
  content: string;
  replyType: string;
  createdAt: Date;
  confidence?: number | null;
}): SerializedMessage {
  return {
    id: message.id,
    from: message.direction === Direction.OUTBOUND ? "bot" : "user",
    text: message.content,
    replyType: message.replyType,
    confidence: message.confidence ?? null,
    timestamp: message.createdAt.toISOString()
  };
}

async function getFaqReply(businessId: string, text: string) {
  const faqs = await prisma.fAQ.findMany({
    where: {
      businessId,
      isActive: true
    }
  });
  const match = matchFaq(text, faqs);

  if (!match) {
    return null;
  }

  await prisma.fAQ.update({
    where: { id: match.faq.id },
    data: { usageCount: { increment: 1 } }
  });

  return match.faq.answer;
}

function isWaitingForName(conversation: { leadState: string }, previousOutbound: { content: string } | null) {
  return conversation.leadState === LeadCaptureState.AWAITING_NAME && normalizeText(previousOutbound?.content ?? "").includes("name");
}

function resumePrompt(state: string) {
  if (state === LeadCaptureState.AWAITING_NAME) {
    return ASK_NAME_REPLY;
  }

  if (state === LeadCaptureState.AWAITING_PHONE) {
    return ASK_PHONE_REPLY;
  }

  if (state === LeadCaptureState.AWAITING_SERVICE) {
    return ASK_SERVICE_REPLY;
  }

  return null;
}

function withResume(answer: string, state: string) {
  const prompt = resumePrompt(state);
  return prompt ? `${answer}\n\n${prompt}` : answer;
}

async function getAiFallback(input: {
  business: Awaited<ReturnType<typeof prisma.business.findUniqueOrThrow>>;
  messageText: string;
  conversationId: string;
  channel: ChannelType;
}) {
  const aiConversationHistory = await prisma.message.findMany({
    where: { conversationId: input.conversationId },
    orderBy: { createdAt: "asc" },
    take: 20
  });

  if (isDevelopment) {
    console.log("[Inbound Message] Calling Groq AI fallback");
    console.log("[Inbound Message] GROQ_API_KEY exists", Boolean(process.env.GROQ_API_KEY));
  }

  const fallback = await getGroqReply({
    business: input.business,
    message: input.messageText,
    conversationHistory: aiConversationHistory,
    channel: input.channel
  });

  if (isDevelopment) {
    console.log("[Inbound Message] Parsed AI answer and confidence", {
      answer: fallback.answer,
      confidence: fallback.confidence
    });
    if (fallback.error) {
      console.log("[Inbound Message] Groq error", fallback.error);
    }
  }

  return fallback;
}

export async function processInboundMessage(input: ProcessInboundMessageInput): Promise<ProcessInboundMessageResult> {
  const inboundText = input.messageText.trim();
  const channel = input.channel === Channel.WHATSAPP ? Channel.WHATSAPP : Channel.INSTAGRAM;
  const externalUserId = input.externalUserId.trim();
  const contactName = input.contactName?.trim() || "New Lead";
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: input.businessId }
  });

  if (isDevelopment) {
    console.log("[Inbound Message] Incoming message", inboundText);
    console.log("[Inbound Message] Selected business", {
      id: business.id,
      name: business.name,
      type: business.businessType
    });
    console.log("[Inbound Message] Selected channel", channel);
  }

  const existingConversation = input.conversationId
    ? await prisma.conversation.findFirst({
        where: {
          id: input.conversationId,
          businessId: business.id
        },
        include: { lead: true }
      })
    : await prisma.conversation.findFirst({
        where: {
          businessId: business.id,
          instagramHandle: externalUserId,
          channel
        },
        include: { lead: true },
        orderBy: { updatedAt: "desc" }
      });

  const lead =
    existingConversation?.lead ??
    (await prisma.lead.upsert({
      where: {
        businessId_instagramHandle: {
          businessId: business.id,
          instagramHandle: externalUserId
        }
      },
      update: {
        lastSeenAt: new Date()
      },
      create: {
        businessId: business.id,
        name: contactName,
        instagramHandle: externalUserId,
        intent: "General inquiry",
        status: LeadStatus.NEW
      }
    }));

  const conversation =
    existingConversation ??
    (await prisma.conversation.create({
      data: {
        businessId: business.id,
        leadId: lead.id,
        contactName: lead.name,
        instagramHandle: externalUserId,
        channel,
        status: ConversationStatus.ACTIVE,
        leadState: LeadCaptureState.AWAITING_NAME
      },
      include: { lead: true }
    }));
  const previousOutbound = await prisma.message.findFirst({
    where: {
      conversationId: conversation.id,
      direction: Direction.OUTBOUND
    },
    orderBy: { createdAt: "desc" }
  });
  const waitingForName = isWaitingForName(conversation, previousOutbound);

  const inbound = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: Direction.INBOUND,
      channel,
      replyType: ReplyType.LEAD_CAPTURE,
      content: inboundText
    }
  });

  let reply = "";
  let replyType: ReplyTypeType = ReplyType.LEAD_CAPTURE;
  let nextLeadState = conversation.leadState as LeadCaptureStateType;
  let nextNoMatchCount = conversation.noMatchCount;
  let nextConversationStatus: ConversationStatusType = ConversationStatus.ACTIVE;
  let aiConfidence: number | null = null;
  let shouldDispatchHotNotification = false;
  const leadUpdate: {
    name?: string;
    phone?: string;
    serviceInterest?: string;
    intent?: string;
    status?: string;
    lastSeenAt: Date;
  } = { lastSeenAt: new Date() };

  const faqAnswer = await getFaqReply(business.id, inboundText);

  if (isDevelopment) {
    console.log("[Inbound Message] FAQ matched", Boolean(faqAnswer));
  }

  if (isGreeting(inboundText) && !waitingForName && conversation.leadState !== LeadCaptureState.AWAITING_PHONE) {
    reply = getGreetingReply(business.name);
    nextNoMatchCount = 0;
  } else if (
    faqAnswer &&
    looksLikeQuestion(inboundText) &&
    (waitingForName || conversation.leadState === LeadCaptureState.AWAITING_PHONE || conversation.leadState === LeadCaptureState.AWAITING_SERVICE)
  ) {
    reply = withResume(faqAnswer, conversation.leadState);
    replyType = ReplyType.FAQ_MATCH;
    leadUpdate.intent = inferIntent(inboundText);
    nextNoMatchCount = 0;
  } else if (
    !faqAnswer &&
    looksLikeQuestion(inboundText) &&
    (waitingForName || conversation.leadState === LeadCaptureState.AWAITING_PHONE || conversation.leadState === LeadCaptureState.AWAITING_SERVICE)
  ) {
    const fallback = await getAiFallback({
      business,
      messageText: inboundText,
      conversationId: conversation.id,
      channel
    });
    aiConfidence = fallback.confidence;

    if (fallback.confidence >= 0.6) {
      reply = withResume(fallback.answer, conversation.leadState);
      replyType = ReplyType.AI_REPLY;
      nextNoMatchCount = 0;
    } else {
      nextNoMatchCount += 1;
      reply = HUMAN_ASSIST_REPLY;
      replyType = ReplyType.HANDOFF;
      leadUpdate.status = LeadStatus.ESCALATED;
      nextConversationStatus = ConversationStatus.WAITING_HUMAN;
    }
  } else if (waitingForName) {
    if (isValidName(inboundText)) {
      leadUpdate.name = inboundText;
      leadUpdate.status = LeadStatus.WARM;
      reply = ASK_PHONE_REPLY;
      nextLeadState = nextState(conversation.leadState);
      nextNoMatchCount = 0;
    } else {
      reply = "I may have missed your name there. Could you share just your name?";
    }
  } else if (conversation.leadState === LeadCaptureState.AWAITING_PHONE) {
    if (isValidPhone(inboundText)) {
      leadUpdate.phone = inboundText.replace(/\D/g, "");
      leadUpdate.status = LeadStatus.WARM;
      reply = ASK_SERVICE_REPLY;
      nextLeadState = nextState(conversation.leadState);
      nextNoMatchCount = 0;
    } else {
      reply = "Could you share a valid phone number? Digits are perfect.";
    }
  } else if (conversation.leadState === LeadCaptureState.AWAITING_SERVICE) {
    if (isValidServiceInterest(inboundText)) {
      leadUpdate.serviceInterest = inboundText;
      leadUpdate.intent = inboundText;
      leadUpdate.status = LeadStatus.HOT;
      reply = COMPLETE_REPLY;
      nextLeadState = nextState(conversation.leadState);
      nextNoMatchCount = 0;
      shouldDispatchHotNotification = true;
    } else {
      reply = "Could you tell me which service you are interested in?";
    }
  } else if (faqAnswer) {
    reply = isLeadCaptureTrigger(inboundText) ? `${faqAnswer}\n\n${ASK_NAME_REPLY}` : faqAnswer;
    replyType = ReplyType.FAQ_MATCH;
    leadUpdate.intent = inferIntent(inboundText);
    nextLeadState = isLeadCaptureTrigger(inboundText) ? LeadCaptureState.AWAITING_NAME : nextLeadState;
    nextNoMatchCount = 0;
  } else if (isLeadCaptureTrigger(inboundText)) {
    reply = ASK_NAME_REPLY;
    nextLeadState = LeadCaptureState.AWAITING_NAME;
    nextNoMatchCount = 0;
  } else {
    const fallback = await getAiFallback({
      business,
      messageText: inboundText,
      conversationId: conversation.id,
      channel
    });
    aiConfidence = fallback.confidence;

    if (fallback.confidence >= 0.6) {
      reply = fallback.answer;
      replyType = ReplyType.AI_REPLY;
      nextNoMatchCount = 0;
    } else {
      nextNoMatchCount += 1;
      reply = HUMAN_ASSIST_REPLY;
      replyType = ReplyType.HANDOFF;
      leadUpdate.status = LeadStatus.ESCALATED;
      nextConversationStatus = ConversationStatus.WAITING_HUMAN;
    }
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: leadUpdate
  });

  const updatedLead = await prisma.lead.findUniqueOrThrow({
    where: { id: lead.id }
  });

  if (shouldDispatchHotNotification) {
    await dispatchHotLeadNotification({
      businessId: business.id,
      leadId: updatedLead.id,
      channel
    });
  }

  const outbound = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: Direction.OUTBOUND,
      channel,
      replyType,
      content: reply
    }
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      contactName: updatedLead.name,
      leadState: nextLeadState,
      noMatchCount: nextNoMatchCount,
      status: nextConversationStatus,
      updatedAt: new Date()
    }
  });

  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" }
  });

  return {
    conversationId: conversation.id,
    replyText: reply,
    replyType,
    confidence: aiConfidence,
    leadState: nextLeadState,
    messages: history.map((message) =>
      serializeMessage({
        ...message,
        confidence: message.id === outbound.id ? aiConfidence : null
      })
    ),
    latest: [inbound, { ...outbound, confidence: aiConfidence }].map(serializeMessage)
  };
}
