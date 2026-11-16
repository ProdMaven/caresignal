// Checks that the two storage paths agree: nearest-entry search computed in code, and the same search in
// Postgres with pgvector. Uses PGlite (Postgres compiled to run inside Node) with the vector extension, so no
// real database is touched. Applies scripts/pgvector/001_entry_embeddings.sql to that throwaway database.
// Run: EMBEDDING_MODEL_DIR=<folder with the model> npx tsx scripts/semantic-storage-test.ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
import { embed, EMBEDDING_MODEL } from "../src/lib/semantic/embeddings";
import { allEmbeddings, indexEntries, nearestInMemory, resetSemantic } from "../src/lib/semantic/index";
import { nearestInPgvector, upsertEmbedding } from "../src/lib/semantic/pgvector";
import type { LogRecord } from "../src/lib/types";

async function main() {
  const set = JSON.parse(readFileSync(path.join(__dirname, "../eval/semantic/paraphrase_set.json"), "utf8")) as { groups: { notes: string[] }[]; nearMisses: { note: string }[] };
  const notes = [...set.groups.flatMap((g) => g.notes), ...set.nearMisses.map((m) => m.note)];
  // Two people share the same notes, so a leak across people would show up as a wrong id in the results.
  const entries: LogRecord[] = notes.flatMap((n, i) => (["p_one", "p_two"] as const).map((personId) => ({
    id: `evt_${personId}_${i}`, personId, mode: "autism", loggedBy: "cg", occurredAt: "2026-11-14T15:00:00", timeBand: "afternoon", source: "text",
    eventType: "meltdown", behaviors: [], intensity: 2, durationMin: null, contextBefore: [], environment: [], responseTried: [], outcome: "unknown",
    rawNote: n, confidence: {}, needsReview: [], redFlags: [], loggedAt: "2026-11-14T15:05:00",
  } as unknown as LogRecord)));
  resetSemantic();
  await indexEntries(entries);

  const db = new PGlite({ extensions: { vector } });
  await db.exec(readFileSync(path.join(__dirname, "pgvector/001_entry_embeddings.sql"), "utf8"));
  const q = { query: (text: string, params?: unknown[]) => db.query(text, params as unknown[]) as Promise<{ rows: Record<string, unknown>[] }> };
  for (const r of allEmbeddings()) await upsertEmbedding(q, r);

  const questions = ["busy places with lots of people", "nights when he did not sleep", "scratchy clothes", "when the tablet is taken away", "había demasiada gente", "रात को नींद नहीं आई", "what is the weather tomorrow?"];
  const vectors = await embed(questions);
  let checks = 0, same = 0, leaks = 0;
  for (const [i, question] of questions.entries()) {
    for (const personId of ["p_one", "p_two", "p_nobody"]) {
      const a = nearestInMemory(personId, vectors[i], 10);
      const b = await nearestInPgvector(q, personId, EMBEDDING_MODEL, vectors[i], 10);
      checks++;
      // Same entries in the same order. Scores may differ in the last decimal (float4 in Postgres), so ties within 0.0005 may swap.
      const idsA = a.map((x) => x.entryId), idsB = b.map((x) => x.entryId);
      const sameSet = idsA.length === idsB.length && idsA.every((id) => idsB.includes(id));
      const sameOrder = idsA.every((id, k) => id === idsB[k] || Math.abs(a[k].score - b[k].score) <= 0.0005);
      const maxDiff = Math.max(0, ...a.map((x) => Math.abs(x.score - (b.find((y) => y.entryId === x.entryId)?.score ?? 0))));
      if (sameSet && sameOrder && maxDiff <= 0.0005) same++;
      else console.log("DIFFERENT", personId, question, idsA.slice(0, 4), idsB.slice(0, 4), maxDiff);
      leaks += [...a, ...b].filter((x) => !x.entryId.startsWith(`evt_${personId}_`)).length;
      if (personId === "p_nobody" && (a.length || b.length)) leaks++;
    }
  }
  console.log(`storage paths agree on ${same} of ${checks} searches; entries returned for the wrong person: ${leaks}; rows in entry_embeddings: ${allEmbeddings().length}`);
  await db.close();
  process.exit(same === checks && leaks === 0 ? 0 : 1);
}
void main();
