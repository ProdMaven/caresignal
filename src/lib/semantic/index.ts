// Semantic index for FEATURE_SEMANTIC_MATCH. Server only.
// For every log entry: one embedding of the caregiver's words plus the structured fields, and, for the
// "what came before" vocabulary, how close the note's clauses are to each tag's meaning.
// Similarity only says which entries are related. Counting stays in code (src/mocks/patterns.ts, src/lib/askAnswers.ts).
// Every lookup takes a person id and never looks outside that person's entries.
import { label } from "../../config/modes";
import type { LogRecord } from "../types";
import { conceptScores, CONCEPT_MARGIN, CONCEPT_THRESHOLD } from "./concepts";
import { cosine, embed, EMBEDDING_DIMS, EMBEDDING_MODEL, roundVector } from "./embeddings";

export interface EntryEmbedding {
  entryId: string;
  personId: string;
  model: string;
  dims: number;
  vector: number[];
  // Tags whose meaning a clause of the note reached the threshold for, with the score and the clause.
  concepts: { tag: string; score: number; clause: string }[];
  createdAt: string;
}

interface SemanticState {
  entries: Map<string, EntryEmbedding>;
  // "entryId|tag": the caregiver said this entry does not belong with that tag.
  exclusions: Set<string>;
}

const g = globalThis as unknown as { __unspokenSemantic?: SemanticState };

function state(): SemanticState {
  g.__unspokenSemantic ??= { entries: new Map(), exclusions: new Set() };
  return g.__unspokenSemantic;
}

// The caregiver's own words plus the structured fields, as one text.
export function entryText(e: LogRecord): string {
  const fields = [
    label(e.eventType, e.mode),
    ...e.contextBefore.map((t) => label(t)),
    ...e.environment.map((t) => label(t)),
    ...e.responseTried.map((t) => label(t)),
  ].filter(Boolean);
  return [(e.rawNote ?? "").trim(), fields.join(", ")].filter(Boolean).join(" | ");
}

// A tag counts only when it clears the threshold and leads every tag that is not itself above the threshold by the margin.
function tagsFor(scores: Record<string, number>, clause: Record<string, string>): EntryEmbedding["concepts"] {
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const below = ranked.find(([, s]) => s < CONCEPT_THRESHOLD)?.[1] ?? 0;
  return ranked
    .filter(([, s]) => s >= CONCEPT_THRESHOLD && s - below >= CONCEPT_MARGIN)
    .map(([tag, score]) => ({ tag, score, clause: clause[tag] ?? "" }));
}

export async function embedEntry(e: LogRecord): Promise<EntryEmbedding> {
  const note = (e.rawNote ?? "").trim();
  const [[vector], scored] = await Promise.all([embed([entryText(e)]), note ? conceptScores(note) : Promise.resolve({ scores: {}, clause: {} })]);
  return {
    entryId: e.id,
    personId: e.personId,
    model: EMBEDDING_MODEL,
    dims: EMBEDDING_DIMS,
    vector: roundVector(vector),
    concepts: tagsFor(scored.scores, scored.clause),
    createdAt: new Date().toISOString(),
  };
}

// Embeds the entries that are not in the index yet. Safe to call again and again.
export async function indexEntries(events: LogRecord[]): Promise<number> {
  const s = state();
  let added = 0;
  for (const e of events) {
    const have = s.entries.get(e.id);
    if (have && have.model === EMBEDDING_MODEL && have.personId === e.personId) continue;
    s.entries.set(e.id, await embedEntry(e));
    added++;
  }
  return added;
}

export function getEmbedding(entryId: string): EntryEmbedding | undefined {
  return state().entries.get(entryId);
}

export function indexSize(): number {
  return state().entries.size;
}

// Tags this entry is close to in meaning, that its labels do not already carry, and that the caregiver has not removed.
export function similarityTags(e: LogRecord): { tag: string; score: number; clause: string }[] {
  const s = state();
  const rec = s.entries.get(e.id);
  if (!rec || rec.personId !== e.personId) return [];
  return rec.concepts.filter((c) => !e.contextBefore.includes(c.tag) && !s.exclusions.has(`${e.id}|${c.tag}`));
}

export function excludeJoin(entryId: string, tag: string): void {
  state().exclusions.add(`${entryId}|${tag}`);
}

// ---- saved state: embeddings and removals for the entries caregivers added. Seeded entries are embedded again at start.
export interface SemanticSnapshot {
  model: string;
  entries: EntryEmbedding[];
  exclusions: string[];
}

export function snapshotSemantic(isAdded: (entryId: string) => boolean): SemanticSnapshot {
  const s = state();
  return { model: EMBEDDING_MODEL, entries: [...s.entries.values()].filter((r) => isAdded(r.entryId)), exclusions: [...s.exclusions] };
}

export function restoreSemantic(snap: SemanticSnapshot | undefined | null): void {
  const s = state();
  s.entries.clear();
  s.exclusions.clear();
  if (!snap || !Array.isArray(snap.entries)) return;
  for (const r of snap.entries) if (r && r.model === EMBEDDING_MODEL && Array.isArray(r.vector) && r.vector.length === EMBEDDING_DIMS) s.entries.set(r.entryId, r);
  for (const x of snap.exclusions ?? []) s.exclusions.add(x);
}

export function resetSemantic(): void {
  g.__unspokenSemantic = { entries: new Map(), exclusions: new Set() };
}

// ---- nearest entries for one person, computed in code. The pgvector path (pgvector.ts) must return the same list.
export interface Neighbor {
  entryId: string;
  score: number;
}

export function nearestInMemory(personId: string, query: number[], limit: number): Neighbor[] {
  const out: Neighbor[] = [];
  for (const r of state().entries.values()) {
    if (r.personId !== personId) continue; // person filter first, always
    out.push({ entryId: r.entryId, score: Math.round(cosine(query, r.vector) * 1e4) / 1e4 });
  }
  return out.sort((a, b) => b.score - a.score || a.entryId.localeCompare(b.entryId)).slice(0, limit);
}

export function allEmbeddings(): EntryEmbedding[] {
  return [...state().entries.values()];
}
