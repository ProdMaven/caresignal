"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CardSkeleton, EmptyState, ErrorState, GuardrailBanner } from "@/components/states";
import { StrategyCardView } from "@/components/strategy-card";
import { Button } from "@/components/ui/button";
import { label, MODES } from "@/config/modes";
import { useApi } from "@/hooks/useApi";
import { useMode } from "@/hooks/useAppState";
import type { StrategiesResponse } from "@/lib/types";

function describePattern(patternKey: string): string {
  const [eventType, contextTag] = patternKey.split("|");
  return `${label(eventType)} after: ${label(contextTag ?? "").toLowerCase()}`;
}

function WinningPatterns() {
  const [mode] = useMode();
  const patternKey = useSearchParams().get("patternKey");
  const query = `/api/strategies?mode=${mode}${patternKey ? `&patternKey=${encodeURIComponent(patternKey)}` : ""}`;
  const { data, loading, error, reload } = useApi<StrategiesResponse>(query);

  // With no pattern picked, group the mode's strategies by pattern.
  const groups = new Map<string, StrategiesResponse["strategies"]>();
  for (const s of data?.strategies ?? []) groups.set(s.patternKey, [...(groups.get(s.patternKey) ?? []), s]);

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">What worked for other families</h1>
        <p className="text-muted-foreground">
          Winning Patterns: ideas ranked by how often they helped families in {MODES[mode].label.toLowerCase()} who saw
          the same pattern.
        </p>
      </div>
      <GuardrailBanner />

      {patternKey && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2">
          <p className="text-sm">
            <span className="text-muted-foreground">For the pattern: </span>
            <span className="font-semibold">{describePattern(patternKey)}</span>
          </p>
          <Button asChild variant="link" size="sm">
            <Link href="/patterns">Show all</Link>
          </Button>
        </div>
      )}

      {loading ? (
        <>
          <CardSkeleton lines={5} />
          <CardSkeleton lines={5} />
        </>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : groups.size === 0 ? (
        <EmptyState title="No ranked ideas for this pattern yet">
          Not enough families have logged what they tried for this pattern in {MODES[mode].label.toLowerCase()}.{" "}
          <Link href="/patterns" className="font-semibold text-primary underline underline-offset-4">
            See all ranked ideas
          </Link>
        </EmptyState>
      ) : (
        [...groups.entries()].map(([key, strategies]) => (
          <section key={key} className="flex flex-col gap-3">
            {!patternKey && <h2 className="text-xl font-semibold">{describePattern(key)}</h2>}
            {strategies.map((s, i) => (
              <StrategyCardView key={s.id} strategy={s} rank={i + 1} />
            ))}
          </section>
        ))
      )}

      {data && <p className="text-center text-sm text-muted-foreground">{data.disclaimer}</p>}
    </>
  );
}

export default function PatternsPage() {
  return (
    <Suspense fallback={<CardSkeleton lines={5} />}>
      <WinningPatterns />
    </Suspense>
  );
}
