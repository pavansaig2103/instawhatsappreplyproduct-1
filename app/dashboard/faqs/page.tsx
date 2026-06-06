import { FaqManager } from "@/components/FaqManager";
import { PageHeader } from "@/components/ui/PageHeader";
import { getFaqs } from "@/lib/db/data";
import { requireCurrentUser } from "@/lib/auth/session";

export default async function FaqsPage() {
  const user = await requireCurrentUser();
  const faqs = await getFaqs(user.businessSlug);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Knowledge base"
        title="FAQs"
        description={`Manage the answers that power the ${user.business.name} lead assistant.`}
      />
      <FaqManager items={faqs} businessSlug={user.businessSlug} />
    </div>
  );
}
