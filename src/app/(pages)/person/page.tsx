"use client";

import Link from "next/link";
import { PatternCardView } from "@/components/pattern-card";
import { PersonPicker, usePersonContext } from "@/components/person-picker";
import { CardSkeleton, EmptyState, ErrorState, GuardrailBanner } from "@/components/states";
import { Timeline } from "@/components/timeline";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import type { EventsResponse, PatternsResponse } from "@/lib/types";

const DAYS = 21;

export default function PersonPage() {
  const ctx = usePersonContext();
  const { person } = ctx;
  const patterns = useApi<PatternsResponse>(person ? `/api/patterns?personId=${person.id}` : null);
  const events = useApi<EventsResponse>(person ? `/api/people/${person.id}/events?days=${DAYS}` : null);
  const waitingForPerson = ctx.loading || (!person && !ctx.error);

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{person ? `${person.displayName}'s timeline` : "Timeline"}</h1>
        {person && <p className="text-muted-foreground">{person.ageBandOrSetting}. Last {DAYS} days.</p>}
      </div>
      <GuardrailBanner />
      <PersonPicker ctx={ctx} label="Showing" />

      <section aria-labelledby="patterns-heading" className="flex flex-col gap-3">
        <h2 id="patterns-heading" className="text-xl font-semibold">
          Patterns in the logs
        </h2>
        {waitingForPerson || patterns.loading ? (
          <>
            <CardSkeleton lines={4} />
            <CardSkeleton lines={4} />
          </>
        ) : patterns.error ? (
          <ErrorState message={patterns.error} onRetry={patterns.reload} />
        ) : patterns.data && patterns.data.patterns.length > 0 ? (
          patterns.data.patterns.map((p) => <PatternCardView key={p.id} pattern={p} />)
        ) : (
          <EmptyState title="No clear pattern yet">
            A pattern shows up after 4 or more similar entries. Keep logging and check back.
          </EmptyState>
        )}
      </section>

      <section aria-labelledby="timeline-heading" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 id="timeline-heading" className="text-xl font-semibold">
            Day by day
          </h2>
          {events.data && <span className="text-sm text-muted-foreground">{events.data.events.length} entries</span>}
        </div>
        {waitingForPerson || events.loading ? (
          <>
            <CardSkeleton lines={3} />
            <CardSkeleton lines={3} />
          </>
        ) : events.error ? (
          <ErrorState message={events.error} onRetry={events.reload} />
        ) : events.data && events.data.events.length > 0 ? (
          <Timeline events={events.data.events} />
        ) : (
          <EmptyState title="No entries yet">
            <Button asChild variant="link">
              <Link href="/">Log the first one</Link>
            </Button>
          </EmptyState>
        )}
      </section>
    </>
  );
}
