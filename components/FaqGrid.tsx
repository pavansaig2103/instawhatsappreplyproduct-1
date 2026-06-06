"use client";

import { Edit3, MessageCircleQuestion, Trash2 } from "lucide-react";
import type { UiFaq } from "@/lib/db/data";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type FaqGridProps = {
  items?: UiFaq[];
  onEdit?: (faq: UiFaq) => void;
  onDelete?: (faq: UiFaq) => void;
};

export function FaqGrid({ items = [], onEdit, onDelete }: FaqGridProps) {
  if (!items.length) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-white/[0.05] text-brand-500">
          <MessageCircleQuestion className="h-5 w-5" />
        </div>
        <h3 className="mt-4 font-semibold text-white">No FAQs yet</h3>
        <p className="mt-2 text-sm text-slate-400">Add your first answer so the assistant can match common customer questions.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((faq) => (
        <Card key={faq.question} className="p-5">
          <div className="flex items-start justify-between gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/5 text-brand-500">
              <MessageCircleQuestion className="h-5 w-5" />
            </span>
            <div className="flex items-center gap-2">
              <Badge tone="green">{faq.usage}</Badge>
              {onEdit ? (
                <button
                  type="button"
                  onClick={() => onEdit(faq)}
                  aria-label="Edit FAQ"
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              ) : null}
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => onDelete(faq)}
                  aria-label="Delete FAQ"
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-amber"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
          <h3 className="mt-5 text-lg font-semibold text-white">{faq.question}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">{faq.answer}</p>
        </Card>
      ))}
    </div>
  );
}
