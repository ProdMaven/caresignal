// The person picked on screen wins. A note only moves an entry to someone else when the caregiver confirms it.
// Applied to every /api/log response (model, demo cache, keyword fallback, mock), after the note is parsed.
import type { ParseLogResponse, Person } from "@/lib/types";

// A person counts as named in the note when the parser matched them by name with high confidence.
const NAMED_CONFIDENCE = 0.9;

export function applySelectedPerson(response: ParseLogResponse, roster: Person[], selectedId: string | undefined): ParseLogResponse {
  const draft = response.draft;
  const selected = selectedId ? roster.find((p) => p.id === selectedId) : undefined;
  if (!draft || !selected) return response;

  const named = draft.personId && (draft.confidence.personId ?? 0) >= NAMED_CONFIDENCE ? roster.find((p) => p.id === draft.personId) : undefined;
  const withoutPersonReview = draft.needsReview.filter((f) => f !== "personId");

  // The note names the picked person, or names nobody: the picked person is used, nothing to ask.
  if (!named || named.id === selected.id) {
    return {
      ...response,
      draft: { ...draft, personId: selected.id, needsReview: withoutPersonReview, confidence: { ...draft.confidence, personId: 0.95 } },
      unmatchedPerson: false,
      candidates: [],
    };
  }

  // The note clearly names someone else on the list. Keep the picked person and let the caregiver choose.
  return {
    ...response,
    draft: { ...draft, personId: selected.id, needsReview: ["personId", ...withoutPersonReview], confidence: { ...draft.confidence, personId: 0.5 } },
    unmatchedPerson: false,
    candidates: [named, selected],
  };
}
