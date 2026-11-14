"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { ErrorState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FIELD_LABEL, INTENSITY_LABEL, label, MODES, OUTCOME_LABEL, VOCAB } from "@/config/modes";
import { postJson } from "@/lib/api";
import { bandForHour, formatDay, setWallTime, TIME_BAND_LABEL, timeInputValue, wallParts } from "@/lib/time";
import type { Intensity, LogRecord, Mode, Outcome, Person, SaveEventResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

export type Draft = Omit<LogRecord, "id" | "loggedAt">;

const selectClass =
  "h-12 w-full rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Field({ name, review, children }: { name: string; review: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5 rounded-lg p-2", review && "border-2 border-amber-400 bg-amber-50")}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-muted-foreground">{FIELD_LABEL[name] ?? name}</span>
        {review && <Badge variant="warning">Please check</Badge>}
      </div>
      {children}
    </div>
  );
}

function ChipField({
  values,
  options,
  onChange,
  addLabel,
}: {
  values: string[];
  options: readonly string[];
  onChange: (next: string[]) => void;
  addLabel: string;
}) {
  const remaining = options.filter((o) => !values.includes(o));
  return (
    <div className="flex flex-wrap items-center gap-2">
      {values.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(values.filter((x) => x !== v))}
          className="inline-flex min-h-10 items-center gap-1 rounded-full border bg-accent px-3 text-sm font-medium text-accent-foreground hover:bg-accent/70"
          aria-label={`Remove ${label(v)}`}
        >
          {label(v)}
          <X className="size-4" aria-hidden />
        </button>
      ))}
      {remaining.length > 0 && (
        <span className="relative inline-flex min-h-10 items-center gap-1 rounded-full border border-dashed px-3 text-sm text-muted-foreground">
          <Plus className="size-4" aria-hidden />
          {values.length === 0 ? `None noted. ${addLabel}` : addLabel}
          <select
            aria-label={addLabel}
            className="absolute inset-0 cursor-pointer opacity-0"
            value=""
            onChange={(e) => e.target.value && onChange([...values, e.target.value])}
          >
            <option value="">{addLabel}</option>
            {remaining.map((o) => (
              <option key={o} value={o}>
                {label(o)}
              </option>
            ))}
          </select>
        </span>
      )}
    </div>
  );
}

