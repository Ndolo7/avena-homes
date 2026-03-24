import Link from "next/link";
import LandingNav from "@/components/LandingNav";

const pricingFactors = [
  {
    title: "Number of active units",
    description:
      "Your base subscription is primarily driven by the total units you actively manage on the platform.",
  },
  {
    title: "Portfolio complexity",
    description:
      "Multi-property and multi-landlord setups, advanced tenancy structures, and custom billing rules affect scope.",
  },
  {
    title: "Payment volume",
    description:
      "Monthly transaction and reconciliation volume helps size the right operations and support package for your team.",
  },
  {
    title: "Data migration needs",
    description:
      "If you need onboarding support for historical invoices, tenants, and ledgers, migration effort is included in pricing.",
  },
  {
    title: "Integrations and reporting",
    description:
      "Custom integrations, exports, and specialized reports are priced based on implementation and ongoing maintenance.",
  },
  {
    title: "Support level",
    description:
      "Standard support is included. Priority response windows, SLAs, and dedicated account support are available as add-ons.",
  },
];

const included = [
  "Automated recurring invoicing",
  "Paystack-powered rent collection",
  "Smart payment reconciliation",
  "Live tenant and unit ledgers",
  "Role-based access control",
  "Secure webhook verification (HMAC-SHA512)",
  "CSV/PDF exports",
  "Core onboarding support",
];

const faqs = [
  {
    q: "Do you have fixed packages?",
    a: "No. We tailor pricing to your portfolio size, payment volume, and support requirements so you only pay for what you need.",
  },
  {
    q: "Is there any per-transaction commission?",
    a: "Avena does not take rent commissions. Standard payment processor charges by Paystack still apply.",
  },
  {
    q: "How fast can we get a quote?",
    a: "Most teams receive a custom quote within one business day after sharing portfolio details.",
  },
  {
    q: "Can pricing change as we grow?",
    a: "Yes. Pricing is reviewed when your unit count, workflows, or support scope changes significantly.",
  },
  {
    q: "Can you support enterprise or agency rollouts?",
    a: "Yes. We provide custom onboarding, migration support, and implementation plans for larger deployments.",
  },
];

export default function PricingPage() {
  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen">
      <LandingNav />

      {/* Header */}
      <section className="pt-32 pb-12 text-center px-6">
        <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm uppercase tracking-widest mb-3">
          Custom pricing
        </p>
        <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
          Pricing built around your portfolio
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto">
          No rigid tiers. We price based on your units, operations, and support needs so your team gets the right setup from day one.
        </p>
      </section>

      {/* Pricing factors */}
      <section className="w-full px-6 lg:px-12 pb-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            What determines your price
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pricingFactors.map((factor) => (
              <div
                key={factor.title}
                className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5"
              >
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{factor.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Included */}
      <section className="w-full px-6 lg:px-12 pb-16">
        <div className="max-w-6xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5">
            Included in every subscription
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {included.map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate-700 dark:text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full px-6 lg:px-12 pb-24">
        <div className="max-w-5xl mx-auto rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-8 md:p-10 text-white">
          <p className="text-emerald-100 text-sm font-semibold uppercase tracking-widest mb-3">
            Get your quote
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Contact us for custom pricing
          </h2>
          <p className="text-emerald-50/90 max-w-2xl mb-7">
            Share your unit count, number of properties, and support needs. We will send a tailored proposal with clear pricing and onboarding scope.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:info@avenasoftware.co.ke?subject=Avena%20Homes%20Custom%20Pricing"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white text-emerald-700 font-bold hover:bg-emerald-50 transition-colors"
            >
              Contact us
            </a>
            <Link
              href="/get-started"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-white/40 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              Start onboarding
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="w-full px-6 lg:px-12 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer strip */}
      <div className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-8 px-6 text-center">
        <p className="text-sm text-slate-400 dark:text-slate-500">
          &copy; {new Date().getFullYear()} Avena Homes · A product of{" "}
          <a href="https://www.avenasoftware.co.ke/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline">
            Avena Softwares
          </a>
        </p>
      </div>
    </div>
  );
}
