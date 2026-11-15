// One follow-up question after a note (docs/AI_FEATURES.md, Feature 3). Behind FEATURE_FOLLOWUP.
// Code decides whether to ask and about which field. A small fast model may word the question; code checks it
// and falls back to a fixed question for that field. Never more than one question per note.
import { AiError, callClaude, parseJson } from "./ai";
import { mocksEnabled } from "./env";
import { features } from "./features";
import { buildFollowUpUserMessage, FOLLOW_UP_SYSTEM } from "../prompts/followUp";
import { detectNoteLanguage } from "./safetyMultilingual";
import { CAUSE_CLAIM, checkNoDiagnosis, checkNoMedication, wordCount } from "./textChecks";
import type { FollowUp, ParseLogRequest, ParseLogResponse } from "./types";

type Field = FollowUp["field"];
type Lang = "en" | "es" | "hi" | "zh";

// Fixed questions, used when the model gives none or its question fails a check.
// The Spanish, Hindi and Chinese lines were drafted by the team and are not yet reviewed by native speakers.
const FIXED: Record<Lang, Record<Field, string>> = {
  en: {
    contextBefore: "What was happening just before this?",
    stepResult: "Did what you tried help?",
    occurredAt: "About what time did this happen?",
  },
  es: {
    contextBefore: "¿Qué estaba pasando justo antes?",
    stepResult: "¿Ayudó lo que intentaste?",
    occurredAt: "¿A qué hora pasó, más o menos?",
  },
  hi: {
    contextBefore: "इससे ठीक पहले क्या हो रहा था?",
    stepResult: "आपने जो किया, क्या उससे मदद मिली?",
    occurredAt: "यह लगभग कितने बजे हुआ?",
  },
  zh: {
    contextBefore: "在这之前发生了什么？",
    stepResult: "您试的方法有帮助吗？",
    occurredAt: "这大约是几点发生的？",
  },
};

// Words that state a cause in the other supported languages (English is covered by CAUSE_CLAIM).
const CAUSE_OTHER = /\b(porque|debido a|por culpa de|a causa de|kyunki|kyonki|ki wajah se)\b|क्योंकि|की वजह से|के कारण|因为|由于|导致|所以/i;
// A question that names a dose or a medicine in the other supported languages.
const MED_OTHER = /\b(dosis|medicamento|medicina|pastillas?|dawa|dawai|goli)\b|दवा|दवाई|गोली|खुराक|药|剂量/i;
// Times said in the note itself, so the "when" question is not asked when the caregiver already told us.
const SAYS_WHEN =
  /\b(\d{1,2}(:\d{2})?\s?(am|pm|a\.m\.|p\.m\.)|\d{1,2}:\d{2}|morning|afternoon|evening|tonight|night|noon|midnight|lunch(time)?|dinner(time)?|breakfast|bedtime|bath ?time|after school|just now|right now|earlier today|yesterday|today|mañana|tarde|noche|almuerzo|cena|desayuno|ayer|hoy|subah|dopahar|shaam|raat|aaj|kal)\b|सुबह|दोपहर|शाम|रात|आज|कल|बजे|早上|上午|中午|下午|晚上|今天|昨天|点/i;

function langOf(transcript: string): Lang {
  const detected = detectNoteLanguage(transcript);
  return detected === "es" || detected === "hi" || detected === "zh" ? detected : "en";
}

// Which missing piece would help most, in the spec's priority. null when nothing should be asked.
export function chooseFollowUpField(req: ParseLogRequest, response: ParseLogResponse): Field | null {
  if (req.followUpAnswered) return null;
  if (response.kind !== "event" || response.message) return null;
  const draft = response.draft;
  if (!draft || draft.redFlags.length > 0) return null;
  if (draft.contextBefore.length === 0) return "contextBefore";
  const tried = draft.responses ?? [];
  if ((tried.length > 0 && tried.every((s) => s.result === "unknown")) || (tried.length === 0 && draft.responseTried.length > 0 && draft.outcome === "unknown")) return "stepResult";
  if (!SAYS_WHEN.test(req.transcript)) return "occurredAt";
  return null;
}

// Why a model-written question cannot be shown, or null when it can.
export function questionProblem(question: string, lang: Lang): string | null {
  const q = question.trim();
  if (!q) return "empty";
  if (!/[?？]$/.test(q)) return "does not end with a question mark";
  if ((q.match(/[?？]/g) ?? []).length > 1) return "more than one question";
  const words = lang === "zh" ? Math.ceil(q.replace(/\s/g, "").length / 2) : wordCount(q);
  if (words > 20) return "longer than 20 words";
  if (/[\n<>{}]/.test(q) || q.length > 160) return "not a plain short question";
  if (CAUSE_CLAIM.test(q) || CAUSE_OTHER.test(q)) return "states a cause";
  if (checkNoDiagnosis(q)) return "names a condition";
  if (checkNoMedication(q) || MED_OTHER.test(q) || /\b(dose|dosage|medication|medicine|meds|pills?|mg)\b/i.test(q)) return "mentions medication";
  return null;
}

// Adds followUp to a parsed response. modelFollowUp is what the formatter suggested, if anything.
export function applyFollowUp(
  req: ParseLogRequest,
  response: ParseLogResponse,
  modelFollowUp: { field: string; question: string } | null | undefined,
): ParseLogResponse {
  if (!features.followUp()) return response;
  const field = chooseFollowUpField(req, response);
  if (!field) return { ...response, followUp: null };
  const lang = langOf(req.transcript);
  const fromModel = modelFollowUp && modelFollowUp.field === field && !questionProblem(modelFollowUp.question, lang) ? modelFollowUp.question.trim() : null;
  return { ...response, followUp: { field, question: fromModel ?? FIXED[lang][field] } };
}

// Asks the small fast model to word the question for this note. Returns null when the model is off,
// slow, fails, or its question does not pass the checks; the caller then shows the fixed question.
// A separate short call, so the note formatter's prompt and speed are untouched (see docs/DECISIONS.md).
const PHRASE_TIMEOUT_MS = 3_500;
export async function phraseFollowUp(transcript: string, field: Field): Promise<string | null> {
  if (mocksEnabled()) return null;
  try {
    const reply = await callClaude({
      system: FOLLOW_UP_SYSTEM,
      messages: [{ role: "user", content: buildFollowUpUserMessage({ field, transcript }) }],
      model: process.env.ANTHROPIC_MODEL_FAST || "claude-haiku-5-5",
      maxTokens: 300,
      timeoutMs: PHRASE_TIMEOUT_MS,
      maxRetries: 0,
      label: "follow_up",
    });
    const parsed = parseJson<{ question?: unknown }>(reply.text);
    const question = typeof parsed?.question === "string" ? parsed.question.trim() : "";
    const problem = questionProblem(question, langOf(transcript));
    if (problem) {
      console.warn(`[follow_up] model question rejected (${problem}), using the fixed question`);
      return null;
    }
    return question;
  } catch (err) {
    if (!(err instanceof AiError)) console.error("[follow_up] failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
