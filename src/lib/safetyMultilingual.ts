// Crisis and red-flag screen for notes that are not in English: Spanish, Hindi (Devanagari and romanized),
// and Mandarin (simplified and traditional). Behind FEATURE_MULTILINGUAL_SAFETY.
// It only ever ADDS findings to the English screen in src/lib/safety.ts. Wording stays fixed (see
// src/config/safetyTranslations.ts). The lists were written by the build team and have NOT been reviewed
// by a native speaker of each language; see docs/eval_report.md.
//
// Phrases are matched as plain substrings after the same normalization the English screen uses
// (lower case, Latin accents removed), so "se cayó" matches "se cayo".

export type OtherLanguage = "es" | "hi" | "zh";

function norm(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
}

type Needle = string | RegExp;
const has = (text: string, needles: Needle[]) => needles.some((n) => (typeof n === "string" ? text.includes(norm(n)) : n.test(text)));

// ---- The speaker themselves is in distress (first person).
const DISTRESS: Needle[] = [
  // Spanish
  "no puedo mas", "ya no puedo", "no aguanto mas", "ya no doy mas", "ya no aguanto", "estoy al limite",
  "quiero morir", "quiero morirme", "quisiera morir", "me quiero morir", "quitarme la vida", "matarme",
  "no quiero vivir", "no quiero seguir viviendo", "no le veo sentido", "no tiene sentido seguir", "acabar con todo",
  "quiero desaparecer",
  // Hindi, romanized
  /\b(main|mai|mein|me)\b.{0,30}\b(ab|aur)\b.{0,20}\b(nahi|nahin|nhi)\b ?(kar|seh|sah|jhel) ?(sakti|sakta|paungi|paunga|pa rahi|pa raha)/,
  "ab nahi hota mujhse", "mujhse ab nahi hota", "mujhse aur nahi hota", "ab mujhse nahi hota", "ab aur nahi hota",
  /\b(mar jana|marna|marjana) (chahti|chahta) (hu|hun|hoon|hoo)\b/, /\b(jeena|jina) nahi (chahti|chahta) (hu|hun|hoon|hoo)?/,
  "jeene ka mann nahi", "jeene ka man nahi", "jine ka man nahi", "khudkushi", "aatmahatya", "atmahatya", "himmat nahi bachi",
  "sab khatam kar du", "sab khatam kar dun", "koi matlab nahi dikhta", "koi fayda nahi dikhta",
  // Hindi, Devanagari
  /मैं.{0,30}(अब|और).{0,20}नहीं (कर|सह|झेल) (सकती|सकता|पाऊँगी|पाऊंगी|पाऊँगा|पाऊंगा|पा रही|पा रहा)/,
  "मुझसे अब नहीं होता", "मुझसे और नहीं होता", "अब मुझसे नहीं होता", "अब और नहीं होता",
  /(मर जाना|मरना) (चाहती|चाहता) (हूँ|हूं|हु)/, /जीना नहीं (चाहती|चाहता)/, "जीने का मन नहीं", "आत्महत्या", "खुदकुशी",
  "हिम्मत नहीं बची", "सब खत्म कर दूँ", "सब खत्म कर दूं", "कोई मतलब नहीं दिखता",
  // Mandarin
  "我受不了了", "我撑不下去", "我撐不下去", "撑不下去了", "撐不下去了", "我坚持不下去", "我堅持不下去", "我照顾不下去", "我照顧不下去",
  "我不想活", "我活不下去", "我想死", "我想自杀", "我想自殺", "我想结束", "我想結束", "活着没意思", "活著沒意思", "我快崩溃", "我快崩潰",
  "我崩溃了", "我崩潰了", "我真的不行了", "看不到意义", "看不到意義",
];

// ---- The person being cared for says they want to die or to hurt themselves (third person).
const PERSON_WISH_TO_DIE: Needle[] = [
  "dice que quiere morir", "dice que se quiere morir", "quiere morirse", "dice que se quiere matar", "dijo que quiere morir",
  /\b(mar jana|marna) (chahti|chahta) (hai|hain)\b/, /\b(kehti|kehta|keh rahi|keh raha|bolti|bolta) (hai )?(ki )?.{0,20}(mar jana|marna|jeena nahi)/,
  /(मर जाना|मरना) (चाहती|चाहता) (है|हैं)/, /(कहती|कहता|कह रही|कह रहा|बोलती|बोलता) .{0,25}(मर जाना|मरना|जीना नहीं)/,
  /(她|他|妈妈|媽媽|妈|媽|爸爸|爸|奶奶|爷爷|爺爺|外婆|外公|孩子|儿子|兒子|女儿|女兒)(总是|總是|一直|老是|常常)?(说|說)(她|他)?(自己)?(想死|不想活|活不下去|要自杀|要自殺|想自杀|想自殺)/,
];

