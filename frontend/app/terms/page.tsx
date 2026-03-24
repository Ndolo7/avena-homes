import Link from "next/link";
import LandingNav from "@/components/LandingNav";

export default function TermsPage() {
  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen">
      <LandingNav />
      <div className="pt-32 pb-24 w-full px-6 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">Terms of Service</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mb-10">Last updated: March 2026</p>

          <div className="space-y-8 text-slate-600 dark:text-slate-400">
            {[
              {
                title: "1. Acceptance of Terms",
                body: "By accessing or using Avena Homes, a service operated by Avena Softwares (\"we\", \"us\", \"our\"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform.",
              },
              {
                title: "2. Eligibility",
                body: "You must be at least 18 years old and legally authorized to operate rental properties in Kenya to use this service. By creating an account, you represent that you meet these requirements.",
              },
              {
                title: "3. Account Registration",
                body: "You are responsible for maintaining the confidentiality of your credentials. You agree to notify us immediately of any unauthorized access. Each account represents one landlord or property manager. Sharing accounts is prohibited.",
              },
              {
                title: "4. Subscription and Billing",
                body: "The Starter plan is free with limited features. Paid plans are billed monthly or annually as selected. Payments are processed in KES. We reserve the right to modify pricing with 30 days' notice. No refunds are issued for partial months.",
              },
              {
                title: "5. Payment Processing",
                body: "Rent payments collected through the platform are processed by our payment partner. Funds are routed directly to your registered bank account or M-Pesa. Settlement timelines depend on your payment provider. We are not liable for delays caused by third-party payment processors.",
              },
              {
                title: "6. Tenant Data Responsibility",
                body: "You, as the landlord, are the data controller for tenant information entered into the system. You are responsible for obtaining lawful consent to collect and process tenant KYC data, and for complying with the Data Protection Act (Kenya, 2019).",
              },
              {
                title: "7. Prohibited Uses",
                body: "You may not use Avena Homes for illegal rental practices, money laundering, fraudulent invoicing, or any purpose that violates Kenyan law. Violation may result in immediate account suspension.",
              },
              {
                title: "8. Service Availability",
                body: "We target 99.5% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be communicated 24 hours in advance. We are not liable for losses resulting from downtime.",
              },
              {
                title: "9. Intellectual Property",
                body: "All platform content, software, and trademarks are owned by Avena Softwares. You retain ownership of your property and tenant data. By using the service, you grant us a limited license to process your data to provide the service.",
              },
              {
                title: "10. Termination",
                body: "You may cancel your account at any time. We reserve the right to suspend or terminate accounts that violate these terms. Upon termination, you may export your data within 30 days.",
              },
              {
                title: "11. Limitation of Liability",
                body: "To the maximum extent permitted by law, Avena Softwares shall not be liable for indirect, incidental, or consequential damages. Our total liability is limited to the amount paid by you in the 3 months preceding the claim.",
              },
              {
                title: "12. Governing Law",
                body: "These terms are governed by the laws of Kenya. Any disputes shall be resolved in the courts of Nairobi County, Kenya.",
              },
              {
                title: "13. Contact",
                body: "Questions about these terms: info@avenasoftware.co.ke | +254 745 485 486 | Nairobi, Kenya.",
              },
            ].map((s) => (
              <div key={s.title}>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{s.title}</h2>
                <p className="leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center gap-6 text-sm">
            <Link href="/privacy" className="text-emerald-600 dark:text-emerald-400 hover:underline">Privacy Policy</Link>
            <Link href="/support" className="text-emerald-600 dark:text-emerald-400 hover:underline">Support</Link>
            <Link href="/" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">← Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
