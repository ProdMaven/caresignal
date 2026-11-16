// Step 1 baseline: how well does today's labeling (the note formatter) group paraphrases, with no semantic matching?
// Sends every note in paraphrase_set.json to POST /api/log (parse only, nothing is saved) and reads the tags.
// Run: EVAL_BASE_URL=... EVAL_INVITE_CODE=... npx tsx eval/semantic/baseline.ts
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const base = (process.env.EVAL_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const code = process.env.EVAL_INVITE_CODE ?? "";

async function parse(note: string, mode: string, personId: string) {
  const started = Date.now();
  const res = await fetch(`${base}/api/log`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-invite-code": code },
    body: JSON.stringify({ mode, personId, transcript: note, loggedBy: "Priya", now: "2026-11-14T16:00:00" }),
  });
  const body = (await res.json().catch(() => null)) as { draft?: { contextBefore?: string[]; environment?: string[]; eventType?: string } } | null;
  return { status: res.status, source: res.headers.get("x-caresignal-source"), ms: Date.now() - started, contextBefore: body?.draft?.contextBefore ?? [], environment: body?.draft?.environment ?? [], eventType: body?.draft?.eventType ?? null };
}

async function main() {
  const file = path.join(__dirname, "paraphrase_set.json");
  const set = JSON.parse(readFileSync(file, "utf8")) as { mode: string; personId: string; groups: { group: string; expectTag: string; lang: string; notes: string[] }[]; nearMisses: { id: string; mustNotTag: string; lang: string; note: string }[] };
  const groups = [];
  for (const g of set.groups) {
    const notes = [];
    for (const n of g.notes) notes.push({ note: n, ...(await parse(n, set.mode, set.personId)) });
    const tagged = notes.filter((n) => n.contextBefore.includes(g.expectTag)).length;
    groups.push({ group: g.group, expectTag: g.expectTag, lang: g.lang, tagged, grouped: tagged === 3, notes });
    console.log(g.group, g.expectTag, g.lang, `${tagged}/3`, notes.map((n) => `[${n.contextBefore.join(",")}]`).join(" "));
  }
  const near = [];
  for (const m of set.nearMisses) {
    const r = await parse(m.note, set.mode, set.personId);
    near.push({ ...m, ...r, wronglyTagged: r.contextBefore.includes(m.mustNotTag) });
    console.log(m.id, "must not be", m.mustNotTag, `[${r.contextBefore.join(",")}]`, r.contextBefore.includes(m.mustNotTag) ? "WRONG" : "ok");
  }
  const all = groups.flatMap((g) => g.notes);
  const summary = {
    baseUrl: base, ranAt: new Date().toISOString(),
    answeredBy: all.reduce<Record<string, number>>((a, n) => ({ ...a, [n.source ?? "none"]: (a[n.source ?? "none"] ?? 0) + 1 }), {}),
    notesTagged: all.length ? groups.reduce((s, g) => s + g.tagged, 0) : 0, notesTotal: all.length,
    groupsFullyGrouped: groups.filter((g) => g.grouped).length, groupsTotal: groups.length,
    notesWithEmptyContext: all.filter((n) => n.contextBefore.length === 0).length,
    nearMissesWronglyTagged: near.filter((n) => n.wronglyTagged).length, nearMissesTotal: near.length,
    medianMs: all.map((n) => n.ms).sort((a, b) => a - b)[Math.floor(all.length / 2)],
  };
  console.log(JSON.stringify(summary));
  writeFileSync(path.join(__dirname, "baseline_results.json"), `${JSON.stringify({ summary, groups, near }, null, 1)}\n`);
}
void main();
