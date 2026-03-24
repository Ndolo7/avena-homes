import Link from "next/link";
import Image from "next/image";
import LandingNav from "@/components/LandingNav";

// ─── Data ──────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0H5m14 0a2 2 0 01-2 2H7a2 2 0 01-2-2M9 7h6m-6 4h6m-2 4h2",
    title: "Portfolio Management",
    description:
      "Manage unlimited properties and units. Track occupancy, unit status, and rental income across your entire portfolio from one dashboard.",
    color: "emerald",
  },
  {
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    title: "Automated Invoicing",
    description:
      "Invoices are generated automatically on each billing day. Credit balances from overpayments are applied, overdue statuses update in real time.",
    color: "teal",
  },
  {
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    title: "Seamless Payments",
    description:
      "Funds flow directly to landlord accounts. Card, M-Pesa, and bank transfers — with webhook-driven ledger reconciliation in under 2 minutes.",
    color: "cyan",
  },
  {
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    title: "Smart Reconciliation",
    description:
      "Automatic matching of payments to invoices — exact, partial, overpayment, or orphaned. Admin queue for manual review with a full audit trail.",
    color: "violet",
  },
  {
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    title: "Real-time Analytics",
    description:
      "Live dashboards showing revenue trends, occupancy rates, and outstanding balances. Know the health of your portfolio at a glance.",
    color: "indigo",
  },
  {
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    title: "Bank-grade Security",
    description:
      "HMAC-SHA512 webhook verification, JWT authentication, role-based access, and encrypted data storage — security built in from day one.",
    color: "rose",
  },
];

const featureColors: Record<string, string> = {
  emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
  teal:    "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20",
  cyan:    "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
  violet:  "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20",
  indigo:  "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
  rose:    "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20",
};

const steps = [
  {
    step: "01",
    title: "Add your properties",
    description:
      "Register properties, create units, and set rent amounts. Payment subaccounts are linked per landlord so funds settle directly to your bank.",
    img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80&auto=format&fit=crop",
  },
  {
    step: "02",
    title: "Onboard tenants",
    description:
      "Create tenant profiles and active tenancies with KYC details. The system generates invoices automatically on each billing cycle.",
    img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80&auto=format&fit=crop",
  },
  {
    step: "03",
    title: "Collect rent effortlessly",
    description:
      "Tenants pay via card, M-Pesa, or bank transfer. Payments are reconciled in real time. You get notified the moment rent lands.",
    img: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80&auto=format&fit=crop",
  },
];

const testimonials = [
  {
    quote:
      "Before this, I was chasing rent on WhatsApp. Now I get instant notifications when payment comes in. The reconciliation queue is a lifesaver.",
    name: "Wanjiru M.",
    role: "Landlord · 12 units in Kilimani",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80&auto=format&fit=crop&crop=face",
  },
  {
    quote:
      "Funds go straight into my account. No middleman, no waiting. The credit balance system means overpayments carry forward automatically.",
    name: "David O.",
    role: "Property Manager · Westlands",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80&auto=format&fit=crop&crop=face",
  },
  {
    quote:
      "Real-time ledgers mean I always know exactly what's paid, what's owed. No spreadsheets, no chaos, no embarrassing phone calls.",
    name: "Amina K.",
    role: "Landlord · 3 properties in Nairobi",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&q=80&auto=format&fit=crop&crop=face",
  },
];

const stats = [
  { value: "500+", label: "Properties managed" },
  { value: "KES 50M+", label: "Rent collected" },
  { value: "98.4%", label: "Auto-reconciliation rate" },
  { value: "< 2 min", label: "Payment to ledger" },
];

const paymentMethods = [
  { label: "M-Pesa", icon: "📱" },
  { label: "Visa / Mastercard", icon: "💳" },
  { label: "Bank Transfer", icon: "🏦" },
  { label: "RTGS", icon: "⚡" },
];

// ─── Reusable Icon ────────────────────────────────────────────────────────────

