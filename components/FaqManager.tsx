"use client";

import { FormEvent, useState } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FaqGrid } from "@/components/FaqGrid";
import { Card } from "@/components/ui/Card";
import { Toast } from "@/components/ui/Toast";
import type { UiFaq } from "@/lib/db/data";

type FaqManagerProps = {
  items: UiFaq[];
  businessSlug: string;
};

export function FaqManager({ items, businessSlug }: FaqManagerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function showToast(message: string, tone: "success" | "error" = "success") {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  }

  function resetForm() {
    setQuestion("");
    setAnswer("");
    setEditingId(null);
    setIsOpen(false);
  }

  function onEdit(faq: UiFaq) {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setError("");
    setIsOpen(true);
  }

  async function onDelete(faq: UiFaq) {
    setError("");

    try {
      const response = await fetch("/api/faqs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: faq.id })
      });

      if (!response.ok) {
        throw new Error("Failed to delete FAQ.");
      }

      showToast("FAQ deleted.");
      router.refresh();
    } catch {
      showToast("Could not delete this FAQ. Try again.", "error");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!question.trim() || !answer.trim()) {
      setError("Add both a question and an answer.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/faqs", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, question, answer, businessSlug })
      });

      if (!response.ok) {
        throw new Error(editingId ? "Failed to update FAQ." : "Failed to create FAQ.");
      }

      resetForm();
      showToast(editingId ? "FAQ updated." : "FAQ created.");
      router.refresh();
    } catch {
      const message = editingId ? "Could not update this FAQ yet. Try again." : "Could not save this FAQ yet. Try again.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              resetForm();
            } else {
              setIsOpen(true);
            }
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-slate-200"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isOpen ? "Close" : "New FAQ"}
        </button>
      </div>

      {isOpen ? (
        <Card className="p-5">
          <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[1fr_1.4fr_auto] lg:items-end">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Question</span>
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-ink-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-500"
                placeholder="What are your timings?"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Answer</span>
              <input
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-ink-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-500"
                placeholder="Open 5 AM to 10 PM."
              />
            </label>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving" : editingId ? "Update" : "Save"}
            </button>
          </form>
          {error ? <p className="mt-3 text-sm text-amber">{error}</p> : null}
        </Card>
      ) : null}

      <FaqGrid items={items} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}
