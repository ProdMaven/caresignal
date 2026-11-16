// Maps free text to the controlled vocabulary by meaning. Similarity only proposes a tag; code does all counting.
import { CONTEXT_CONCEPTS } from "../../config/semanticConcepts";
import { clauses, cosine, embed } from "./embeddings";

// Tuned on eval/semantic/paraphrase_set.json with scripts/semantic-tune.ts (see docs/DECISIONS.md).
// At or above the threshold, and ahead of the next tag by the margin, a clause counts as meaning that tag.
// Below it, nothing is ever joined.
export const CONCEPT_THRESHOLD = 0.9;
export const CONCEPT_MARGIN = 0.02;

const g = globalThis as unknown as { __unspokenConceptVectors?: Promise<Record<string, number[][]>> | null };

export function conceptVectors(): Promise<Record<string, number[][]>> {
  if (!g.__unspokenConceptVectors) {
    g.__unspokenConceptVectors = (async () => {
      const out: Record<string, number[][]> = {};
      for (const [tag, phrases] of Object.entries(CONTEXT_CONCEPTS)) out[tag] = await embed(phrases);
      return out;
    })().catch((err) => {
      g.__unspokenConceptVectors = null;
      throw err;
    });
  }
  return g.__unspokenConceptVectors;
}

// For each tag, the best similarity between any clause of the text and any phrase for the tag.
export async function conceptScores(text: string): Promise<{ scores: Record<string, number>; clause: Record<string, string> }> {
  const parts = clauses(text);
  const pieces = parts.length ? parts : [text];
  const [vectors, concepts] = await Promise.all([embed(pieces), conceptVectors()]);
  const scores: Record<string, number> = {};
  const clause: Record<string, string> = {};
  for (const [tag, cvs] of Object.entries(concepts)) {
    let best = 0;
    let which = "";
    vectors.forEach((v, i) => {
      for (const c of cvs) {
        const s = cosine(v, c);
        if (s > best) {
          best = s;
          which = pieces[i];
        }
      }
    });
    scores[tag] = Math.round(best * 1000) / 1000;
    clause[tag] = which;
  }
  return { scores, clause };
}

// The one tag the text means, or null. Needs the threshold and a clear lead over the runner-up.
export function bestConcept(scores: Record<string, number>, threshold = CONCEPT_THRESHOLD, margin = CONCEPT_MARGIN): string | null {
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0 || ranked[0][1] < threshold) return null;
  if (ranked.length > 1 && ranked[0][1] - ranked[1][1] < margin) return null;
  return ranked[0][0];
}

// Every tag at or above the threshold (a note can mean more than one), each still ahead of unrelated tags by the margin rule above.
export function conceptsAbove(scores: Record<string, number>, threshold = CONCEPT_THRESHOLD): string[] {
  return Object.entries(scores).filter(([, s]) => s >= threshold).sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
}
