"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { label } from "@/config/modes";
import { postJson } from "@/lib/api";
import { TIME_BAND_LABEL } from "@/lib/time";
import type { PatternCard } from "@/lib/types";

export function strategiesHref(patternKey: string): string {
  return `/patterns?patternKey=${encodeURIComponent(patternKey)}`;
}

// Entries counted with this pattern because their wording is close in meaning, not because of their label.
// The caregiver can see each one and take it out.
function SimilarityJoined({ pattern }: { pattern: PatternCard }) {
  const [removed, setRemoved] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const shown = (pattern.similarityJoined ?? []).filter((j) => !removed.includes(j.eventId));
  if (shown.length === 0) return <p className="text-xs text-muted-foreground">Removed. The count updates the next time this page loads.</p>;
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-dashed px-3 py-2">
      <p className="text-sm font-semibold text-muted-foreground">
        {shown.length} of these {shown.length === 1 ? "was" : "were"} counted because the wording is similar
      </p>
      <ul className="flex min-w-0 flex-col gap-1.5">
        {shown.map((j) => (
          <li key={j.eventId} className="flex min-w-0 items-center justify-between gap-2 text-sm">
            <span className="min-w-0 break-words">&ldquo;{j.clause}&rdquo;</span>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              disabled={busy === j.eventId}
              onClick={async () => {
                setBusy(j.eventId);
                try {
                  await postJson("/api/semantic/exclude", { eventId: j.eventId, tag: pattern.contextTag });
                  setRemoved((r) => [...r, j.eventId]);
                } finally {
                  setBusy(null);
                }
              }}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">Similarity can be wrong. Remove any that do not belong.</p>
    </div>
  );
}

export function PatternCardView({ pattern }: { pattern: PatternCard }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {TIME_BAND_LABEL[pattern.timeBand]} {label(pattern.eventType).toLowerCase()}
          </Badge>
          {pattern.crossShift && (
            <Badge variant="info">
              <Users className="size-3.5" aria-hidden />
              Seen by different caregivers
            </Badge>
          )}
        </div>
        <CardTitle>{pattern.summary}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="whitespace-nowrap text-3xl font-bold tabular-nums">
            {pattern.matchCount} of {pattern.totalCount}
          </span>
          <span className="text-sm text-muted-foreground">
            entries in the last {pattern.windowDays} days ({pattern.confidence === "high" ? "strong" : "moderate"} pattern)
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Possible things to check</p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {pattern.thingsToCheck.map((t) => (
              <li key={t} className="rounded-full border bg-muted px-3 py-1 text-sm">
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            These are things to look into, not causes or a diagnosis.
          </p>
        </div>
        {pattern.similarityJoined && pattern.similarityJoined.length > 0 && <SimilarityJoined pattern={pattern} />}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="h-auto min-h-12 w-full whitespace-normal py-2 text-left">
          <Link href={strategiesHref(pattern.patternKey)}>
            See what worked for other families
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
