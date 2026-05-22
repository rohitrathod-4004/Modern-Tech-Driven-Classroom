import { authService } from "./authService";

const BASE_URL = "http://localhost:3001";

interface FetchOptions extends RequestInit {
  body?: any;
}

const apiFetch = async <T>(path: string, options: FetchOptions = {}): Promise<T> => {
  const token = authService.getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(errorData.error || "API request failed");
  }

  return response.json();
};

export const apiClient = {
  get: <T>(path: string) => apiFetch<T>(path, { method: "GET" }),
  post: <T>(path: string, body: unknown) => apiFetch<T>(path, { method: "POST", body }),
  put: <T>(path: string, body: unknown) => apiFetch<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body: unknown) => apiFetch<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};


