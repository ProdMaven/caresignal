// In-memory store for mock mode. Lives on globalThis so every route handler
// (each may be bundled separately) shares one copy for the life of the server.
import type { JournalEntry, LogRecord, Mode, Mood, Person, StrategyFeedback } from "../lib/types";
import { addDays, demoToday, isoAt, nowIso } from "../lib/time";
import { registerCaregivers } from "../config/modes";
import { buildSeedEvents, PEOPLE, STRATEGIES } from "./data";

interface MockStore {
  events: LogRecord[];
  nextId: number;
  people: Person[];
  nextPersonId: number;
  // strategyId -> voterId -> helped. One answer per caregiver per strategy.
  votes: Map<string, Map<string, boolean>>;
  journal: JournalEntry[];
  nextJournalId: number;
}

// Entries added by caregivers start here, well above any seeded id, so the seed can grow without clashing with saved data.
const FIRST_ADDED_EVENT_ID = 1001;

const MAX_JOURNAL_ENTRIES = 300; // keeps a public demo from filling up

const MAX_ADDED_PEOPLE = 20; // keeps a public demo from filling up

const globalForStore = globalThis as unknown as {
  __caresignalMockStore?: MockStore;
  // Called after every change, so the state can be saved (see src/lib/persist.ts). Unset when nothing is saved.
  __caresignalStoreChanged?: () => void;
};

function changed(): void {
  globalForStore.__caresignalStoreChanged?.();
}

function freshStore(): MockStore {
  const events = buildSeedEvents();
  return { events, nextId: FIRST_ADDED_EVENT_ID, people: [...PEOPLE], nextPersonId: 1, votes: new Map(), journal: seedJournal(), nextJournalId: 100 };
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
  changed();
  return record;
}

export function resetStore(): number {
  globalForStore.__caresignalMockStore = freshStore();
  changed();
  return globalForStore.__caresignalMockStore.events.length;
}

// Intake: add a person the caregiver described. Returns null when the demo is full.
export function addPerson(
  input: Omit<Person, "id" | "isFeatured" | "caregivers">,
  caregivers: { name: string; role: string }[] = [],
): Person | null {
  const s = store();
  if (s.people.length - PEOPLE.length >= MAX_ADDED_PEOPLE) return null;
  const n = s.nextPersonId++;
  const person: Person = {
    ...input,
    id: `p_new_${n}`,
    isFeatured: false,
    // Each added person gets their own caregivers. With none given, the screen falls back to the mode's demo caregivers.
    caregivers: caregivers.length ? caregivers.map((c, i) => ({ id: `cg_new_${n}_${i + 1}`, name: c.name, role: c.role })) : undefined,
  };
  registerCaregivers(person.caregivers);
  s.people.push(person);
  changed();
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
  changed();
  return feedbackFor(strategyId, voterId);
}

// Synthetic journal entries so the journal and the overview are not empty in the demo.
function seedJournal(): JournalEntry[] {
  const today = demoToday();
  const rows: [string, Mode, number, number, number, Mood | null, string][] = [
    ["cg_neha", "dementia", -12, 21, 10, "tired", "Long day. Mom asked for Dad four times this afternoon and I ran out of ways to answer. I sat in the car for ten minutes before coming back in."],
    ["cg_neha", "dementia", -9, 20, 40, "worried", "Rosa said lunch was small again. I keep wondering if I am missing something obvious."],
    ["cg_neha", "dementia", -6, 22, 5, "sad", "She did not know my name tonight. She still held my hand though."],
    ["cg_neha", "dementia", -4, 19, 30, "hopeful", "We tried the snack before three. Quiet afternoon, and we listened to her old records together."],
    ["cg_neha", "dementia", -2, 21, 15, "tired", "Ravi could not come this weekend, so it was just me. I am running on very little sleep."],
    ["cg_neha", "dementia", -1, 20, 0, "okay", "An ordinary day. I will take ordinary."],
    ["cg_priya", "autism", -11, 9, 20, "overwhelmed", "Another hard morning before school. I was late for work again and felt every look in the car line."],
    ["cg_priya", "autism", -8, 21, 0, "worried", "He was up three times last night. I can tell tomorrow will be heavy before it starts."],
    ["cg_priya", "autism", -5, 20, 30, "hopeful", "The picture schedule on the fridge helped today. He checked it himself and smiled at the bus picture."],
    ["cg_priya", "autism", -3, 9, 45, "tired", "Substitute driver again. I wish someone would warn us. He held it together until we got home."],
    ["cg_priya", "autism", -1, 21, 30, "okay", "Good bedtime. He told me about every planet twice and I loved it."],
  ];
  return rows.map(([loggedBy, mode, dayOffset, hour, minute, mood, text], i) => ({
    id: `jr_${String(i + 1).padStart(3, "0")}`,
    loggedBy, mode, mood, text, source: "text" as const,
    createdAt: isoAt(addDays(today, dayOffset), hour, minute),
  }));
}

