// Synthetic demo data. No real people. One generator feeds both the in-memory
// mocks and scripts/seed.ts, so mock numbers and seeded numbers always match.
// Relative imports only: scripts/seed.ts runs this file through tsx.
import type { LogRecord, Mode, Person, StrategyCard, TimeBand } from "../lib/types";
import { addDays, bandForHour, demoToday, isoAt, weekday } from "../lib/time";

export const WINDOW_DAYS = 21;

export const PEOPLE: Person[] = [
  {
    id: "p_helen",
    mode: "dementia",
    displayName: "Helen",
    aliases: ["Helen", "Mom", "Mum", "Mother", "Mama"],
    ageBandOrSetting: "79, lives at home with family",
    isFeatured: true,
  },
  {
    id: "p_arjun",
    mode: "autism",
    displayName: "Arjun",
    aliases: ["Arjun"],
    ageBandOrSetting: "Age 7, home and school",
    isFeatured: true,
  },
  {
    id: "p_maya",
    mode: "autism",
    displayName: "Maya",
    aliases: ["Maya"],
    ageBandOrSetting: "Age 9, home and school",
    isFeatured: true,
  },
];

interface Spec {
  date: string;
  hour: number;
  minute: number;
  mode: Mode;
  personId: string;
  loggedBy: string;
  eventType: string;
  rawNote: string;
  intensity?: 1 | 2 | 3;
  behaviors?: string[];
  durationMin?: number | null;
  contextBefore?: string[];
  environment?: string[];
  responseTried?: string[];
  outcome?: LogRecord["outcome"];
  source?: LogRecord["source"];
}

function pick<T>(list: T[], i: number): T {
  return list[i % list.length];
}

