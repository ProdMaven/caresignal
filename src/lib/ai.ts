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
  timeoutMs?: number;
}

export interface CallClaudeResult<T = unknown> {
  text: string;
  json: T | null;
  model: string;
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

export async function callClaude<T = unknown>(options: CallClaudeOptions): Promise<CallClaudeResult<T>> {
  const model = options.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
  const anthropic = getClient();

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
      { timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS, maxRetries: 1 },
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new AiError(`Claude request failed: ${detail}`, "request_failed");
  }

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
  console.log(`[ai] model=${model} in=${usage.inputTokens} out=${usage.outputTokens} cacheRead=${usage.cacheReadTokens}`);

  return { text, json: options.json ? parseJson<T>(text) : null, model, usage };
}
