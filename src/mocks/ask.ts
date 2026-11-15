// Mock for POST /api/ask. Red-flag rule first, then scope, then an answer built
// only from counts in that person's logs. No AI here. Lane 2 replaces the wording.
import type { AskRequest, AskResponse, LogRecord, Person } from "../lib/types";
import { TIME_BAND_LABEL } from "../lib/time";
import { caregiverName, label } from "../config/modes";
import { WINDOW_DAYS } from "./data";
import { computePatterns, contextPhrase, eventsInWindow, type PatternDetail } from "./patterns";
import { normalize, OUT_OF_SCOPE_MESSAGE, screenSafety } from "./safety";
import { mockStrategies } from "./strategies";

function pickPattern(question: string, patterns: PatternDetail[]): PatternDetail {
  const q = normalize(question);
  const scored = patterns.map((p) => {
    let score = 0;
    if (q.includes(TIME_BAND_LABEL[p.timeBand].toLowerCase())) score += 2;
    if (q.includes(label(p.eventType).toLowerCase())) score += 2;
    if (q.includes(p.eventType.replace(/_/g, " "))) score += 1;
    for (const word of contextPhrase(p.contextTag).split(" ")) if (word.length > 4 && q.includes(word)) score += 1;
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].p;
}

export function mockAsk(req: AskRequest, person: Person, allEvents: LogRecord[]): AskResponse {
  const safety = screenSafety(req.question);
  const events = eventsInWindow(allEvents.filter((e) => e.personId === person.id), WINDOW_DAYS);

  // 1. Red-flag rule, before anything else.
  if (safety.message) {
    if (safety.caregiverDistress) {
      return {
        redFlag: true,
        redFlagMessage: safety.message,
        answer: "Your own wellbeing comes first right now. The logs can wait.",
        evidence: [],
        relatedPatternKeys: [],
        dataSufficient: true,
      };
    }
    const flagged = events.filter(
      (e) => e.redFlags.length > 0 || e.behaviors.includes("head_banging") || safety.redFlags.some((f) => e.redFlags.includes(f)),
    );
    return {
      redFlag: true,
      redFlagMessage: safety.message,
      answer:
        `This is something for your doctor or care team to look at, so Unspoken will not guess at a reason. ` +
        `You can share ${person.displayName}'s log with them to show what happened and when.`,
      evidence: [
        flagged.length > 0
          ? { text: `${flagged.length} saved ${flagged.length === 1 ? "entry mentions" : "entries mention"} something similar in the last 3 weeks.`, eventIds: flagged.map((e) => e.id) }
          : { text: `No saved entries in the last 3 weeks mention this yet. Logging it gives your care team a record.`, eventIds: [] },
      ],
      relatedPatternKeys: [],
      dataSufficient: flagged.length > 0,
    };
  }

  // 2. Diagnosis, medication and placement questions are out of scope.
  if (safety.outOfScope) {
    return {
      redFlag: false,
      redFlagMessage: null,
      answer: OUT_OF_SCOPE_MESSAGE,
      evidence: [],
      relatedPatternKeys: [],
      dataSufficient: true,
    };
  }

  // 3. Grounded answer from the pattern counts.
  const patterns = computePatterns(person.id, allEvents);
  if (patterns.length === 0) {
    return {
      redFlag: false,
      redFlagMessage: null,
      answer:
        `There are not enough logs for ${person.displayName} yet to see a clear pattern ` +
        `(${events.length} ${events.length === 1 ? "entry" : "entries"} in the last 3 weeks). ` +
        `A pattern needs at least 4 similar entries. Keep logging and ask again in a few days.`,
      evidence: [],
      relatedPatternKeys: [],
      dataSufficient: false,
    };
  }

  const p = pickPattern(req.question, patterns);
  const what = `${TIME_BAND_LABEL[p.timeBand].toLowerCase()} ${label(p.eventType).toLowerCase()}`;
  const evidence: AskResponse["evidence"] = [
    {
      text: `${p.matchCount} of ${p.totalCount} ${what} entries in the last 3 weeks came after ${contextPhrase(p.contextTag)}.`,
      eventIds: p.evidenceEventIds,
    },
  ];
  if (p.crossCount > 0) {
    evidence.push({
      text: `${p.crossNames.join(" and ")} logged it earlier on ${p.crossCount} of those days, before the ${label(p.eventType).toLowerCase()} was seen.`,
      eventIds: p.crossEventIds,
    });
  }
  const who = Object.entries(p.loggedByCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([id, n]) => `${caregiverName(id)} (${n})`)
    .join(", ");
  evidence.push({ text: `Those ${p.matchCount} entries were logged by: ${who}.`, eventIds: p.evidenceEventIds });

  const top = mockStrategies(person.mode, p.patternKey).strategies[0];
  const strategyLine =
    top && top.families >= 5 && top.tier !== "not_recommended"
      ? ` Other families with this pattern most often found "${top.name}" helpful (${Math.round(top.families)} families).`
      : "";

  return {
    redFlag: false,
    redFlagMessage: null,
    answer:
      `From ${person.displayName}'s logs: ${p.summary} ` +
      `Possible things to check: ${p.thingsToCheck.map((t) => t.toLowerCase()).join(", ")}. ` +
      `This is a pattern in the logs, not a cause or a diagnosis.${strategyLine}`,
    evidence,
    relatedPatternKeys: [p.patternKey],
    dataSufficient: true,
  };
}