// Builds the 21-day seed history ending yesterday (today stays empty for live demo logs).
// Deterministic for a given date. Planted patterns:
//   Helen: afternoon agitation, 8 events, 6 after a skipped or small meal;
//          Rosa logged the small lunch on 5 of those mornings (cross-caregiver).
//   Helen: evening restlessness, 5 events, 4 after a visit.
//   Arjun: morning meltdown, 9 events, 7 after poor sleep (Dev logged 5 of those nights),
//          6 with a routine change.
//   Maya:  a few scattered events, no pattern yet.
export function buildSeedEvents(today: string = demoToday()): LogRecord[] {
  const weekdays: string[] = []; // oldest first
  const weekends: string[] = [];
  for (let back = WINDOW_DAYS - 1; back >= 1; back--) {
    const date = addDays(today, -back);
    const wd = weekday(date);
    if (wd === 0 || wd === 6) weekends.push(date);
    else weekdays.push(date);
  }
  // 20 consecutive days always hold at least 14 weekdays and 4 weekend days.
  const W = (i: number) => weekdays[i];
  const E = (i: number) => weekends[i];
  const specs: Spec[] = [];

  // ---------- Helen (dementia) ----------
  const helen = { mode: "dementia" as const, personId: "p_helen" };
  const rosaLunchNotes = [
    "Helen only ate a few bites of lunch, pushed the plate away.",
    "Small lunch again today, she had half a sandwich and no fruit.",
    "Helen did not want lunch, just some tea.",
    "She ate about a third of her soup and said she was done.",
    "Helen skipped most of lunch, seemed tired at the table.",
  ];
  const nehaAgitationNotes = [
    "Mom got agitated around 3, pacing the hallway and calling out for Dad. A snack helped.",
    "Mom was worked up mid afternoon, pacing and asking to go home. Settled after some music.",
    "Agitated again after 3, kept calling out. She calmed a bit when we sat together.",
    "Mom was pacing and upset this afternoon, said she was looking for Dad. Toast and tea helped.",
    "Restless and calling out around 3:30. A banana and her old records settled her.",
  ];
  const matchTimes: [number, number][] = [[15, 0], [15, 20], [14, 45], [15, 10], [15, 30]];
  [0, 2, 4, 6, 8].forEach((wi, i) => {
    specs.push({
      ...helen, date: W(wi), hour: 11, minute: 40 + (i % 3) * 5, loggedBy: "cg_rosa",
      eventType: "refused_food", intensity: 1, environment: ["mealtime"], outcome: "unknown",
      rawNote: rosaLunchNotes[i],
    });
    specs.push({
      ...helen, date: W(wi), hour: matchTimes[i][0], minute: matchTimes[i][1], loggedBy: "cg_neha",
      eventType: "agitation", intensity: i === 3 ? 3 : 2, behaviors: ["pacing", "calling_out"],
      durationMin: pick([20, 30, 25, 40, 15], i), contextBefore: ["skipped_meal"],
      responseTried: i % 2 === 0 ? ["offered_snack", "music"] : ["offered_snack", "reassurance"],
      outcome: i === 2 ? "partly_calmed" : "calmed", rawNote: nehaAgitationNotes[i],
    });
  });
  // Sixth match: a weekend, Ravi saw both the small lunch and the agitation himself.
  specs.push({
    ...helen, date: E(0), hour: 15, minute: 15, loggedBy: "cg_ravi", eventType: "agitation",
    intensity: 2, behaviors: ["pacing", "repetitive_speech"], durationMin: 30,
    contextBefore: ["skipped_meal"], responseTried: ["offered_snack", "walk"], outcome: "calmed",
    rawNote: "Mom barely touched lunch and by 3 she was pacing and asking the same question over and over. A snack and a short walk helped.",
  });
  // Two afternoon agitation events without a skipped meal.
  specs.push({
    ...helen, date: W(10), hour: 14, minute: 30, loggedBy: "cg_neha", eventType: "agitation",
    intensity: 2, behaviors: ["pacing", "grabbing"], durationMin: 15, contextBefore: ["toileting_need"],
    responseTried: ["toileting_assist"], outcome: "calmed",
    rawNote: "Mom was agitated and tugging at her clothes after lunch. She needed the bathroom, calm after that.",
  });
  specs.push({
    ...helen, date: E(1), hour: 16, minute: 0, loggedBy: "cg_ravi", eventType: "agitation",
    intensity: 1, behaviors: ["calling_out"], durationMin: 10, responseTried: ["reassurance"],
    outcome: "calmed", rawNote: "Mom called out for a few minutes around 4, ate a good lunch today. Sat with her and she settled.",
  });
  // Evening restlessness after visits (4 of 5).
  const visitNotes = [
    "Cousins visited all afternoon. Mom was restless tonight, up and down from her chair.",
    "Busy day with the grandkids here. She could not settle after dinner, kept pacing.",
    "Neighbors came by for a long visit. Restless this evening, rocking in her chair.",
    "Her church friends visited. She was unsettled all evening and kept going to the door.",
  ];
  [E(0), E(1), E(2), W(5)].forEach((date, i) => {
    specs.push({
      ...helen, date, hour: 18 + (i % 2), minute: 30, loggedBy: "cg_neha", eventType: "restlessness",
      intensity: 2, behaviors: i % 2 === 0 ? ["pacing"] : ["rocking"], durationMin: pick([45, 60, 40, 50], i),
      contextBefore: ["visitor"], environment: ["noisy"],
      responseTried: i % 2 === 0 ? ["quiet_space", "music"] : ["quiet_space", "reassurance"],
      outcome: i === 1 ? "partly_calmed" : "calmed", rawNote: visitNotes[i],
    });
  });
  specs.push({
    ...helen, date: W(9), hour: 19, minute: 0, loggedBy: "cg_neha", eventType: "restlessness",
    intensity: 1, behaviors: ["pacing"], durationMin: 20, responseTried: ["walk"], outcome: "calmed",
    rawNote: "A little restless after dinner on a quiet day. A short walk around the yard helped.",
  });
  // Other day-to-day events.
  specs.push({
    ...helen, date: W(1), hour: 9, minute: 15, loggedBy: "cg_rosa", eventType: "refused_care",
    intensity: 2, behaviors: ["grabbing"], contextBefore: ["bathing"], responseTried: ["reassurance"],
    outcome: "partly_calmed", rawNote: "Helen did not want her shower this morning and held on to the door frame. We did a wash at the sink instead.",
  });
  specs.push({
    ...helen, date: W(7), hour: 9, minute: 30, loggedBy: "cg_rosa", eventType: "refused_care",
    intensity: 1, contextBefore: ["bathing"], responseTried: ["music"], outcome: "calmed",
    rawNote: "Helen said no to bathing at first. Played her favorite songs and she agreed after a while.",
  });
  specs.push({
    ...helen, date: W(3), hour: 2, minute: 10, loggedBy: "cg_neha", eventType: "sleep_disturbance",
    intensity: 2, behaviors: ["calling_out"], durationMin: 40, responseTried: ["reassurance", "offered_drink"],
    outcome: "calmed", rawNote: "Mom woke around 2 and was calling out. Warm milk and sitting with her helped her back to sleep.",
  });
  specs.push({
    ...helen, date: W(11), hour: 3, minute: 0, loggedBy: "cg_neha", eventType: "sleep_disturbance",
    intensity: 1, durationMin: 20, responseTried: ["toileting_assist"], outcome: "calmed",
    rawNote: "Up at 3 needing the bathroom, back to bed without trouble.",
  });
  specs.push({
    ...helen, date: W(12), hour: 10, minute: 20, loggedBy: "cg_rosa", eventType: "calling_out",
    intensity: 1, behaviors: ["calling_out", "repetitive_speech"], durationMin: 10,
    responseTried: ["redirect_activity"], outcome: "calmed",
    rawNote: "Helen kept asking where her husband was this morning. We looked at the photo album together and she relaxed.",
  });

  // ---------- Arjun (autism) ----------
  const arjun = { mode: "autism" as const, personId: "p_arjun" };
  const meltdownDays = [0, 1, 3, 4, 6, 8, 9, 11, 13].map(W);
  const meltdownContext: string[][] = [
    ["poor_sleep", "routine_change"],
    ["poor_sleep"],
    ["poor_sleep", "routine_change"],
    ["poor_sleep", "routine_change"],
    ["routine_change"],
    ["poor_sleep", "routine_change"],
    ["poor_sleep"],
    ["poor_sleep", "routine_change"],
    ["transition"],
  ];
  const meltdownNotes = [
    "Arjun had a meltdown before school. He was up half the night and his usual bus aide was out.",
    "Hard morning, Arjun cried and covered his ears getting dressed. He slept badly.",
    "Meltdown at the door before school after a rough night. We also had to leave early for an appointment.",
    "Arjun screamed and dropped to the floor before the bus. Poor sleep, and Grandma did the morning instead of me.",
    "Meltdown this morning when breakfast was different, we were out of his cereal. He slept fine.",
    "Big meltdown before school. Bad night, and school had a late start so the timing was off.",
    "Arjun cried and rocked for a while before school. He was awake from 2 to 4.",
    "Meltdown putting shoes on. Slept badly and there was a different driver.",
    "Arjun got upset leaving the house, wanted to finish his puzzle. Calmed in the car.",
  ];
  const devSleepNotes = [
    "Arjun woke at 1:30 and could not get back to sleep for two hours.",
    "Up at 2 again, wide awake and humming. Sat with him until he drifted off.",
    "Arjun was awake from 1 to 3, tossing and turning.",
    "Restless night, he came into our room at 2:30.",
    "He woke at 3 and stayed up, asked for the hallway light on.",
  ];
  let devIndex = 0;
  meltdownDays.forEach((date, i) => {
    const ctx = meltdownContext[i];
    if ([0, 2, 3, 5, 7].includes(i)) {
      specs.push({
        ...arjun, date, hour: 1 + (devIndex % 3), minute: 30, loggedBy: "cg_dev", eventType: "sleep_trouble",
        intensity: 2, durationMin: pick([120, 90, 120, 60, 100], devIndex), environment: ["bedtime"],
        responseTried: ["reassurance"], outcome: "partly_calmed", rawNote: devSleepNotes[devIndex],
      });
      devIndex++;
    }
    specs.push({
      ...arjun, date, hour: 8, minute: 5 + (i % 4) * 5, loggedBy: "cg_priya", eventType: "meltdown",
      intensity: i === 5 || i === 3 ? 3 : 2,
      behaviors: pick([["crying", "covering_ears"], ["screaming", "crying"], ["crying", "rocking"]], i),
      durationMin: pick([15, 20, 25, 30, 10], i), contextBefore: ctx, environment: ["school"],
      responseTried: i % 2 === 0 ? ["quiet_space", "deep_pressure"] : ["break_time", "sensory_tool"],
      outcome: i === 5 ? "partly_calmed" : "calmed", rawNote: meltdownNotes[i],
    });
  });
  [W(2), W(7), W(12)].forEach((date, i) => {
    specs.push({
      ...arjun, date, hour: 16, minute: 30, loggedBy: "cg_priya", eventType: "transition_distress",
      intensity: 1, behaviors: ["crying"], durationMin: 10, contextBefore: ["screen_time_ended"],
      responseTried: ["visual_schedule"], outcome: "calmed",
      rawNote: pick([
        "Arjun was upset when tablet time ended. Showing him the schedule card helped.",
        "Tears when the show was over. He settled once he saw what came next.",
        "Hard time stopping his game for dinner prep. A five minute warning would have helped.",
      ], i),
    });
  });
  [E(0), E(3)].forEach((date, i) => {
    specs.push({
      ...arjun, date, hour: 18, minute: 15, loggedBy: "cg_dev", eventType: "food_refusal",
      intensity: 1, behaviors: ["withdrawing"], environment: ["mealtime"], outcome: "unknown",
      rawNote: pick(["Arjun would not eat dinner, the pasta was a new shape.", "He pushed dinner away and only ate the bread."], i),
    });
  });

  // ---------- Maya (autism, no pattern yet) ----------
  const maya = { mode: "autism" as const, personId: "p_maya", loggedBy: "cg_lena" };
  specs.push({
    ...maya, date: W(2), hour: 13, minute: 30, eventType: "shutdown", intensity: 2, behaviors: ["withdrawing", "covering_ears"],
    durationMin: 30, contextBefore: ["loud_noise"], environment: ["school", "noisy"], responseTried: ["quiet_space"],
    outcome: "calmed", rawNote: "Maya went quiet and hid under her hood after the fire drill at school. Quiet corner helped.",
  });
  specs.push({
    ...maya, date: W(8), hour: 15, minute: 45, eventType: "shutdown", intensity: 1, behaviors: ["withdrawing"],
    durationMin: 20, contextBefore: ["crowd"], environment: ["outing", "crowded"], responseTried: ["break_time"],
    outcome: "calmed", rawNote: "Maya stopped talking at the grocery store, it was packed. We took a break in the car.",
  });
  specs.push({
    ...maya, date: W(5), hour: 17, minute: 30, eventType: "stimming_increase", intensity: 1, behaviors: ["rocking"],
    durationMin: 25, contextBefore: ["waiting"], responseTried: ["sensory_tool"], outcome: "calmed",
    rawNote: "Lots of rocking while we waited for dinner. Her fidget ring helped.",
  });
  specs.push({
    ...maya, date: E(1), hour: 10, minute: 0, eventType: "stimming_increase", intensity: 1, behaviors: ["repetitive_speech"],
    contextBefore: ["new_person"], outcome: "unknown",
    rawNote: "Maya repeated lines from her show a lot when the new sitter arrived.",
  });
  specs.push({
    ...maya, date: W(10), hour: 22, minute: 15, eventType: "sleep_trouble", intensity: 1, durationMin: 45,
    environment: ["bedtime"], responseTried: ["deep_pressure"], outcome: "calmed",
    rawNote: "Maya could not fall asleep until after 10. Tucking the blanket in tight helped.",
  });
  specs.push({
    ...maya, date: W(13), hour: 7, minute: 40, eventType: "transition_distress", intensity: 2, behaviors: ["crying"],
    durationMin: 10, contextBefore: ["clothing_texture"], responseTried: ["reassurance"], outcome: "calmed",
    rawNote: "Maya cried getting dressed, the new sweater felt scratchy. Switched to her soft one.",
  });

  specs.sort((a, b) => (a.date + String(a.hour).padStart(2, "0") + String(a.minute).padStart(2, "0"))
    .localeCompare(b.date + String(b.hour).padStart(2, "0") + String(b.minute).padStart(2, "0")));

  return specs.map((s, i): LogRecord => {
    const occurredAt = isoAt(s.date, s.hour, s.minute);
    const loggedMinute = s.minute + 6;
    const timeBand: TimeBand = bandForHour(s.hour);
    return {
      id: `evt_${String(i + 1).padStart(4, "0")}`,
      mode: s.mode,
      personId: s.personId,
      loggedBy: s.loggedBy,
      occurredAt,
      timeBand,
      loggedAt: isoAt(s.date, s.hour + Math.floor(loggedMinute / 60), loggedMinute % 60),
      source: s.source ?? (i % 4 === 3 ? "tap" : "voice"),
      eventType: s.eventType,
      behaviors: s.behaviors ?? [],
      intensity: s.intensity ?? 2,
      durationMin: s.durationMin ?? null,
      contextBefore: s.contextBefore ?? [],
      environment: s.environment ?? [],
      responseTried: s.responseTried ?? [],
      outcome: s.outcome ?? "unknown",
      rawNote: s.rawNote,
      confidence: { eventType: 0.95, occurredAt: 0.9, intensity: 0.85 },
      needsReview: [],
      redFlags: [],
    };
  });
}

