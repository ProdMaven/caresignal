// Tunes the similarity threshold on eval/semantic/paraphrase_set.json. Run: npx tsx scripts/semantic-tune.ts
// Prints recall (paraphrases matched to their tag) and false joins (wrong tag, or a near miss matched) per threshold.
import { readFileSync } from "node:fs";
import path from "node:path";
import { conceptScores, bestConcept } from "../src/lib/semantic/concepts";

interface Group { group: string; expectTag: string; lang: string; notes: string[] }
interface Near { id: string; mustNotTag: string; note: string }

async function main() {
  const set = JSON.parse(readFileSync(path.join(__dirname, "../eval/semantic/paraphrase_set.json"), "utf8")) as { groups: Group[]; nearMisses: Near[] };
  const rows: { kind: "para" | "near"; id: string; tag: string; scores: Record<string, number> }[] = [];
  for (const g of set.groups) for (const [i, n] of g.notes.entries()) rows.push({ kind: "para", id: `${g.group}.${i + 1}`, tag: g.expectTag, scores: (await conceptScores(n)).scores });
  for (const m of set.nearMisses) rows.push({ kind: "near", id: m.id, tag: m.mustNotTag, scores: (await conceptScores(m.note)).scores });
  const margin = Number(process.env.MARGIN ?? 0.02);
  console.log(`margin ${margin}`);
  for (const t of [0.86, 0.87, 0.88, 0.89, 0.9, 0.91, 0.92, 0.93]) {
    let hit = 0, wrong = 0, nearJoin = 0, nearOther = 0;
    const groupsHit = new Map<string, number>();
    for (const r of rows) {
      const best = bestConcept(r.scores, t, margin);
      if (r.kind === "para") {
        if (best === r.tag) { hit++; const gid = r.id.split(".")[0]; groupsHit.set(gid, (groupsHit.get(gid) ?? 0) + 1); }
        else if (best) wrong++;
      } else if (best === r.tag) nearJoin++;
      else if (best) nearOther++;
    }
    const full = [...groupsHit.values()].filter((n) => n === 3).length;
    const joined = hit + wrong + nearJoin;
    console.log(`threshold ${t.toFixed(2)}: paraphrases matched ${hit}/30 (recall ${(hit / 30 * 100).toFixed(0)}%), whole groups ${full}/10, wrong tag ${wrong}, near misses joined ${nearJoin}/10, near miss to another tag ${nearOther}, precision ${joined ? (hit / joined * 100).toFixed(0) : "n/a"}%`);
  }
  if (process.env.VERBOSE) for (const r of rows) { const top = Object.entries(r.scores).sort((a, b) => b[1] - a[1]).slice(0, 2); console.log(r.id, r.kind, r.tag, r.scores[r.tag].toFixed(3), "| top", top.map(([k, v]) => `${k}:${v.toFixed(3)}`).join(" ")); }
}
void main();
