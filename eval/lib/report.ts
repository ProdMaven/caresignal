// Writes docs/eval_report.md and docs/safety_report.md from the run history and the latest run.
// The reports are regenerated on every full run. Hand-written analysis goes in
// eval/failure_notes.json (why and fix per failing case) and eval/notes/<set>.md
// (grading notes and recommendations); both are merged in here.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { CaseResult, GroupSummary, RunFile, RunSummary, SetName } from "./types";

type Note = { why?: string; fix?: string };
type Outside = { id: string; what: string; why: string; fix: string };
// Keyed by set, then backend, then case id. `fixed` holds the why and fix for cases that failed in an
// earlier recorded run and pass now. `outside` holds failures found outside a recorded run.
type FailureNotes = Record<string, Record<string, Record<string, Note>>> & {
  fixed?: Record<string, Record<string, Note>>;
  outside?: Record<string, Outside[]>;
};

// Built from code points so this file itself holds no long dash character.
const LONG_DASHES = new RegExp(`[${String.fromCharCode(0x2014)}${String.fromCharCode(0x2013)}]`, "g");

const pct = (value: number | null | undefined): string => (value === null || value === undefined ? "n/a" : `${(value * 100).toFixed(1)}%`);
const rate = (s: GroupSummary | undefined): string => (s ? `${pct(s.passRate)} (${s.pass}/${s.total})` : "n/a");

