"use client";

// "Did this help?" under each suggested next step. One answer per caregiver, changeable.
// The counts sit next to the score and never change it.
import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { MIN_FAMILIES } from "@/config/modes";
import { postJson } from "@/lib/api";
import type { FeedbackRequest, FeedbackResponse, StrategyFeedback } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StrategyFeedbackRow({ strategyId, initial }: { strategyId: string; initial?: StrategyFeedback }) {
  const [feedback, setFeedback] = useState<StrategyFeedback>(initial ?? { helped: 0, notHelped: 0, yourAnswer: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = feedback.helped + feedback.notHelped;

  async function answer(helped: boolean) {
    if (busy || feedback.yourAnswer === helped) return;
    setBusy(true);
    setError(null);
    try {
      const body: FeedbackRequest = { strategyId, helped };
      const res = await postJson<FeedbackResponse>("/api/feedback", body);
      setFeedback(res.feedback);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your answer. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const choice = (helped: boolean, label: string, Icon: typeof ThumbsUp) => {
    const active = feedback.yourAnswer === helped;
    return (
      <button
        type="button"
        aria-pressed={active}
        disabled={busy}
        onClick={() => void answer(helped)}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
          active ? "border-primary bg-primary/10 ring-1 ring-primary" : "bg-card hover:bg-muted",
        )}
      >
        <Icon className="size-4" aria-hidden />
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2 border-t pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">Tried it? Did this help?</span>
        {choice(true, "It helped", ThumbsUp)}
        {choice(false, "Not really", ThumbsDown)}
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {busy
          ? "Saving your answer..."
          : error
            ? error
            : total >= MIN_FAMILIES
              ? `${feedback.helped} of ${total} caregivers who answered said it helped.${feedback.yourAnswer !== null ? " Thank you, your answer is counted." : ""}`
              : feedback.yourAnswer !== null
                ? `Thank you, your answer is counted. Totals show once ${MIN_FAMILIES} caregivers have answered.`
                : `Totals show once ${MIN_FAMILIES} caregivers have answered.`}
      </p>
    </div>
  );
}
