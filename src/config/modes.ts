// Per-mode labels, event types, colors and copy. Owner: Lane 1.
// Tailwind class names are written out in full so the compiler can see them.
import type { Mode, Outcome } from "@/lib/types";

export interface EventTypeConfig {
  value: string;
  label: string;
  dot: string; // timeline dot color
}

export interface Caregiver {
  id: string;
  name: string;
  role: string;
}

export interface ModeConfig {
  mode: Mode;
  label: string;
  personNoun: string;
  logPrompt: string;
  logPlaceholder: string;
  askPlaceholder: string;
  eventTypes: EventTypeConfig[];
  caregivers: Caregiver[];
  logExamples: { label: string; text: string }[];
  askExamples: string[];
  // color classes
  accentBg: string;
  accentText: string;
  accentSoft: string;
  accentBorder: string;
  accentRing: string;
}

export const MODES: Record<Mode, ModeConfig> = {
  dementia: {
    mode: "dementia",
    label: "Dementia care",
    personNoun: "family member",
    logPrompt: "Say or type what happened, in your own words.",
    logPlaceholder: "For example: Mom was agitated around 3 and barely ate lunch.",
    askPlaceholder: "For example: Why is Mom so upset every afternoon?",
    eventTypes: [
      { value: "agitation", label: "Agitation", dot: "bg-rose-500" },
      { value: "calling_out", label: "Calling out", dot: "bg-orange-500" },
      { value: "wandering", label: "Wandering", dot: "bg-amber-500" },
      { value: "refused_care", label: "Refused care", dot: "bg-fuchsia-500" },
      { value: "refused_food", label: "Ate little or refused food", dot: "bg-lime-600" },
      { value: "restlessness", label: "Restlessness", dot: "bg-sky-500" },
      { value: "crying", label: "Crying", dot: "bg-blue-600" },
      { value: "sleep_disturbance", label: "Sleep disturbance", dot: "bg-indigo-500" },
    ],
    caregivers: [
      { id: "cg_neha", name: "Neha", role: "daughter" },
      { id: "cg_ravi", name: "Ravi", role: "son, weekends" },
      { id: "cg_rosa", name: "Rosa", role: "home aide, weekday mornings" },
    ],
    logExamples: [
      {
        label: "Afternoon agitation",
        text: "Mom was agitated around 3, pacing and calling out for Dad. She barely ate lunch. A snack and some music helped, she settled after 20 minutes.",
      },
      {
        label: "Small lunch",
        text: "Rosa here, Helen only ate half her lunch today, she seemed tired.",
      },
      {
        label: "Bath time",
        text: "Mom would not get in the shower this morning. She said it was too cold and pushed my hand away. We did a warm towel wash instead and she settled.",
      },
      {
        label: "After visitors",
        text: "Mom's sister and her family visited all afternoon. Mom was restless after dinner, pacing and could not settle. Low lights and her music helped.",
      },
    ],
    askExamples: ["Why is Mom so upset every afternoon?", "What happens after busy visit days?"],
    accentBg: "bg-teal-700",
    accentText: "text-teal-800",
    accentSoft: "bg-teal-50",
    accentBorder: "border-teal-200",
    accentRing: "ring-teal-600",
  },
  autism: {
    mode: "autism",
    label: "Autism support",
    personNoun: "child",
    logPrompt: "Say or type what happened, in your own words.",
    logPlaceholder: "For example: Arjun had a hard morning before school, he slept badly.",
    askPlaceholder: "For example: Why are mornings so hard for Arjun?",
    eventTypes: [
      { value: "meltdown", label: "Meltdown", dot: "bg-rose-500" },
      { value: "shutdown", label: "Shutdown", dot: "bg-slate-500" },
      { value: "stimming_increase", label: "More stimming", dot: "bg-violet-500" },
      { value: "sleep_trouble", label: "Sleep trouble", dot: "bg-indigo-500" },
      { value: "food_refusal", label: "Food refusal", dot: "bg-lime-600" },
      { value: "transition_distress", label: "Hard transition", dot: "bg-amber-500" },
      { value: "aggression", label: "Hitting or kicking", dot: "bg-orange-600" },
      { value: "elopement", label: "Running off", dot: "bg-sky-500" },
    ],
    caregivers: [
      { id: "cg_priya", name: "Priya", role: "Arjun's mother" },
      { id: "cg_dev", name: "Dev", role: "Arjun's father" },
      { id: "cg_lena", name: "Lena", role: "Maya's mother" },
    ],
    logExamples: [
      {
        label: "Hard morning",
        text: "Arjun had a big meltdown before school, he slept badly and we had a substitute driver today.",
      },
      {
        label: "Screen time ended",
        text: "Arjun screamed and cried when I turned the tablet off for dinner tonight. I gave him some space in his room and he calmed down after 15 minutes.",
      },
      {
        label: "Loud place",
        text: "Maya went quiet and covered her ears after the school assembly this afternoon, it was really loud. Her headphones and a quiet corner helped.",
      },
    ],
    askExamples: ["Why are mornings so hard for Arjun?", "What do his hard mornings have in common?"],
    accentBg: "bg-indigo-700",
    accentText: "text-indigo-800",
    accentSoft: "bg-indigo-50",
    accentBorder: "border-indigo-200",
    accentRing: "ring-indigo-600",
  },
};

export const MODE_LIST: Mode[] = ["dementia", "autism"];
export const DEFAULT_MODE: Mode = "dementia";

