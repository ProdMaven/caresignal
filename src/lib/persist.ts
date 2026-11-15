// Keeps what caregivers add across deploys and restarts. Server only.
// The app state lives in memory (src/mocks/store.ts). When STATE_DATABASE_URL points at Postgres, a snapshot of
// everything caregivers added is saved to one JSON row after each change and loaded again when the server starts.
// This is a bridge until the data routes are backed by real tables.
import { Pool } from "pg";
import { onStoreChanged, restoreStore, snapshotStore } from "@/mocks/store";

const STATE_KEY = process.env.STATE_KEY || "default"; // lets live and staging share one database without sharing data
const SAVE_DELAY_MS = 400;

let pool: Pool | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let saving: Promise<void> = Promise.resolve();

async function save(): Promise<void> {
  if (!pool) return;
  const data = JSON.stringify(snapshotStore());
  await pool.query(
    "insert into app_state (key, data, updated_at) values ($1, $2::jsonb, now()) on conflict (key) do update set data = excluded.data, updated_at = now()",
    [STATE_KEY, data],
  );
}

function saveSoon(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    // One write at a time, in order. A failed save is logged and the next change tries again.
    saving = saving.then(save).catch((err) => console.error("[persist] save failed:", err instanceof Error ? err.message : err));
  }, SAVE_DELAY_MS);
}

// Called once when the server starts (src/instrumentation.ts), before any request is served.
export async function startPersistence(): Promise<void> {
  const url = process.env.STATE_DATABASE_URL;
  if (!url) {
    console.log("[persist] STATE_DATABASE_URL is not set: data is kept in memory only and resets on every deploy.");
    return;
  }
  try {
    pool = new Pool({ connectionString: url, max: 2, connectionTimeoutMillis: 8000 });
    await pool.query(
      "create table if not exists app_state (key text primary key, data jsonb not null, updated_at timestamptz not null default now())",
    );
    const found = await pool.query("select data from app_state where key = $1", [STATE_KEY]);
    if (found.rows.length > 0) {
      const ok = restoreStore(found.rows[0].data);
      console.log(ok ? `[persist] restored saved state for key "${STATE_KEY}".` : `[persist] saved state for key "${STATE_KEY}" was not usable; starting from seed data.`);
    } else {
      console.log(`[persist] no saved state for key "${STATE_KEY}" yet; starting from seed data.`);
    }
    onStoreChanged(saveSoon);
  } catch (err) {
    // Never block the app on the database: run in memory and say so.
    pool = null;
    console.error("[persist] could not start, running in memory only:", err instanceof Error ? err.message : err);
  }
}
