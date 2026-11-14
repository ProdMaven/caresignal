// Small fetch wrapper for client components. Throws an Error with plain words on failure.
const TIMEOUT_MS = 20_000;

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
      headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const detail = body && typeof body.error === "string" ? body.error : `Request failed (${res.status}).`;
      throw new Error(detail);
    }
    return body as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("That took too long. Please check your connection and try again.");
    }
    if (err instanceof TypeError) throw new Error("Could not reach CareSignal. Please check your connection and try again.");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export function postJson<T>(url: string, body?: unknown): Promise<T> {
  return fetchJson<T>(url, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
}
