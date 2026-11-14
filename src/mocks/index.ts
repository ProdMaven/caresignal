// One mock per route in the docs/TASKS.md contracts table.
// Route handlers call these when USE_MOCKS is on (see src/lib/env.ts).
import type {
  AskRequest, AskResponse, EventsResponse, Mode, ParseLogRequest, ParseLogResponse, PatternsResponse,
  PeopleResponse, ResetResponse, SaveEventRequest, SaveEventResponse, StrategiesResponse,
} from "../lib/types";
import { mockAsk as buildAsk } from "./ask";
import { mockLog as buildLog } from "./log";
import { eventsInWindow, mockPatterns as buildPatterns } from "./patterns";
import { addEvent, allEvents, findPerson, listPeople, resetStore } from "./store";
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
export function mockStrategies(mode: Mode, patternKey: string | null): StrategiesResponse {
  return buildStrategies(mode, patternKey);
}

// POST /api/reset
export function mockReset(): ResetResponse {
  return { ok: true, eventCount: resetStore() };
}
