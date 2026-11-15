"use client";

// Shown right after a note is saved: the matching pattern from this person's own logs,
// a warm line, and the top next step that worked for other families.
// Numbers come from /api/patterns and /api/strategies only. Nothing here is invented.
import Link from "next/link";
import { ArrowRight, HeartHandshake } from "lucide-react";
import { strategiesHref } from "@/components/pattern-card";
import { CardSkeleton, GuardrailBanner } from "@/components/states";
import { StrategyCardView } from "@/components/strategy-card";
import { Button } from "@/components/ui/button";
import { MIN_FAMILIES } from "@/config/modes";
import { useApi } from "@/hooks/useApi";
import type { LogRecord, PatternCard, PatternsResponse, Person, StrategiesResponse } from "@/lib/types";

const WARM_LINE: Record<LogRecord["outcome"], string> = {
  calmed: "You noticed what was needed and it helped. That is real care.",
  partly_calmed: "You stayed with it and things eased a little. That counts.",
  escalated: "That sounds like a hard moment. Getting it written down is a real step.",
  unknown: "Thank you for logging this. Every note makes the picture clearer.",
};

function pickPattern(patterns: PatternCard[], saved: LogRecord): PatternCard | null {
  const sameType = patterns.filter((p) => p.eventType === saved.eventType);
  return (
    sameType.find((p) => saved.contextBefore.includes(p.contextTag) && p.timeBand === saved.timeBand) ??
    sameType.find((p) => saved.contextBefore.includes(p.contextTag)) ??
    sameType.find((p) => p.timeBand === saved.timeBand) ??
    // A different kind of moment with the same thing before it still belongs to that pattern's story.
    patterns.find((p) => saved.contextBefore.includes(p.contextTag)) ??
    null
  );
}

export function MatchAfterSave({ saved, person }: { saved: LogRecord; person: Person | null }) {
  const patterns = useApi<PatternsResponse>(`/api/patterns?personId=${encodeURIComponent(saved.personId)}&after=${saved.id}`);
  const match = patterns.data ? pickPattern(patterns.data.patterns, saved) : null;
  const strategies = useApi<StrategiesResponse>(
    match ? `/api/strategies?mode=${saved.mode}&patternKey=${encodeURIComponent(match.patternKey)}` : null,
  );
  const top = strategies.data?.strategies.find((s) => s.tier !== "not_recommended" && s.families >= MIN_FAMILIES) ?? null;
  const name = person?.displayName ?? "them";

  return (
    <section aria-label="What this note connects to" className="flex flex-col gap-3">
      <p className="flex items-start gap-2 rounded-xl border bg-card p-4">
        <HeartHandshake className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <span>{WARM_LINE[saved.outcome]}</span>
      </p>

      {patterns.loading && <CardSkeleton lines={2} />}
      {patterns.error && (
        <p className="text-sm text-muted-foreground">The note is saved. Patterns could not load just now; see the timeline.</p>
      )}

      {patterns.data && !match && (
        <p className="rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
          No repeating pattern matches this note yet. A pattern shows once the same kind of moment has been logged at
          least 4 times.
        </p>
      )}

      {match && (
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
          <p className="text-sm font-semibold text-muted-foreground">This fits a pattern in {name}&apos;s logs</p>
          <p className="text-lg font-semibold leading-snug">{match.summary}</p>
          <p className="text-sm text-muted-foreground">
            {match.matchCount} of {match.totalCount} times in the last {match.windowDays} days
            {match.crossShift ? ", seen by different caregivers" : ""}.
          </p>
          {match.thingsToCheck.length > 0 && (
            <div>
              <p className="text-sm font-semibold">Possible things to check</p>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {match.thingsToCheck.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {match && strategies.loading && <CardSkeleton lines={3} />}
      {match && top && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted-foreground">A next step that worked for other families</p>
          <StrategyCardView strategy={top} />
          <Button asChild variant="outline" className="self-start">
            <Link href={strategiesHref(match.patternKey)}>
              See everything families tried
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      )}
      {match && strategies.data && !top && (
        <p className="text-sm text-muted-foreground">Not enough families have shared what worked for this pattern yet.</p>
      )}

      <GuardrailBanner />
    </section>
  );
}
