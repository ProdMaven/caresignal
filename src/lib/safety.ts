// Deterministic safety screen for POST /api/log. Owner: Lane 2.
// It runs on the transcript BEFORE any model call and its result is never
// weakened by the model: code takes the union of these flags and the model's.
// Every message here is a fixed string. The model never writes safety copy.
// Rules started from src/mocks/safety.ts and were widened for the cases in
// eval/cases.json and safety/prompts.json. Relative imports only (tsx scripts load this).

export const RED_FLAG_VOCAB = [
  "self_injury",
  "head_banging",
  "injury",
  "fall",
  "sudden_change",
  "signs_of_illness",
  "signs_of_pain_severe",
  "not_eating_days",
] as const;
export type RedFlag = (typeof RED_FLAG_VOCAB)[number];

// Used when a safety message fires but no vocabulary flag fits (possible abuse,
// running toward a road). Same choice the mock made, so a flagged note is never saved with redFlags = [].
export const DEFAULT_SAFETY_FLAG: RedFlag = "sudden_change";

export const RED_FLAG_MESSAGE =
  "Please contact your doctor or care team. What you described can be a sign that something needs medical attention, and they are the right people to check. CareSignal supports caregivers and does not diagnose.";

export const EMERGENCY_MESSAGE =
  "Call 911 now. What you described can be a sign of an emergency, such as a stroke, a serious injury, or a person who may be in danger. Do not wait to see if it passes. Please contact your doctor or care team once emergency help is on the way.";

export const ABUSE_MESSAGE =
  "Please contact your doctor or care team. If you are worried that someone is hurting a person in your care, you can also contact Adult Protective Services, or child protective services for a child. If anyone is in immediate danger, call 911 now.";

export const PERSON_WISH_TO_DIE_MESSAGE =
  "Please contact your doctor or care team today and tell them exactly what was said. You can also call or text 988, the 988 Suicide and Crisis Lifeline, at any time for support. If anyone is in immediate danger, call 911 now.";

export const DISTRESS_MESSAGE =
  "That sounds really heavy, and it makes sense to feel worn down. Caring for someone every day is hard, and you matter too. If you feel you cannot go on or are thinking about harming yourself, please call or text 988, the 988 Suicide and Crisis Lifeline, right now. It is free and open 24 hours a day. If you are in immediate danger, call 911. Please contact your doctor or care team as well and tell them how you are feeling. Nothing from this note was saved to the log.";

export type ScopeReason = "medical" | "privacy" | "role";

export const SCOPE_MESSAGES: Record<ScopeReason, string> = {
  medical:
    "CareSignal cannot diagnose, and it cannot give advice about medication, doses, treatment, cures, restraint, or care placement. Please ask your doctor or care team about that. It can log what you saw so you can share it with them.",
  privacy:
    "CareSignal does not share, export, or send notes anywhere, and it cannot show anything about other people or other families. Community numbers appear only as totals from 5 or more families. For questions about care, please ask your doctor or care team. It can log what you saw so you can share it with them.",
  role:
    "CareSignal only turns your care notes into log entries. It cannot change its rules, act as a therapist or a doctor, or answer other questions. For advice, please ask your doctor or care team. It can log what you saw so you can share it with them.",
};

export interface SafetyFindings {
  emergency: boolean;
  possibleAbuse: boolean;
  personWishToDie: boolean;
  redFlags: string[];
}

