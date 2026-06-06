import { MessageSquareText } from "lucide-react";
import type { UiConversation } from "@/lib/db/data";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type ConversationViewerProps = {
  items?: UiConversation[];
};

const toneByChannel = {
  Instagram: "pink",
  WhatsApp: "green"
} as const;

export function ConversationViewer({ items = [] }: ConversationViewerProps) {
  const activeConversation = items[0];

  if (!activeConversation) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-white/[0.05] text-brand-500">
          <MessageSquareText className="h-5 w-5" />
        </div>
        <h3 className="mt-4 font-semibold text-white">No conversations yet</h3>
        <p className="mt-2 text-sm text-slate-400">Send a Test DM to create the first customer thread.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
      <Card className="overflow-hidden">
        <div className="border-b border-white/10 px-4 py-3 text-sm font-medium text-white">Inbox</div>
        <div className="divide-y divide-white/10">
          {items.map((conversation, index) => (
            <div
              key={conversation.id}
              className={cn("p-4", index === 0 ? "bg-white/[0.07]" : "hover:bg-white/[0.04]")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{conversation.contact}</p>
                  <p className="text-xs text-slate-500">{conversation.handle}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge tone={toneByChannel[conversation.channel]}>{conversation.channel}</Badge>
                  <Badge tone={index === 0 ? "green" : "slate"}>{conversation.messages.length}</Badge>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-400">
                {conversation.messages[conversation.messages.length - 1].text}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex min-h-[560px] flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <p className="font-semibold text-white">{activeConversation.contact}</p>
            <p className="text-xs text-slate-500">{activeConversation.handle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={toneByChannel[activeConversation.channel]}>{activeConversation.channel}</Badge>
            <Badge tone="pink">{activeConversation.status}</Badge>
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {activeConversation.messages.map((message, index) => (
            <div key={`${message.text}-${index}`} className={cn("flex", message.from === "bot" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6",
                  message.from === "bot"
                    ? "bg-brand-500 text-white"
                    : "border border-white/10 bg-white/[0.06] text-slate-100"
                )}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
