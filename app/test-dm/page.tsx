import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { TestDmClient } from "@/components/TestDmClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireCurrentUser } from "@/lib/auth/session";

export default async function TestDmPage() {
  const user = await requireCurrentUser();

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <PageHeader
          eyebrow="Live preview"
          title="Test lead flow"
          description={`Preview the ${user.business.name} FAQ and lead capture flow.`}
        />
        <Suspense fallback={null}>
          <TestDmClient businessSlug={user.businessSlug} businessName={user.business.name} businessHandle={user.business.instagramHandle} />
        </Suspense>
      </div>
    </main>
  );
}