// ---------- Strategies (docs/SCORING.md seed targets, score per the PRD demo script) ----------
export interface SeedStrategy extends StrategyCard {
  mode: Mode;
  safetyApproved: boolean;
}

export const STRATEGY_DISCLAIMER = "Based on family logs, not a clinical trial. Discuss with your care team.";

export const STRATEGIES: SeedStrategy[] = [
  {
    id: "s_afternoon_snack", mode: "dementia", patternKey: "agitation|skipped_meal",
    name: "Scheduled mid-afternoon snack",
    description: "Offer a small snack and a drink at the same time each afternoon, before the restless time usually starts.",
    score: 81, tier: "winning_research", families: 27, pctImproved: 0.74, avgDropPct: 0.42, durabilityPct: 0.8,
    researchBacked: true, safetyApproved: true,
  },
  {
    id: "s_quiet_hour", mode: "dementia", patternKey: "agitation|skipped_meal",
    name: "Protected quiet hour after lunch",
    description: "Keep the hour after lunch calm: lights low, television off, no visitors or errands.",
    score: 58, tier: "promising", families: 14, pctImproved: 0.64, avgDropPct: 0.31, durabilityPct: 0.56,
    researchBacked: false, safetyApproved: true,
  },
  {
    id: "s_hand_massage", mode: "dementia", patternKey: "agitation|skipped_meal",
    name: "Hand massage before meals",
    description: "A few minutes of gentle hand massage with lotion before sitting down to eat.",
    score: 52, tier: "emerging", families: 3, pctImproved: 0.67, avgDropPct: 0.22, durabilityPct: 0.5,
    researchBacked: false, safetyApproved: true,
  },
  {
    id: "s_group_activity", mode: "dementia", patternKey: "agitation|skipped_meal",
    name: "Extra afternoon group activity",
    description: "Adding a busy group activity in the mid-afternoon.",
    score: 29, tier: "not_recommended", families: 11, pctImproved: 0.18, avgDropPct: -0.12, durabilityPct: 0,
    researchBacked: false, safetyApproved: true,
  },
  {
    id: "s_visual_schedule", mode: "autism", patternKey: "meltdown|poor_sleep",
    name: "Visual morning schedule",
    description: "A picture schedule of the morning steps that your child can see and check off, set up the night before.",
    score: 84, tier: "winning_research", families: 34, pctImproved: 0.76, avgDropPct: 0.45, durabilityPct: 0.82,
    researchBacked: true, safetyApproved: true,
  },
  {
    id: "s_transition_warnings", mode: "autism", patternKey: "meltdown|poor_sleep",
    name: "Five-minute transition warnings",
    description: "Give a calm heads-up five minutes before each change, with a timer your child can see.",
    score: 72, tier: "winning", families: 22, pctImproved: 0.68, avgDropPct: 0.36, durabilityPct: 0.64,
    researchBacked: false, safetyApproved: true,
  },
  {
    id: "s_weighted_blanket", mode: "autism", patternKey: "meltdown|poor_sleep",
    name: "Weighted blanket at bedtime",
    description: "Offer a weighted blanket as part of the bedtime routine, if your child likes it.",
    score: 55, tier: "promising", families: 9, pctImproved: 0.56, avgDropPct: 0.27, durabilityPct: 0.5,
    researchBacked: false, safetyApproved: true,
  },
  {
    id: "s_morning_screen", mode: "autism", patternKey: "meltdown|poor_sleep",
    name: "Extra morning screen time",
    description: "Adding more screen time before school on hard mornings.",
    score: 27, tier: "not_recommended", families: 8, pctImproved: 0.25, avgDropPct: -0.15, durabilityPct: 0,
    researchBacked: false, safetyApproved: true,
  },
];
