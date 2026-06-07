"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Wand2 } from "lucide-react";
import { Toast } from "@/components/ui/Toast";

export function InstagramDebugActions() {
  const router = useRouter();
  const [simulateMessage, setSimulateMessage] = useState("Hi, I want to book an appointment");
  const [fakeSenderId, setFakeSenderId] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [sendText, setSendText] = useState("Test message from AeroCore InstaReply AI");
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  function showToast(message: string, tone: "success" | "error" = "success") {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  }

  async function simulateDm() {
    setIsSimulating(true);

    try {
      const response = await fetch("/api/debug/instagram-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageText: simulateMessage,
          fakeSenderId
        })
      });

      if (!response.ok) {
        throw new Error("Simulation failed.");
      }

      showToast("Simulated Instagram DM created.");
      router.refresh();
    } catch {
      showToast("Could not simulate Instagram DM.", "error");
    } finally {
      setIsSimulating(false);
    }
  }

  async function testSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);

    try {
      const response = await fetch("/api/debug/instagram-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          text: sendText
        })
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Send failed.");
      }

      showToast("Instagram send attempt succeeded.");
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Instagram send failed.", "error");
      router.refresh();
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}

      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <h2 className="font-semibold text-white">Simulate Instagram DM</h2>
        <div className="mt-4 grid gap-3">
          <input
            value={simulateMessage}
            onChange={(event) => setSimulateMessage(event.target.value)}
            className="rounded-lg border border-white/10 bg-ink-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-500"
            placeholder="Message text"
          />
          <input
            value={fakeSenderId}
            onChange={(event) => setFakeSenderId(event.target.value)}
            className="rounded-lg border border-white/10 bg-ink-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-500"
            placeholder="Fake sender ID optional"
          />
          <button
            type="button"
            onClick={simulateDm}
            disabled={isSimulating}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Wand2 className="h-4 w-4" />
            {isSimulating ? "Simulating" : "Simulate Instagram DM"}
          </button>
        </div>
      </div>

      <form onSubmit={testSend} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <h2 className="font-semibold text-white">Test Instagram Send</h2>
        <div className="mt-4 grid gap-3">
          <input
            value={recipientId}
            onChange={(event) => setRecipientId(event.target.value)}
            className="rounded-lg border border-white/10 bg-ink-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-500"
            placeholder="Instagram recipient ID"
          />
          <input
            value={sendText}
            onChange={(event) => setSendText(event.target.value)}
            className="rounded-lg border border-white/10 bg-ink-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-500"
            placeholder="Message text"
          />
          <button
            type="submit"
            disabled={isSending || !recipientId.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-ink-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {isSending ? "Sending" : "Test Instagram Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
