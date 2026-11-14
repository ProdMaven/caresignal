"use client";

// Tap-logger fallback: log an event without speaking or typing a sentence.
import { useState } from "react";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { INTENSITY_LABEL, MODES } from "@/config/modes";
import { postJson } from "@/lib/api";
import { bandForHour, localIso, wallParts } from "@/lib/time";
import type { Intensity, LogRecord, Mode, Person, SaveEventRequest, SaveEventResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TapLogger({
  mode,
  person,
  loggedBy,
  onSaved,
}: {
  mode: Mode;
  person: Person | null;
  loggedBy: string;
  onSaved: (record: LogRecord) => void;
}) {
  const [eventType, setEventType] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<Intensity>(2);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!person || !eventType) return;
    setSaving(true);
    setError(null);
    const occurredAt = localIso();
    const body: SaveEventRequest = {
      record: {
        mode,
        personId: person.id,
        loggedBy,
        occurredAt,
        timeBand: bandForHour(wallParts(occurredAt)?.hour ?? new Date().getHours()),
        source: "tap",
        eventType,
        behaviors: [],
        intensity,
        durationMin: null,
        contextBefore: [],
        environment: [],
        responseTried: [],
        outcome: "unknown",
        rawNote: "",
        confidence: {},
        needsReview: [],
        redFlags: [],
      },
    };
    try {
      const res = await postJson<SaveEventResponse>("/api/events", body);
      setEventType(null);
      onSaved(res.record);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="rounded-xl border bg-card">
      <summary className="cursor-pointer select-none px-4 py-3 font-semibold">Or tap to log, no typing</summary>
      <div className="flex flex-col gap-3 border-t px-4 py-4">
        <p className="text-sm text-muted-foreground">
          What happened{person ? ` with ${person.displayName}` : ""} just now?
        </p>
        <div className="grid grid-cols-2 gap-2">
          {MODES[mode].eventTypes.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={eventType === t.value}
              onClick={() => setEventType(t.value)}
              className={cn(
                "flex min-h-12 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                eventType === t.value ? "border-primary bg-accent" : "bg-card hover:bg-muted",
              )}
            >
              <span className={cn("size-3 shrink-0 rounded-full", t.dot)} aria-hidden />
              {t.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([1, 2, 3] as Intensity[]).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={intensity === n}
              onClick={() => setIntensity(n)}
              className={cn(
                "h-11 rounded-lg border text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                intensity === n ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
              )}
            >
              {INTENSITY_LABEL[n]}
            </button>
          ))}
        </div>
        {error && <ErrorState message={error} />}
        <Button onClick={save} disabled={!eventType || !person || saving}>
          {saving ? "Saving..." : "Save to log"}
        </Button>
      </div>
    </details>
  );
}
