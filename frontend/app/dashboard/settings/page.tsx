"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_BASE_URL ??
  "http://localhost:8000/api";

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          {description}
        </p>
      </div>
      <div className="md:col-span-2">
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

function Field({
  label,
  id,
  type = "text",
  defaultValue,
  value,
  onChange,
  placeholder,
  readOnly,
}: {
  label: string;
  id: string;
  type?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type={type}
        defaultValue={defaultValue}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`
          w-full px-4 py-2.5 rounded-xl text-sm
          border border-slate-200 dark:border-slate-600
          bg-white dark:bg-slate-900
          text-slate-900 dark:text-white
          placeholder-slate-400 dark:placeholder-slate-500
          focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
          transition-colors
          ${readOnly ? "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800" : ""}
        `}
      />
    </div>
  );
}

function splitDisplayName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  enabled,
  onChange,
  label,
  description,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`
          relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-emerald-500/50
          ${enabled ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}
        `}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [notifications, setNotifications] = useState({
    paymentReceived: true,
    invoiceGenerated: true,
    overdueAlert: true,
    orphanAlert: true,
    weeklyDigest: false,
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedDisplayName = localStorage.getItem("user_display_name") || "";
    const storedEmail = localStorage.getItem("user_email") || "";
    const storedPhone = localStorage.getItem("user_phone") || "";

    const parsedStoredName = splitDisplayName(storedDisplayName);
    setProfile((prev) => ({
      ...prev,
      firstName: parsedStoredName.firstName,
      lastName: parsedStoredName.lastName,
      email: storedEmail,
      phone: storedPhone,
    }));

    if (!token) return;

    void (async () => {
      try {
        const res = await fetch(`${API_BASE}/accounts/me/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });
        if (!res.ok) return;

        const me = await res.json();
        const nextFirstName = (me.first_name ?? "").trim();
        const nextLastName = (me.last_name ?? "").trim();
        const nextEmail = (me.email ?? "").trim();
        const nextDisplayName = `${nextFirstName} ${nextLastName}`.trim();

        setProfile((prev) => ({
          ...prev,
          firstName: nextFirstName,
          lastName: nextLastName,
          email: nextEmail,
        }));

        if (nextDisplayName) localStorage.setItem("user_display_name", nextDisplayName);
        if (nextEmail) localStorage.setItem("user_email", nextEmail);
      } catch {
        // Keep local values if profile fetch fails.
      }
    })();
  }, []);

  const profileInitial = (profile.firstName || profile.email || "U").charAt(0).toUpperCase();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, POST to /api/accounts/profile/
    localStorage.setItem("user_phone", profile.phone);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your account, notifications, and platform preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Divider */}
        <div className="border-t border-slate-200 dark:border-slate-700/60" />

        {/* Profile */}
        <Section
          title="Profile"
          description="Your personal information shown across the platform."
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold select-none">
              {profileInitial}
            </div>
            <div>
              <button
                type="button"
                className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                Change avatar
              </button>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">JPG, PNG up to 2 MB</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                {profile.phone || "No phone number set"}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="First name"
              id="first_name"
              value={profile.firstName}
              onChange={(value) => setProfile((prev) => ({ ...prev, firstName: value }))}
            />
            <Field
              label="Last name"
              id="last_name"
              value={profile.lastName}
              onChange={(value) => setProfile((prev) => ({ ...prev, lastName: value }))}
            />
          </div>
          <Field label="Email address" id="email" type="email" value={profile.email} readOnly />
          <Field
            label="Phone number"
            id="phone"
            type="tel"
            value={profile.phone}
            onChange={(value) => setProfile((prev) => ({ ...prev, phone: value }))}
            placeholder="+254 7XX XXX XXX"
          />
        </Section>

        <div className="border-t border-slate-200 dark:border-slate-700/60" />

        {/* Appearance */}
        <Section
          title="Appearance"
          description="Customize how the dashboard looks for you."
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Theme</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Currently: {theme === "dark" ? "Dark mode" : "Light mode"}
              </p>
            </div>
            <div className="flex gap-2">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    if (theme !== t) toggleTheme();
                  }}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all
                    ${
                      theme === t
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                    }
                  `}
                >
                  {t === "light" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <div className="border-t border-slate-200 dark:border-slate-700/60" />

        {/* Notifications */}
        <Section
          title="Notifications"
          description="Choose which events trigger email and in-app alerts."
        >
          <div className="space-y-5">
            <Toggle
              enabled={notifications.paymentReceived}
              onChange={(v) => setNotifications((n) => ({ ...n, paymentReceived: v }))}
              label="Payment received"
              description="Alert when a Paystack payment is reconciled to an invoice."
            />
            <Toggle
              enabled={notifications.invoiceGenerated}
              onChange={(v) => setNotifications((n) => ({ ...n, invoiceGenerated: v }))}
              label="Invoice generated"
              description="Alert when monthly invoices are created for active tenancies."
            />
            <Toggle
              enabled={notifications.overdueAlert}
              onChange={(v) => setNotifications((n) => ({ ...n, overdueAlert: v }))}
              label="Overdue invoices"
              description="Daily alert when invoices pass their due date."
            />
            <Toggle
              enabled={notifications.orphanAlert}
              onChange={(v) => setNotifications((n) => ({ ...n, orphanAlert: v }))}
              label="Orphaned payment alert"
              description="Alert when a webhook payment cannot be auto-reconciled."
            />
            <Toggle
              enabled={notifications.weeklyDigest}
              onChange={(v) => setNotifications((n) => ({ ...n, weeklyDigest: v }))}
              label="Weekly portfolio digest"
              description="Summary email every Monday with occupancy and payment stats."
            />
          </div>
        </Section>

        <div className="border-t border-slate-200 dark:border-slate-700/60" />

        {/* Security */}
        <Section
          title="Security"
          description="Update your password and manage session access."
        >
          <Field label="Current password" id="current_password" type="password" placeholder="••••••••" />
          <Field label="New password" id="new_password" type="password" placeholder="••••••••" />
          <Field label="Confirm new password" id="confirm_password" type="password" placeholder="••••••••" />
        </Section>

        {/* Save bar */}
        <div className="flex items-center justify-between pt-4">
          <p className={`text-sm transition-opacity duration-300 ${saved ? "opacity-100 text-emerald-600 dark:text-emerald-400" : "opacity-0"}`}>
            ✓ Settings saved
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-md hover:shadow-emerald-500/20"
            >
              Save changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
