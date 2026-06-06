import { Suspense } from "react";
import { Sidebar } from "@/components/Sidebar";
import { requireCurrentUser } from "@/lib/auth/session";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireCurrentUser();

  return (
    <div className="min-h-screen">
      <Suspense fallback={null}>
        <Sidebar businessName={user.business.name} userName={user.name} />
      </Suspense>
      <main className="px-4 py-6 sm:px-6 lg:ml-72 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