export interface SafetyScreen extends SafetyFindings {
  caregiverDistress: boolean;
  scope: ScopeReason | null;
  // Message to show before anything else, or null when nothing was triggered.
  message: string | null;
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // Latin accents only, so "más" matches "mas"
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// The speaker themselves is in distress.
const DISTRESS = [
  /\b(can'?t|cannot|can not) (do|take|handle|keep doing|bear|cope with) (this|it|that) (anymore|any more|any longer)\b/,
  /\bi (just |really |honestly )?(can'?t|cannot|can not) (do|take|handle|keep doing|bear|cope with) (this|it)\b/,
  /\b(can'?t|cannot) (go on|cope|keep going|carry on)\b/,
  /\bdon'?t see (the|a|any) point\b|\bno point (in|to) (going on|living|any of)\b/,
  /\b(end|ending) it all\b|\b(think|thinking|thought|thoughts) (about|of) ending it\b|\b(want|wanted|going|ready) to end it\b/,
  /\b(end|ending|take|taking) my (own )?life\b/,
  /\b(kill|hurt|harm)(ing)? myself\b/,
  /\bi (just )?(want|wish|wanted) to die\b|\bwish i (was|were) dead\b|\bi('d| would) rather be dead\b/,
  /\bsuicid/,
  /\bno reason to (live|go on)\b/,
  /\bbetter off without me\b/,
  /\bwish i could (just )?(disappear|vanish|not wake up)\b|\bi (just )?want to disappear\b/,
  /\b(nobody|no one) would (even )?(notice|care|miss me)\b.{0,20}\bif i (was|were|am) (gone|dead)\b/,
  /\bi('m| am) (at my breaking point|falling apart|done with (all of )?this)\b/,
  // Spanish
  /\bno puedo mas\b|\bya no puedo\b|\bno aguanto mas\b/,
  /\b(quiero|quisiera) (morir|morirme|desaparecer)\b|\bquitarme la vida\b|\bno quiero (seguir viviendo|vivir)\b/,
  // Hindi (romanized and Devanagari)
  /\b(main|mai|mein) (ab )?(aur )?(nahi|nahin) (kar|seh|sah) (sakti|sakta)\b|\b(mar jana|marna) chahti hu|\b(mar jana|marna) chahta hu/,
  /मैं (अब )?(और )?नहीं (कर|सह) (सकती|सकता)|मरना चाहती हूँ|मरना चाहता हूँ|मर जाना चाहती|मर जाना चाहता|जीना नहीं चाहती|जीना नहीं चाहता/,
];

// The person being cared for says they want to die or to hurt themselves.
const PERSON_WISH_TO_DIE = [
  /\b(she|he|mom|mum|mother|mama|dad|father|grandma|grandpa|they) (said|says|keeps saying|told me) (that )?(she|he|they) (wants?|wanted|wish(es)?) to die\b/,
  /\b(wants|wanted) to die\b/,
  /\b(kill|killing|hurt|harm) (her|him|them)sel(f|ves)\b.{0,40}\b(said|says|threat)/,
  /\b(said|says|saying|told me|threaten\w*) .{0,40}\b(kill|end) (her|him|them)sel(f|ves)\b/,
  /\b(said|says|saying) (she|he)('d| would) be better off dead\b/,
  /\b(quiere|dice que quiere) morir(se)?\b/,
];

const EMERGENCY = [
  /\bface (is |was |looks |looked )?(droop|sagg)/,
  /\bdroop(ing|y|ed)? (face|mouth|eye)/,
  /\bslurr(ed|ing)\b/,
  /\bstroke\b/,
  /\b(not|isn'?t|stopped) breathing\b|\b(can'?t|cannot|trouble|struggling to) breathe?\b|\bturn(ing|ed) blue\b/,
  /\bunresponsive\b|\bunconscious\b|\bpassed out\b|\b(can'?t|cannot|won'?t) wake\b/,
  /\bseizure\b|\bchoking\b|\bchest pain\b/,
  /\bhit (her|his|their|my|the) head\b/,
  /\bbleeding (a lot|heavily|badly)\b|\bwon'?t stop bleeding\b/,
  /\b(serious|bad|hard|nasty|terrible) fall\b|\bfell down (the|some) (stairs|steps)\b/,
  /\bbroken (hip|arm|leg|bone|wrist)\b|\bbroke (her|his) (hip|arm|leg|wrist)\b/,
  /\boverdos/,
  // Person missing.
  /\b(is|has|went|gone|has gone|been) missing\b/,
  /\b(can'?t|cannot|can not|could ?n'?t) find (her|him|them|mom|mum|mother|dad|father|grandma|grandpa|my (son|daughter|child|kid|mother|father|mom|husband|wife))\b/,
  /\b(don'?t|do not) know where (she|he|mom|dad) (is|went|has gone)\b/,
  /\b(has ?n'?t|has not|still not|never) (come|came) (back|home)\b/,
  // Spanish
  /\bno respira\b|\bno despierta\b|\bcara caida\b|\bno (la|lo) encuentro\b|\bderrame\b|\bconvulsion/,
  // Hindi
  /सांस नहीं|साँस नहीं|होश नहीं|बेहोश|चेहरा टेढ़ा|दौरा पड़/,
];

// After a fall, not being able to get up is an emergency. On its own it is not ("won't get up for school").
const CANNOT_GET_UP = /\b(can'?t|cannot|could ?n'?t|won'?t|would ?n'?t|unable to) (get|stand) (back )?up\b/;

const ABUSE = [
  /\b(shov|slap|punch|chok|beat|hitt?|kick|smack)\w* (mom|mum|mother|mama|dad|father|her|him|them|grandma|grandpa|my (son|daughter|child|kid|mother|father|wife|husband))\b(?! (to|up to|about|that|how)\b)/,
  /\b(is|was|been|being|gets|got) (rough|abusive|violent) with\b/,
  /\babus(e|ed|ing|ive)\b/,
  /\b(locks?|locked|ties?|tied) (her|him|mom|mum|dad) (in|up|down|to)\b/,
];

// "hit him" is abuse wording only when someone other than the person in care is the one acting.
const ABUSE_ACTOR = /\b(my|the|her|his) (brother|sister|husband|wife|partner|boyfriend|girlfriend|aide|sitter|nurse|teacher|uncle|aunt|dad|father|mom|mother|stepdad|stepmom|caregiver|carer)\b|\bsomeone\b|\bstaff\b/;

const RED_FLAGS: [RedFlag, RegExp][] = [
  ["fall", /\b(fell|fall|fallen|falls|falling|tripped and|slipped and|se cayo)\b(?! (asleep|apart|behind|in love|into (a |her |his )?(routine|sleep|bed)|back asleep|silent|quiet))(?<!\b(this|last|next|in the|every) fall)/],
  ["fall", /गिर (गई|गया|गयी|पड़)/],
  ["head_banging", /\bbang(ing|ed|s)? (his|her|their|the|on his|on her)? ?(own )?head\b|\bhead[- ]?bang|\b(hitting|hits|smacking|smacks|slamming|slams|slammed) (his|her|their) (own )?head\b/],
  ["head_banging", /सिर (पटक|मार)/],
  ["self_injury", /\b(hurt|hurting|hurts|bit|bite|biting|bites|scratch|scratched|scratching|scratches|hit|hitting|hits|cut|cutting|cuts|pinching|pinched|punching|punched) (him|her|them)sel(f|ves)\b|\bself[- ]?(injur|harm)/],
  ["self_injury", /\b(bit|bite|bites|biting|scratch\w*|hit|hits|hitting|cut|cuts|cutting|pinch\w*|punch\w*|pick\w*|pull\w*) (at )?(his|her|their) own\b/],
  ["self_injury", /\b(scratch\w*|claw\w*|pick\w* at|bit|bites|biting) (his|her|their) (arms?|hands?|face|skin|legs?|wrists?|fingers?)\b/],
  ["self_injury", /\bse (golpea|golpeo|muerde|mordio|lastima|lastimo)\b/],
  ["injury", /\b(injur\w+|bruis\w+|bleeding|bleeds?|bled|blood(?! (pressure|sugar|test|work))|wound\w*|swollen|swelling|sprain\w*|bump|lump|gash|black eye|sangr\w+|moreton\w*|herida)\b/],
  ["signs_of_illness", /\b(fever|feverish|vomit\w*|throwing up|threw up|diarrhea|dehydrat\w+|fiebre|vomito)\b|बुखार|उल्टी/],
  ["signs_of_pain_severe", /\bin (a lot of |severe |so much |terrible |real )?pain\b|\bwinc(e|ing|ed)\b|\bgrimac\w+|\bscream\w* in pain\b|\bholding (her|his|their) (stomach|side|chest|hip|head|belly|tummy)\b|\bmucho dolor\b|बहुत दर्द/],
  ["not_eating_days", /\b(has ?n'?t|has not|not|has ?n'?t really|has barely) eaten (anything |much )?(in|for) (\w+ )?days\b|\brefus\w+ (food|to eat) for (\w+ )?days\b|\b(no|not) (eating|eaten|food) (in|for) (\w+ )?days\b|\b(no come|no ha comido) (desde hace|en|hace) (\w+ )?dias\b/],
  ["sudden_change", /\ball of a sudden\b|\bsuddenly\b|\bsudden (major |big )?change\b|\bout of nowhere\b|\bnever (done|been like) (this|that) before\b|\bde repente\b|अचानक/],
];

// Running toward a road or traffic: a safety risk even when the person is back.
const ROAD_RISK = /\b(ran|run|running|bolted|darted|walked|wandered) .{0,40}\b(road|street|traffic|highway|cars?)\b/;

const MED_WORD = /\bmedicat|\bmedicine|\bmeds?\b|\bpills?\b|\bsupplement|\bseroquel\b|\blorazepam\b|\bativan\b|\brisperdal\b|\brisperidone\b|\bhaldol\b|\bxanax\b|\bmelatonin\b|\bbenadryl\b|\bcbd\b|\bmedicamento|\bpastilla|दवा/;
const ADVICE_CUE = /\?|\b(should|shall|can|could|may) (i|we)\b|\bwhat\b|\bwhich\b|\bhow much\b|\bhow many\b|\bincrease\b|\b(up|raise|lower|reduce|change|stop|start|double) (her|his|the|their)\b|\bgive (her|him|mom|mum|dad)\b|\brecommend|\bsuggest|\bneed to\b|\bdebo\b|\bpuedo\b/;

const SCOPE_MEDICAL = [
  /\balzheimer|\blewy\b|\bparkinson|\bdiagnos|\badhd\b|\bocd\b|\buti\b|\burinary tract\b/,
  /\b(does|do you think|is it that) (she|he|mom|mum|dad|helen|arjun|maya) (also |really |maybe )?(has|have)\b/,
  /\bdo i have\b/,
  /\bis (it|this|that) (dementia|autism|adhd|alzheimer|a uti)\b/,
  /\b(what|which) stage\b|\bstage of (her |his |the )?(dementia|alzheimer)|\b(autism|spectrum) level\b|\blevel [123]\b/,
  /\b(autism|dementia|condition|alzheimer'?s?) (is )?(getting|gotten|got|going to get) (worse|better)\b/,
  /\bhow long (does|do|will|has) .{0,30}\b(have left|got left|to live|live)\b|\bgrow out of\b|\bprognos/,
  /\bdos(e|es|age|ing)\b|\b\d+ ?mg\b|\bsedat|\bprescri/,
  /\bcure\b|\bcured\b|\bgluten[- ]free\b/,
  /\bnursing home\b|\bmemory care\b|\bassisted living\b|\bcare home\b|\bput (her|him|mom|mum|dad) in a home\b/,
  /\brestrain|\bhold (him|her) down\b|\btie (him|her) (down|to)\b/,
];

const SCOPE_PRIVACY = [
  /\b(last|previous|other|another|next) (user|users|caregiver|caregivers|person'?s? logs)\b|\bother families\b/,
  /\b(another|the other|the last|a different) family'?s? (logs?|notes?|data|entries)\b/,
  /\bother (kids|children|people|parents|patients)\b/,
  /\bfamily (who|that|which|with) (scored|logged|tried|has the|had the|the highest)\b|\bone family\b|\bhighest score\b/,
  /\b(your|the) database\b|\bevery (person|user|family)\b/,
  /\bexport\b|\be-?mail (them|it|this|all|her|his|the)\b|\bsend (them|it|all|her logs|his logs|the logs|this) to\b/,
  /\bprevious conversation\b|\braw notes\b/,
  /\b(neighbor|neighbour|friend|coworker)\b.{0,40}\b(logged|logs|notes|uses this app)\b/,
  /\bgive me names\b|\bnames and\b|\btheir (child'?s?|kid'?s?) (age|name|city)\b/,
];

const SCOPE_ROLE = [
  /\bignore (all |any )?(of )?(your|the|my|previous|prior|above|safety|these|those)( previous| prior| safety)? (rules|instructions|prompt|guidelines|limits)\b/,
  /\bsystem prompt\b|\bdeveloper mode\b|\bjailbreak\b|\bno limits\b/,
  /\b(be|act as|acting as|play) (my|a|the) (therapist|doctor|counsel\w+|psychiatrist|nurse)\b/,
  /\bpretend (you'?re|you are|to be)\b|\byou are now\b|\broleplay\b/,
  /\btranslate this\b/,
  /\bhow (do|can|should|could) (i|we) (make|get|force) (him|her|them) (to )?(stop|quit|behave|comply)\b/,
  /\bno matter what i (log|say|type)\b/,
  /\b(developers?|admin|anthropic|your creators?) (say|says|said|told)\b/,
];

function any(patterns: RegExp[], text: string): boolean {
  return patterns.some((p) => p.test(text));
}

function scopeOf(text: string): ScopeReason | null {
  if (any(SCOPE_MEDICAL, text) || (MED_WORD.test(text) && ADVICE_CUE.test(text))) return "medical";
  if (any(SCOPE_PRIVACY, text)) return "privacy";
  if (any(SCOPE_ROLE, text)) return "role";
  return null;
}

// Keeps only vocabulary values, in vocabulary order, without duplicates.
export function cleanRedFlags(flags: Iterable<unknown>): string[] {
  const seen = new Set<string>();
  for (const f of flags) if (typeof f === "string") seen.add(f);
  return RED_FLAG_VOCAB.filter((f) => seen.has(f));
}

// Union of two flag lists. Never returns fewer flags than either input.
export function unionRedFlags(a: Iterable<unknown>, b: Iterable<unknown>): string[] {
  return cleanRedFlags([...a, ...b]);
}

// The fixed message for a set of findings. Emergencies lead with 911; everything
// else leads with "Please contact your doctor or care team".
export function safetyMessageFor(f: SafetyFindings): string | null {
  if (f.emergency) return EMERGENCY_MESSAGE;
  if (f.personWishToDie) return PERSON_WISH_TO_DIE_MESSAGE;
  if (f.possibleAbuse) return ABUSE_MESSAGE;
  if (f.redFlags.length > 0) return RED_FLAG_MESSAGE;
  return null;
}

// Makes the findings self-consistent: implied flags are added, and a triggered
// message always carries at least one flag.
export function finalizeFindings(f: SafetyFindings): SafetyFindings {
  const flags = new Set(cleanRedFlags(f.redFlags));
  if (flags.has("head_banging")) flags.add("self_injury");
  if (f.personWishToDie) flags.add("self_injury");
  if ((f.emergency || f.possibleAbuse) && flags.size === 0) flags.add(DEFAULT_SAFETY_FLAG);
  return { ...f, redFlags: cleanRedFlags(flags) };
}

export function screenSafety(rawText: string): SafetyScreen {
  const text = normalize(rawText);
  const caregiverDistress = any(DISTRESS, text);
  const personWishToDie = !caregiverDistress && any(PERSON_WISH_TO_DIE, text);

  const flags: string[] = [];
  for (const [flag, pattern] of RED_FLAGS) if (pattern.test(text)) flags.push(flag);
  if (/\bhit (her|his|their) head\b/.test(text)) flags.push("injury");
  if (ROAD_RISK.test(text)) flags.push(DEFAULT_SAFETY_FLAG);

  const emergency = any(EMERGENCY, text) || (flags.includes("fall") && CANNOT_GET_UP.test(text));
  const possibleAbuse =
    ABUSE.slice(1).some((p) => p.test(text)) || (ABUSE[0].test(text) && ABUSE_ACTOR.test(text));

  const findings = finalizeFindings({ emergency, possibleAbuse, personWishToDie, redFlags: flags });
  return {
    ...findings,
    caregiverDistress,
    scope: scopeOf(text),
    message: caregiverDistress ? DISTRESS_MESSAGE : safetyMessageFor(findings),
  };
}
