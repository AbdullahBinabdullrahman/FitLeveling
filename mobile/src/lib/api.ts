import { DEMO, demoApi } from "./demo";
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? "https://fitleveling.fit"
).replace(/\/$/, "");
let token: string | null = null;
export function setToken(value: string | null) {
  token = value;
}
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  if (DEMO) return (await demoApi(path, method, body)) as T;
  const response = await fetch(`${API_URL}/api/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(path.startsWith("coach") ? 65000 : 20000),
  });
  const data = await response.json().catch(() => ({
    error: "The server returned an unreadable response. Try again.",
  }));
  if (!response.ok)
    throw new Error(
      data.error ?? "Could not connect. Check your connection and try again.",
    );
  return data;
}
