// Backfill: embeds the entries caregivers already saved, for semantic matching.
// DO NOT run this against the live database without the PM's approval. It was written on Nov 16 and has only
// been run in dry-run mode against a local file. It reads the saved app state, embeds each added entry with the
// local model (no text leaves the machine it runs on) and then either:
//   --dry-run            prints what it would do and writes nothing (default)
//   --write-state        saves the embeddings into the saved app state (the in-code path)
//   --write-pgvector     upserts rows into entry_embeddings (needs scripts/pgvector/001_entry_embeddings.sql first)
// Run: STATE_DATABASE_URL=... STATE_KEY=staging npx tsx scripts/backfill-embeddings.ts --dry-run
//  or: npx tsx scripts/backfill-embeddings.ts --state-file ./state.json --dry-run
import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { EMBEDDING_DIMS, EMBEDDING_MODEL } from "../src/lib/semantic/embeddings";
import { embedEntry, type EntryEmbedding } from "../src/lib/semantic/index";
import { upsertEmbedding } from "../src/lib/semantic/pgvector";
import type { LogRecord } from "../src/lib/types";

const arg = (name: string) => process.argv.includes(name);
const value = (name: string) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : undefined; };

async function main() {
  const writeState = arg("--write-state");
  const writePg = arg("--write-pgvector");
  const dryRun = !writeState && !writePg;
  const key = process.env.STATE_KEY || "default";
  const file = value("--state-file");
  const pool = file ? null : new Pool({ connectionString: process.env.STATE_DATABASE_URL, max: 1 });

  let state: { addedEvents?: LogRecord[]; semantic?: { model: string; entries: EntryEmbedding[]; exclusions: string[] } };
  if (file) state = JSON.parse(readFileSync(file, "utf8"));
  else {
    const found = await pool!.query("select data from app_state where key = $1", [key]);
    if (found.rows.length === 0) throw new Error(`No saved state for key "${key}".`);
    state = found.rows[0].data;
  }
  const events = state.addedEvents ?? [];
  const have = new Map((state.semantic?.entries ?? []).filter((r) => r.model === EMBEDDING_MODEL).map((r) => [r.entryId, r]));
  const todo = events.filter((e) => !have.has(e.id));
  console.log(`${events.length} saved entries, ${have.size} already embedded with ${EMBEDDING_MODEL} (${EMBEDDING_DIMS} dims), ${todo.length} to embed. Mode: ${dryRun ? "dry run, nothing is written" : writePg ? "write to entry_embeddings" : "write to saved state"}.`);

  const fresh: EntryEmbedding[] = [];
  for (const e of todo) fresh.push(await embedEntry(e));
  if (dryRun) {
    for (const r of fresh.slice(0, 5)) console.log(` would embed ${r.entryId} for ${r.personId}: ${r.concepts.map((c) => `${c.tag} ${c.score}`).join(", ") || "no tag above the threshold"}`);
  } else if (writePg) {
    for (const r of [...have.values(), ...fresh]) await upsertEmbedding(pool!, r);
    console.log(`upserted ${have.size + fresh.length} rows into entry_embeddings.`);
  } else if (pool) {
    const semantic = { model: EMBEDDING_MODEL, entries: [...have.values(), ...fresh], exclusions: state.semantic?.exclusions ?? [] };
    await pool.query("update app_state set data = jsonb_set(data, '{semantic}', $2::jsonb), updated_at = now() where key = $1", [key, JSON.stringify(semantic)]);
    console.log(`saved ${semantic.entries.length} embeddings into the app state for key "${key}".`);
  }
  await pool?.end();
}
main().catch((err) => { console.error(err instanceof Error ? err.message : err); process.exit(1); });
