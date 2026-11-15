// Turns a caregiver's spoken or typed story into dated milestones. Server only.
// Order: caregiver distress screen (fixed wording), then the model, then a keyword fallback if the model cannot be used.
// Nothing is saved here: the caregiver checks and edits the milestones, then saves the Care Profile.
import { AiError, callClaude, parseJson } from "@/lib/ai";
import { mocksEnabled } from "@/lib/env";
import { DISTRESS_MESSAGE, screenSafety } from "@/lib/safety";
import { historyReplySchema, MILESTONE_CATEGORIES } from "@/lib/schemas";
import { wallParts } from "@/lib/time";
import type { FormatHistoryRequest, FormatHistoryResponse, MilestoneCategory, MilestoneInput } from "@/lib/types";
import { buildHistoryUserMessage, HISTORY_SYSTEM } from "@/prompts/history";

const MAX_MILESTONES = 20;
const SCOPE_MESSAGE =
  "Unspoken can only turn their story into milestones here. It cannot diagnose or give advice. For questions about care, please ask your doctor or care team.";

// Medicine names never appear in a milestone, whatever the model or the caregiver wrote.
const MEDICINE_NAME = /\b(seroquel|quetiapine|lorazepam|ativan|risperdal|risperidone|haldol|haloperidol|xanax|alprazolam|melatonin|benadryl|aricept|donepezil|namenda|memantine|ritalin|adderall|concerta|abilify|aripiprazole|zoloft|sertraline|prozac|fluoxetine|clonidine|guanfacine|cbd)\b/gi;
const DOSE = /\b\d+(\.\d+)?\s?(mg|mcg|ml|milligrams?)\b/gi;

function clean(text: string): string {
  return text.replace(MEDICINE_NAME, "a medicine").replace(DOSE, "").replace(/\s+/g, " ").replace(/\s+([.,])/g, "$1").trim();
}

// Oldest first. A milestone with no year stays where it was said: it takes the place in time of the dated
// milestone before it, or goes first when nothing dated came before it.
export function orderMilestones<T extends { year: number | null; month: number | null }>(list: T[]): T[] {
  let carried = -Infinity;
  return list
    .map((m, i) => {
      if (m.year !== null) carried = m.year + (m.month ?? 0) / 100;
      return { m, i, key: m.year !== null ? m.year + (m.month ?? 0) / 100 : carried };
    })
    .sort((a, b) => a.key - b.key || a.i - b.i)
    .map(({ m }) => m);
}

function finish(items: Omit<MilestoneInput, "id">[], nowYear: number): MilestoneInput[] {
  const seen = new Set<string>();
  const kept = items
    .map((m, i) => ({
      i,
      m: {
        when: m.when.trim().slice(0, 60),
        year: m.year !== null && m.year >= 1900 && m.year <= nowYear ? m.year : null,
        month: m.month !== null && m.month >= 1 && m.month <= 12 ? m.month : null,
        category: (MILESTONE_CATEGORIES as readonly string[]).includes(m.category) ? m.category : ("other" as MilestoneCategory),
        text: clean(m.text).slice(0, 300),
      },
    }))
    .filter(({ m }) => {
      const key = m.text.toLowerCase();
      if (!m.text || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(({ m }) => m);
  return orderMilestones(kept).slice(0, MAX_MILESTONES);
}

// Keyword fallback: one milestone per sentence, with a year when one can be read. Used in mock mode and when the model fails.
const WORD_NUMBER: Record<string, number> = { a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

export function fallbackMilestones(text: string, nowYear: number): MilestoneInput[] {
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter((s) => s.length > 8);
  const items = sentences.map((sentence) => {
    const lower = sentence.toLowerCase();
    let year: number | null = null;
    let when = "";
    const explicit = /\b(19|20)\d{2}\b/.exec(lower);
    const ago = /\b(\d{1,2}|a|one|two|three|four|five|six|seven|eight|nine|ten) years? ago\b/.exec(lower);
    if (explicit) {
      year = Number(explicit[0]);
      when = explicit[0];
    } else if (ago) {
      const n = WORD_NUMBER[ago[1]] ?? Number(ago[1]);
      year = nowYear - n;
      when = `About ${n} ${n === 1 ? "year" : "years"} ago`;
    } else if (/\blast year\b/.test(lower)) {
      year = nowYear - 1;
      when = "Last year";
    } else if (/\bthis year\b/.test(lower)) {
      year = nowYear;
      when = "This year";
    }
    let category: MilestoneCategory = "change";
    if (/\bdiagnos|\bassess|\bevaluat|\bfirst (noticed|signs)|\bstarted forgetting/.test(lower)) category = "diagnosis";
    else if (/\bfell\b|\bfall\b|\bhospital|\bsurgery|\binfection|\bbroke\b|\bseizure|\bill\b/.test(lower)) category = "health";
    else if (/\btherap|\baide\b|\bprogram\b|\bservice|\bstarted (a|an|using|speech|occupational)|\bmedicine|\bmedication/.test(lower)) category = "support";
    else if (/\bmoved\b|\bschool\b|\bclass\b|\bday program\b|\bmoved in\b/.test(lower)) category = "setting";
    return { when, year, month: null, category, text: sentence.replace(/^(so|and|then|also|well)[, ]+/i, "") };
  });
  return finish(items, nowYear);
}

export async function formatHistory(req: FormatHistoryRequest): Promise<FormatHistoryResponse> {
  const nowYear = Number((wallParts(req.now)?.date ?? new Date().toISOString()).slice(0, 4));

  // The caregiver is the one in distress: care and 988 first, nothing is turned into history.
  if (screenSafety(req.text).caregiverDistress) {
    return { kind: "caregiver_distress", message: DISTRESS_MESSAGE.replace(" Nothing from this note was saved to the log.", " Nothing from this was saved."), milestones: [] };
  }
  if (mocksEnabled()) return { kind: "milestones", message: null, milestones: fallbackMilestones(req.text, nowYear) };

  try {
    const reply = await callClaude({
      system: HISTORY_SYSTEM,
      messages: [{ role: "user", content: buildHistoryUserMessage(req) }],
      maxTokens: 1500,
      timeoutMs: 20_000,
      maxRetries: 0,
      label: "history",
    });
    const parsed = historyReplySchema.safeParse(parseJson(reply.text));
    if (!parsed.success) throw new AiError("History reply did not match the output shape.", "bad_json");
    if (parsed.data.kind === "caregiver_distress") {
      return { kind: "caregiver_distress", message: DISTRESS_MESSAGE.replace(" Nothing from this note was saved to the log.", " Nothing from this was saved."), milestones: [] };
    }
    const milestones = finish(parsed.data.milestones, nowYear);
    if (parsed.data.kind === "out_of_scope" || milestones.length === 0) return { kind: "out_of_scope", message: SCOPE_MESSAGE, milestones: [] };
    return { kind: "milestones", message: null, milestones };
  } catch (err) {
    if (!(err instanceof AiError)) console.error("[history] formatter failed:", err instanceof Error ? err.message : err);
    // Model unavailable or unusable: sentence-by-sentence fallback, for the caregiver to tidy up.
    return { kind: "milestones", message: null, milestones: fallbackMilestones(req.text, nowYear) };
  }
}
