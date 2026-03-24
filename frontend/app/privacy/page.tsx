import Link from "next/link";
import LandingNav from "@/components/LandingNav";

export default function PrivacyPage() {
  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen">
      <LandingNav />
      <div className="pt-32 pb-24 w-full px-6 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">Privacy Policy</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mb-10">Last updated: March 2026</p>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-600 dark:text-slate-400">
            {[
              {
                title: "1. Information We Collect",
                body: "We collect information you provide directly, including your name, email address, phone number, and property details when you register for an account. We also collect payment information processed through our payment provider, and usage data such as log files, IP addresses, and browser information.",
              },
              {
                title: "2. How We Use Your Information",
                body: "We use collected information to provide and improve our rental management services, process payments, send transactional notifications (rent receipts, invoice alerts, payment confirmations), generate analytics for your portfolio, and comply with legal obligations under Kenyan law.",
              },
              {
                title: "3. Data Sharing",
                body: "We do not sell your personal data. We share information only with payment processors necessary to facilitate transactions, cloud infrastructure providers who host our services under data processing agreements, and regulatory bodies when required by law.",
              },
              {
                title: "4. Payment Data",
                body: "Payment transactions are processed by our payment partner. We do not store full card details on our servers. Payment references and amounts are stored for reconciliation and audit purposes. Funds are routed directly to landlord accounts — we do not hold rent on your behalf.",
              },
              {
                title: "5. Tenant Data",
                body: "Landlords are responsible for obtaining tenant consent before entering KYC data (National ID, KRA PIN) into the system. This data is encrypted at rest and accessible only to the landlord of record and platform administrators.",
              },
              {
                title: "6. Data Retention",
                body: "We retain your account data for the duration of your subscription and up to 7 years thereafter for tax and legal compliance. You may request deletion of non-legally-required data by contacting us.",
              },
              {
                title: "7. Security",
                body: "We use HMAC-SHA512 webhook verification, JWT authentication with short-lived tokens, role-based access control, and encrypted database storage. Despite these measures, no system is perfectly secure and we cannot guarantee absolute security.",
              },
              {
                title: "8. Your Rights",
                body: "Under applicable Kenyan data protection law, you have the right to access, correct, or delete your personal data; object to processing; and data portability. Submit requests to info@avenasoftware.co.ke.",
              },
              {
                title: "9. Cookies",
                body: "We use essential cookies for authentication (JWT access token) and user preferences (theme). We do not use advertising or tracking cookies.",
              },
              {
                title: "10. Contact",
                body: "For privacy inquiries: info@avenasoftware.co.ke | +254 745 485 486 | Nairobi, Kenya.",
              },
            ].map((s) => (
              <div key={s.title}>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{s.title}</h2>
                <p className="leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center gap-6 text-sm">
            <Link href="/terms" className="text-emerald-600 dark:text-emerald-400 hover:underline">Terms of Service</Link>
            <Link href="/support" className="text-emerald-600 dark:text-emerald-400 hover:underline">Support</Link>
            <Link href="/" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">← Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
