import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type Check = {
  label: string;
  ok: boolean;
  detail: string;
};

const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const aerocoreInstagramAccountId = "aerocore_ig_test_account";
const aerocoreWhatsAppPhoneNumberId = "aerocore_wa_test_phone";

const Channel = {
  INSTAGRAM: "INSTAGRAM",
  WHATSAPP: "WHATSAPP"
} as const;
const LeadStatus = {
  HOT: "HOT"
} as const;

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").trim().replace(/^"|"$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function check(label: string, ok: boolean, detail: string): Check {
  return { label, ok, detail };
}

function envExists(name: string) {
  return Boolean(process.env[name]);
}

function getCookie(response: Response) {
  return response.headers.get("set-cookie")?.split(";")[0] ?? "";
}

async function request(path: string, init?: RequestInit & { cookie?: string }) {
  const headers = new Headers(init?.headers);

  if (init?.cookie) {
    headers.set("Cookie", init.cookie);
  }

  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    redirect: "manual"
  });
}

async function login(email: string, password: string) {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  return {
    response,
    cookie: getCookie(response)
  };
}

async function saveChannel(cookie: string, channel: string, externalAccountId: string, accessToken: string) {
  return request("/api/channels", {
    method: "PATCH",
    cookie,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      channel,
      externalAccountId,
      externalBusinessAccountId: channel === Channel.WHATSAPP ? "aerocore_waba_test" : "",
      accessToken
    })
  });
}

async function postInstagramWebhook(messageText: string, externalMessageId: string) {
  return request("/api/webhook/instagram", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      object: "instagram",
      entry: [
        {
          id: aerocoreInstagramAccountId,
          time: Date.now(),
          messaging: [
            {
              sender: { id: "aerocore_ig_e2e_user" },
              recipient: { id: aerocoreInstagramAccountId },
              timestamp: Date.now(),
              message: {
                mid: externalMessageId,
                text: messageText
              }
            }
          ]
        }
      ]
    })
  });
}

async function postWhatsAppWebhook(messageText: string, externalMessageId: string) {
  return request("/api/webhook/whatsapp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      object: "whatsapp_business_account",
      entry: [
        {
          id: "aerocore_waba_test",
          changes: [
            {
              field: "messages",
              value: {
                metadata: {
                  phone_number_id: aerocoreWhatsAppPhoneNumberId
                },
                messages: [
                  {
                    from: "919999000001",
                    id: externalMessageId,
                    timestamp: `${Math.floor(Date.now() / 1000)}`,
                    type: "text",
                    text: {
                      body: messageText
                    }
                  }
                ]
              }
            }
          ]
        }
      ]
    })
  });
}

async function runLeadCaptureFlow(channel: typeof Channel.INSTAGRAM | typeof Channel.WHATSAPP) {
  const { prisma } = await import("../lib/db/prisma");
  const prefix = `${channel.toLowerCase()}_${Date.now()}`;
  const post = channel === Channel.INSTAGRAM ? postInstagramWebhook : postWhatsAppWebhook;
  const userId = channel === Channel.INSTAGRAM ? "aerocore_ig_e2e_user" : "919999000001";

  await post(channel === Channel.INSTAGRAM ? "I need a website for my clinic" : "I need an AI chatbot", `${prefix}_1`);
  await post(channel === Channel.INSTAGRAM ? "Anil Kumar" : "Meena Rao", `${prefix}_2`);
  await post(channel === Channel.INSTAGRAM ? "9876500001" : "9876500002", `${prefix}_3`);
  await post(channel === Channel.INSTAGRAM ? "Clinic website" : "AI chatbot automation", `${prefix}_4`);

  const business = await prisma.business.findUniqueOrThrow({
    where: { instagramHandle: "@aerocore" }
  });
  const conversation = await prisma.conversation.findFirst({
    where: {
      businessId: business.id,
      instagramHandle: userId,
      channel
    },
    include: {
      lead: true,
      messages: true
    },
    orderBy: { updatedAt: "desc" }
  });
  const notification = conversation?.leadId
    ? await prisma.notification.findFirst({
        where: {
          businessId: business.id,
          leadId: conversation.leadId
        }
      })
    : null;

  return {
    conversation,
    notification
  };
}

