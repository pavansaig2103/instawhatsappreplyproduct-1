"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Toast } from "@/components/ui/Toast";

type BusinessSettings = {
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
};

type BusinessSettingsFormProps = {
  business: BusinessSettings;
  channelConnections: {
    INSTAGRAM: ChannelConnectionSettings;
    WHATSAPP: ChannelConnectionSettings;
  };
};

type EditableBusinessSetting = keyof BusinessSettings;
type ChannelConnectionSettings = {
  externalAccountId: string;
  externalBusinessAccountId: string;
  tokenExists: boolean;
  isConnected: boolean;
};
type ChannelFormState = ChannelConnectionSettings & {
  accessToken: string;
};

const fields: Array<{
  key: EditableBusinessSetting;
  label: string;
  type?: "input" | "textarea";
  required?: boolean;
}> = [
  { key: "name", label: "Business name", required: true },
  { key: "businessType", label: "Business type", required: true },
  { key: "location", label: "Location" },
  { key: "timings", label: "Timings" },
  { key: "services", label: "Services", type: "textarea" },
  { key: "pricingNotes", label: "Pricing notes", type: "textarea" },
  { key: "staffNotificationPhone", label: "Staff notification phone" },
  { key: "staffNotificationEmail", label: "Staff notification email" },
  { key: "aiTone", label: "AI tone", type: "textarea" }
];

export function BusinessSettingsForm({ business, channelConnections }: BusinessSettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(business);
  const [instagram, setInstagram] = useState<ChannelFormState>({ ...channelConnections.INSTAGRAM, accessToken: "" });
  const [whatsapp, setWhatsapp] = useState<ChannelFormState>({ ...channelConnections.WHATSAPP, accessToken: "" });
  const [status, setStatus] = useState("");
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savingChannel, setSavingChannel] = useState<string | null>(null);

  function showToast(message: string, tone: "success" | "error" = "success") {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  }

  function updateField(key: EditableBusinessSetting, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function saveChannel(channel: "INSTAGRAM" | "WHATSAPP", state: ChannelFormState) {
    setSavingChannel(channel);

    try {
      const response = await fetch("/api/channels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          externalAccountId: state.externalAccountId,
          externalBusinessAccountId: state.externalBusinessAccountId,
          accessToken: state.accessToken
        })
      });
      const data = (await response.json()) as { connection?: ChannelConnectionSettings; error?: string };

      if (!response.ok || !data.connection) {
        throw new Error(data.error || "Could not save channel.");
      }

      if (channel === "INSTAGRAM") {
        setInstagram({ ...data.connection, accessToken: "" });
      } else {
        setWhatsapp({ ...data.connection, accessToken: "" });
      }

      showToast(`${channel === "INSTAGRAM" ? "Instagram" : "WhatsApp"} connection saved.`);
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not save channel.", "error");
    } finally {
      setSavingChannel(null);
    }
  }

  async function testChannel(channel: "INSTAGRAM" | "WHATSAPP") {
    setSavingChannel(`${channel}_TEST`);

    try {
      const response = await fetch("/api/channels/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel })
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Connection test failed.");
      }

      showToast(`${channel === "INSTAGRAM" ? "Instagram" : "WhatsApp"} connection test passed.`);
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Connection test failed.", "error");
      router.refresh();
    } finally {
      setSavingChannel(null);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/business?business=${business.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          businessSlug: business.slug
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save settings.");
      }

      const data = (await response.json()) as { business: BusinessSettings };
      setForm(data.business);
      setStatus("Settings saved.");
      showToast("Settings saved.");
      router.refresh();
    } catch {
      setStatus("Could not save settings yet. Try again.");
      showToast("Could not save settings. Try again.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="p-5">
      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          {fields.map((field) => (
            <label key={field.key} className={field.type === "textarea" ? "space-y-2 lg:col-span-2" : "space-y-2"}>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {field.label}
                {field.required ? " *" : ""}
              </span>
              {field.type === "textarea" ? (
                <textarea
                  value={form[field.key]}
                  onChange={(event) => updateField(field.key, event.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-ink-900 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-brand-500"
                />
              ) : (
                <input
                  value={form[field.key]}
                  onChange={(event) => updateField(field.key, event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-ink-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-500"
                />
              )}
            </label>
          ))}
        </div>

        <div className="grid gap-5 border-t border-white/10 pt-5 xl:grid-cols-2">
          <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-white">Instagram</h2>
                <p className="mt-1 text-sm text-slate-400">Connect the Instagram account that receives DMs.</p>
              </div>
              <Badge tone={instagram.isConnected ? "green" : "slate"}>
                {instagram.isConnected ? "Connected" : "Not connected"}
              </Badge>
            </div>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Instagram Account ID</span>
              <input
                value={instagram.externalAccountId}
                onChange={(event) => setInstagram((current) => ({ ...current, externalAccountId: event.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-ink-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-500"
                placeholder="17841400000000000"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Instagram Access Token</span>
              <input
                type="password"
                value={instagram.accessToken}
                onChange={(event) => setInstagram((current) => ({ ...current, accessToken: event.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-ink-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-500"
                placeholder={instagram.tokenExists ? "Token saved - paste new token to replace" : "Paste access token"}
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => saveChannel("INSTAGRAM", instagram)} disabled={savingChannel === "INSTAGRAM"} className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60">
                {savingChannel === "INSTAGRAM" ? "Saving" : "Save"}
              </button>
              <button type="button" onClick={() => testChannel("INSTAGRAM")} disabled={savingChannel === "INSTAGRAM_TEST"} className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-slate-200 disabled:opacity-60">
                {savingChannel === "INSTAGRAM_TEST" ? "Testing" : "Test connection"}
              </button>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-white">WhatsApp</h2>
                <p className="mt-1 text-sm text-slate-400">Connect the WhatsApp Cloud API phone number.</p>
              </div>
              <Badge tone={whatsapp.isConnected ? "green" : "slate"}>
                {whatsapp.isConnected ? "Connected" : "Not connected"}
              </Badge>
            </div>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">WhatsApp Phone Number ID</span>
              <input value={whatsapp.externalAccountId} onChange={(event) => setWhatsapp((current) => ({ ...current, externalAccountId: event.target.value }))} className="w-full rounded-lg border border-white/10 bg-ink-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-500" placeholder="Phone number ID" />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">WhatsApp Business Account ID</span>
              <input value={whatsapp.externalBusinessAccountId} onChange={(event) => setWhatsapp((current) => ({ ...current, externalBusinessAccountId: event.target.value }))} className="w-full rounded-lg border border-white/10 bg-ink-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-500" placeholder="Business account ID" />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">WhatsApp Access Token</span>
              <input type="password" value={whatsapp.accessToken} onChange={(event) => setWhatsapp((current) => ({ ...current, accessToken: event.target.value }))} className="w-full rounded-lg border border-white/10 bg-ink-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-500" placeholder={whatsapp.tokenExists ? "Token saved - paste new token to replace" : "Paste access token"} />
            </label>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => saveChannel("WHATSAPP", whatsapp)} disabled={savingChannel === "WHATSAPP"} className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60">
                {savingChannel === "WHATSAPP" ? "Saving" : "Save"}
              </button>
              <button type="button" onClick={() => testChannel("WHATSAPP")} disabled={savingChannel === "WHATSAPP_TEST"} className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-slate-200 disabled:opacity-60">
                {savingChannel === "WHATSAPP_TEST" ? "Testing" : "Test connection"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
          <p className="text-sm text-slate-400">{status}</p>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving" : "Save settings"}
          </button>
        </div>
      </form>
    </Card>
  );
}
