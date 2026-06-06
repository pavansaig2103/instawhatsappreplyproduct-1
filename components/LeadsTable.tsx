import { UsersRound } from "lucide-react";
import type { UiLead } from "@/lib/db/data";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

const toneByStatus = {
  Hot: "pink",
  Warm: "amber",
  Open: "green",
  Nurture: "slate"
} as const;

const toneByChannel = {
  Instagram: "pink",
  WhatsApp: "green"
} as const;

type LeadsTableProps = {
  items?: UiLead[];
};

export function LeadsTable({ items = [] }: LeadsTableProps) {
  if (!items.length) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-white/[0.05] text-brand-500">
          <UsersRound className="h-5 w-5" />
        </div>
        <h3 className="mt-4 font-semibold text-white">No leads yet</h3>
        <p className="mt-2 text-sm text-slate-400">Complete a Test DM lead capture flow and the lead will appear here.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-4 font-medium">Lead</th>
              <th className="px-5 py-4 font-medium">Source</th>
              <th className="px-5 py-4 font-medium">Intent</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium">Value</th>
              <th className="px-5 py-4 font-medium">Last seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {items.map((lead) => (
                <tr key={lead.handle} className="text-slate-300">
                  <td className="px-5 py-4">
                    <div className="font-medium text-white">{lead.name}</div>
                    <div className="text-xs text-slate-500">{lead.handle}</div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={toneByChannel[lead.channel]}>{lead.channel}</Badge>
                  </td>
                  <td className="px-5 py-4">{lead.intent}</td>
                  <td className="px-5 py-4">
                    <Badge tone={toneByStatus[lead.status as keyof typeof toneByStatus]}>{lead.status}</Badge>
                  </td>
                  <td className="px-5 py-4 font-medium text-white">{lead.value}</td>
                  <td className="px-5 py-4">{lead.lastSeen}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