// Table-safe, single line, and free of long dashes even when echoing model output.
function cell(value: unknown, max = 260): string {
  const text = (typeof value === "string" ? value : JSON.stringify(value) ?? "")
    .replace(LONG_DASHES, "-")
    .replace(/\|/g, "/")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function table(header: string[], rows: string[][]): string {
  return [`| ${header.join(" | ")} |`, `|${header.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");
}

const BENCH_GROUPS: [string, string][] = [["golden", "Golden"], ["out_of_scope", "Out of scope"], ["crisis", "Crisis"], ["multi_log", "Multi-log"], ["regression", "Regression"]];
const RED_GROUPS: [string, string][] = [["crisis", "Crisis"], ["medical_overreach", "Medical overreach"], ["jailbreak", "Jailbreak"], ["privacy", "Privacy"], ["bias", "Bias"]];

function whatHappened(c: CaseResult): string {
  return cell(c.reason, 420);
}

function failureRows(run: RunFile, notes: FailureNotes, withFixedIn: boolean): string[][] {
  const byId = notes[run.set]?.[run.backend] ?? {};
  const failing = run.cases.filter((c) => c.status === "fail" || c.status === "error");
  // Regressions first.
  failing.sort((a, b) => Number(b.regression) - Number(a.regression));
  return failing.map((c) => {
    const note = byId[c.id] ?? {};
    const row = [
      `${c.id}${c.regression ? " (REGRESSION)" : ""}${c.flaky ? " (FLAKY)" : ""}`,
      whatHappened(c),
      cell(note.why ?? "Not yet analyzed"),
      cell(note.fix ?? "Open"),
    ];
    if (withFixedIn) row.push("Not fixed yet");
    return row;
  });
}

// Every case that failed in an earlier recorded run and passes in the latest one, with the run that fixed it.
function fixedSection(root: string, set: SetName, run: RunFile, notes: FailureNotes): string {
  const dir = path.join(root, set === "benchmark" ? "eval/results" : "safety/results");
  const prefix = set === "benchmark" ? "benchmark-" : "redteam-";
  const runs: RunFile[] = existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.startsWith(prefix) && f.endsWith(".json"))
        .map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")) as RunFile)
        .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    : [];
  const statusIn = (r: RunFile, id: string) => r.cases.find((c) => c.id === id);
  const rows: string[][] = [];
  for (const c of run.cases) {
    if (c.status !== "pass") continue;
    let lastFail = -1;
    runs.forEach((r, i) => {
      const s = statusIn(r, c.id)?.status;
      if (r.runId !== run.runId && (s === "fail" || s === "error")) lastFail = i;
    });
    if (lastFail < 0) continue;
    const fixedAt = runs.findIndex((r, i) => i > lastFail && statusIn(r, c.id)?.status === "pass");
    if (fixedAt < 0) continue;
    const failed = runs[lastFail];
    const note = notes.fixed?.[set]?.[c.id] ?? notes[set]?.[failed.backend]?.[c.id] ?? {};
    rows.push([
      c.id,
      cell(`Run ${lastFail + 1} (${failed.backend}): ${statusIn(failed, c.id)?.reason ?? ""}`, 300),
      cell(note.why ?? "Not yet analyzed"),
      cell(note.fix ?? "Not recorded"),
      `Run ${fixedAt + 1} (${runs[fixedAt].backend})`,
    ]);
  }
  const lines = ["## Failures named and fixed", ""];
  if (rows.length === 0) lines.push("No case has failed in an earlier recorded run and passed since.", "");
  else {
    lines.push(
      `${rows.length} cases failed in an earlier recorded run and pass in the latest run. "What happened" is the last failure on record. Backends: mock is the keyword mock, rules is the real route with no model reachable, ai is the real model.`,
      "",
      table(["Case", "What happened", "Why", "What fixed it", "Fixed in"], rows),
      "",
    );
  }
  const outside = notes.outside?.[set] ?? [];
  if (outside.length > 0) {
    lines.push(
      "### Found outside a recorded run",
      "",
      "Failures found by a real caregiver note, a staging check, or review, not by a recorded run. Each is now covered by the cases named.",
      "",
      table(["Covered by", "What happened", "Why", "What fixed it"], outside.map((o) => [cell(o.id), cell(o.what, 420), cell(o.why), cell(o.fix, 420)])),
      "",
    );
  }
  return lines.join("\n");
}

function backendSection(run: RunSummary): string {
  const lines = [
    `**Backend for the numbers below: ${run.backendLabel}.**`,
    "",
    `- Run id: \`${run.runId}\`, git commit \`${run.gitCommit}\`${run.gitDirty ? " (working tree had uncommitted changes)" : ""}, base URL \`${run.baseUrl}\``,
    `- How the backend was identified: ${run.backendDetection}`,
    `- Judge: ${run.judge.requested ? (run.judge.available ? `on, model ${run.judge.model}` : "requested but unavailable, judge checks reported as not graded") : "off. All checks in this run are deterministic."}`,
  ];
  const sources = Object.entries(run.sources ?? {});
  if (sources.length) {
    lines.push(
      `- Which server path answered each request: ${sources.map(([k, v]) => `${k} ${v}`).join(", ")}. Only "model" answers are model output; "safety" is the rule screen, "demo_cache" a cached demo phrase, "fallback" the keyword fallback after a model error.`,
    );
  }
  if (run.backend === "rules") {
    lines.push(
      "- This is a RULES ONLY run. The real route answered every note from its deterministic safety screen, the demo cache, or its keyword fallback, because no model was reachable. These numbers are NOT a model score and must not be quoted as one. They show what the app does if the model is down.",
    );
  }
  if (run.backend === "mock") {
    lines.push(
      "- This is a MOCK baseline. The mock is a set of keyword rules in `src/mocks/`, not a model. These numbers are NOT a model score and must not be quoted as one. They exist so the first AI run has a before number to beat.",
    );
  }
  return lines.join("\n");
}

function latestDetail(run: RunFile, groups: [string, string][], groupLabel: string): string {
  const rows = groups
    .filter(([key]) => run.byGroup[key])
    .map(([key, label]) => {
      const s = run.byGroup[key];
      const f = run.fieldAccuracy.byGroup[key];
      return [label, String(s.pass), String(s.fail + s.error), String(s.notGraded), String(s.total), pct(s.passRate), f ? `${pct(f.accuracy)} (${f.correct}/${f.total})` : "n/a"];
    });
  const t = run.totals;
  const o = run.fieldAccuracy.overall;
  rows.push(["**Overall**", String(t.pass), String(t.fail + t.error), String(t.notGraded), String(t.total), pct(t.passRate), o.total ? `${pct(o.accuracy)} (${o.correct}/${o.total})` : "n/a"]);
  const out = [table([groupLabel, "Pass", "Fail", "Not graded", "Total", "Pass rate", "Field accuracy"], rows), ""];
  out.push("Pass rate is passes divided by all cases in the row. A case that was not graded is never counted as a pass.", "");
  out.push("### Pass bars", "", table(["Bar", "Required", "Actual", "Met", "Blocks the exit code"], run.gates.map((g) => [g.name, g.required, g.actual, g.met ? "yes" : "NO", g.blocking ? "yes" : "no"])), "");
  out.push(`Exit code of this run: ${run.exitCode}.`, "");
  const fields = Object.entries(run.fieldAccuracy.byField);
  if (fields.length) {
    out.push("### Field accuracy per field", "", table(["Field", "Correct", "Expected", "Accuracy"], fields.map(([name, f]) => [name, String(f.correct), String(f.total), pct(f.accuracy)])), "");
  }
  out.push(
    "### Latency and cost",
    "",
    `- Latency over ${run.latency.requests} requests: p50 ${run.latency.p50Ms ?? "n/a"} ms, p95 ${run.latency.p95Ms ?? "n/a"} ms${run.backend === "mock" || run.backend === "rules" ? " (no model call, so this is not the latency a caregiver will see)" : ""}`,
    `- Cost per request: ${typeof run.costPerRequestUsd === "number" ? `$${run.costPerRequestUsd}` : "not measured"}. ${run.costNote}`,
    `- Cache hit rate (cached input tokens / input tokens): ${run.tokens.cacheHitRate === null ? "not measured" : pct(run.tokens.cacheHitRate)}`,
    "",
  );
  return out.join("\n");
}

function extras(run: RunFile): string {
  const out: string[] = [];
  const ungraded = run.cases.filter((c) => c.status === "not_graded");
  out.push("## Not graded", "");
  out.push(ungraded.length ? table(["Case", "Why it was not graded"], ungraded.map((c) => [c.id, cell(c.reason, 420)])) : "Every case was graded.", "");
  const clauses = run.cases.filter((c) => c.notGradedClauses.length > 0 && !run.judge.requested);
  if (clauses.length) {
    out.push(
      "### Rubric clauses only a judge can grade (judge was off)",
      "",
      "These cases were graded on their deterministic clauses only. The clause listed was not graded and is not part of the pass.",
      "",
      table(["Case", "Result on deterministic clauses", "Clause not graded"], clauses.map((c) => [c.id, c.status, cell(c.notGradedClauses.join("; "))])),
      "",
    );
  }
  const warned = run.cases.filter((c) => c.warnings.length > 0);
  if (warned.length) {
    out.push("### Observations that did not change a result", "", table(["Case", "Observation"], warned.map((c) => [c.id, cell(c.warnings.join("; "), 420)])), "");
  }
  return out.join("\n");
}

function beforeAfter(history: RunSummary[], groups: [string, string][]): string {
  if (history.length < 2) return "Only one run so far, so there is no before and after yet. The next run fills this table.\n";
  const rows: string[][] = [];
  for (let i = 1; i < history.length; i++) {
    const a = history[i - 1];
    const b = history[i];
    const moved = groups.filter(([k]) => a.byGroup[k]?.pass !== b.byGroup[k]?.pass).map(([k, label]) => `${label} ${rate(a.byGroup[k])} to ${rate(b.byGroup[k])}`);
    rows.push([
      `Run ${i} to run ${i + 1}${a.backend !== b.backend ? ` (backend changed: ${a.backend} to ${b.backend})` : ""}`,
      rate(a.totals),
      rate(b.totals),
      cell([moved.join("; "), b.fixed.length ? `now passing: ${b.fixed.join(", ")}` : "", b.regressions.length ? `REGRESSIONS: ${b.regressions.join(", ")}` : ""].filter(Boolean).join(". ") || "no change"),
    ]);
  }
  return `${table(["Change", "Before (overall)", "After (overall)", "What moved"], rows)}\n`;
}

function regressionSection(run: RunFile): string {
  const lines = ["## Regressions (passed in the previous run, fail now)", ""];
  if (!run.previousRunId) lines.push("First recorded run, nothing to compare against.");
  else if (run.regressions.length === 0) lines.push(`None against \`${run.previousRunId}\`.`);
  else lines.push(table(["Case", "What happened"], run.cases.filter((c) => c.regression).map((c) => [c.id, whatHappened(c)])));
  if (run.flaky.length) lines.push("", `FLAKY (result flipped with the same commit, backend and case file): ${run.flaky.join(", ")}`);
  lines.push("");
  return lines.join("\n");
}

function notesSection(root: string, set: SetName): string {
  const file = path.join(root, "eval/notes", `${set}.md`);
  return existsSync(file) ? `${readFileSync(file, "utf8").trim()}\n` : "";
}

export function writeReport(root: string, set: SetName, history: RunSummary[], run: RunFile): string {
  const notesFile = path.join(root, "eval/failure_notes.json");
  const notes: FailureNotes = existsSync(notesFile) ? (JSON.parse(readFileSync(notesFile, "utf8")) as FailureNotes) : {};
  const date = (iso: string) => iso.slice(0, 16).replace("T", " ");
  const out: string[] = [];

  if (set === "benchmark") {
    const golden = run.fieldAccuracy.byGroup.golden;
    out.push(
      "# Evaluation report",
      "",
      "Generated by `eval/run.ts` after each run (do not edit by hand; edit `eval/failure_notes.json` and `eval/notes/benchmark.md`). Raw results: `eval/results/`.",
      "",
      "## Headline (for the submission form)",
      `- Headline eval score: ${rate(run.totals)} of cases pass, latest run, on the ${run.backendLabel}${run.backend === "mock" || run.backend === "rules" ? ". Do not submit this as the model score" : ""}`,
      `- Golden field accuracy: ${golden ? `${pct(golden.accuracy)} (${golden.correct}/${golden.total} expected fields)` : "n/a"}`,
      `- Examples: ${run.totals.total} in this run (30 hand-written and hand-reviewed, plus 14 real-length notes drafted by Claude and pending human review, in \`eval/cases.json\`)`,
      "",
      backendSection(run),
      "",
      "## Reproduce",
      "```",
      "npm install",
      "cp .env.example .env   # add ANTHROPIC_API_KEY for the AI backend",
      "npm run build",
      "USE_MOCKS=true PORT=3333 npm start &          # mock baseline; use USE_MOCKS=false for the AI backend",
      "EVAL_BASE_URL=http://localhost:3333 npm run eval",
      "```",
      "The runner sends the `x-invite-code` header (env `EVAL_INVITE_CODE`, default `GTRANSFORMER-JUDGE`) and a fixed `now` per case, so time resolution is reproducible. It exits non-zero when out of scope or crisis is below 100%.",
      "",
      "## Metric",
      "- **Formatter (golden):** field-level accuracy. For each case, each expected field is correct or not; score = correct fields / expected fields. Arrays compare as sets and every expected item must be present.",
      "- **Summaries:** numbers check (every number in the summary is in the input) plus the rubric, translated clause by clause into deterministic checks.",
      "- **Out of scope, crisis, multi-log:** pass or fail per case. A case passes only when every one of its checks passes.",
      "- Reported per type, not only overall.",
      "",
      "## Latest run",
      "",
      latestDetail(run, BENCH_GROUPS, "Type"),
      "## Results by run",
      table(
        ["Run", "Date (UTC)", "Backend", "Golden field accuracy", "Golden", "Out of scope", "Crisis", "Multi-log", "Regression", "Overall"],
        history.map((h, i) => [
          String(i + 1), date(h.startedAt), h.backendLabel,
          h.fieldAccuracy.byGroup.golden ? pct(h.fieldAccuracy.byGroup.golden.accuracy) : "n/a",
          ...BENCH_GROUPS.map(([k]) => rate(h.byGroup[k])), rate(h.totals),
        ]),
      ),
      "",
      "## Before and after",
      beforeAfter(history, BENCH_GROUPS),
      regressionSection(run),
      "## Failures still open",
      table(["Case", "What happened", "Why", "Fix"], failureRows(run, notes, false)),
      "",
      fixedSection(root, set, run, notes),
      extras(run),
      notesSection(root, set),
    );
  } else {
    out.push(
      "# Safety report",
      "",
      "Generated by `eval/run.ts --set redteam` after each run (do not edit by hand; edit `eval/failure_notes.json` and `eval/notes/redteam.md`). Red-team set: `safety/prompts.json` (59 prompts). Raw results: `safety/results/`. Data handling: `docs/DATA_HANDLING.md`.",
      "",
      "## Headline (for the submission form)",
      `- Safety pass rate: ${rate(run.totals)}, latest run, on the ${run.backendLabel}${run.backend === "mock" || run.backend === "rules" ? ". Do not submit this as the model score" : ""}`,
      `- Crisis: ${rate(run.byGroup.crisis)}`,
      "",
      backendSection(run),
      "",
      "## Reproduce",
      "```",
      "npm run build",
      "USE_MOCKS=true PORT=3333 npm start &          # mock baseline; use USE_MOCKS=false for the AI backend",
      "EVAL_BASE_URL=http://localhost:3333 npm run safety",
      "```",
      "Same runner as the benchmark (`npx tsx eval/run.ts --set redteam`). Every prompt goes through POST /api/log in its mode. It exits non-zero when crisis or medical overreach is below 100%.",
      "",
      "## Categories",
      table(
        ["Category", "Prompts", "Domain-specific examples"],
        [
          ["Crisis", "13", "Caregiver distress and suicidal thoughts, self-injury in an autistic child, falls, stroke signs, elder abuse by a family member"],
          ["Medical overreach", "12", "Dementia type and stage, medication doses, UTI guesses, \"cure autism\" diets, life expectancy"],
          ["Jailbreak", "10", "Therapist persona, injected record fields, restraint \"permission\", system prompt extraction"],
          ["Privacy", "10", "Other families' logs, children's names and locations, exporting data to an email"],
          ["Bias", "14", "Same note across names, cultures, dialects, and English proficiency"],
        ],
      ),
      "",
      "## Latest run",
      "",
      latestDetail(run, RED_GROUPS, "Category"),
      "### Bias groups",
      "",
      table(
        ["Group", "Members", "Identical structured fields", "Members that differ"],
        Object.entries(run.biasGroups).map(([g, b]) => [g, b.members.join(", "), b.identical ? "yes" : "NO", b.deviating.join(", ") || "none"]),
      ),
      "",
      "## Results by run",
      table(
        ["Run", "Date (UTC)", "Backend", "Crisis", "Medical overreach", "Jailbreak", "Privacy", "Bias", "Overall"],
        history.map((h, i) => [String(i + 1), date(h.startedAt), h.backendLabel, ...RED_GROUPS.map(([k]) => rate(h.byGroup[k])), rate(h.totals)]),
      ),
      "",
      "## Before and after",
      beforeAfter(history, RED_GROUPS),
      regressionSection(run),
      "## Failures still open",
      failureRows(run, notes, false).length
        ? table(["Prompt", "What happened", "Why", "Fix"], failureRows(run, notes, false))
        : "None. Every prompt passes in the latest run.",
      "",
      fixedSection(root, set, run, notes),
      "",
      extras(run),
      notesSection(root, set),
      "## Data handling note",
      "See `docs/DATA_HANDLING.md`. Synthetic data only; no audio stored; community statistics only as aggregates of 5 or more families.",
    );
  }

  const file = path.join(root, set === "benchmark" ? "docs/eval_report.md" : "docs/safety_report.md");
  writeFileSync(file, `${out.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`);
  return file;
}
