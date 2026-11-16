// The pgvector storage path for semantic matching, behind USE_PGVECTOR (off by default). Server only.
// Needs the table from scripts/pgvector/001_entry_embeddings.sql. That migration has NOT been run; it waits for the PM.
// Anything with a query(text, params) method works: a pg Pool in the app, PGlite in the tests.
import type { EntryEmbedding, Neighbor } from "./index";

export interface Queryable {
  query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

const toVector = (v: number[]) => `[${v.join(",")}]`;

export async function upsertEmbedding(db: Queryable, r: EntryEmbedding): Promise<void> {
  await db.query(
    `insert into entry_embeddings (entry_id, person_id, model, dims, embedding, created_at)
     values ($1, $2, $3, $4, $5::vector, $6)
     on conflict (entry_id) do update set person_id = excluded.person_id, model = excluded.model, dims = excluded.dims, embedding = excluded.embedding, created_at = excluded.created_at`,
    [r.entryId, r.personId, r.model, r.dims, toVector(r.vector), r.createdAt],
  );
}

// The person filter is in the WHERE clause, so another person's rows are never candidates.
// "<=>" is cosine distance; similarity is 1 minus it.
export async function nearestInPgvector(db: Queryable, personId: string, model: string, query: number[], limit: number): Promise<Neighbor[]> {
  const res = await db.query(
    `select entry_id, 1 - (embedding <=> $1::vector) as score
     from entry_embeddings
     where person_id = $2 and model = $3
     order by embedding <=> $1::vector asc, entry_id asc
     limit $4`,
    [toVector(query), personId, model, limit],
  );
  return res.rows.map((row) => ({ entryId: String(row.entry_id), score: Math.round(Number(row.score) * 1e4) / 1e4 }));
}
