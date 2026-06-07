"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2 } from "lucide-react";
import { Toast } from "@/components/ui/Toast";

type Channel = "INSTAGRAM" | "WHATSAPP";

export function ChannelsDebugActions() {
  const router = useRouter();
  const [messageText, setMessageText] = useState("Hi, I want to book an appointment");
  const [fakeSenderId, setFakeSenderId] = useState("");
  const [loadingChannel, setLoadingChannel] = useState<Channel | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  function showToast(message: string, tone: "success" | "error" = "success") {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  }

  async function simulate(channel: Channel) {
    setLoadingChannel(channel);

    try {
      const response = await fetch("/api/debug/channel-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          messageText,
          fakeSenderId
        })
      });

      if (!response.ok) {
        throw new Error("Simulation failed.");
      }

      showToast(`${channel === "INSTAGRAM" ? "Instagram" : "WhatsApp"} simulation created a conversation.`);
      router.refresh();
    } catch {
      showToast("Could not simulate channel message.", "error");
    } finally {
      setLoadingChannel(null);
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
      <h2 className="font-semibold text-white">Simulate channel message</h2>
      <div className="mt-4 grid gap-3">
        <input
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          className="rounded-lg border border-white/10 bg-ink-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-500"
          placeholder="Message text"
        />
        <input
          value={fakeSenderId}
          onChange={(event) => setFakeSenderId(event.target.value)}
          className="rounded-lg border border-white/10 bg-ink-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-500"
          placeholder="Fake sender ID optional"
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => simulate("INSTAGRAM")}
            disabled={loadingChannel === "INSTAGRAM"}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Wand2 className="h-4 w-4" />
            {loadingChannel === "INSTAGRAM" ? "Simulating" : "Simulate Instagram DM"}
          </button>
          <button
            type="button"
            onClick={() => simulate("WHATSAPP")}
            disabled={loadingChannel === "WHATSAPP"}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-ink-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Wand2 className="h-4 w-4" />
            {loadingChannel === "WHATSAPP" ? "Simulating" : "Simulate WhatsApp message"}
          </button>
        </div>
      </div>
    </div>
  );
}
