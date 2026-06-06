import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-ink-900/80 p-6 shadow-glow backdrop-blur">
        <div className="mb-8">
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-brand-500 text-white">
            <Sparkles className="h-6 w-6" />
          </span>
          <h1 className="mt-6 text-3xl font-semibold text-white">Welcome back</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Sign in to manage automated replies, leads, conversations, and FAQs.
          </p>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}