export function listJournal(loggedBy: string): JournalEntry[] {
  return store()
    .journal.filter((e) => e.loggedBy === loggedBy)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

// Returns null when the demo already holds the most entries it allows.
export function addJournalEntry(input: Omit<JournalEntry, "id">): JournalEntry | null {
  const s = store();
  if (s.journal.length >= MAX_JOURNAL_ENTRIES) return null;
  const entry: JournalEntry = { ...input, id: `jr_${s.nextJournalId++}` };
  s.journal.push(entry);
  changed();
  return entry;
}

// ---------------------------------------------------------------------------
// Snapshot: everything caregivers added, as plain JSON, so it can outlive a deploy.
// Seeded demo data is NOT saved. It is rebuilt on load so its dates stay current.
// ---------------------------------------------------------------------------
const SEED_JOURNAL_IDS = new Set(seedJournal().map((j) => j.id));

export interface StoreSnapshot {
  version: 1;
  addedEvents: LogRecord[];
  nextId: number;
  addedPeople: Person[];
  nextPersonId: number;
  votes: [string, [string, boolean][]][];
  addedJournal: JournalEntry[];
  nextJournalId: number;
}

export function snapshotStore(): StoreSnapshot {
  const s = store();
  return {
    version: 1,
    addedEvents: s.events.filter((e) => Number(e.id.replace("evt_", "")) >= FIRST_ADDED_EVENT_ID),
    nextId: s.nextId,
    addedPeople: s.people.filter((p) => !p.isFeatured),
    nextPersonId: s.nextPersonId,
    votes: [...s.votes.entries()].map(([strategyId, votes]) => [strategyId, [...votes.entries()]]),
    addedJournal: s.journal.filter((j) => !SEED_JOURNAL_IDS.has(j.id)),
    nextJournalId: s.nextJournalId,
  };
}

// Rebuilds the store from fresh seed data plus a saved snapshot. Returns false when the snapshot is not usable.
export function restoreStore(raw: unknown): boolean {
  const snap = raw as Partial<StoreSnapshot> | null;
  if (!snap || snap.version !== 1 || !Array.isArray(snap.addedEvents) || !Array.isArray(snap.addedPeople)) return false;
  const fresh = freshStore();
  fresh.events.push(...snap.addedEvents.filter((e) => Number(e.id.replace("evt_", "")) >= FIRST_ADDED_EVENT_ID));
  fresh.nextId = Math.max(fresh.nextId, Number(snap.nextId) || 0);
  fresh.people.push(...snap.addedPeople);
  fresh.nextPersonId = Math.max(fresh.nextPersonId, Number(snap.nextPersonId) || 0);
  fresh.votes = new Map((snap.votes ?? []).map(([strategyId, votes]) => [strategyId, new Map(votes)]));
  fresh.journal.push(...(snap.addedJournal ?? []));
  fresh.nextJournalId = Math.max(fresh.nextJournalId, Number(snap.nextJournalId) || 0);
  fresh.people.forEach((p) => registerCaregivers(p.caregivers));
  globalForStore.__caresignalMockStore = fresh;
  return true;
}

export function onStoreChanged(listener: () => void): void {
  globalForStore.__caresignalStoreChanged = listener;
}
