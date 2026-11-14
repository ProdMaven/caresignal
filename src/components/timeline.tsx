import { Badge } from "@/components/ui/badge";
import { caregiverName, eventDot, INTENSITY_LABEL, label, OUTCOME_LABEL, STEP_RESULT_LABEL } from "@/config/modes";
import { formatDay, formatTime, TIME_BAND_LABEL, TIME_BAND_ORDER, wallParts } from "@/lib/time";
import type { LogRecord, TimeBand } from "@/lib/types";
import { cn } from "@/lib/utils";

function EventRow({ event }: { event: LogRecord }) {
  const resultOf = (tag: string) => event.responses?.find((r) => r.tag === tag)?.result ?? "unknown";
  const tags = [
    ...event.contextBefore.map((t) => ({ t, kind: "before", note: "" })),
    ...event.responseTried.map((t) => ({
      t, kind: "tried", note: resultOf(t) === "unknown" ? "" : ` (${STEP_RESULT_LABEL[resultOf(t)].toLowerCase()})`,
    })),
  ];
  return (
    <li className="flex gap-3 py-2.5">
      <span className={cn("mt-1.5 size-3 shrink-0 rounded-full", eventDot(event.eventType))} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
          <span className="font-semibold">{label(event.eventType, event.mode)}</span>
          <span className="text-sm tabular-nums text-muted-foreground">{formatTime(event.occurredAt)}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {INTENSITY_LABEL[event.intensity]}
          {event.durationMin ? `, ${event.durationMin} min` : ""}
          {event.outcome !== "unknown" ? `, ${OUTCOME_LABEL[event.outcome].toLowerCase()}` : ""}. Logged by{" "}
          {caregiverName(event.loggedBy)}.
        </p>
        {event.rawNote && <p className="text-sm">{event.rawNote}</p>}
        {(tags.length > 0 || event.redFlags.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {event.redFlags.map((f) => (
              <Badge key={f} variant="danger" className="text-xs">
                {label(f)}
              </Badge>
            ))}
            {tags.map(({ t, kind, note }) => (
              <Badge key={`${kind}-${t}`} variant={kind === "before" ? "warning" : "success"} className="text-xs">
                {kind === "before" ? "Before: " : "Tried: "}
                {label(t).toLowerCase()}
                {note}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

// Events grouped by day (newest first), then by time band.
export function Timeline({ events }: { events: LogRecord[] }) {
  const byDay = new Map<string, LogRecord[]>();
  for (const e of events) {
    const date = wallParts(e.occurredAt)?.date ?? e.occurredAt.slice(0, 10);
    byDay.set(date, [...(byDay.get(date) ?? []), e]);
  }
  const days = [...byDay.keys()].sort().reverse();

  return (
    <ol className="flex flex-col gap-3">
      {days.map((date) => {
        const dayEvents = byDay.get(date) ?? [];
        const bands = TIME_BAND_ORDER.filter((b) => dayEvents.some((e) => e.timeBand === b));
        return (
          <li key={date} className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold">{formatDay(date)}</h3>
            {bands.map((band: TimeBand) => (
              <div key={band} className="mt-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{TIME_BAND_LABEL[band]}</p>
                <ul className="divide-y">
                  {dayEvents
                    .filter((e) => e.timeBand === band)
                    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
                    .map((e) => (
                      <EventRow key={e.id} event={e} />
                    ))}
                </ul>
              </div>
            ))}
          </li>
        );
      })}
    </ol>
  );
}
