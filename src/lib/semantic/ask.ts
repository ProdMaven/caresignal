// Ask by retrieval (FEATURE_SEMANTIC_MATCH). Server only.
// The question is matched by meaning to one "what came before" tag. The entries retrieved for the SELECTED person
// are the ones that carry that tag by label, plus the ones whose wording is close to it. Only those are passed on.
// Code then counts and writes the answer from templates. No model reads the retrieved notes, and note text is
// never treated as instructions: it is only compared, counted and linked.
import { label } from "../../config/modes";
import { WINDOW_DAYS } from "../../mocks/data";
import { contextPhrase, eventsInWindow } from "../../mocks/patterns";
import { answerFor } from "../askAnswers";
import type { AskResponse, AskUnderstanding, LogRecord, Person } from "../types";
import { bestConcept, conceptScores } from "./concepts";
import { embed } from "./embeddings";
import { getEmbedding, indexEntries, similarityTags } from "./index";
import { nearest, saveEmbedding } from "./store";

const MAX_RETRIEVED = 30;
// Intents whose ordinary answer can be computed over just the retrieved entries.
const REUSE: AskUnderstanding["intent"][] = ["when_does_it_happen", "what_helped", "how_often", "who_saw_it"];
const SKIP: AskUnderstanding["intent"][] = ["medical_out_of_scope", "crisis", "about_the_app", "compare_periods"];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function counts<T extends string>(values: T[]): [T, number][] {
  const m = new Map<T, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

// Returns null when the question does not clearly mean one tag: the ordinary Ask answer is used, unchanged.
export async function semanticAsk(question: string, person: Person, allEvents: LogRecord[], understanding: AskUnderstanding): Promise<AskResponse | null> {
  if (SKIP.includes(understanding.intent)) return null;
  // A question that already names a kind of moment ("her afternoon agitation") is answered the usual way.
  // A time of day alone does not stop retrieval: "nights when he did not sleep" is about sleep, not about the night band.
  if (understanding.eventType) return null;

  const scored = await conceptScores(question);
  const tag = bestConcept(scored.scores);
  if (!tag) return null;

  const days = understanding.days ?? WINDOW_DAYS;
  const mine = eventsInWindow(allEvents.filter((e) => e.personId === person.id), days); // person first, always
  const fresh = mine.filter((e) => !getEmbedding(e.id));
  await indexEntries(mine);
  for (const e of fresh) {
    const rec = getEmbedding(e.id);
    if (rec) await saveEmbedding(rec);
  }

  const byLabel = mine.filter((e) => e.contextBefore.includes(tag));
  const bySimilarity = mine.filter((e) => !e.contextBefore.includes(tag) && similarityTags(e).some((t) => t.tag === tag));
  const wanted = new Set([...byLabel, ...bySimilarity].map((e) => e.id));

  // Most similar to the question first. The search itself is limited to this person's entries.
  const [queryVector] = await embed([question]);
  const order = (await nearest(person.id, queryVector, 500)).filter((n) => wanted.has(n.entryId)).map((n) => n.entryId);
  const rank = new Map(order.map((id, i) => [id, i]));
  const retrieved = [...byLabel, ...bySimilarity].sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999)).slice(0, MAX_RETRIEVED);

  const window = days === WINDOW_DAYS ? "the last 3 weeks" : `the last ${days} days`;
  const phrase = contextPhrase(tag);
  const semantic = { concept: tag, byLabel: byLabel.map((e) => e.id), bySimilarity: bySimilarity.map((e) => e.id) };

  if (retrieved.length === 0) {
    return {
      redFlag: false, redFlagMessage: null,
      answer: `I looked in ${person.displayName}'s logs for entries where ${phrase} came before, and found none in ${window}. This is a count from the logs, not a cause or a diagnosis.`,
      evidence: [], relatedPatternKeys: [], dataSufficient: false, intent: understanding.intent, semantic,
    };
  }

  const how = bySimilarity.length > 0
    ? `${byLabel.length} by its label and ${bySimilarity.length} by similar wording`
    : `all by their label`;
  const lead = `I found ${plural(retrieved.length, "entry", "entries")} in ${person.displayName}'s logs from ${window} where ${phrase} came before (${how}). `;

  if (REUSE.includes(understanding.intent)) {
    const base = answerFor({ intent: understanding.intent, ...(understanding.days ? { days: understanding.days } : {}) }, person, retrieved, [], undefined, question);
    return { ...base, answer: lead + base.answer, relatedPatternKeys: [], semantic };
  }

  // Overview of the retrieved entries, counted in code.
  const kinds = counts(retrieved.map((e) => label(e.eventType, e.mode).toLowerCase())).slice(0, 3).map(([k, n]) => `${k} (${n})`);
  const bands = counts(retrieved.map((e) => e.timeBand.replace("_", " "))).slice(0, 3).map(([k, n]) => `${k} (${n})`);
  const calm = retrieved.filter((e) => e.outcome === "calmed").length;
  const answer =
    lead +
    `What was logged: ${kinds.join(", ")}. Time of day: ${bands.join(", ")}. ${calm} of those ${retrieved.length} ended calm. ` +
    `This is a count from the logs, not a cause or a diagnosis.`;
  const evidence: AskResponse["evidence"] = [];
  if (byLabel.length) evidence.push({ text: `${plural(byLabel.length, "entry", "entries")} labeled with ${phrase}.`, eventIds: byLabel.map((e) => e.id) });
  if (bySimilarity.length) evidence.push({ text: `${plural(bySimilarity.length, "entry", "entries")} joined because the wording is close in meaning. Check them: similarity can be wrong.`, eventIds: bySimilarity.map((e) => e.id) });
  return { redFlag: false, redFlagMessage: null, answer, evidence, relatedPatternKeys: [], dataSufficient: retrieved.length >= 3, intent: understanding.intent, semantic };
}
