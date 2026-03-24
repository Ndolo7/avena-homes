"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

interface PayInvoiceButtonProps {
  invoiceId: number;
  className?: string;
  label?: string;
}

export default function PayInvoiceButton({
  invoiceId,
  className,
  label = "Pay now",
}: PayInvoiceButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/payments/transactions/initialize/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ invoice_id: invoiceId }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.detail ?? "Failed to initialize payment.");
      }

      const payload = await res.json();
      const checkoutUrl = payload.authorization_url as string | undefined;
      if (!checkoutUrl) {
        throw new Error("Missing Paystack checkout URL.");
      }

      window.location.assign(checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className={
          className ??
          "inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white transition-colors"
        }
      >
        {loading ? "Redirecting..." : label}
      </button>

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
      )}
    </div>
  );
}

