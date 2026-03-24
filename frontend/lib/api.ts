/**
 * Typed API client for avena-homes backend.
 *
 * Uses the native fetch API.
 * JWT access token is read from localStorage and attached to every request.
 * Access token is auto-refreshed from refresh token when needed.
 */
import type {
  DashboardSummary,
  Invoice,
  OrphanedTransaction,
  PaginatedResponse,
} from "./types";
import { clearAuthStorage, getValidAccessToken, refreshAccessToken } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const runRequest = async (token: string | null): Promise<Response> => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    return fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  };

  let token = await getValidAccessToken();
  let response = await runRequest(token);

  if (response.status === 401) {
    token = await refreshAccessToken();
    if (!token) {
      clearAuthStorage();
      throw Object.assign(new Error("Session expired. Please sign in again."), {
        status: 401,
        body: { detail: "Session expired" },
      });
    }
    response = await runRequest(token);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(
      (errorBody as { detail?: string }).detail ??
        `Request failed with status ${response.status}`,
    );
    (error as Error & { status: number; body: unknown }).status = response.status;
    (error as Error & { status: number; body: unknown }).body = errorBody;
    throw error;
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  getSummary: (): Promise<DashboardSummary> =>
    apiFetch("/payments/dashboard/summary/"),
};

// ─── Invoices ─────────────────────────────────────────────────────────────────

export const invoicesApi = {
  list: (params?: { status?: string; page?: number }): Promise<PaginatedResponse<Invoice>> => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.page) qs.set("page", String(params.page));
    return apiFetch(`/payments/invoices/?${qs.toString()}`);
  },

  get: (id: number): Promise<Invoice> => apiFetch(`/payments/invoices/${id}/`),
};

// ─── Orphaned Transactions ────────────────────────────────────────────────────

export const orphansApi = {
  list: (params?: {
    status?: string;
    page?: number;
  }): Promise<PaginatedResponse<OrphanedTransaction>> => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.page) qs.set("page", String(params.page));
    return apiFetch(`/payments/orphans/?${qs.toString()}`);
  },

  get: (id: number): Promise<OrphanedTransaction> =>
    apiFetch(`/payments/orphans/${id}/`),

  resolve: (
    id: number,
    payload: { tenancy_id: number; resolution_notes?: string },
  ): Promise<{ status: string; orphan_id: number; transaction_id: number }> =>
    apiFetch(`/payments/orphans/${id}/resolve/`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  dismiss: (
    id: number,
    payload: { resolution_notes: string },
  ): Promise<{ status: string; orphan_id: number }> =>
    apiFetch(`/payments/orphans/${id}/dismiss/`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
