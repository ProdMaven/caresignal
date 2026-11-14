// HTTP client for the running app. Sends the invite header on every request.
import type { HttpResult, Usage } from "./types";

const TIMEOUT_MS = 60_000;

export interface RequestLog {
  method: string;
  path: string;
  status: number;
  latencyMs: number;
  usage: Usage | null;
  source: string | null;
  ai: boolean; // counts toward latency and cost statistics
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// Token usage is not part of the frozen contract. If a route ever exposes it
// (body.usage, body._usage, or an x-ai-usage header holding JSON) it is picked up here.
function readUsage(body: unknown, headers: Headers | null): Usage | null {
  const candidates: unknown[] = [];
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    candidates.push(b.usage, b._usage);
  }
  const header = headers?.get("x-ai-usage");
  if (header) {
    try {
      candidates.push(JSON.parse(header));
    } catch {
      // ignore a malformed header
    }
  }
  // The real /api/log branch reports usage in x-caresignal-meta as { ai: { calls, inputTokens,
  // outputTokens, cacheReadTokens, cacheWriteTokens } }. There inputTokens excludes cached tokens.
  const meta = headers?.get("x-caresignal-meta");
  if (meta) {
    try {
      const ai = (JSON.parse(meta) as Record<string, unknown>).ai as Record<string, unknown> | null;
      if (ai && (num(ai.calls) ?? 0) > 0) {
        const read = num(ai.cacheReadTokens) ?? 0;
        return {
          inputTokens: (num(ai.inputTokens) ?? 0) + read + (num(ai.cacheWriteTokens) ?? 0),
          cachedInputTokens: read,
          outputTokens: num(ai.outputTokens) ?? 0,
        };
      }
    } catch {
      // ignore a malformed header
    }
  }
  for (const c of candidates) {
    if (!c || typeof c !== "object") continue;
    const u = c as Record<string, unknown>;
    const input = num(u.inputTokens) ?? num(u.input_tokens);
    const output = num(u.outputTokens) ?? num(u.output_tokens);
    if (input === null || output === null) continue;
    const cached = num(u.cacheReadTokens) ?? num(u.cachedInputTokens) ?? num(u.cache_read_input_tokens) ?? 0;
    return { inputTokens: input, cachedInputTokens: cached, outputTokens: output };
  }
  return null;
}

export class Client {
  readonly log: RequestLog[] = [];

  constructor(
    readonly baseUrl: string,
    private readonly inviteCode: string,
  ) {}

  async call(method: "GET" | "POST", path: string, body?: unknown, ai = false): Promise<HttpResult> {
    const started = performance.now();
    let result: HttpResult;
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { "content-type": "application/json", "x-invite-code": this.inviteCode },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const text = await response.text();
      const latencyMs = Math.round(performance.now() - started);
      let parsed: unknown = null;
      let error: string | null = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        error = `Response was not valid JSON: ${text.slice(0, 120)}`;
      }
      if (!response.ok && !error) {
        const detail = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>).error : null;
        error = `HTTP ${response.status}${typeof detail === "string" ? `: ${detail}` : ""}`;
      }
      result = { ok: response.ok && !error, status: response.status, body: parsed, latencyMs, usage: readUsage(parsed, response.headers), source: response.headers.get("x-caresignal-source"), error };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      result = { ok: false, status: 0, body: null, latencyMs: Math.round(performance.now() - started), usage: null, source: null, error: `Request failed: ${detail}` };
    }
    this.log.push({ method, path, status: result.status, latencyMs: result.latencyMs, usage: result.usage, source: result.source, ai });
    return result;
  }
}
