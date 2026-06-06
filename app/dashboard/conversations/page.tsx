import { ConversationViewer } from "@/components/ConversationViewer";
import { PageHeader } from "@/components/ui/PageHeader";
import { getConversations } from "@/lib/db/data";
import { requireCurrentUser } from "@/lib/auth/session";

export default async function ConversationsPage() {
  const user = await requireCurrentUser();
  const conversations = await getConversations(user.businessSlug);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Conversations"
        description={`Inspect full ${user.business.name} lead capture threads and FAQ replies.`}
      />
      <ConversationViewer items={conversations} />
    </div>
  );
}
