// Single entry point for Claude calls. Server only: never import from a client component.
// Owner: Lane 2. The mocks do not call this.
import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-sonnet-5-5";
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_TOKENS = 1024;

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CallClaudeOptions {
  // Stable instructions only. No per-request data here, so prompt caching can hit.
  system: string;
  messages: ClaudeMessage[];
  // When true, the reply is parsed as JSON and returned in `json`.
  json?: boolean;
  model?: string;
  maxTokens?: number;
  timeoutMs?: number; // per attempt
  // SDK retries (timeouts, connection errors, 429 and 5xx). Default 1.
  maxRetries?: number;
  // Short name for the usage log line, for example "formatter".
  label?: string;
}

export interface CallClaudeResult<T = unknown> {
  text: string;
  json: T | null;
  model: string;
  latencyMs: number;
  stopReason: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  };
}

export class AiError extends Error {
  constructor(
    message: string,
    public readonly code: "no_api_key" | "request_failed" | "bad_json",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "AiError";
  }
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiError("ANTHROPIC_API_KEY is not set.", "no_api_key");
  }
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

// Pulls a JSON value out of a model reply. Accepts bare JSON, fenced JSON,
// or JSON with a little text around it. Throws AiError("bad_json") otherwise.
export function parseJson<T = unknown>(text: string): T {
  const trimmed = text.trim();
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
  const candidates = [trimmed];
  if (fenced) candidates.push(fenced[1].trim());
  const firstObj = trimmed.indexOf("{");
  const lastObj = trimmed.lastIndexOf("}");
  if (firstObj !== -1 && lastObj > firstObj) candidates.push(trimmed.slice(firstObj, lastObj + 1));
  const firstArr = trimmed.indexOf("[");
  const lastArr = trimmed.lastIndexOf("]");
  if (firstArr !== -1 && lastArr > firstArr) candidates.push(trimmed.slice(firstArr, lastArr + 1));

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // try the next candidate
    }
  }
  throw new AiError("The model reply was not valid JSON.", "bad_json");
}

// One JSON line per call so eval/run.ts (or a log drain) can add up tokens, latency and cache hits.
// Never logs prompt text, note text, or the key.
function logUsage(entry: Record<string, unknown>): void {
  console.log(`[ai] ${JSON.stringify(entry)}`);
}

// Request shape checked against the installed @anthropic-ai/sdk (1.8.0): `messages.create`
// has no `temperature`, `top_p` or `top_k` field any more, so none is sent. Consistency
// between near-identical notes comes from the fixed prompt, the closed vocabulary and the
// code-side validation instead. No assistant prefill either (newer models reject it).
export async function callClaude<T = unknown>(options: CallClaudeOptions): Promise<CallClaudeResult<T>> {
  const model = options.model || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const label = options.label ?? "call";
  const started = Date.now();
  let anthropic: Anthropic;
  try {
    anthropic = getClient();
  } catch (err) {
    logUsage({ label, model, ok: false, error: "no_api_key", latencyMs: 0 });
    throw err;
  }

  let response;
  try {
    response = await anthropic.messages.create(
      {
        model,
        max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
        // Prompt caching on the stable system block.
        system: [{ type: "text", text: options.system, cache_control: { type: "ephemeral" } }],
        messages: options.messages,
      },
      // One retry (the SDK retries timeouts, connection errors, 429 and 5xx).
      { timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS, maxRetries: options.maxRetries ?? 1 },
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    const status = err instanceof Anthropic.APIError && typeof err.status === "number" ? err.status : undefined;
    logUsage({ label, model, ok: false, error: "request_failed", status: status ?? null, latencyMs: Date.now() - started });
    throw new AiError(`Claude request failed: ${detail}`, "request_failed", status);
  }
  const latencyMs = Date.now() - started;

  const text = response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();

  const usage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
  };
  logUsage({ label, model, ok: true, latencyMs, stopReason: response.stop_reason ?? null, ...usage });

  return {
    text,
    json: options.json ? parseJson<T>(text) : null,
    model,
    latencyMs,
    stopReason: response.stop_reason ?? null,
    usage,
  };
}
