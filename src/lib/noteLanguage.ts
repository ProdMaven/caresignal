// Records the language a note was given in, and adds the fixed translated safety line under the English one.
// Applied to every /api/log response. The model never translates a safety message.
import { isTranslatedLanguage, SAFETY_TRANSLATIONS, type SafetyLineKind, type TranslatedLanguage } from "@/config/safetyTranslations";
import { features } from "@/lib/features";
import { detectNoteLanguage } from "@/lib/safetyMultilingual";
import type { ParseLogResponse } from "@/lib/types";

// "es", "hi", "zh", "en", another two-letter code, or "mixed".
export function noteLanguageOf(rawText: string, modelLanguage: string | null): string {
  const detected = detectNoteLanguage(rawText);
  const said = (modelLanguage ?? "").toLowerCase().trim();
  if (said.includes("+") || said === "mixed") return "mixed";
  const code = said.slice(0, 2);
  if (/^[a-z]{2}$/.test(code) && said !== "unknown") return code;
  return detected;
}

// The language to translate into: the script or common words of the note first, then what the model reported.
function translationLanguage(rawText: string, modelLanguage: string | null): TranslatedLanguage | null {
  const detected = detectNoteLanguage(rawText);
  if (isTranslatedLanguage(detected)) return detected;
  const parts = (modelLanguage ?? "").toLowerCase().split(/[+,/ ]+/).map((p) => p.slice(0, 2));
  return parts.find(isTranslatedLanguage) ?? null;
}

function lineKinds(response: ParseLogResponse): SafetyLineKind[] {
  const message = response.message ?? "";
  if (response.kind === "caregiver_distress") return ["distress"];
  const kinds: SafetyLineKind[] = [];
  if (message.startsWith("Call 911 now")) kinds.push("emergency");
  else if (message.includes("Adult Protective Services")) kinds.push("abuse");
  else if (message.startsWith("Please contact your doctor or care team today and tell them")) kinds.push("person_wish_to_die");
  else if (message.startsWith("Please contact your doctor or care team")) kinds.push("red_flag");
  if (response.kind === "out_of_scope") kinds.push("scope");
  return kinds;
}

export function applyNoteLanguage(response: ParseLogResponse, rawText: string, modelLanguage: string | null): ParseLogResponse {
  const draft = response.draft ? { ...response.draft, noteLanguage: noteLanguageOf(rawText, modelLanguage) } : null;
  let message = response.message;
  if (features.multilingualSafety() && message) {
    const lang = translationLanguage(rawText, modelLanguage);
    const lines = lang ? lineKinds(response).map((k) => SAFETY_TRANSLATIONS[lang][k]) : [];
    if (lines.length > 0) message = `${message}\n${lines.join(" ")}`;
  }
  return { ...response, draft, message };
}