// ---- Possible emergencies: call 911 now.
const EMERGENCY: Needle[] = [
  // Spanish
  "no respira", "no puede respirar", "le cuesta respirar", "no despierta", "inconsciente", "se desmayo", "cara caida",
  "la cara torcida", "boca torcida", "se le cae la cara", "habla arrastrada", "arrastra las palabras", "no puede hablar bien",
  "derrame", "convulsion", "se golpeo la cabeza", "golpe en la cabeza", "sangra mucho", "no deja de sangrar",
  "no la encuentro", "no lo encuentro", "se perdio", "ha desaparecido", "dolor en el pecho", "se esta ahogando", "atragant",
  // Hindi, romanized
  "saans nahi", "sans nahi", "saans lene mein", "behosh", "hosh nahi", "chehra tedha", "muh tedha", "munh tedha", "chehra latak",
  "awaaz ladkhada", "bol nahi pa rahi", "bol nahi pa raha", "daura pad", "sir par chot", "sar par chot", "sir mein chot",
  "bahut khoon", "khoon nahi ruk", "mil nahi rahi", "mil nahi raha", "kho gayi", "kho gaya", "seene mein dard", "chhati mein dard",
  // Hindi, Devanagari
  "सांस नहीं", "साँस नहीं", "सांस लेने में", "साँस लेने में", "बेहोश", "होश नहीं", "चेहरा टेढ़ा", "मुंह टेढ़ा", "मुँह टेढ़ा", "चेहरा लटक",
  "आवाज़ लड़खड़ा", "बोल नहीं पा रही", "बोल नहीं पा रहा", "दौरा पड़", "सिर पर चोट", "सिर में चोट", "बहुत खून", "खून नहीं रुक",
  "मिल नहीं रही", "मिल नहीं रहा", "खो गई", "खो गया", "सीने में दर्द", "छाती में दर्द",
  // Mandarin
  "没有呼吸", "沒有呼吸", "不呼吸了", "呼吸困难", "呼吸困難", "喘不过气", "喘不過氣", "昏迷", "昏倒", "晕倒", "暈倒", "叫不醒",
  "嘴歪", "口眼歪斜", "脸歪", "臉歪", "脸下垂", "臉下垂", "说话不清", "說話不清", "口齿不清", "口齒不清", "中风", "中風", "抽搐", "癫痫", "癲癇",
  "撞到头", "撞到頭", "摔到头", "摔到頭", "流血不止", "大量出血", "找不到她", "找不到他", "走失", "失踪", "失蹤", "胸口痛", "胸痛", "噎住",
];

// ---- Red flags: contact your doctor or care team.
const RED_FLAGS: Record<string, Needle[]> = {
  fall: [
    "se cayo", "se ha caido", "se cae", "tuvo una caida", "una caida", "se resbalo", "tropezo",
    "gir gayi", "gir gaya", "gir gaye", "gir gyi", "gir gya", "gir padi", "gir pada", "gir pade", "fisal gayi", "fisal gaya", "phisal gayi", "phisal gaya",
    "गिर गई", "गिर गयी", "गिर गया", "गिर गए", "गिर पड़", "फिसल गई", "फिसल गया",
    "摔倒", "跌倒", "摔了一跤", "摔了", "跌了", "滑倒", "摔下",
  ],
  head_banging: [
    "se golpea la cabeza", "golpeandose la cabeza", "golpea su cabeza", "se da golpes en la cabeza", "se pega en la cabeza", "cabezazos",
    "sir patak", "sar patak", "sir maar", "sar maar", "sir deewar", "sir diwar", "sir zameen", "sir farsh", "sar zameen",
    "सिर पटक", "सिर मार", "सिर दीवार", "सिर फर्श", "सिर ज़मीन", "सिर जमीन",
    "撞头", "撞頭", "用头撞", "用頭撞", "拿头撞", "拿頭撞", "头撞墙", "頭撞牆", "撞墙", "撞牆", "头撞地", "頭撞地",
  ],
  self_injury: [
    "se muerde", "se mordio", "se golpea", "se pega a si mism", "se arana", "se rasguna", "se lastima", "se hace dano", "se corta",
    "khud ko maar", "khud ko kaat", "apne aap ko maar", "apne aap ko kaat", "apna haath kaat", "apne haath ko kaat", "haath kaat liya", "khud ko noch", "khud ko chot", "apne aap ko chot",
    "खुद को मार", "खुद को काट", "अपने आप को मार", "अपने आप को काट", "अपना हाथ काट", "अपने हाथ को काट", "हाथ काट लिया", "खुद को नोच", "खुद को चोट", "अपने आप को चोट",
    "咬自己", "咬他自己", "咬她自己", "打自己", "抓自己", "掐自己", "伤害自己", "傷害自己", "自残", "自殘", "咬手", "抓伤自己", "抓傷自己",
  ],
  injury: [
    "sangre", "sangra", "sangro", "moreton", "herida", "hinchad", "chichon",
    "khoon", "chot lag", "sujan", "soojan", "neel pad",
    "खून", "चोट लग", "सूजन", "नील पड़",
    "流血", "出血", "淤青", "瘀青", "肿了", "腫了", "受伤", "受傷", "伤口", "傷口",
  ],
  not_eating_days: [
    "dias sin comer", "no come desde hace", "no ha comido en", "no ha comido nada en", "lleva dias sin comer",
    /\b(din|dino|dinon) se (khana|kuch|kuchh) (bhi )?nahi/, /\b(din|dino|dinon) se nahi kha/,
    /(दिन|दिनों) से (खाना|कुछ) (भी )?नहीं/, /(दिन|दिनों) से नहीं खा/,
    "天没吃", "天沒吃", "天不吃", "天没有吃", "天沒有吃", "几天没吃", "幾天沒吃",
  ],
  signs_of_illness: ["fiebre", "vomit", "diarrea", "bukhar", "bukhaar", "ulti", "बुखार", "उल्टी", "发烧", "發燒", "呕吐", "嘔吐", "拉肚子", "腹泻", "腹瀉"],
  sudden_change: ["de repente", "de pronto", "achanak", "अचानक", "突然"],
};

