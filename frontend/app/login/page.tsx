"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { storeSessionTokens } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
type UserRole = "admin" | "landlord" | "tenant";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Invalid email or password. Please try again.");
        return;
      }

      const { access, refresh } = await res.json();

      // Resolve user profile for role-aware routing and navbar display.
      let role: UserRole = "landlord";
      let profileEmail = email;
      let displayName = email
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      try {
        const meRes = await fetch(`${API_BASE}/accounts/me/`, {
          headers: { Authorization: `Bearer ${access}` },
        });
        if (meRes.ok) {
          const me = await meRes.json();
          role = (me.role as UserRole) ?? role;
          profileEmail = me.email ?? profileEmail;
          const fullName = `${me.first_name ?? ""} ${me.last_name ?? ""}`.trim();
          if (fullName) displayName = fullName;
        }
      } catch {
        // Keep fallback values if profile fetch fails.
      }

      localStorage.setItem("user_email", profileEmail);
      localStorage.setItem("user_display_name", displayName);
      localStorage.setItem("user_role", role);
      storeSessionTokens(access, refresh, role);

      const nextParam = new URLSearchParams(window.location.search).get("next");
      const defaultRoute = role === "tenant" ? "/dashboard/pay-rent" : "/dashboard";
      const next =
        role === "tenant" && (!nextParam || nextParam === "/dashboard")
          ? defaultRoute
          : (nextParam ?? defaultRoute);
      router.push(next);
      router.refresh();
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col w-[480px] shrink-0 relative overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=960&q=80&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-emerald-950/60" />
        <div className="absolute inset-0 hero-grid opacity-30" />

        {/* Glow */}
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />

        <div className="relative p-10 flex flex-col justify-between h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                <path d="M9 21V12h6v9" fill="white" opacity="0.6" />
              </svg>
            </span>
            <span className="text-white font-bold text-xl">
              avena<span className="text-emerald-400">homes</span>
            </span>
          </Link>

          {/* Quote */}
          <div>
            <p className="text-xl font-medium text-white leading-relaxed mb-6">
              &ldquo;The most stress-free rent collection I&apos;ve ever used. My money is
              in my account before tenants even WhatsApp me.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/30 border border-emerald-500/40 flex items-center justify-center">
                <span className="text-emerald-300 font-bold text-sm">NK</span>
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Njeri K.</p>
                <p className="text-slate-400 text-xs">Landlord, 8 units in Karen</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "500+", label: "Properties" },
              { value: "98%", label: "Reconciled" },
              { value: "T+1", label: "Settlement" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"
              >
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-950">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="lg:hidden flex items-center gap-2"
          >
            <span className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              </svg>
            </span>
            <span className="text-slate-900 dark:text-white font-bold">
              avena<span className="text-emerald-500">homes</span>
            </span>
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome back</h1>
              <p className="text-slate-500 dark:text-slate-400">
                Sign in to your Avena Homes dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="
                    w-full px-4 py-3 rounded-xl text-sm
                    bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                    text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
                    transition-colors
                  "
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="
                      w-full px-4 py-3 pr-11 rounded-xl text-sm
                      bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                      text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500
                      focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
                      transition-colors
                    "
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="
                  w-full py-3 rounded-xl text-sm font-bold
                  bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed
                  text-slate-950 transition-all duration-200
                  hover:shadow-lg hover:shadow-emerald-500/25
                  flex items-center justify-center gap-2
                "
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign in to dashboard"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/get-started" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors">
                Get started free
              </Link>
            </p>

            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
              <p className="text-center text-xs text-slate-400 dark:text-slate-600">
                Protected by HMAC-SHA512 · JWT authentication · Payment-certified
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
