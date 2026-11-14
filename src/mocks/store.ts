// In-memory store for mock mode. Lives on globalThis so every route handler
// (each may be bundled separately) shares one copy for the life of the server.
import type { LogRecord, Mode, Person, StrategyFeedback } from "../lib/types";
import { nowIso } from "../lib/time";
import { buildSeedEvents, PEOPLE, STRATEGIES } from "./data";

interface MockStore {
  events: LogRecord[];
  nextId: number;
  people: Person[];
  nextPersonId: number;
  // strategyId -> voterId -> helped. One answer per caregiver per strategy.
  votes: Map<string, Map<string, boolean>>;
}

const MAX_ADDED_PEOPLE = 20; // keeps a public demo from filling up

const globalForStore = globalThis as unknown as { __caresignalMockStore?: MockStore };

function freshStore(): MockStore {
  const events = buildSeedEvents();
  return { events, nextId: events.length + 1, people: [...PEOPLE], nextPersonId: 1, votes: new Map() };
}

function store(): MockStore {
  globalForStore.__caresignalMockStore ??= freshStore();
  return globalForStore.__caresignalMockStore;
}

export function listPeople(mode?: Mode): Person[] {
  return store().people.filter((p) => !mode || p.mode === mode);
}

export function findPerson(id: string): Person | undefined {
  return store().people.find((p) => p.id === id);
}

export function allEvents(): LogRecord[] {
  return store().events;
}

export function addEvent(draft: Omit<LogRecord, "id" | "loggedAt">): LogRecord {
  const s = store();
  const record: LogRecord = {
    ...draft,
    id: `evt_${String(s.nextId++).padStart(4, "0")}`,
    loggedAt: nowIso(),
  };
  s.events.push(record);
  return record;
}

export function resetStore(): number {
  globalForStore.__caresignalMockStore = freshStore();
  return globalForStore.__caresignalMockStore.events.length;
}

// Intake: add a person the caregiver described. Returns null when the demo is full.
export function addPerson(input: Omit<Person, "id" | "isFeatured">): Person | null {
  const s = store();
  if (s.people.length - PEOPLE.length >= MAX_ADDED_PEOPLE) return null;
  const person: Person = { ...input, id: `p_new_${s.nextPersonId++}`, isFeatured: false };
  s.people.push(person);
  return person;
}

// "Did this help?" feedback. Seeded answers are synthetic, sized from each strategy's seeded families.
function seededFeedback(strategyId: string): { helped: number; notHelped: number } {
  const s = STRATEGIES.find((x) => x.id === strategyId);
  if (!s) return { helped: 0, notHelped: 0 };
  const answered = Math.round(s.families * 0.6);
  const helped = Math.round(answered * s.pctImproved);
  return { helped, notHelped: answered - helped };
}

export function strategyExists(strategyId: string): boolean {
  return STRATEGIES.some((s) => s.id === strategyId && s.safetyApproved);
}

export function feedbackFor(strategyId: string, voterId: string | null): StrategyFeedback {
  const base = seededFeedback(strategyId);
  const votes = store().votes.get(strategyId);
  let helped = base.helped;
  let notHelped = base.notHelped;
  votes?.forEach((v) => (v ? helped++ : notHelped++));
  return { helped, notHelped, yourAnswer: voterId ? votes?.get(voterId) ?? null : null };
}

// Records or replaces this caregiver's answer. A second answer changes the first, it never adds a vote.
export function recordFeedback(strategyId: string, voterId: string, helped: boolean): StrategyFeedback {
  const s = store();
  const votes = s.votes.get(strategyId) ?? new Map<string, boolean>();
  votes.set(voterId, helped);
  s.votes.set(strategyId, votes);
  return feedbackFor(strategyId, voterId);
}
