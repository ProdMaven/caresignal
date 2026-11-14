// One mock per route in the docs/TASKS.md contracts table.
// Route handlers call these when USE_MOCKS is on (see src/lib/env.ts).
import type {
  AskRequest, AskResponse, EventsResponse, Mode, ParseLogRequest, ParseLogResponse, PatternsResponse,
  PeopleResponse, ResetResponse, CreatePersonRequest, CreatePersonResponse, SaveEventRequest, SaveEventResponse, StrategiesResponse,
} from "../lib/types";
import { mockAsk as buildAsk } from "./ask";
import { mockLog as buildLog } from "./log";
import { eventsInWindow, mockPatterns as buildPatterns } from "./patterns";
import { addEvent, addPerson, allEvents, findPerson, listPeople, resetStore } from "./store";
import { mockStrategies as buildStrategies } from "./strategies";

export { findPerson } from "./store";

// GET /api/people?mode=
export function mockPeople(mode?: Mode): PeopleResponse {
  return { people: listPeople(mode) };
}

// GET /api/people/[id]/events?days=21 (newest first)
export function mockEvents(personId: string, days: number): EventsResponse {
  const events = eventsInWindow(allEvents().filter((e) => e.personId === personId), days)
    .slice()
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
  return { events };
}

// POST /api/log
export function mockLog(req: ParseLogRequest): ParseLogResponse {
  return buildLog(req, listPeople(req.mode));
}

// POST /api/events
export function mockSaveEvent(req: SaveEventRequest): SaveEventResponse {
  return { record: addEvent(req.record) };
}

// GET /api/patterns?personId=
export function mockPatterns(personId: string): PatternsResponse {
  return buildPatterns(personId, allEvents());
}

// POST /api/ask
export function mockAsk(req: AskRequest): AskResponse | null {
  const person = findPerson(req.personId);
  return person ? buildAsk(req, person, allEvents()) : null;
}

// GET /api/strategies?mode=&patternKey=
export function mockStrategies(mode: Mode, patternKey: string | null, voterId: string | null = null): StrategiesResponse {
  return buildStrategies(mode, patternKey, voterId);
}

// POST /api/reset
export function mockReset(): ResetResponse {
  return { ok: true, eventCount: resetStore() };
}

const AGE_LABEL: Record<CreatePersonRequest["ageBand"], string> = {
  "2_5": "Age 2 to 5",
  "6_11": "Age 6 to 11",
  "12_17": "Age 12 to 17",
  adult: "Adult",
};

// POST /api/people (intake). Returns null when the demo already holds the most added people it allows.
export function mockCreatePerson(req: CreatePersonRequest): CreatePersonResponse | null {
  const aliases = Array.from(new Set([req.displayName, ...req.aliases].map((a) => a.trim()).filter(Boolean)));
  const person = addPerson({
    mode: req.mode,
    displayName: req.displayName.trim(),
    aliases,
    ageBandOrSetting: AGE_LABEL[req.ageBand],
    ageBand: req.ageBand,
    gender: req.gender,
    spectrumLevel: req.mode === "autism" ? req.spectrumLevel : undefined,
    communicationLevel: req.communicationLevel,
  });
  return person ? { person } : null;
}

export { feedbackFor, recordFeedback, strategyExists } from "./store";

export { addJournalEntry, listJournal } from "./store";
