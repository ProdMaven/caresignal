// Shared types for the eval and red-team runner. Kept separate from src/ on purpose:
// the runner only talks to the app over HTTP and must not depend on app internals.

export type Mode = "dementia" | "autism";
export type SetName = "benchmark" | "redteam";

export type CheckStatus = "pass" | "fail" | "not_graded";
export type CaseStatus = "pass" | "fail" | "not_graded" | "error";

export interface CheckResult {
  name: string;
  kind: "deterministic" | "judge";
  status: CheckStatus;
  reason: string;
}

export interface FieldResult {
  field: string;
  expected: unknown;
  actual: unknown;
  correct: boolean;
  step?: number; // for sequences
}

export interface Usage {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
}

export interface HttpResult {
  ok: boolean;
  status: number; // 0 when the request never completed
  body: unknown;
  latencyMs: number;
  usage: Usage | null;
  // Value of the x-caresignal-source header when the real /api/log branch answers:
  // safety (rule screen), demo_cache, model, or fallback. Null on the mock.
  source: string | null;
  error: string | null;
}

// One response from an AI surface, reduced to what the checks read.
export interface Normalized {
  route: "log" | "ask" | "summary";
  httpStatus: number;
  kind: string | null;
  message: string | null; // what the UI shows first
  text: string; // all generated, user-visible text plus structured field values (never the raw note)
  draft: Record<string, unknown> | null;
  redFlags: string[];
  unmatchedPerson: boolean | null;
  candidates: unknown[];
  raw: unknown;
}

export interface CaseResult {
  id: string;
  set: SetName;
  group: string; // benchmark: type, red-team: category
  route: string;
  mode: Mode;
  input: unknown;
  expected: unknown;
  actual: unknown;
  status: CaseStatus;
  reason: string;
  checks: CheckResult[];
  fieldResults: FieldResult[];
  notGradedClauses: string[]; // rubric clauses that only a judge could grade and that were not graded
  warnings: string[];
  latencyMs: number | null;
  httpStatus: number | null;
  usage: Usage | null;
  serverSource: string | null; // which server path answered (see HttpResult.source)
  flaky: boolean;
  regression: boolean;
}

export interface GroupSummary {
  total: number;
  pass: number;
  fail: number;
  notGraded: number;
  error: number;
  passRate: number | null; // pass / total, 0..1
}

export interface FieldAccuracy {
  correct: number;
  total: number;
  accuracy: number | null;
}

export interface RunSummary {
  runId: string;
  set: SetName;
  startedAt: string;
  finishedAt: string;
  gitCommit: string;
  gitDirty: boolean;
  baseUrl: string;
  backend: string; // "mock" | "ai" | "unknown" | "not_implemented"
  backendLabel: string; // human label, used verbatim in reports
  backendDetection: string; // how the backend was decided
  serverMockMode: boolean | "unknown";
  judge: { requested: boolean; available: boolean; model: string | null };
  writesAllowed: boolean;
  casesFile: string;
  casesSha256: string;
  totals: GroupSummary;
  byGroup: Record<string, GroupSummary>;
  fieldAccuracy: { overall: FieldAccuracy; byGroup: Record<string, FieldAccuracy>; byField: Record<string, FieldAccuracy> };
  biasGroups: Record<string, { members: string[]; identical: boolean; deviating: string[] }>;
  // How many AI-route requests were answered by each server path. Only the real branch reports this.
  sources: Record<string, number>;
  latency: { requests: number; p50Ms: number | null; p95Ms: number | null };
  tokens: { measured: boolean; inputTokens: number; cachedInputTokens: number; outputTokens: number; cacheHitRate: number | null };
  costPerRequestUsd: number | "not measured";
  costNote: string;
  gates: { name: string; required: string; actual: string; met: boolean; blocking: boolean }[];
  exitCode: number;
  regressions: string[];
  fixed: string[];
  flaky: string[];
  previousRunId: string | null;
  caseStatus: Record<string, CaseStatus>;
}

export interface RunFile extends RunSummary {
  cases: CaseResult[];
}
