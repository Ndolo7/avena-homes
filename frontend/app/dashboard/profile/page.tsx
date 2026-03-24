"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";

export default function ProfilePage() {
  const { theme, toggleTheme } = useTheme();
  const [displayName, setDisplayName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [initials, setInitials] = useState("U");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("user_display_name") || "";
    const email = localStorage.getItem("user_email") || "";
    const phone = localStorage.getItem("user_phone") || "";
    setDisplayName(name);
    setUserEmail(email);
    setPhoneNumber(phone);
    const parts = name.trim().split(" ");
    setInitials(
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : (parts[0]?.[0] ?? "U").toUpperCase(),
    );
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("user_phone", phoneNumber);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your personal details and account preferences.
        </p>
      </div>

      {/* Avatar card */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold select-none shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-bold text-slate-900 dark:text-white text-lg">{displayName || "—"}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{userEmail || "—"}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{phoneNumber || "—"}</p>
          <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Landlord
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal info */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">Personal Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { id: "first_name", label: "First name", placeholder: "John" },
              { id: "last_name", label: "Last name", placeholder: "Kamau" },
            ].map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {f.label}
                </label>
                <input
                  id={f.id}
                  type="text"
                  placeholder={f.placeholder}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                />
              </div>
            ))}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              defaultValue={userEmail}
              readOnly
              className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 opacity-70 cursor-not-allowed focus:outline-none transition-colors"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Email cannot be changed here. Contact support.</p>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+254 7XX XXX XXX"
              className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">Appearance</h2>
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
                  onClick={() => { if (theme !== t) toggleTheme(); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    theme === t
                      ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
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
        </div>

        {/* Change password */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">Change Password</h2>
          {[
            { id: "cur_pw", label: "Current password" },
            { id: "new_pw", label: "New password" },
            { id: "conf_pw", label: "Confirm new password" },
          ].map((f) => (
            <div key={f.id}>
              <label htmlFor={f.id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {f.label}
              </label>
              <input
                id={f.id}
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
              />
            </div>
          ))}
        </div>

        {/* Save bar */}
        <div className="flex items-center justify-between">
          <p className={`text-sm transition-opacity duration-300 ${saved ? "opacity-100 text-emerald-600 dark:text-emerald-400" : "opacity-0"}`}>
            ✓ Profile saved
          </p>
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-md hover:shadow-emerald-500/20"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
