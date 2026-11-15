// In-memory store for mock mode. Lives on globalThis so every route handler
// (each may be bundled separately) shares one copy for the life of the server.
import type { LogRecord, Milestone, MilestoneInput, Mode, Person, StrategyFeedback, UpdatePersonRequest } from "../lib/types";
import { nowIso } from "../lib/time";
import { registerCaregivers } from "../config/modes";
import { buildSeedEvents, PEOPLE, STRATEGIES } from "./data";

interface MockStore {
  events: LogRecord[];
  nextId: number;
  people: Person[];
  nextPersonId: number;
  // strategyId -> voterId -> helped. One answer per caregiver per strategy.
  votes: Map<string, Map<string, boolean>>;
  // History a family shared for a demo profile, by person id (saved data only).
  featuredHistory?: Record<string, Milestone[]>;
}

// Entries added by caregivers start here, well above any seeded id, so the seed can grow without clashing with saved data.
const FIRST_ADDED_EVENT_ID = 1001;

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
  return { events, nextId: FIRST_ADDED_EVENT_ID, people: [...PEOPLE], nextPersonId: 1, votes: new Map() };
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
// Gives every milestone an id and keeps the ones that already have one.
function withMilestoneIds(history: MilestoneInput[] | undefined): Milestone[] | undefined {
  if (!history) return undefined;
  const used = new Set(history.map((m) => m.id).filter(Boolean));
  let n = 1;
  return history.map((m) => {
    if (m.id) return { ...m, id: m.id };
    while (used.has(`ms_${n}`)) n++;
    used.add(`ms_${n}`);
    return { ...m, id: `ms_${n}` };
  });
}

const AGE_LABEL: Record<string, string> = { "2_5": "Age 2 to 5", "6_11": "Age 6 to 11", "12_17": "Age 12 to 17", adult: "Adult" };

// Edits a person added through intake. Existing caregivers keep their ids so earlier entries still show the right name.
export function updatePerson(id: string, patch: UpdatePersonRequest): Person | null {
  const s = store();
  const index = s.people.findIndex((p) => p.id === id && !p.isFeatured);
  if (index < 0) return null;
  const current = s.people[index];
  const next: Person = { ...current };
  if (patch.displayName !== undefined) next.displayName = patch.displayName.trim();
  if (patch.aliases !== undefined || patch.displayName !== undefined) {
    next.aliases = Array.from(new Set([next.displayName, ...(patch.aliases ?? current.aliases.filter((a) => a !== current.displayName))].map((a) => a.trim()).filter(Boolean)));
  }
  if (patch.ageBand !== undefined) {
    next.ageBand = patch.ageBand;
    next.ageBandOrSetting = AGE_LABEL[patch.ageBand] ?? next.ageBandOrSetting;
  }
  if (patch.gender !== undefined) next.gender = patch.gender ?? undefined;
  if (patch.spectrumLevel !== undefined && next.mode === "autism") next.spectrumLevel = patch.spectrumLevel;
  if (patch.communicationLevel !== undefined) next.communicationLevel = patch.communicationLevel;
  if (patch.caregivers !== undefined) {
    const prefix = `cg_new_${id.replace("p_new_", "")}_`;
    const existingIds = new Set((current.caregivers ?? []).map((c) => c.id));
    let n = (current.caregivers ?? []).reduce((max, c) => Math.max(max, Number(c.id.replace(prefix, "")) || 0), 0);
    next.caregivers = patch.caregivers.map((c) => ({
      id: c.id && existingIds.has(c.id) ? c.id : `${prefix}${++n}`,
      name: c.name.trim(),
      role: c.role.trim(),
    }));
    registerCaregivers(next.caregivers);
  }
  if (patch.history !== undefined) next.history = withMilestoneIds(patch.history);
  s.people[index] = next;
  changed();
  return next;
}

export function addPerson(
  input: Omit<Person, "id" | "isFeatured" | "caregivers" | "history">,
  caregivers: { name: string; role: string }[] = [],
  history?: MilestoneInput[],
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
    history: withMilestoneIds(history),
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

// ---------------------------------------------------------------------------
// Snapshot: everything caregivers added, as plain JSON, so it can outlive a deploy.
// Seeded demo data is NOT saved. It is rebuilt on load so its dates stay current.
// ---------------------------------------------------------------------------
export interface StoreSnapshot {
  version: 1;
  addedEvents: LogRecord[];
  nextId: number;
  addedPeople: Person[];
  nextPersonId: number;
  votes: [string, [string, boolean][]][];
  // History a family shared for a demo profile. Kept in saved data only, never in the seed file.
  featuredHistory?: Record<string, Milestone[]>;
}

// An added profile that is folded into a demo profile the first time saved data is loaded after this change:
// its entries and history move over and the added profile is removed. Matched by name and mode.
const MERGE_INTO_FEATURED: { name: string; mode: Mode; into: string }[] = [{ name: "Aisha", mode: "autism", into: "p_maya" }];

function mergeIntoFeatured(fresh: MockStore, featuredHistory: Record<string, Milestone[]>): void {
  for (const rule of MERGE_INTO_FEATURED) {
    const target = fresh.people.find((p) => p.id === rule.into);
    const from = fresh.people.filter((p) => !p.isFeatured && p.mode === rule.mode && p.displayName.trim().toLowerCase() === rule.name.toLowerCase());
    if (!target || from.length === 0) continue;
    for (const person of from) {
      // Entries keep who logged them: a caregiver with the same name on the demo profile takes over the id.
      const caregiverId = new Map((person.caregivers ?? []).map((c) => [c.id, target.caregivers?.find((t) => t.name.toLowerCase() === c.name.trim().toLowerCase())?.id ?? c.id]));
      registerCaregivers(person.caregivers);
      fresh.events = fresh.events.map((e) => (e.personId === person.id ? { ...e, personId: target.id, loggedBy: caregiverId.get(e.loggedBy) ?? e.loggedBy } : e));
      if (person.history?.length && !featuredHistory[target.id]?.length) featuredHistory[target.id] = person.history;
      fresh.people = fresh.people.filter((p) => p.id !== person.id);
      console.log(`[store] moved the added profile ${person.id} into the demo profile ${target.id}.`);
    }
  }
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
    featuredHistory: { ...(s.featuredHistory ?? {}) },
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
  const featuredHistory: Record<string, Milestone[]> = { ...(snap.featuredHistory ?? {}) };
  const before = fresh.people.length;
  mergeIntoFeatured(fresh, featuredHistory);
  fresh.featuredHistory = featuredHistory;
  fresh.people = fresh.people.map((p) => (p.isFeatured && featuredHistory[p.id]?.length ? { ...p, history: featuredHistory[p.id] } : p));
  fresh.people.forEach((p) => registerCaregivers(p.caregivers));
  globalForStore.__caresignalMockStore = fresh;
  // A profile was folded in: save the new shape once the save hook is attached.
  if (fresh.people.length !== before) setTimeout(changed, 2_000);
  return true;
}

export function onStoreChanged(listener: () => void): void {
  globalForStore.__caresignalStoreChanged = listener;
}
