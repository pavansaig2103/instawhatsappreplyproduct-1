"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
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
};

const fields: Array<{
  key: keyof BusinessSettings;
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

export function BusinessSettingsForm({ business }: BusinessSettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(business);
  const [status, setStatus] = useState("");
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function showToast(message: string, tone: "success" | "error" = "success") {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  }

  function updateField(key: keyof BusinessSettings, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
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
