"use client";

export type ApiRole = "professional" | "facility" | "admin";

export type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[] | string>;
};

export type ApiResponse<T> = {
  ok?: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[] | string>;
};

export const apiBase = () =>
  process.env.NEXT_PUBLIC_AFYA_API_BASE?.replace(/\/$/, "") || "";

export function friendlyError(payload: ApiErrorPayload | null | undefined, fallback = "Request failed") {
  const messages: string[] = [];

  if (payload?.errors && typeof payload.errors === "object") {
    for (const [field, values] of Object.entries(payload.errors)) {
      messages.push(`${field}: ${Array.isArray(values) ? values.join(", ") : values}`);
    }
  }

  return messages.length ? messages.join(" ") : payload?.message || fallback;
}

export async function apiRequest<T>(
  path: string,
  {
    method = "GET",
    body,
    token,
  }: {
    method?: string;
    body?: Record<string, unknown> | null;
    token?: string | null;
  } = {},
): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : null,
  });

  const payload = (await response
    .json()
    .catch(() => ({ ok: false, message: "The API returned an unreadable response." }))) as ApiResponse<T>;

  if (!response.ok || payload.ok === false) {
    throw new Error(friendlyError(payload, response.statusText || "Request failed"));
  }

  return (payload.data ?? payload) as T;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function asArray<T = Record<string, unknown>>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