// ---- Questions the app does not answer (diagnosis, medicine, dose).
const SCOPE_MEDICAL: Needle[] = [
  "que dosis", "cuanta dosis", "cuanto le doy", "le puedo dar", "que medicamento", "que medicina le", "tiene alzheimer", "es alzheimer", "tiene demencia o",
  "tiene autismo", "que diagnostico", "le subo la dosis", "aumentar la dosis",
  "kitni dawa", "kitna dose", "kaun si dawa", "konsi dawa", "dawa du", "dawa de du", "dose badha", "kya use alzheimer", "kya unhe alzheimer", "kya ise autism", "kya yeh autism hai", "kya ye autism hai",
  "कितनी दवा", "कितना डोज़", "कौन सी दवा", "दवा दूं", "दवा दूँ", "दवा दे दूं", "डोज़ बढ़ा", "क्या उन्हें अल्ज़ाइमर", "क्या इसे ऑटिज़्म", "क्या यह ऑटिज़्म है",
  "多少剂量", "多少劑量", "剂量", "劑量", "吃多少药", "吃多少藥", "吃什么药", "吃什麼藥", "该吃什么药", "是不是老年痴呆", "是不是阿尔茨海默", "是不是阿茲海默", "是不是自闭症", "是不是自閉症", "是不是痴呆",
];

export interface OtherLanguageFindings {
  caregiverDistress: boolean;
  personWishToDie: boolean;
  emergency: boolean;
  redFlags: string[];
  scopeMedical: boolean;
}

export function screenOtherLanguages(rawText: string): OtherLanguageFindings {
  const text = norm(rawText);
  const personWishToDie = has(text, PERSON_WISH_TO_DIE);
  return {
    // A third-person report ("she says she wants to die") is about the person in care, not the speaker.
    caregiverDistress: has(text, DISTRESS),
    personWishToDie,
    emergency: has(text, EMERGENCY),
    redFlags: Object.entries(RED_FLAGS).filter(([, needles]) => has(text, needles)).map(([flag]) => flag),
    scopeMedical: has(text, SCOPE_MEDICAL),
  };
}

// ---- Which language a note is in, from the script and a few very common words. Used to pick the translated line.
const ES_WORDS = /\b(el|la|los|las|que|de|del|una|con|por|para|pero|muy|esta|estaba|hoy|ayer|despues|porque|mi|se|le|lo|y|no|mama|papa|hijo|hija|abuela|abuelo)\b/g;
const HI_WORDS = /\b(hai|hain|nahi|nahin|kya|mein|ko|ka|ki|ke|tha|thi|raha|rahi|gaya|gayi|aaj|kal|bahut|aur|phir|usne|maine|humne|khana|baad|subah|shaam|raat|ne|se|din|kuch|mummy|papa|unke|uske|mujhse|hota|kar|gir|chot|lagi|apna|apne|apni|par|pe|liya|diya|kiya|hua|hui|the|ho|hi|bhi|toh|wo|woh|yeh|unhe|use|gusse|haath|sir|khoon|nikal|aaya|aayi|patak|kaat|deewar|ghar|aaram|mila|chup|shor|bilkul|baje|uth|koshish|wapas|bistar)\b/g;

export function detectNoteLanguage(rawText: string): OtherLanguage | "en" | "mixed" {
  const text = rawText.toLowerCase();
  const letters = (text.match(/\p{L}/gu) ?? []).length || 1;
  const devanagari = (text.match(/[\u0900-\u097f]/g) ?? []).length;
  const han = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) ?? []).length;
  if (devanagari / letters > 0.3) return "hi";
  if (han / letters > 0.3) return "zh";
  const latin = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const words = (latin.match(/[a-z]+/g) ?? []).length || 1;
  const es = (latin.match(ES_WORDS) ?? []).length + (/[¿¡ñ]/.test(text) ? 3 : 0) + Math.min(3, (text.match(/[áéíóú]/g) ?? []).length);
  const hi = (latin.match(HI_WORDS) ?? []).length;
  if (hi >= 3 && hi / words > 0.3 && hi > es) return "hi";
  if (es >= 3 && es / words > 0.25) return "es";
  if (devanagari > 0 || han > 0) return "mixed";
  return "en";
}
