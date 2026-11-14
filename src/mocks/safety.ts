// Rule-based safety screen used by the mock /api/log and /api/ask.
// It runs before anything else. Lane 2 replaces the wording with the real
// formatter, but a deterministic rule like this should stay as the first gate.

export const RED_FLAG_MESSAGE =
  "Please contact your doctor or care team. What you described can be a sign that something needs medical attention, and they are the right people to check. CareSignal supports caregivers and does not diagnose.";

export const EMERGENCY_MESSAGE =
  "Call 911 now. What you described can be a sign of an emergency, such as a stroke or a serious injury. Do not wait to see if it passes. Please contact your doctor or care team once emergency help is on the way.";

export const ABUSE_MESSAGE =
  "Please contact your doctor or care team. If you are worried that someone is hurting a person in your care, you can also contact Adult Protective Services, or child protective services for a child. If anyone is in immediate danger, call 911 now.";

export const DISTRESS_MESSAGE =
  "That sounds really heavy, and it makes sense to feel worn down. Caring for someone every day is hard, and you matter too. If you feel you cannot go on or are thinking about harming yourself, please call or text 988, the 988 Suicide and Crisis Lifeline, right now. It is free and open 24 hours a day. If you are in immediate danger, call 911. Nothing from this note was saved to the log.";

export const OUT_OF_SCOPE_MESSAGE =
  "CareSignal cannot diagnose or give advice about medication, doses, treatment, or care placement. Please ask your doctor or care team about that. It can log what you saw so you can share it with them.";

