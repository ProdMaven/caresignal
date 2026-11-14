// In-memory store for mock mode. Lives on globalThis so every route handler
// (each may be bundled separately) shares one copy for the life of the server.
import type { LogRecord, Mode, Person } from "../lib/types";
import { nowIso } from "../lib/time";
import { buildSeedEvents, PEOPLE } from "./data";

interface MockStore {
  events: LogRecord[];
  nextId: number;
  people: Person[];
  nextPersonId: number;
}

const MAX_ADDED_PEOPLE = 20; // keeps a public demo from filling up

const globalForStore = globalThis as unknown as { __caresignalMockStore?: MockStore };

function freshStore(): MockStore {
  const events = buildSeedEvents();
  return { events, nextId: events.length + 1, people: [...PEOPLE], nextPersonId: 1 };
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
