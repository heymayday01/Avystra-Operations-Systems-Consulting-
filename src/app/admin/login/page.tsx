"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";
import AvystraLogo from "@/components/avystra/AvystraLogo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.success) {
        setError(
          res.status === 429
            ? "Too many attempts. Please try again later."
            : "Invalid credentials."
        );
        setSubmitting(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-bg px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <AvystraLogo size="md" showSubtitle />
        </div>

        <div className="hero-card-premium rounded-[22px] p-6 sm:p-8">
          <h1 className="font-display text-lg font-bold uppercase tracking-[0.08em] text-navy-deep">
            Admin Sign In
          </h1>
          <p className="mt-1.5 font-sans text-sm text-slate-text">
            Authorized access only.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 block font-display text-[11px] font-bold uppercase tracking-[0.1em] text-navy-deep/70"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-deep/40" />
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  className="focus-ring w-full rounded-xl border border-navy-deep/15 bg-white/80 py-2.5 pl-10 pr-3 font-sans text-sm text-navy-deep placeholder:text-navy-deep/30 disabled:opacity-60"
                  placeholder="you@avystra.co.in"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 block font-display text-[11px] font-bold uppercase tracking-[0.1em] text-navy-deep/70"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-deep/40" />
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  className="focus-ring w-full rounded-xl border border-navy-deep/15 bg-white/80 py-2.5 pl-10 pr-3 font-sans text-sm text-navy-deep placeholder:text-navy-deep/30 disabled:opacity-60"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 font-sans text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="hero-btn-primary focus-ring flex w-full items-center justify-center gap-2 rounded-full py-3 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Signing In…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
