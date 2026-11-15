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
    caregivers: [
      { id: "cg_neha", name: "Neha", role: "daughter" },
      { id: "cg_ravi", name: "Ravi", role: "son, weekends" },
      { id: "cg_rosa", name: "Rosa", role: "home aide, weekday mornings" },
    ],
    history: [
      { id: "ms_1", when: "About 5 years ago", year: 2021, month: null, category: "diagnosis", text: "Started forgetting names and repeating questions; the family thought it was age." },
      { id: "ms_2", when: "Spring 2022", year: 2022, month: 4, category: "diagnosis", text: "Diagnosed with dementia by a specialist at a memory clinic." },
      { id: "ms_3", when: "Summer 2022", year: 2022, month: 7, category: "change", text: "Stopped driving after getting lost on a familiar road." },
      { id: "ms_4", when: "2024", year: 2024, month: null, category: "setting", text: "Moved in with her daughter's family." },
      { id: "ms_5", when: "Last year", year: 2025, month: null, category: "health", text: "Fell in the kitchen, broke her wrist, and spent a week in hospital." },
      { id: "ms_6", when: "January 2026", year: 2026, month: 1, category: "support", text: "A home aide began helping on weekday mornings." },
    ],
  },
  {
    id: "p_arjun",
    mode: "autism",
    displayName: "Arjun",
    aliases: ["Arjun"],
    ageBandOrSetting: "Age 7, home and school",
    isFeatured: true,
    caregivers: [
      { id: "cg_priya", name: "Priya", role: "mother" },
      { id: "cg_dev", name: "Dev", role: "father" },
    ],
    history: [
      { id: "ms_1", when: "Age 2", year: 2021, month: null, category: "diagnosis", text: "Parents noticed he was not using words and lined up his toys for long stretches." },
      { id: "ms_2", when: "Age 3", year: 2022, month: null, category: "diagnosis", text: "Assessed and identified as autistic." },
      { id: "ms_3", when: "2022", year: 2022, month: null, category: "support", text: "Started speech therapy once a week." },
      { id: "ms_4", when: "Fall 2024", year: 2024, month: 10, category: "setting", text: "Started kindergarten with a classroom aide." },
      { id: "ms_5", when: "2025", year: 2025, month: null, category: "change", text: "Began speaking in short sentences at home." },
      { id: "ms_6", when: "This fall", year: 2026, month: 9, category: "change", text: "Mornings before school became harder after a change of bus driver." },
    ],
  },
  {
    id: "p_maya",
    mode: "autism",
    displayName: "Maya",
    aliases: ["Maya"],
    ageBandOrSetting: "Age 9, home and school",
    isFeatured: true,
    caregivers: [{ id: "cg_lena", name: "Lena", role: "mother" }],
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
//   Maya:  afternoon shutdown, 6 events, 5 after loud noise.
//   Helen: morning refused care, 6 events, 5 around bathing.
//   Arjun: evening hard transition, 6 events, 5 after screen time ended.
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

  // ---------- Added patterns (see docs/research/seeded_patterns_sources.md) ----------
  // Helen: morning refused care around bathing. With the two above: 6 events, 5 around bathing.
  const bathNotes: [string, string[], LogRecord["outcome"], string[]][] = [
    ["Helen pushed my hands away when I started the shower and said it was too cold. We stopped and tried a warm washcloth.", ["grabbing"], "partly_calmed", ["reassurance"]],
    ["She cried when the water touched her back and wanted to get out. I wrapped her in a towel and we sat for a while.", ["crying"], "calmed", ["reassurance", "quiet_space"]],
    ["Helen refused the bath again this morning, calling out that she had already washed. Singing with her helped a little.", ["calling_out"], "partly_calmed", ["music"]],
  ];
  [W(4), W(10), W(12)].forEach((date, i) => {
    specs.push({
      ...helen, date, hour: 9, minute: 10 + i * 10, loggedBy: "cg_rosa", eventType: "refused_care",
      intensity: i === 1 ? 3 : 2, behaviors: bathNotes[i][1], durationMin: pick([15, 20, 10], i),
      contextBefore: ["bathing"], responseTried: bathNotes[i][3], outcome: bathNotes[i][2], rawNote: bathNotes[i][0],
    });
  });
  specs.push({
    ...helen, date: E(3), hour: 10, minute: 15, loggedBy: "cg_ravi", eventType: "refused_care", intensity: 1,
    durationMin: 10, responseTried: ["reassurance"], outcome: "calmed",
    rawNote: "Mom did not want to get dressed this morning and kept her robe on. We tried again after breakfast and she was fine.",
  });

  // Arjun: evening hard transitions when screen time ends. 6 events, 5 after the screen went off.
  const screenNotes = [
    "Arjun screamed and threw the remote when I turned the tablet off for dinner.",
    "Big upset when his show ended. He lay on the floor crying for a while.",
    "Turned the tablet off without warning because we were late. He hit the couch and cried.",
    "Screen time ended and he ran to his room and slammed the door.",
    "He cried hard when the game was switched off, even with a reminder.",
  ];
  [W(1), W(4), W(7), W(10), W(12)].forEach((date, i) => {
    specs.push({
      ...arjun, date, hour: 18 + (i % 2), minute: 10 + i * 5, loggedBy: i % 2 === 0 ? "cg_priya" : "cg_dev",
      eventType: "transition_distress", intensity: i === 0 ? 3 : 2,
      behaviors: pick([["screaming", "throwing"], ["crying"], ["crying", "hitting"], ["running_off"], ["crying"]], i),
      durationMin: pick([20, 15, 25, 10, 15], i), contextBefore: ["screen_time_ended"],
      responseTried: pick([["quiet_space"], ["reassurance"], ["quiet_space", "reassurance"], ["break_time"], ["deep_pressure"]], i),
      outcome: i === 2 ? "partly_calmed" : "calmed", rawNote: screenNotes[i],
    });
  });
  specs.push({
    ...arjun, date: E(2), hour: 19, minute: 0, loggedBy: "cg_dev", eventType: "transition_distress", intensity: 1,
    behaviors: ["crying"], durationMin: 10, contextBefore: ["transition"], responseTried: ["reassurance"], outcome: "calmed",
    rawNote: "Arjun did not want to leave his cousins' house and cried in the car for a few minutes.",
  });

  // Maya: afternoon shutdowns after loud places. With the two above: 6 events, 5 after loud noise.
  const noiseNotes: [string, string[], string[]][] = [
    ["Maya went silent and covered her ears after the school assembly. She stayed under her hood all the way home.", ["school", "noisy"], ["quiet_space"]],
    ["The cafeteria was very loud today, her teacher said. Maya would not talk after pickup and curled up in the back seat.", ["school", "noisy"], ["break_time"]],
    ["Birthday party with music and balloons popping. Maya hid behind the couch and would not come out.", ["outing", "noisy"], ["sensory_tool", "quiet_space"]],
    ["The hand dryers in the mall bathroom set her off. She froze and would not speak for a while afterwards.", ["outing", "noisy"], ["sensory_tool"]],
  ];
  [W(4), W(6), E(2), W(11)].forEach((date, i) => {
    specs.push({
      ...maya, date, hour: 14 + (i % 3), minute: 20, eventType: "shutdown", intensity: i === 2 ? 3 : 2,
      behaviors: i % 2 === 0 ? ["withdrawing", "covering_ears"] : ["withdrawing"], durationMin: pick([30, 25, 40, 15], i),
      contextBefore: ["loud_noise"], environment: noiseNotes[i][1], responseTried: noiseNotes[i][2],
      outcome: i === 1 ? "partly_calmed" : "calmed", rawNote: noiseNotes[i][0],
    });
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
  // ---- Added Nov 14 for the pattern-matching demo. Scores come from the docs/SCORING.md formula.
  // What each one rests on is in docs/research/seeded_patterns_sources.md. All numbers are synthetic.
  {
    id: "s_towel_bath", mode: "dementia", patternKey: "refused_care|bathing",
    name: "Towel bath in a warm room",
    description: "Wash with warm, moist towels under a blanket, one part of the body at a time, in a warm room, instead of a shower.",
    score: 75, tier: "winning_research", families: 26, pctImproved: 0.77, avgDropPct: 0.52, durabilityPct: 0.77,
    researchBacked: true, safetyApproved: true,
  },
  {
    id: "s_same_bath_helper", mode: "dementia", patternKey: "refused_care|bathing",
    name: "Same helper, same time of day",
    description: "Keep bathing with the person they know best, at the time of day they are usually most at ease.",
    score: 52, tier: "promising", families: 13, pctImproved: 0.69, avgDropPct: 0.36, durabilityPct: 0.62,
    researchBacked: false, safetyApproved: true,
  },
  {
    id: "s_bath_music", mode: "dementia", patternKey: "refused_care|bathing",
    name: "Favorite music during the wash",
    description: "Play songs they love before starting and through the wash.",
    score: 48, tier: "emerging", families: 4, pctImproved: 0.75, avgDropPct: 0.3, durabilityPct: 0.5,
    researchBacked: false, safetyApproved: true,
  },
  {
    id: "s_bath_rush", mode: "dementia", patternKey: "refused_care|bathing",
    name: "Getting it over with quickly",
    description: "Pushing on to finish fast while they are upset.",
    score: 32, tier: "not_recommended", families: 9, pctImproved: 0.22, avgDropPct: -0.18, durabilityPct: 0.0,
    researchBacked: false, safetyApproved: true,
  },
  {
    id: "s_short_visits", mode: "dementia", patternKey: "restlessness|visitor",
    name: "Shorter visits with one or two people",
    description: "Keep visits to about an hour with one or two visitors at a time, in a quiet room.",
    score: 55, tier: "promising", families: 17, pctImproved: 0.71, avgDropPct: 0.38, durabilityPct: 0.65,
    researchBacked: false, safetyApproved: true,
  },
  {
    id: "s_quiet_after_visit", mode: "dementia", patternKey: "restlessness|visitor",
    name: "Quiet time after visitors leave",
    description: "Plan half an hour of calm after a visit: low lights, no television, a familiar activity.",
    score: 52, tier: "promising", families: 12, pctImproved: 0.7, avgDropPct: 0.36, durabilityPct: 0.62,
    researchBacked: false, safetyApproved: true,
  },
  {
    id: "s_morning_visits", mode: "dementia", patternKey: "restlessness|visitor",
    name: "Visits earlier in the day",
    description: "Ask visitors to come in the late morning instead of the late afternoon.",
    score: 46, tier: "emerging", families: 4, pctImproved: 0.5, avgDropPct: 0.25, durabilityPct: 0.5,
    researchBacked: false, safetyApproved: true,
  },
  {
    id: "s_change_preview", mode: "autism", patternKey: "meltdown|routine_change",
    name: "Show the change ahead of time with a picture",
    description: "Add the change to their picture schedule the night before and again in the morning, and talk it through once.",
    score: 72, tier: "winning_research", families: 27, pctImproved: 0.74, avgDropPct: 0.45, durabilityPct: 0.72,
    researchBacked: true, safetyApproved: true,
  },
  {
    id: "s_familiar_item", mode: "autism", patternKey: "meltdown|routine_change",
    name: "One familiar thing stays the same",
    description: "When the plan changes, keep one part the same: the same snack, the same seat, or the same song in the car.",
    score: 51, tier: "promising", families: 12, pctImproved: 0.7, avgDropPct: 0.36, durabilityPct: 0.6,
    researchBacked: false, safetyApproved: true,
  },
  {
    id: "s_change_surprise", mode: "autism", patternKey: "meltdown|routine_change",
    name: "Not mentioning the change until it happens",
    description: "Hoping it goes unnoticed and saying nothing ahead of time.",
    score: 33, tier: "not_recommended", families: 8, pctImproved: 0.25, avgDropPct: -0.12, durabilityPct: 0.0,
    researchBacked: false, safetyApproved: true,
  },
  {
    id: "s_visual_timer", mode: "autism", patternKey: "transition_distress|screen_time_ended",
    name: "Visual timer before screen time ends",
    description: "Set a timer they can see when screen time starts, so the end is expected and not a surprise.",
    score: 56, tier: "promising", families: 18, pctImproved: 0.72, avgDropPct: 0.4, durabilityPct: 0.62,
    researchBacked: false, safetyApproved: true,
  },
  {
    id: "s_two_warnings", mode: "autism", patternKey: "transition_distress|screen_time_ended",
    name: "A five-minute warning, then a two-minute warning",
    description: "Give two calm warnings before the screen goes off, in the same words each time.",
    score: 52, tier: "promising", families: 15, pctImproved: 0.67, avgDropPct: 0.35, durabilityPct: 0.6,
    researchBacked: false, safetyApproved: true,
  },
  {
    id: "s_next_activity", mode: "autism", patternKey: "transition_distress|screen_time_ended",
    name: "Something they like ready for afterwards",
    description: "Have the next activity set out before the screen goes off.",
    score: 48, tier: "emerging", families: 4, pctImproved: 0.75, avgDropPct: 0.3, durabilityPct: 0.5,
    researchBacked: false, safetyApproved: true,
  },
  {
    id: "s_more_screen", mode: "autism", patternKey: "transition_distress|screen_time_ended",
    name: "Extra screen time to avoid the upset",
    description: "Letting the screen stay on longer whenever they protest.",
    score: 31, tier: "not_recommended", families: 11, pctImproved: 0.27, avgDropPct: -0.2, durabilityPct: 0.0,
    researchBacked: false, safetyApproved: true,
  },
  {
    id: "s_ear_defenders", mode: "autism", patternKey: "shutdown|loud_noise",
    name: "Ear defenders or headphones on hand",
    description: "Keep ear defenders in the bag and offer them before a loud place, not after.",
    score: 55, tier: "promising", families: 17, pctImproved: 0.71, avgDropPct: 0.37, durabilityPct: 0.65,
    researchBacked: false, safetyApproved: true,
  },
  {
    id: "s_agreed_quiet_spot", mode: "autism", patternKey: "shutdown|loud_noise",
    name: "A quiet spot agreed in advance",
    description: "Before going in, agree where they can go for a break and how to ask for it.",
    score: 51, tier: "promising", families: 13, pctImproved: 0.69, avgDropPct: 0.34, durabilityPct: 0.62,
    researchBacked: false, safetyApproved: true,
  },
  {
    id: "s_leave_early", mode: "autism", patternKey: "shutdown|loud_noise",
    name: "Leaving early without a fuss",
    description: "Have a plan to leave early, with no pressure to say goodbye to everyone.",
    score: 48, tier: "emerging", families: 4, pctImproved: 0.75, avgDropPct: 0.3, durabilityPct: 0.5,
    researchBacked: false, safetyApproved: true,
  },
];