export function ConfirmCard({
  draft,
  mode,
  people,
  fallbackPerson,
  unmatchedPerson,
  source,
  onSaved,
  onDiscard,
}: {
  draft: Draft;
  mode: Mode;
  people: Person[];
  fallbackPerson: Person | null;
  unmatchedPerson: boolean;
  source: LogRecord["source"];
  onSaved: (record: LogRecord) => void;
  onDiscard: () => void;
}) {
  const [record, setRecord] = useState<Draft>(() => ({
    ...draft,
    source,
    // The note did not name anyone we know: use the person picked at the top.
    personId: draft.personId || fallbackPerson?.id || people[0]?.id || "",
  }));
  const [checked, setChecked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reviewFields = unmatchedPerson && !draft.needsReview.includes("personId")
    ? ["personId", ...draft.needsReview]
    : draft.needsReview;
  const needs = (field: string) => reviewFields.includes(field) && !checked.includes(field);
  const update = (field: keyof Draft, patch: Partial<Draft>) => {
    setRecord((r) => ({ ...r, ...patch }));
    setChecked((c) => (c.includes(field) ? c : [...c, field]));
  };

  const eventTypes = MODES[record.mode].eventTypes;
  const rosterForMode = people.filter((p) => p.mode === record.mode);
  const parts = wallParts(record.occurredAt);
  const openReview = reviewFields.filter((f) => !checked.includes(f));

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await postJson<SaveEventResponse>("/api/events", {
        record: { ...record, needsReview: openReview },
      });
      onSaved(res.record);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Please try again.");
      setSaving(false);
    }
  }

  return (
    <Card className={cn("border-2", MODES[mode].accentBorder)}>
      <CardHeader>
        <CardTitle className="text-xl">Does this look right?</CardTitle>
        <CardDescription>
          {openReview.length > 0
            ? `Please check the ${openReview.length === 1 ? "highlighted field" : `${openReview.length} highlighted fields`}. Tap anything to change it.`
            : "Tap anything to change it, then save."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {record.redFlags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">Flagged for your care team:</span>
            {record.redFlags.map((f) => (
              <Badge key={f} variant="danger">
                {label(f)}
              </Badge>
            ))}
          </div>
        )}

        <Field name="personId" review={needs("personId")}>
          <select
            className={selectClass}
            value={record.personId}
            onChange={(e) => update("personId", { personId: e.target.value })}
            aria-label="Person"
          >
            {rosterForMode.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>
          {unmatchedPerson && needs("personId") && (
            <p className="text-sm text-amber-900">The note did not name anyone on your list, so the person picked above is used.</p>
          )}
        </Field>

        <Field name="eventType" review={needs("eventType")}>
          <select
            className={selectClass}
            value={record.eventType}
            onChange={(e) => update("eventType", { eventType: e.target.value })}
            aria-label="What happened"
          >
            {eventTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field name="occurredAt" review={needs("occurredAt")}>
          <div className="flex items-center gap-3">
            <Input
              type="time"
              className="w-36"
              value={timeInputValue(record.occurredAt)}
              aria-label="Time"
              onChange={(e) => {
                const [h, m] = e.target.value.split(":").map(Number);
                if (Number.isNaN(h) || Number.isNaN(m)) return;
                update("occurredAt", { occurredAt: setWallTime(record.occurredAt, h, m), timeBand: bandForHour(h) });
              }}
            />
            <span className="text-sm text-muted-foreground">
              {TIME_BAND_LABEL[record.timeBand]}
              {parts ? `, ${formatDay(parts.date)}` : ""}
            </span>
          </div>
        </Field>

        <Field name="intensity" review={needs("intensity")}>
          <div className="grid grid-cols-3 gap-2">
            {([1, 2, 3] as Intensity[]).map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={record.intensity === n}
                onClick={() => update("intensity", { intensity: n })}
                className={cn(
                  "h-12 rounded-lg border text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  record.intensity === n ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                )}
              >
                {INTENSITY_LABEL[n]}
              </button>
            ))}
          </div>
        </Field>

        <Field name="behaviors" review={needs("behaviors")}>
          <ChipField values={record.behaviors} options={VOCAB.behaviors} addLabel="Add" onChange={(v) => update("behaviors", { behaviors: v })} />
        </Field>
        <Field name="contextBefore" review={needs("contextBefore")}>
          <ChipField values={record.contextBefore} options={VOCAB.contextBefore} addLabel="Add" onChange={(v) => update("contextBefore", { contextBefore: v })} />
        </Field>
        <Field name="responseTried" review={needs("responseTried")}>
          <ChipField values={record.responseTried} options={VOCAB.responseTried} addLabel="Add" onChange={(v) => update("responseTried", { responseTried: v })} />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field name="outcome" review={needs("outcome")}>
            <select
              className={selectClass}
              value={record.outcome}
              onChange={(e) => update("outcome", { outcome: e.target.value as Outcome })}
              aria-label="How it ended"
            >
              {(Object.keys(OUTCOME_LABEL) as Outcome[]).map((o) => (
                <option key={o} value={o}>
                  {OUTCOME_LABEL[o]}
                </option>
              ))}
            </select>
          </Field>
          <Field name="durationMin" review={needs("durationMin")}>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={600}
                placeholder="?"
                aria-label="How long, in minutes"
                value={record.durationMin ?? ""}
                onChange={(e) => {
                  const n = e.target.value === "" ? null : Math.max(0, Math.round(Number(e.target.value)));
                  update("durationMin", { durationMin: n !== null && Number.isNaN(n) ? null : n });
                }}
              />
              <span className="text-sm text-muted-foreground">min</span>
            </div>
          </Field>
        </div>

        {record.rawNote && (
          <blockquote className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            <span className="font-semibold">Your words: </span>
            {record.rawNote}
          </blockquote>
        )}

        {error && <ErrorState message={error} />}
      </CardContent>
      <CardFooter>
        <Button size="lg" onClick={save} disabled={saving || !record.personId} className="flex-1">
          <Check className="size-5" aria-hidden />
          {saving ? "Saving..." : "Save to log"}
        </Button>
        <Button variant="ghost" onClick={onDiscard} disabled={saving}>
          Discard
        </Button>
      </CardFooter>
    </Card>
  );
}
