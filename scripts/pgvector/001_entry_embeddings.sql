-- Semantic matching: one embedding per log entry, searched with pgvector.
-- NOT RUN. The live app and staging share one Railway Postgres, so this needs the PM's approval first.
-- To apply (after approval): psql "$STATE_DATABASE_URL" -f scripts/pgvector/001_entry_embeddings.sql
-- To undo: drop table if exists entry_embeddings;  (the extension can stay)
-- The app does not need this table while USE_PGVECTOR is off: embeddings then live with the saved state and
-- similarity is computed in code.

create extension if not exists vector;

create table if not exists entry_embeddings (
  entry_id   text primary key,          -- LogRecord.id
  person_id  text not null,             -- every query filters on this first
  model      text not null,             -- for example Xenova/multilingual-e5-small
  dims       integer not null,          -- 384 for that model
  embedding  vector(384) not null,
  created_at timestamptz not null default now()
);

create index if not exists entry_embeddings_person_idx on entry_embeddings (person_id, model);

-- Cosine index. At our size a sequential scan within one person is already fast; this is for growth.
create index if not exists entry_embeddings_cosine_idx on entry_embeddings using hnsw (embedding vector_cosine_ops);