function Ico({ d, className = "w-6 h-6" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-white dark:bg-slate-950 overflow-x-hidden">
      <LandingNav />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Base Image */}
        <div className="absolute inset-0 w-[55%]">
          <Image
            src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1920&q=70&auto=format&fit=crop"
            alt=""
            fill
            className="object-cover opacity-80 dark:opacity-80"
            priority
          />
        </div>
        {/* Layered background — begins with transparent and goes to white */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-white dark:from-transparent dark:via-slate-950 dark:to-slate-950" />
        <div className="absolute inset-0 hero-grid opacity-30 dark:opacity-100" />
        {/* Glow blobs */}
        <div className="absolute -top-60 -right-60 w-[600px] h-[600px] bg-emerald-400/10 dark:bg-emerald-500/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-60 -left-60 w-[500px] h-[500px] bg-teal-400/10 dark:bg-teal-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10 w-full px-6 lg:px-12 pt-28 pb-16 flex flex-col items-center">
          <div className="max-w-4xl w-full mx-auto text-center">
            {/* Badge */}
            {/* <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-8 animate-fade-in">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-slow" />
              Built for Kenyan landlords · by Avena Softwares
            </div> */}

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white leading-[1.05] mb-6 animate-slide-up">
              The smarter way to
              <span className="text-gradient block mt-2">manage rentals</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-10 leading-relaxed animate-slide-up">
              Automated invoicing, real-time ledgers, and seamless digital payments for
              Kenyan property owners — all in one modern platform.
            </p>

            <div className="flex flex-wrap gap-4 mb-16 animate-slide-up justify-center">
              <Link
                href="/get-started"
                className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/25"
              >
                Get started free
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900/10 dark:bg-white/10 hover:bg-slate-900/15 dark:hover:bg-white/15 border border-slate-900/20 dark:border-white/20 text-slate-900 dark:text-white font-semibold rounded-xl transition-all duration-200 backdrop-blur-sm"
              >
                Sign in to dashboard
              </Link>
            </div>

            {/* Stats strip */}
            <div className="flex flex-wrap gap-8 md:gap-12 animate-fade-in justify-center">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Property showcase image — right side, desktop only */}
        <div className="absolute right-0 top-0 bottom-0 w-[45%] hidden xl:block overflow-hidden z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-slate-950 to-transparent z-10 w-96" />
          <Image
            src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000&q=80&auto=format&fit=crop"
            alt="Modern apartment"
            fill
            className="object-cover opacity-60 dark:opacity-40"
            priority
          />
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 animate-bounce">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Payments strip ──────────────────────────────────────────────────── */}
      <div className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 py-5">
        <div className="w-full px-6 lg:px-12 flex flex-wrap items-center gap-4 md:gap-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 shrink-0">
            Accepted payments
          </span>
          <div className="flex flex-wrap gap-3">
            {paymentMethods.map((m) => (
              <div
                key={m.label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <span>{m.icon}</span>
                {m.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-32 bg-white dark:bg-slate-900 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-50 dark:bg-emerald-900/20 blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[30rem] h-[30rem] rounded-full bg-teal-50 dark:bg-teal-900/20 blur-3xl opacity-60 pointer-events-none" />

        <div className="relative w-full px-6 lg:px-12 max-w-[1400px] mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-widest mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Everything you need
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
              Built for serious landlords
            </h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed">
              From a single bedsitter to a 200-unit complex — Avena Homes scales with your portfolio at every stage.
            </p>
          </div>

          <div className="space-y-32">
            {/* Feature 1: Portfolio Management (Image Right) */}
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              <div className="flex-1 lg:pr-10">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-8 border border-emerald-200 dark:border-emerald-500/30 shadow-inner">
                  <Ico d={features[0].icon} className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                  Total <span className="text-emerald-500">visibility</span> into your properties
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  {features[0].description} Say goodbye to scattered spreadsheets and notebooks. Get a real-time bird&apos;s-eye view of your entire real estate empire.
                </p>
                <ul className="space-y-4">
                  {['Track occupancy & vacancies instantly', 'Manage unlimited properties and units', 'Centralized tenant document storage'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                      <span className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 aspect-[4/3] group">
                  <Image src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&auto=format&fit=crop" alt="Portfolio Management" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                </div>
              </div>
            </div>

            {/* Feature 2: Automated Invoicing (Image Left) */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
              <div className="flex-1 lg:pl-10">
                <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center mb-8 border border-teal-200 dark:border-teal-500/30 shadow-inner">
                  <Ico d={features[1].icon} className="w-7 h-7 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                  <span className="text-teal-500">Automated</span> billing that never sleeps
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  {features[1].description} Your tenants receive SMS and email invoices exactly when they are supposed to, without any manual intervention.
                </p>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-500" />
                  <p className="font-medium text-slate-900 dark:text-white mb-1">Invoice #INV-2026-001</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Sent automatically on 1st March</p>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-2">
                    <div className="bg-teal-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-bold text-right tracking-wider uppercase">PAID IN FULL</p>
                </div>
              </div>
              <div className="flex-1 w-full">
                <div className="relative justify-center lg:justify-start flex">
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 aspect-square w-full max-w-[500px] z-10 group">
                    <Image src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80&auto=format&fit=crop" alt="Automated Invoicing" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-teal-900/60 to-transparent" />
                  </div>
                  {/* Decorative offset card */}
                  <div className="absolute -bottom-8 -right-8 w-64 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 p-5 z-20 hidden md:block animate-float">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center"><Ico d="M12 6v6m0 0v6m0-6h6m-6 0H6" className="w-4 h-4 text-teal-600" /></div>
                      <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded">Just now</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Invoice Generated</p>
                    <p className="text-xs text-slate-500 mt-1">KES 35,000 to John Doe</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Seamless Payments (Image Right) */}
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              <div className="flex-1 lg:pr-10">
                <div className="w-14 h-14 rounded-2xl bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center mb-8 border border-cyan-200 dark:border-cyan-500/30 shadow-inner">
                  <Ico d={features[2].icon} className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                  Frictionless <span className="text-cyan-500">M-Pesa</span> & Bank payments
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  {features[2].description} Eliminate payment disputes and the dreaded "I sent the money" phone calls with our modern webhooks.
                </p>
                <div className="flex flex-wrap gap-3">
                  {['M-Pesa Express', 'Paybill', 'Visa', 'Mastercard', 'RTGS'].map(tag => (
                    <span key={tag} className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1 w-full">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 aspect-[4/3] group">
                  <Image src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80&auto=format&fit=crop" alt="Seamless Payments" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/60 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 shadow-2xl">
                      <Ico d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-10 h-10 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Features Grid (Bento style) */}
          <div className="mt-32 pt-20 border-t border-slate-200 dark:border-slate-800">
            <div className="text-center mb-16">
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">But wait, there's more</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Advanced features to make your property management experience buttery smooth.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {features.slice(3).map((f) => (
                <div key={f.title} className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 hover:-translate-y-2 transition-transform duration-300">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-sm border ${featureColors[f.color]}`}>
                    <Ico d={f.icon} />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{f.title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Dashboard preview ──────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <div className="w-full px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm uppercase tracking-widest mb-3">
                Real-time insights
              </p>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">
                Every payment, every unit, every lease — at a glance
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg mb-8 leading-relaxed">
                Your dashboard shows portfolio occupancy, outstanding balances,
                credit balances, and a live reconciliation queue — all updating in real time.
              </p>
              <ul className="space-y-3">
                {[
                  "Live payment webhook reconciliation",
                  "Automated invoice generation on billing day",
                  "Overpayment credit carried to next invoice",
                  "HMAC-verified payment signatures",
                  "Role-based access for landlords, managers, and admins",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3 text-emerald-600 dark:text-emerald-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  href="/get-started"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                >
                  Start your free account
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Mockup image */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-300/30 dark:shadow-slate-900/50">
                <Image
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80&auto=format&fit=crop"
                  alt="Dashboard analytics"
                  width={900}
                  height={600}
                  className="w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                  <Ico d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Payment reconciled</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">KES 45,000</p>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Occupancy rate</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">94%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-32 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        <div className="w-full px-6 lg:px-12 max-w-[1200px] mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-20 animate-slide-up">
            <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase tracking-widest mb-3">
              Simple setup
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Up and running in minutes
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              No technical expertise needed. If you can use a smartphone, you can manage your entire portfolio on Avena Homes.
            </p>
          </div>

          <div className="relative">
            {/* The vertical flow line connecting the dots */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-100 via-teal-200 to-cyan-100 dark:from-emerald-900/40 dark:via-teal-800/40 dark:to-cyan-900/40 -translate-x-1/2 rounded-full z-0" />
            
            <div className="space-y-16 md:space-y-24 relative z-10">
              {steps.map((s, i) => (
                <div key={s.step} className="group relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0">
                  {/* Left or Right content depending on index */}
                  <div className={`w-full md:w-5/12 ${i % 2 === 0 ? 'md:order-1 text-left md:text-right md:pr-12' : 'md:order-3 text-left md:pl-12'}`}>
                    <div className={`inline-block px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-emerald-600 dark:text-emerald-400 mb-4 ${i % 2 === 0 ? 'md:mr-0 md:ml-auto' : ''}`}>
                      Step {s.step}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">{s.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                      {s.description}
                    </p>
                  </div>

                  {/* The central dot */}
                  <div className="hidden md:flex flex-col items-center justify-center order-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-50 dark:border-slate-950 z-20 shadow-[0_0_0_4px_rgba(16,185,129,0.1)] dark:shadow-[0_0_0_4px_rgba(16,185,129,0.05)] group-hover:scale-110 transition-transform duration-300">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-inner" />
                  </div>

                  {/* Image container */}
                  <div className={`w-full md:w-5/12 ${i % 2 === 0 ? 'md:order-3 md:pl-12' : 'md:order-1 md:pr-12'}`}>
                    <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 group-hover:-translate-y-2 transition-transform duration-500">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.img}
                        alt={s.title}
                        className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-emerald-900/10 dark:bg-emerald-900/20 mix-blend-multiply group-hover:opacity-0 transition-opacity duration-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* End of flow dot */}
            <div className="hidden md:flex items-center justify-center absolute left-1/2 bottom-0 translate-y-full -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-b from-cyan-100 to-transparent dark:from-cyan-900/40 z-0">
              <div className="w-2 h-2 rounded-full bg-cyan-400 dark:bg-cyan-500 opacity-50" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Kenya Market Section ────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950">
        <div className="w-full px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <div className="order-2 lg:order-1 relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
              <Image
                src="https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=900&q=80&auto=format&fit=crop"
                alt="Nairobi skyline"
                width={900}
                height={600}
                className="w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white text-sm font-medium">Kenya&apos;s real estate market is growing fast.</p>
                <p className="text-white/70 text-xs mt-0.5">Avena Homes is built to keep pace with it.</p>
              </div>
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm uppercase tracking-widest mb-3">
                Made for Kenya
              </p>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">
                Built around how Kenyans actually pay rent
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg mb-8 leading-relaxed">
                With over 80% of Kenyan transactions processed via M-Pesa, manual reconciliation is the biggest pain point for landlords. Avena Homes automates the entire flow — from invoice to ledger — in minutes.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { val: "3M+", label: "Rental units in Kenya" },
                  { val: "80%", label: "Mobile money penetration" },
                  { val: "KES 2T+", label: "Annual rental market" },
                  { val: "0", label: "Spreadsheets needed" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stat.val}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-2xl mb-16">
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm uppercase tracking-widest mb-3">
              Trusted by landlords
            </p>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white">
              What our users are saying
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-amber-400">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <Image src={t.avatar} alt={t.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden bg-emerald-600 dark:bg-slate-900">
        <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-emerald-950/40 dark:to-transparent" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 dark:bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 dark:bg-teal-500/10 rounded-full blur-3xl" />

        <div className="relative w-full px-6 lg:px-12 text-center">
          <p className="text-emerald-100 dark:text-emerald-400 font-semibold text-sm uppercase tracking-widest mb-4">
            Start today
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to modernize your portfolio?
          </h2>
          <p className="text-emerald-100 dark:text-slate-400 text-xl mb-10 max-w-2xl mx-auto">
            Join hundreds of Kenyan landlords who&apos;ve automated their rent collection.
            No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/get-started"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-700 dark:bg-emerald-500 dark:text-slate-950 font-bold rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-black/20"
            >
              Get started free
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-8 py-4 border border-white/40 text-white dark:border-white/20 hover:bg-white/10 font-semibold rounded-xl transition-all duration-200"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-white/5">
        <div className="w-full px-6 lg:px-12 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Brand column */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <span className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                    <path d="M9 21V12h6v9" fill="white" opacity="0.6" />
                  </svg>
                </span>
                <span className="text-slate-900 dark:text-white font-bold text-lg">
                  avena<span className="text-emerald-600">homes</span>
                </span>
              </Link>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 max-w-xs">
                The modern rental management platform for Kenyan landlords. Automated invoicing, real-time ledgers, and seamless digital payments.
              </p>
              {/* Social icons */}
              <div className="flex gap-3">
                {[
                  { label: "Facebook", d: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" },
                  { label: "Twitter/X", d: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" },
                  { label: "LinkedIn", d: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" },
                ].map((s) => (
                  <a
                    key={s.label}
                    href="https://www.avenasoftware.co.ke/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-all"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d={s.d} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Product</h4>
              <ul className="space-y-3">
                {[
                  { label: "Features", href: "/#features" },
                  { label: "Pricing", href: "/pricing" },
                  { label: "How it works", href: "/#how-it-works" },
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "Get started", href: "/get-started" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Company</h4>
              <ul className="space-y-3">
                {[
                  { label: "About Avena Softwares", href: "https://www.avenasoftware.co.ke/" },
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Support", href: "/support" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                      target={l.href.startsWith("http") ? "_blank" : undefined}
                      rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Contact</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Ico d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <a href="tel:+254745485486" className="text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    +254 745 485 486
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Ico d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <a href="mailto:info@avenasoftware.co.ke" className="text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors break-all">
                    info@avenasoftware.co.ke
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Ico d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Nairobi, Kenya<br />
                    <span className="text-xs text-slate-400 dark:text-slate-500">Mon–Fri · 8AM – 5PM</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400 dark:text-slate-500">
              &copy; {new Date().getFullYear()} Avena Homes. A product of{" "}
              <a
                href="https://www.avenasoftware.co.ke/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Avena Softwares
              </a>
              . All rights reserved.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-600">
              Secure · Reliable · Made in Kenya 🇰🇪
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
