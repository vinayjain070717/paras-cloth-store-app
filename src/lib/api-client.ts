"use client";

interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  status: number;
}

export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, options);
    const data = await res.json();

    if (!res.ok) {
      return {
        data: null,
        error: data.error || `Request failed (${res.status})`,
        status: res.status,
      };
    }

    return { data: data as T, error: null, status: res.status };
  } catch {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return {
        data: null,
        error: "You are offline. Please check your internet connection.",
        status: 0,
      };
    }
    return {
      data: null,
      error: "Network error. Please try again.",
      status: 0,
    };
  }
}

export async function apiGet<T = unknown>(url: string): Promise<ApiResponse<T>> {
  return apiFetch<T>(url);
}

export async function apiPost<T = unknown>(
  url: string,
  body: unknown
): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiPut<T = unknown>(
  url: string,
  body: unknown
): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T = unknown>(url: string): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, { method: "DELETE" });
}
