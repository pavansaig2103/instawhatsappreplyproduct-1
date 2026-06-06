"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { SendHorizonal } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

type Message = {
  from: "user" | "bot";
  text: string;
  replyType?: string;
  confidence?: number | null;
  timestamp: string;
};

type Channel = "INSTAGRAM" | "WHATSAPP";

const CHANNELS: Array<{ label: string; value: Channel }> = [
  { label: "Instagram", value: "INSTAGRAM" },
  { label: "WhatsApp", value: "WHATSAPP" }
];

const CHANNEL_STORAGE_KEY = "instareply:selected-channel";
const TEST_DM_STORAGE_PREFIX = "instareply:test-dm";

function createTimestamp() {
  return new Date().toISOString();
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function replyTypeLabel(replyType?: string) {
  const labels: Record<string, string> = {
    FAQ_MATCH: "FAQ",
    AI_REPLY: "AI",
    LEAD_CAPTURE: "Lead Capture",
    HANDOFF: "Handoff",
    HUMAN: "Human"
  };

  return replyType ? labels[replyType] ?? replyType : "Lead Capture";
}

function replyTypeTone(replyType?: string) {
  if (replyType === "FAQ_MATCH") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  }

  if (replyType === "AI_REPLY") {
    return "border-sky-400/30 bg-sky-400/10 text-sky-100";
  }

  if (replyType === "HANDOFF") {
    return "border-amber/30 bg-amber/10 text-amber";
  }

  return "border-white/10 bg-white/[0.06] text-slate-300";
}

type TestDmClientProps = {
  businessSlug: string;
  businessName: string;
  businessHandle: string;
};

export function TestDmClient({ businessSlug, businessName, businessHandle }: TestDmClientProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [channel, setChannel] = useState<Channel>("INSTAGRAM");
  const selectedChannel = CHANNELS.find((item) => item.value === channel) ?? CHANNELS[0];
  const storageKey = `${TEST_DM_STORAGE_PREFIX}:${businessSlug}:${channel}`;
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "bot",
      text: `Send a test message and I will respond from ${businessName}'s FAQ knowledge base.`,
      timestamp: createTimestamp()
    }
  ]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string>();
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  useEffect(() => {
    const savedChannel = window.localStorage.getItem(CHANNEL_STORAGE_KEY);

    if (savedChannel === "INSTAGRAM" || savedChannel === "WHATSAPP") {
      setChannel(savedChannel);
    }

    const saved = window.localStorage.getItem(storageKey);

    if (!saved) {
      setConversationId(undefined);
      setMessages([
        {
          from: "bot",
          text: `Send a test message and I will respond from ${businessName}'s FAQ knowledge base.`,
          timestamp: createTimestamp()
        }
      ]);
      return;
    }

    try {
      const parsed = JSON.parse(saved) as {
        conversationId?: string;
        messages?: Message[];
      };

      if (parsed.conversationId) {
        setConversationId(parsed.conversationId);
      }

      if (parsed.messages?.length) {
        setMessages(parsed.messages);
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [businessName, storageKey]);

  function onChannelChange(nextChannel: Channel) {
    setChannel(nextChannel);
    window.localStorage.setItem(CHANNEL_STORAGE_KEY, nextChannel);
  }

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify({ conversationId, messages }));
  }, [conversationId, messages, storageKey]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();

    if (!trimmed) {
      return;
    }

    setMessages((current) => [...current, { from: "user", text: trimmed, replyType: "LEAD_CAPTURE", timestamp: createTimestamp() }]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/test-dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          conversationId,
          businessSlug,
          channel,
          instagramHandle: `@${businessSlug}_${channel.toLowerCase()}_demo_lead`,
          contactName: "New Lead"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to send test DM.");
      }

      const data = (await response.json()) as {
        conversationId: string;
        reply: string;
        messages: Message[];
      };

      setConversationId(data.conversationId);
      setMessages(data.messages);
    } catch {
      setToast({ message: "Could not send this Test DM. Please try again.", tone: "error" });
      setMessages((current) => [
        ...current,
        {
          from: "bot",
          text: "I could not save this test DM yet. Run the Prisma migration and seed, then try again.",
          replyType: "HANDOFF",
          timestamp: createTimestamp()
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Card className="mx-auto flex min-h-[640px] w-full max-w-4xl flex-col overflow-hidden">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-white">{businessHandle}</p>
            <p className="text-xs text-slate-500">{selectedChannel.label} Lead Capture Live Preview</p>
          </div>
          <div className="inline-flex rounded-lg border border-white/10 bg-ink-950 p-1">
            {CHANNELS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onChannelChange(item.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition",
                  channel === item.value ? "bg-white text-ink-950" : "text-slate-400 hover:text-white"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.map((message, index) => (
          <div key={`${message.text}-${index}`} className={cn("flex", message.from === "bot" ? "justify-start" : "justify-end")}>
            <div
              className={cn(
                "max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6",
                message.from === "bot"
                  ? "border border-white/10 bg-white/[0.06] text-slate-100"
                  : "bg-brand-500 text-white"
              )}
            >
              {message.from === "bot" ? (
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase", replyTypeTone(message.replyType))}>
                    {replyTypeLabel(message.replyType)}
                  </span>
                  {message.replyType === "AI_REPLY" && typeof message.confidence === "number" ? (
                    <span className="text-[11px] text-slate-400">{Math.round(message.confidence * 100)}% confidence</span>
                  ) : null}
                </div>
              ) : null}
              <span className="block">{message.text}</span>
              <span className={cn("mt-2 block text-[11px] leading-none", message.from === "bot" ? "text-slate-500" : "text-pink-100")}>
                {formatTimestamp(message.timestamp)}
              </span>
            </div>
          </div>
        ))}
        {isSending ? (
          <div className="flex justify-start">
            <div className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-300">
              Thinking...
            </div>
          </div>
        ) : null}
        <div ref={scrollRef} />
      </div>
      <form onSubmit={onSubmit} className="flex gap-3 border-t border-white/10 p-4">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isSending}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-ink-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-500"
          placeholder="Ask about pricing, timings, trial, trainer, or location"
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={isSending || !input.trim()}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-500 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <SendHorizonal className="h-5 w-5" />
        </button>
      </form>
    </Card>
  );
}
