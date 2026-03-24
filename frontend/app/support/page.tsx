import Link from "next/link";
import LandingNav from "@/components/LandingNav";

export default function SupportPage() {
  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen">
      <LandingNav />
      <div className="pt-32 pb-24 w-full px-6 lg:px-12">
        <div className="max-w-2xl">
          <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm uppercase tracking-widest mb-3">Support</p>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">How can we help?</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg mb-10">
            Our team is available Monday – Friday, 8AM to 5PM EAT. Reach us via any of the channels below.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: "📧", label: "Email us", value: "info@avenasoftware.co.ke", href: "mailto:info@avenasoftware.co.ke" },
              { icon: "📞", label: "Call us", value: "+254 745 485 486", href: "tel:+254745485486" },
            ].map((c) => (
              <a key={c.label} href={c.href} className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-colors">
                <span className="text-2xl">{c.icon}</span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{c.label}</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">{c.value}</p>
                </div>
              </a>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">← Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
