export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export function getToken() {
  const t = localStorage.getItem("token");
  if (!t) return null;
  if (t.split(".").length !== 3) return null;
  return t;
}
// достаём sub (user_id) из JWT без валидации (норм для фронта)
export function getUserIdFromToken(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payloadPart = token.split(".")[1];
    const json = atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json);
    return payload?.sub ?? null;
  } catch {
    return null;
  }
}

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers = new Headers(opts.headers);

  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  // если вдруг пустой ответ
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return (await res.text()) as unknown as T;

  return (await res.json()) as T;
}

export function wsUrl(path: string) {
  const base = API_URL.replace("https://", "wss://").replace("http://", "ws://");
  return `${base}${path}`;
}

export function saveUserIdFromToken(token: string) {
  try {
    const payloadPart = token.split(".")[1];
    const json = atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json);
    if (payload?.sub) localStorage.setItem("user_id", payload.sub);
  } catch {
    // ignore
  }
}