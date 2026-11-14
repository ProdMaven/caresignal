// Languages offered for the mic (Web Speech API locale codes). Typed notes can be in any language.
// The log entry itself is always filled in using the English controlled vocabulary.
export const SPEECH_LANGUAGES: { code: string; label: string }[] = [
  { code: "en-US", label: "English (United States)" },
  { code: "en-IN", label: "English (India)" },
  { code: "en-GB", label: "English (United Kingdom)" },
  { code: "es-US", label: "Español (Estados Unidos)" },
  { code: "es-MX", label: "Español (México)" },
  { code: "hi-IN", label: "हिन्दी (Hindi)" },
  { code: "gu-IN", label: "ગુજરાતી (Gujarati)" },
  { code: "mr-IN", label: "मराठी (Marathi)" },
  { code: "ta-IN", label: "தமிழ் (Tamil)" },
  { code: "te-IN", label: "తెలుగు (Telugu)" },
  { code: "bn-IN", label: "বাংলা (Bengali)" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "ur-PK", label: "اردو (Urdu)" },
  { code: "zh-CN", label: "中文 (Mandarin)" },
  { code: "yue-Hant-HK", label: "粵語 (Cantonese)" },
  { code: "vi-VN", label: "Tiếng Việt (Vietnamese)" },
  { code: "fil-PH", label: "Filipino (Tagalog)" },
  { code: "ko-KR", label: "한국어 (Korean)" },
  { code: "ar-SA", label: "العربية (Arabic)" },
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "fr-FR", label: "Français (French)" },
];

export const DEFAULT_SPEECH_LANGUAGE = "en-US";
export const SPEECH_LANGUAGE_KEY = "caresignal.speechLang";

export function isSpeechLanguage(code: string | null | undefined): code is string {
  return Boolean(code) && SPEECH_LANGUAGES.some((l) => l.code === code);
}