// Controlled vocabulary from docs/DATA_MODEL.md (shared by both modes).
export const VOCAB = {
  behaviors: [
    "pacing", "calling_out", "crying", "hitting", "kicking", "throwing", "screaming", "rocking",
    "covering_ears", "withdrawing", "repetitive_speech", "grabbing", "biting", "running_off", "head_banging",
    "body_movement", "self_biting", "self_hitting",
  ],
  contextBefore: [
    "skipped_meal", "poor_sleep", "routine_change", "transition", "visitor", "toileting_need", "pain_signs",
    "medication_time", "bathing", "new_person", "screen_time_ended", "loud_noise", "crowd", "clothing_texture",
    "waiting", "denied_request", "woke_from_sleep",
  ],
  environment: [
    "caregiver_handoff", "noisy", "crowded", "bright_lights", "new_place", "outing", "school", "car",
    "mealtime", "bedtime",
  ],
  responseTried: [
    "offered_snack", "offered_drink", "quiet_space", "reassurance", "redirect_activity", "music",
    "toileting_assist", "pain_check_reported", "sensory_tool", "visual_schedule", "deep_pressure",
    "break_time", "walk", "cold_or_ice", "massage", "blocked_behavior", "remedy_given",
  ],
} as const;

const LABEL_OVERRIDES: Record<string, string> = {
  skipped_meal: "Skipped or small meal",
  poor_sleep: "Poor sleep",
  toileting_need: "Needed the toilet",
  pain_signs: "Signs of pain",
  medication_time: "Around medication time",
  screen_time_ended: "Screen time ended",
  denied_request: "Was told no",
  offered_snack: "Offered a snack",
  offered_drink: "Offered a drink",
  redirect_activity: "Changed activity",
  toileting_assist: "Helped to the toilet",
  pain_check_reported: "Checked for pain",
  caregiver_handoff: "Caregiver handoff",
  head_banging: "Head banging",
  self_injury: "Self-injury",
  signs_of_illness: "Signs of illness",
  signs_of_pain_severe: "Signs of severe pain",
  not_eating_days: "Not eating for days",
  sudden_change: "Sudden change",
  biting: "Biting others",
  body_movement: "Flapping or moving arms or legs",
  self_biting: "Biting themselves",
  self_hitting: "Hitting themselves",
  woke_from_sleep: "Woke from sleep",
  cold_or_ice: "Something cold or ice",
  massage: "Massage or rubbing",
  blocked_behavior: "Held or blocked the movement",
  remedy_given: "Gave a remedy or medicine",
};

// Plain-words label for any vocabulary value or event type.
export function label(value: string, mode?: Mode): string {
  if (mode) {
    const found = MODES[mode].eventTypes.find((e) => e.value === value);
    if (found) return found.label;
  }
  for (const m of MODE_LIST) {
    const found = MODES[m].eventTypes.find((e) => e.value === value);
    if (found) return found.label;
  }
  if (LABEL_OVERRIDES[value]) return LABEL_OVERRIDES[value];
  const words = value.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function eventDot(value: string): string {
  for (const m of MODE_LIST) {
    const found = MODES[m].eventTypes.find((e) => e.value === value);
    if (found) return found.dot;
  }
  return "bg-stone-400";
}

// Caregivers of people added through intake. Kept on globalThis so server routes (bundled separately) and
// client screens each share one copy.
const registry = (() => {
  const g = globalThis as unknown as { __caresignalCaregivers?: Map<string, string> };
  g.__caresignalCaregivers ??= new Map<string, string>();
  return g.__caresignalCaregivers;
})();

export function registerCaregivers(list: { id: string; name: string }[] | undefined): void {
  list?.forEach((c) => registry.set(c.id, c.name));
}

export function caregiverName(id: string): string {
  const added = registry.get(id);
  if (added) return added;
  for (const m of MODE_LIST) {
    const found = MODES[m].caregivers.find((c) => c.id === id);
    if (found) return found.name;
  }
  return "A caregiver";
}

export const INTENSITY_LABEL: Record<number, string> = { 1: "Mild", 2: "Moderate", 3: "Severe" };

export const OUTCOME_LABEL: Record<Outcome, string> = {
  calmed: "Calmed",
  partly_calmed: "Partly calmed",
  escalated: "Got worse",
  unknown: "Not sure",
};

export const FIELD_LABEL: Record<string, string> = {
  personId: "Person",
  eventType: "What happened",
  occurredAt: "Time",
  intensity: "How strong",
  durationMin: "How long",
  behaviors: "What you saw",
  contextBefore: "What came before",
  environment: "Where",
  responseTried: "What you tried",
  outcome: "How it ended",
};

// Copy that must appear on screens (see CLAUDE.md product guardrails).
export const GUARDRAIL_LINE = "Supports caregivers. Does not diagnose.";
export const STRATEGY_DISCLAIMER = "Based on family logs, not a clinical trial. Discuss with your care team.";
export const MIN_FAMILIES = 5;

export const STEP_RESULT_LABEL: Record<string, string> = {
  helped: "Helped",
  helped_a_little: "Helped a little",
  did_not_help: "Did not help",
  unknown: "Not sure",
};

export const STEP_RESULTS = ["helped", "helped_a_little", "did_not_help", "unknown"] as const;
// Recorded as a fact only: never ranked, suggested, or counted as something that helped.
export const RECORD_ONLY_RESPONSES: readonly string[] = ["remedy_given"];
