import { HeartHandshake, Phone, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "care" | "emergency" | "red_flag" | "scope";

export function toneForMessage(message: string, kind?: string): Tone {
  if (kind === "caregiver_distress" || message.includes("988")) return "care";
  if (/call 911 now/i.test(message.slice(0, 40))) return "emergency";
  if (kind === "out_of_scope" && !message.startsWith("Please contact")) return "scope";
  return "red_flag";
}

const STYLE: Record<Tone, string> = {
  care: "border-violet-300 bg-violet-50 text-violet-950",
  emergency: "border-red-400 bg-red-50 text-red-950",
  red_flag: "border-amber-400 bg-amber-50 text-amber-950",
  scope: "border-sky-300 bg-sky-50 text-sky-950",
};

const TITLE: Record<Tone, string> = {
  care: "You matter too",
  emergency: "This may be an emergency",
  red_flag: "Please check with your care team",
  scope: "Outside what Unspoken can do",
};

// Safety or scope message. Always rendered before anything else in a result.
export function SafetyMessage({ message, kind }: { message: string; kind?: string }) {
  const tone = toneForMessage(message, kind);
  const Icon = tone === "care" ? HeartHandshake : TriangleAlert;
  return (
    <div role="alert" className={cn("flex flex-col gap-3 rounded-xl border-2 p-4", STYLE[tone])}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-6 shrink-0" aria-hidden />
        <div className="flex flex-col gap-1">
          <p className="text-lg font-bold leading-snug">{TITLE[tone]}</p>
          <p>{message}</p>
        </div>
      </div>
      {tone === "care" && (
        <div className="flex flex-wrap gap-2">
          <a
            href="tel:988"
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-violet-800 px-4 font-semibold text-white hover:bg-violet-900"
          >
            <Phone className="size-5" aria-hidden />
            Call 988
          </a>
          <a
            href="sms:988"
            className="inline-flex h-12 items-center gap-2 rounded-lg border border-violet-400 bg-white px-4 font-semibold text-violet-950 hover:bg-violet-100"
          >
            Text 988
          </a>
        </div>
      )}
      {tone === "emergency" && (
        <a
          href="tel:911"
          className="inline-flex h-12 items-center gap-2 self-start rounded-lg bg-red-700 px-4 font-semibold text-white hover:bg-red-800"
        >
          <Phone className="size-5" aria-hidden />
          Call 911
        </a>
      )}
    </div>
  );
}
