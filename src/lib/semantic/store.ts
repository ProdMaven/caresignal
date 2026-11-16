// Picks where nearest-entry search runs: in code over the saved embeddings (default), or in Postgres with pgvector
// (USE_PGVECTOR=true, needs the migration that has not been run). Both return the same list for the same data.
import { Pool } from "pg";
import { features } from "../features";
import { EMBEDDING_MODEL } from "./embeddings";
import { nearestInMemory, type EntryEmbedding, type Neighbor } from "./index";
import { nearestInPgvector, upsertEmbedding, type Queryable } from "./pgvector";

let pool: Pool | null = null;
function db(): Queryable | null {
  if (!features.usePgvector()) return null;
  const url = process.env.STATE_DATABASE_URL;
  if (!url) return null;
  pool ??= new Pool({ connectionString: url, max: 2, connectionTimeoutMillis: 8000 });
  return pool;
}

export async function nearest(personId: string, query: number[], limit: number): Promise<Neighbor[]> {
  const pg = db();
  if (pg) {
    try {
      return await nearestInPgvector(pg, personId, EMBEDDING_MODEL, query, limit);
    } catch (err) {
      console.error("[semantic] pgvector search failed, using the in-code search:", err instanceof Error ? err.message : err);
    }
  }
  return nearestInMemory(personId, query, limit);
}

export async function saveEmbedding(record: EntryEmbedding): Promise<void> {
  const pg = db();
  if (!pg) return; // in-code path: the record is already in the index and is saved with the app state
  try {
    await upsertEmbedding(pg, record);
  } catch (err) {
    console.error("[semantic] pgvector save failed:", err instanceof Error ? err.message : err);
  }
}
