import Constants from "expo-constants";
import { clearStoredToken, getStoredToken, setStoredToken } from "./secureToken";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://10.0.2.2:4000/api";

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let memoryToken: string | null = null;
let tokenReady = false;
let tokenReadyPromise: Promise<void> | null = null;

async function ensureTokenLoaded() {
  if (tokenReady) return;
  if (!tokenReadyPromise) {
    tokenReadyPromise = getStoredToken().then((t) => {
      memoryToken = t;
      tokenReady = true;
    });
  }
  await tokenReadyPromise;
}

export async function initAuthToken(): Promise<string | null> {
  await ensureTokenLoaded();
  return memoryToken;
}

export async function setAuthToken(token: string) {
  memoryToken = token;
  tokenReady = true;
  await setStoredToken(token);
}

export async function clearAuthToken() {
  memoryToken = null;
  await clearStoredToken();
}

export function getAuthTokenSync(): string | null {
  return memoryToken;
}

type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;

export function setSessionExpiredHandler(handler: SessionExpiredHandler | null) {
  onSessionExpired = handler;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  query?: Record<string, unknown>;
  skipAuth?: boolean;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(`${API_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, skipAuth } = options;

  await ensureTokenLoaded();

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!skipAuth && memoryToken) {
    headers.Authorization = `Bearer ${memoryToken}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiRequestError(0, "No network connection. Please check your connection and try again.");
  }

  if (res.status === 204) {
    return undefined as T;
  }

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    if (res.status === 401 && !skipAuth) {
      await clearAuthToken();
      onSessionExpired?.();
    }
    const message = payload?.error?.message ?? "Something went wrong";
    throw new ApiRequestError(res.status, message, payload?.error?.details);
  }

  return payload as T;
}