export interface SafetyScreen {
  caregiverDistress: boolean;
  emergency: boolean;
  possibleAbuse: boolean;
  outOfScope: boolean;
  redFlags: string[]; // values from the redFlags vocabulary in docs/DATA_MODEL.md
  // Message to show before anything else, or null when nothing was triggered.
  message: string | null;
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

const DISTRESS = [
  /\b(can'?t|cannot|can not) (do|take|handle|keep doing|bear|cope with) (this|it|that) (anymore|any more|any longer)\b/,
  /\bi (just |really |honestly )?(can'?t|cannot|can not) (do|take|handle|keep doing|bear|cope with) (this|it)\b/,
  /\b(can'?t|cannot) (go on|cope|keep going|carry on)\b/,
  /\bdon'?t see (the|a|any) point\b/,
  /\b(end|ending) it( all)?\b/,
  /\b(kill|hurt|harm)(ing)? myself\b/,
  /\b(want|wish) to die\b|\bwish i (was|were) dead\b/,
  /\bsuicid/,
  /\bno reason to (live|go on)\b/,
  /\bbetter off without me\b/,
  /\bi('m| am) (at my breaking point|falling apart|done with (all of )?this)\b/,
];

const EMERGENCY = [
  /\bface (is |was |looks )?(droop|sagg)/,
  /\bdroop(ing|y|ed)? (face|mouth|eye)/,
  /\bslurr(ed|ing)\b/,
  /\bstroke\b/,
  /\b(not|isn'?t|stopped) breathing\b|\b(can'?t|cannot|trouble|struggling to) breathe?\b/,
  /\bunresponsive\b|\bunconscious\b|\bpassed out\b|\b(can'?t|cannot|won'?t) wake\b/,
  /\bseizure\b|\bchoking\b|\bchest pain\b/,
  /\bhit (her|his|their|my|the) head\b/,
  /\bbleeding (a lot|heavily|badly)\b|\bwon'?t stop bleeding\b/,
  /\b(serious|bad|hard|nasty) fall\b|\bfell down the stairs\b/,
  /\b(can'?t|cannot|couldn'?t) (get|stand) (back )?up\b/,
  /\bbroken (hip|arm|leg|bone|wrist)\b|\bbroke (her|his) (hip|arm|leg|wrist)\b/,
  /\boverdos/,
];

const ABUSE = [
  /\b(shov|slap|punch|chok)\w* (mom|mum|mother|dad|father|her|him|them|grandma|grandpa|helen|arjun|maya)\b/,
  /\b(is|was|been|being|gets) (rough|abusive|violent) with\b/,
  /\babus(e|ed|ing|ive)\b/,
];

const RED_FLAGS: [string, RegExp][] = [
  ["fall", /\b(fell|fall|fallen|falls|tripped and|slipped and)\b(?! asleep)/],
  ["head_banging", /\bbang(ing|ed|s)? (his|her|their|the|on his|on her)? ?(own )?head\b|\bhead[- ]?bang|\b(hitting|hits|smacking|smacks) (his|her|their) (own )?head\b/],
  ["self_injury", /\b(hurt|hurting|hurts|bit|biting|bites|scratch|scratching|scratches|hitting|hits|cut|cutting) (him|her|them)sel(f|ves)\b|\bself[- ]?(injur|harm)/],
  ["injury", /\b(injur\w+|bruis\w+|bleeding|blood|wound\w*|swollen|swelling|sprain\w*)\b/],
  ["signs_of_illness", /\b(fever|vomit\w*|throwing up|threw up|diarrhea|feverish)\b/],
  ["signs_of_pain_severe", /\bin (a lot of |severe |so much |terrible |real )?pain\b|\bwinc(e|ing|ed)\b|\bgrimac\w+|\bscream\w* in pain\b|\bholding (her|his) (stomach|side|chest|hip)\b/],
  ["not_eating_days", /\b(hasn'?t|has not|not|hasn'?t really) eaten (anything )?(in|for) (\w+ )?days\b|\brefus\w+ (food|to eat) for (\w+ )?days\b/],
  ["sudden_change", /\ball of a sudden\b|\bsuddenly\b|\bsudden change\b|\bout of nowhere\b|\bnever (done|been like) (this|that) before\b/],
];

const OUT_OF_SCOPE = [
  /\balzheimer|\blewy\b|\bdiagnos/,
  /\b(does|do you think|is it that) (she|he|mom|mum|dad|helen|arjun|maya) (has|have)\b/,
  /\bis (it|this|that) (dementia|autism|adhd|alzheimer|a uti)\b/,
  /\bmedicat|\bmeds?\b|\bdos(e|es|age)\b|\bmelatonin\b|\bbenadryl\b|\b\d+ ?mg\b|\bsedat|\bprescri|\bpills?\b|\bsupplement/,
  /\bcure\b|\bgluten[- ]free\b/,
  /\bnursing home\b|\bmemory care\b|\bassisted living\b/,
  /\brestrain/,
];

function any(patterns: RegExp[], text: string): boolean {
  return patterns.some((p) => p.test(text));
}

export function screenSafety(rawText: string): SafetyScreen {
  const text = normalize(rawText);
  const caregiverDistress = any(DISTRESS, text);
  const emergency = any(EMERGENCY, text);
  const possibleAbuse = any(ABUSE, text);
  const outOfScope = any(OUT_OF_SCOPE, text);

  const redFlags: string[] = [];
  for (const [flag, pattern] of RED_FLAGS) {
    if (pattern.test(text) && !redFlags.includes(flag)) redFlags.push(flag);
  }
  if (redFlags.includes("head_banging") && !redFlags.includes("self_injury")) redFlags.push("self_injury");
  if (/\bhit (her|his|their) head\b/.test(text) && !redFlags.includes("injury")) redFlags.push("injury");
  if (emergency && redFlags.length === 0) redFlags.push("sudden_change");

  let message: string | null = null;
  if (caregiverDistress) message = DISTRESS_MESSAGE;
  else if (emergency) message = EMERGENCY_MESSAGE;
  else if (possibleAbuse) message = ABUSE_MESSAGE;
  else if (redFlags.length > 0) message = RED_FLAG_MESSAGE;

  return { caregiverDistress, emergency, possibleAbuse, outOfScope, redFlags, message };
}