async function main() {
  loadEnv();
  const [{ ensureDemoBusinesses }, { prisma }] = await Promise.all([
    import("../lib/db/business"),
    import("../lib/db/prisma")
  ]);
  const checks: Check[] = [];

  await ensureDemoBusinesses();

  checks.push(
    ...["DATABASE_URL", "DIRECT_URL", "GROQ_API_KEY", "AUTH_SECRET", "NEXT_PUBLIC_APP_URL", "INSTAGRAM_VERIFY_TOKEN", "WHATSAPP_VERIFY_TOKEN"].map((name) =>
      check(`Env ${name}`, envExists(name), envExists(name) ? "Configured" : "Missing")
    )
  );

  const aerocore = await prisma.business.findUnique({
    where: { instagramHandle: "@aerocore" },
    include: { users: true, faqs: true, leads: true, conversations: true, notifications: true }
  });

  checks.push(check("AEROCORE workspace", Boolean(aerocore), aerocore ? "Seeded" : "Missing"));
  checks.push(check("AEROCORE owner", Boolean(aerocore?.users.some((user) => user.email === "owner@aerocore.com")), "owner@aerocore.com"));
  checks.push(check("AEROCORE FAQs", (aerocore?.faqs.length ?? 0) >= 8, `${aerocore?.faqs.length ?? 0} FAQs`));
  checks.push(check("AEROCORE sample leads", (aerocore?.leads.length ?? 0) >= 3, `${aerocore?.leads.length ?? 0} leads`));
  checks.push(check("AEROCORE sample conversations", (aerocore?.conversations.length ?? 0) >= 3, `${aerocore?.conversations.length ?? 0} conversations`));
  checks.push(check("AEROCORE sample notifications", (aerocore?.notifications.length ?? 0) >= 3, `${aerocore?.notifications.length ?? 0} notifications`));

  const protectedDashboard = await request("/dashboard");
  checks.push(check("Dashboard route protected", [302, 303, 307, 308].includes(protectedDashboard.status), `HTTP ${protectedDashboard.status}`));

  const loginResult = await login("owner@aerocore.com", "password123");
  checks.push(check("Login works", loginResult.response.ok && Boolean(loginResult.cookie), `HTTP ${loginResult.response.status}`));

  if (loginResult.cookie) {
    const dashboard = await request("/dashboard", { cookie: loginResult.cookie });
    checks.push(check("Authenticated dashboard", dashboard.status === 200, `HTTP ${dashboard.status}`));

    const dashboardPages = [
      "/dashboard/leads",
      "/dashboard/conversations",
      "/dashboard/notifications",
      "/dashboard/faqs",
      "/dashboard/settings",
      "/dashboard/channels-debug",
      "/test-dm"
    ];

    for (const page of dashboardPages) {
      const response = await request(page, { cookie: loginResult.cookie });
      checks.push(check(`Page ${page}`, response.status === 200, `HTTP ${response.status}`));
    }

    const businessResponse = await request("/api/business", { cookie: loginResult.cookie });
    const businessPayload = (await businessResponse.json()) as { business?: { name?: string; instagramAccessToken?: string } };
    checks.push(check("Business scoping", businessPayload.business?.name === "AEROCORE", businessPayload.business?.name ?? "No business"));
    checks.push(check("Business API hides legacy token", !("instagramAccessToken" in (businessPayload.business ?? {})), "No token field returned"));

    const saveBusiness = await request("/api/business", {
      method: "PATCH",
      cookie: loginResult.cookie,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "AEROCORE",
        businessType: "Digital Services",
        location: "Serving small and medium businesses online",
        timings: "Available for enquiries every day",
        services: aerocore?.services,
        pricingNotes: aerocore?.pricingNotes,
        staffNotificationPhone: "",
        staffNotificationEmail: "pavansaig2406@gmail.com",
        aiTone: "Professional, helpful, confident, and concise"
      })
    });
    checks.push(check("Business profile saves", saveBusiness.ok, `HTTP ${saveBusiness.status}`));

    const instagramSave = await saveChannel(loginResult.cookie, Channel.INSTAGRAM, aerocoreInstagramAccountId, "invalid_instagram_token_for_test");
    checks.push(check("Instagram connection saves", instagramSave.ok, `HTTP ${instagramSave.status}`));

    const whatsappSave = await saveChannel(loginResult.cookie, Channel.WHATSAPP, aerocoreWhatsAppPhoneNumberId, "invalid_whatsapp_token_for_test");
    checks.push(check("WhatsApp connection saves", whatsappSave.ok, `HTTP ${whatsappSave.status}`));

    const channelsResponse = await request("/api/channels", { cookie: loginResult.cookie });
    const channelsPayload = (await channelsResponse.json()) as {
      connections?: {
        INSTAGRAM?: { tokenExists?: boolean; accessToken?: string };
        WHATSAPP?: { tokenExists?: boolean; accessToken?: string };
      };
    };
    checks.push(check("Tokens masked after saving", Boolean(channelsPayload.connections?.INSTAGRAM?.tokenExists && channelsPayload.connections?.WHATSAPP?.tokenExists), "tokenExists only"));
    checks.push(
      check(
        "Tokens not exposed by channel API",
        !channelsPayload.connections?.INSTAGRAM?.accessToken && !channelsPayload.connections?.WHATSAPP?.accessToken,
        "No accessToken fields returned"
      )
    );

    const instagramTest = await request("/api/channels/test", {
      method: "POST",
      cookie: loginResult.cookie,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: Channel.INSTAGRAM })
    });
    checks.push(check("Instagram invalid token error", instagramTest.status === 502, `HTTP ${instagramTest.status}`));

    const whatsappTest = await request("/api/channels/test", {
      method: "POST",
      cookie: loginResult.cookie,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: Channel.WHATSAPP })
    });
    checks.push(check("WhatsApp invalid token error", whatsappTest.status === 502, `HTTP ${whatsappTest.status}`));

    const faqCreate = await request("/api/faqs", {
      method: "POST",
      cookie: loginResult.cookie,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: `Production test FAQ ${Date.now()}`,
        answer: "Production test answer"
      })
    });
    const faqCreatePayload = (await faqCreate.json()) as { faq?: { id?: string } };
    checks.push(check("FAQ create works", faqCreate.status === 201 && Boolean(faqCreatePayload.faq?.id), `HTTP ${faqCreate.status}`));

    if (faqCreatePayload.faq?.id) {
      const faqUpdate = await request("/api/faqs", {
        method: "PATCH",
        cookie: loginResult.cookie,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: faqCreatePayload.faq.id,
          question: "Production test FAQ updated",
          answer: "Production test answer updated"
        })
      });
      checks.push(check("FAQ update works", faqUpdate.ok, `HTTP ${faqUpdate.status}`));

      const faqDelete = await request("/api/faqs", {
        method: "DELETE",
        cookie: loginResult.cookie,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: faqCreatePayload.faq.id
        })
      });
      checks.push(check("FAQ delete works", faqDelete.ok, `HTTP ${faqDelete.status}`));
    }

    const testDmFaq = await request("/api/test-dm", {
      method: "POST",
      cookie: loginResult.cookie,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "What services do you provide?",
        instagramHandle: `aerocore_testdm_faq_${Date.now()}`,
        channel: Channel.INSTAGRAM
      })
    });
    const testDmFaqPayload = (await testDmFaq.json()) as { reply?: string };
    checks.push(check("Test DM FAQ matching", testDmFaq.ok && Boolean(testDmFaqPayload.reply?.includes("Websites")), testDmFaqPayload.reply ?? `HTTP ${testDmFaq.status}`));

    const testDmAi = await request("/api/test-dm", {
      method: "POST",
      cookie: loginResult.cookie,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Explain retention loops",
        instagramHandle: `aerocore_testdm_ai_${Date.now()}`,
        channel: Channel.INSTAGRAM
      })
    });
    const testDmAiPayload = (await testDmAi.json()) as { reply?: string; aiConfidence?: number | null };
    checks.push(check("Test DM AI fallback", testDmAi.ok && testDmAiPayload.aiConfidence !== null, `confidence ${testDmAiPayload.aiConfidence ?? "null"}`));

    const simulateInstagram = await request("/api/debug/channel-simulate", {
      method: "POST",
      cookie: loginResult.cookie,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: Channel.INSTAGRAM,
        messageText: "I need a website for my clinic",
        fakeSenderId: `aerocore_debug_ig_${Date.now()}`
      })
    });
    checks.push(check("Channels debug Instagram simulation", simulateInstagram.ok, `HTTP ${simulateInstagram.status}`));

    const simulateWhatsApp = await request("/api/debug/channel-simulate", {
      method: "POST",
      cookie: loginResult.cookie,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: Channel.WHATSAPP,
        messageText: "I own a restaurant",
        fakeSenderId: `919999${Date.now().toString().slice(-6)}`
      })
    });
    checks.push(check("Channels debug WhatsApp simulation", simulateWhatsApp.ok, `HTTP ${simulateWhatsApp.status}`));

    const logout = await request("/api/auth/logout", { method: "POST", cookie: loginResult.cookie });
    checks.push(check("Logout works", logout.ok, `HTTP ${logout.status}`));
  }

  const instagramVerify = await request(
    `/api/webhook/instagram?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(process.env.INSTAGRAM_VERIFY_TOKEN ?? "")}&hub.challenge=ig_challenge`
  );
  checks.push(check("Instagram verify token accepts valid challenge", (await instagramVerify.text()) === "ig_challenge", `HTTP ${instagramVerify.status}`));

  const instagramWrongVerify = await request("/api/webhook/instagram?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=bad");
  checks.push(check("Instagram verify token rejects wrong token", instagramWrongVerify.status === 403, `HTTP ${instagramWrongVerify.status}`));

  const whatsappVerify = await request(
    `/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(process.env.WHATSAPP_VERIFY_TOKEN ?? "")}&hub.challenge=wa_challenge`
  );
  checks.push(check("WhatsApp verify token accepts valid challenge", (await whatsappVerify.text()) === "wa_challenge", `HTTP ${whatsappVerify.status}`));

  const whatsappWrongVerify = await request("/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=bad");
  checks.push(check("WhatsApp verify token rejects wrong token", whatsappWrongVerify.status === 403, `HTTP ${whatsappWrongVerify.status}`));

  const duplicateId = `ig_duplicate_${Date.now()}`;
  const beforeDuplicateMessages = await prisma.message.count();
  const duplicateFirst = await postInstagramWebhook("I need a website for my clinic", duplicateId);
  const afterFirstDuplicateMessages = await prisma.message.count();
  const duplicateSecond = await postInstagramWebhook("I need a website for my clinic", duplicateId);
  const afterSecondDuplicateMessages = await prisma.message.count();

  checks.push(check("Instagram webhook returns 200", duplicateFirst.ok && duplicateSecond.ok, `${duplicateFirst.status}/${duplicateSecond.status}`));
  checks.push(
    check(
      "Duplicate externalMessageId ignored",
      afterFirstDuplicateMessages > beforeDuplicateMessages && afterSecondDuplicateMessages === afterFirstDuplicateMessages,
      `${beforeDuplicateMessages} -> ${afterFirstDuplicateMessages} -> ${afterSecondDuplicateMessages}`
    )
  );

  const instagramFlow = await runLeadCaptureFlow(Channel.INSTAGRAM);
  checks.push(
    check(
      "Instagram E2E lead capture",
      instagramFlow.conversation?.lead?.status === LeadStatus.HOT && Boolean(instagramFlow.notification),
      instagramFlow.conversation?.lead?.status ?? "No lead"
    )
  );

  const whatsappFlow = await runLeadCaptureFlow(Channel.WHATSAPP);
  checks.push(
    check(
      "WhatsApp E2E lead capture",
      whatsappFlow.conversation?.lead?.status === LeadStatus.HOT && Boolean(whatsappFlow.notification),
      whatsappFlow.conversation?.lead?.status ?? "No lead"
    )
  );

  const eventCount = await prisma.channelWebhookEvent.count({
    where: {
      businessId: aerocore?.id
    }
  });
  const sendAttemptCount = await prisma.channelSendAttempt.count({
    where: {
      businessId: aerocore?.id
    }
  });
  checks.push(check("Webhook events saved", eventCount > 0, `${eventCount} events`));
  checks.push(check("Send attempts saved", sendAttemptCount > 0, `${sendAttemptCount} attempts`));

  for (const item of checks) {
    console.log(`${item.ok ? "PASS" : "FAIL"} ${item.label}: ${item.detail}`);
  }

  if (checks.some((item) => !item.ok)) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("../lib/db/prisma");
    await prisma.$disconnect();
  });
