"use client";

// Weekly and monthly overview: counts from the logs.
import { useRef, useState } from "react";
import Link from "next/link";
import { PersonPicker, usePersonContext } from "@/components/person-picker";
import { ReportActions } from "@/components/report-actions";
import { CardSkeleton, EmptyState, ErrorState, GuardrailBanner } from "@/components/states";
import { label } from "@/config/modes";
import { useApi } from "@/hooks/useApi";
import { reportFileName } from "@/lib/exportReport";
import { TIME_BAND_LABEL } from "@/lib/time";
import type { OverviewResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

function Tile({ value, caption, note }: { value: string; caption: string; note?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border bg-card p-4">
      <p className="text-3xl font-bold tabular-nums leading-none">{value}</p>
      <p className="text-sm font-medium">{caption}</p>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

// One series, so no legend: the section title names it. Values are written out next to every bar.
function Bars({ rows, unit }: { rows: { name: string; value: number; detail?: string }[]; unit: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <li key={r.name} className="flex flex-col gap-1" title={`${r.name}: ${r.value} ${unit}${r.detail ? `, ${r.detail}` : ""}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium">{r.name}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {r.value}
              {r.detail ? ` · ${r.detail}` : ""}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-r bg-muted" aria-hidden>
            <div
              className={cn("h-2.5 rounded-r bg-primary", r.value === 0 && "hidden")}
              style={{ width: `${Math.max(3, (r.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function OverviewPage() {
  const ctx = usePersonContext();
  const { person } = ctx;
  const [days, setDays] = useState<7 | 30>(7);
  const overview = useApi<OverviewResponse>(
    person ? `/api/overview?personId=${person.id}&days=${days}` : null,
  );
  const data = overview.data;
  const period = days === 7 ? "the last 7 days" : "the last 30 days";

  const change =
    data && data.previousHardMoments !== null
      ? data.hardMoments === data.previousHardMoments
        ? `Same as the ${days} days before`
        : `${Math.abs(data.hardMoments - data.previousHardMoments)} ${data.hardMoments < data.previousHardMoments ? "fewer" : "more"} than the ${days} days before (${data.previousHardMoments})`
      : "Not enough earlier logs to compare yet";

  const reportRef = useRef<HTMLDivElement>(null);
  const name = person?.displayName ?? "Overview";
  const periodTitle = days === 7 ? "Weekly overview" : "Monthly overview";

  // The same counts as on screen, as plain text for the download.
  function overviewText(): string {
    if (!data) return "";
    const lines = [`${name}: ${periodTitle.toLowerCase()} (${period})`, "Counts only, straight from what was logged.", ""];
    lines.push(`Hard moments logged: ${data.hardMoments}. ${change}.`, `Days with none logged: ${data.daysWithNone} of ${data.days}.`, "");
    lines.push("When hard moments happened");
    for (const b of data.byTimeBand) lines.push(`- ${TIME_BAND_LABEL[b.timeBand]}: ${b.count}`);
    if (data.topContexts.length) {
      lines.push("", "What came before most often (possible things to check, not causes)");
      for (const c of data.topContexts) lines.push(`- ${label(c.key)}: ${c.count} ${c.count === 1 ? "time" : "times"}`);
    }
    if (data.whatHelped.length) {
      lines.push("", "What you tried");
      for (const h of data.whatHelped) lines.push(`- ${label(h.key)}: tried ${h.tried} ${h.tried === 1 ? "time" : "times"}, helped ${h.calmed} of ${h.tried}`);
    }
    lines.push("", "Supports caregivers. Does not diagnose.", "Counted from caregiver logs. Not a clinical record.");
    return lines.join("\n");
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{person ? `${person.displayName}'s overview` : "Overview"}</h1>
        <p className="text-muted-foreground">What the logs show for {period}. Counts only, straight from what was logged.</p>
      </div>
      <GuardrailBanner />
      <PersonPicker ctx={ctx} label="Showing" />

      <div role="group" aria-label="Period" className="flex self-start rounded-full border bg-muted p-1">
        {([7, 30] as const).map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={days === d}
            onClick={() => setDays(d)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              days === d ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {d === 7 ? "This week" : "This month"}
          </button>
        ))}
      </div>

      {(ctx.loading || overview.loading) && (
        <>
          <CardSkeleton lines={2} />
          <CardSkeleton lines={4} />
        </>
      )}
      {overview.error && <ErrorState message={overview.error} onRetry={overview.reload} />}

      {data && data.hardMoments === 0 && (
        <EmptyState title="Nothing logged in this period">
          Notes you add on the <Link href="/" className="underline">Log</Link> screen will show up here.
        </EmptyState>
      )}

      {data && data.hardMoments > 0 && (
        <>
          <ReportActions
            target={reportRef}
            fileName={reportFileName(name, periodTitle)}
            text={overviewText}
          />
          <div ref={reportRef} className="flex flex-col gap-4">
          {/* Shown only in the saved PDF, so the page stands on its own. */}
          <div className="hidden flex-col gap-1 print:flex">
            <p className="text-xl font-bold">{name}: {periodTitle.toLowerCase()}</p>
            <p className="text-sm">What the logs show for {period}. Counts only, straight from what was logged.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Tile value={String(data.hardMoments)} caption="hard moments logged" note={change} />
            <Tile value={String(data.daysWithNone)} caption={`of ${data.days} days with none logged`} />
          </div>

          <Section title="When hard moments happened">
            <Bars unit="logged" rows={data.byTimeBand.map((b) => ({ name: TIME_BAND_LABEL[b.timeBand], value: b.count }))} />
          </Section>

          {data.topContexts.length > 0 && (
            <Section title="What came before most often">
              <Bars unit="times" rows={data.topContexts.map((c) => ({ name: label(c.key), value: c.count }))} />
              <p className="text-xs text-muted-foreground">These are possible things to check, not causes.</p>
            </Section>
          )}

          {data.whatHelped.length > 0 && (
            <Section title="What you tried">
              <Bars
                unit="times tried"
                rows={data.whatHelped.map((h) => ({ name: label(h.key), value: h.tried, detail: `helped ${h.calmed} of ${h.tried}` }))}
              />
            </Section>
          )}
          <p className="hidden text-sm print:block">Supports caregivers. Does not diagnose. Counted from caregiver logs. Not a clinical record.</p>
          </div>
        </>
      )}

    </>
  );
}
