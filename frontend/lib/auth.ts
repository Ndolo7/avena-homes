const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_DISPLAY_NAME_KEY = "user_display_name";
const USER_EMAIL_KEY = "user_email";
const USER_ROLE_KEY = "user_role";
const USER_PHONE_KEY = "user_phone";

const ACCESS_TOKEN_COOKIE = "access_token";
const USER_ROLE_COOKIE = "user_role";

const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60; // 1 hour

let refreshInFlight: Promise<string | null> | null = null;

function base64UrlDecode(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "===".slice((normalized.length + 3) % 4);
    return atob(padded);
  } catch {
    return null;
  }
}

function parseTokenExp(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const decoded = base64UrlDecode(parts[1]);
  if (!decoded) return null;

  try {
    const payload = JSON.parse(decoded) as { exp?: unknown };
    if (typeof payload.exp !== "number") return null;
    return payload.exp;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, skewSeconds = 0): boolean {
  const exp = parseTokenExp(token);
  if (!exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return exp <= now + skewSeconds;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

export function clearAuthStorage() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_DISPLAY_NAME_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
  localStorage.removeItem(USER_PHONE_KEY);

  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${USER_ROLE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

function storeAccessToken(accessToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  setCookie(ACCESS_TOKEN_COOKIE, accessToken, ACCESS_TOKEN_MAX_AGE_SECONDS);
}

export function storeSessionTokens(accessToken: string, refreshToken: string, role: string) {
  if (typeof window === "undefined") return;
  storeAccessToken(accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  setCookie(USER_ROLE_COOKIE, role, ACCESS_TOKEN_MAX_AGE_SECONDS);
}

export async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refresh) {
      clearAuthStorage();
      return null;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (!res.ok) {
        clearAuthStorage();
        return null;
      }

      const payload = (await res.json()) as { access?: string; refresh?: string };
      if (!payload.access) {
        clearAuthStorage();
        return null;
      }

      // SimpleJWT rotation may return a new refresh token.
      if (payload.refresh) {
        localStorage.setItem(REFRESH_TOKEN_KEY, payload.refresh);
      }

      storeAccessToken(payload.access);
      return payload.access;
    } catch {
      clearAuthStorage();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function getValidAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return null;
  if (!isTokenExpired(token, 30)) return token;

  return refreshAccessToken();
}
