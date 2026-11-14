// Caregiver check-in: warm listening only. Nothing here is stored or added to anyone's log.
// Order: deterministic safety screen (fixed wording), then a warm reply (model when available, template otherwise).
import type { CheckInRequest, CheckInResponse, Mood } from "@/lib/types";
import { DISTRESS_MESSAGE, screenSafety } from "@/mocks/safety";

const WARM: Record<Mood | "default", string> = {
  okay: "Thank you for checking in. An okay day still takes effort when you are caring for someone, and it counts. I am glad you took a moment for yourself.",
  tired: "You sound worn out, and that makes sense. Caring for someone day after day takes more than most people see. You do not have to do anything with this right now. It is enough to say it.",
  overwhelmed: "That is a lot to carry, and it makes sense that it feels like too much. You are holding many things at once, often without a break. Thank you for saying it out loud here.",
  sad: "I am sorry today feels heavy. Sadness often sits right next to love when you care for someone. You are allowed to feel it, and you do not have to explain it.",
  worried: "Worry like this comes from caring deeply. It is hard to hold so much uncertainty and still keep going. You are not wrong to feel it.",
  hopeful: "It is good to hear some hope in your day. Those moments matter, and you helped make them. Hold on to this one.",
  default: "Thank you for telling me. What you do every day is hard, and how you feel about it matters. You do not need to fix anything right now. I am listening.",
};

// Template reply, used in mock mode and whenever the model is unavailable or says something it should not.
export function templateReply(req: CheckInRequest): string {
  return WARM[req.mood ?? "default"];
}

// Fixed-wording safety results. Returns null when the note is safe to answer with a warm reply.
export function screenCheckIn(req: CheckInRequest): CheckInResponse | null {
  const screen = screenSafety(req.text);
  if (screen.caregiverDistress) {
    return { kind: "crisis", message: DISTRESS_MESSAGE.replace(" Nothing from this note was saved to the log.", " Nothing you write here is saved."), saved: false };
  }
  if ((screen.emergency || screen.possibleAbuse || screen.redFlags.length > 0) && screen.message) {
    return { kind: "care_team", message: screen.message, saved: false };
  }
  return null;
}

// A model reply is only used if it stays within the listening role.
const NOT_LISTENING = /\b(diagnos|medicat|dose|dosage|mg\b|prescri|supplement|melatonin|restrain|you should|you need to|try to|have you tried|i recommend|my advice)/i;

export function acceptableReply(text: string): boolean {
  const t = text.trim();
  return t.length >= 20 && t.length <= 700 && !NOT_LISTENING.test(t) && !/[\u2014\u2013]/.test(t);
}
