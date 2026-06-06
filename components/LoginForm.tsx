"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Toast } from "@/components/ui/Toast";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@powerfit.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setToast("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Login failed.");
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed.";
      setError(message);
      setToast(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {toast ? <Toast message={toast} tone="error" /> : null}
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-300">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-white/10 bg-ink-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-300">Password</span>
        <div className="flex items-center rounded-lg border border-white/10 bg-ink-950 px-4 py-3 focus-within:border-brand-500">
          <LockKeyhole className="mr-3 h-4 w-4 text-slate-500" />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none"
          />
        </div>
      </label>
      {error ? <p className="text-sm text-amber">{error}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Signing in" : "Open dashboard"}
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
