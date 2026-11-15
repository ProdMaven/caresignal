"use client";

// "Summary for a visit" on the person page (docs/AI_FEATURES.md, Feature 1).
// Shown only when the server has FEATURE_SUMMARY on. Safety notes always render first.
import { useState } from "react";
import { Check, ClipboardCopy, FileText } from "lucide-react";
import { SafetyMessage } from "@/components/safety-message";
import { CardSkeleton, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { caregiverName, GUARDRAIL_LINE, label } from "@/config/modes";
import { useApi } from "@/hooks/useApi";
import { postJson } from "@/lib/api";
import { formatDay, formatTime, wallParts } from "@/lib/time";
import type { EventsResponse, LogRecord, Person, SummaryAudience, SummaryRequest, SummaryResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

const AUDIENCES: { value: SummaryAudience; label: string }[] = [
  { value: "doctor", label: "For a doctor" },
  { value: "therapist_school", label: "For a therapist or school meeting" },
  { value: "caregiver_handoff", label: "For the next caregiver" },
];
const WINDOWS: (7 | 14 | 30)[] = [7, 14, 30];
const MAX_ENTRIES_SHOWN = 8;

type Status = "idle" | "loading" | "error" | "done";

// The same words the screen shows, as plain text for the clipboard. Safety notes first.
function plainText(s: SummaryResponse): string {
  const lines: string[] = [s.title, ""];
  for (const n of s.safetyNotes) lines.push(n.text);
  if (s.safetyNotes.length) lines.push("");
  for (const sec of s.sections) lines.push(sec.heading, sec.text, "");
  if (s.questionsToAsk.length) {
    lines.push("Questions to ask");
    for (const q of s.questionsToAsk) lines.push(`- ${q}`);
    lines.push("");
  }
  lines.push(s.disclaimer, GUARDRAIL_LINE);
  return lines.join("\n");
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the older way
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

function Choice({ selected, onSelect, children, disabled }: { selected: boolean; onSelect: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "min-h-12 min-w-0 rounded-lg border px-3 py-2 text-left text-base font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50",
        selected ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

// The entries a section was written from, so every line can be traced back to the log.
function SectionEntries({ ids, byId, loading }: { ids: string[]; byId: Map<string, LogRecord>; loading: boolean }) {
  if (ids.length === 0) return null;
  const found = ids.map((id) => byId.get(id)).filter((e): e is LogRecord => Boolean(e));
  const shown = [...found].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, MAX_ENTRIES_SHOWN);
  return (
    <details className="min-w-0 text-sm">
      <summary className="cursor-pointer py-1 font-medium text-muted-foreground underline underline-offset-4">
        Based on {ids.length} {ids.length === 1 ? "entry" : "entries"}
      </summary>
      {loading ? (
        <p className="py-1 text-muted-foreground">Loading the entries...</p>
      ) : shown.length === 0 ? (
        <p className="py-1 text-muted-foreground">These entries are in the timeline below.</p>
      ) : (
        <ul className="mt-1 flex min-w-0 flex-col gap-1.5 border-l-2 pl-3">
          {shown.map((e) => (
            <li key={e.id} className="min-w-0 break-words">
              <span className="font-medium">
                {formatDay(wallParts(e.occurredAt)?.date ?? e.occurredAt.slice(0, 10))}, {formatTime(e.occurredAt)}:
              </span>{" "}
              {label(e.eventType, e.mode)}, logged by {caregiverName(e.loggedBy)}.{e.rawNote ? ` ${e.rawNote}` : ""}
            </li>
          ))}
          {ids.length > shown.length && (
            <li className="text-muted-foreground">
              And {ids.length - shown.length} more in the timeline below.
            </li>
          )}
        </ul>
      )}
    </details>
  );
}

export function VisitSummary({ person }: { person: Person }) {
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState<SummaryAudience>("doctor");
  const [days, setDays] = useState<7 | 14 | 30>(14);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SummaryResponse | null>(null);
  const [copied, setCopied] = useState<"no" | "yes" | "failed">("no");

  // Entries behind each section. Loaded once a summary is on screen (30 days covers every window).
  const events = useApi<EventsResponse>(result ? `/api/people/${person.id}/events?days=30` : null);
  const byId = new Map((events.data?.events ?? []).map((e) => [e.id, e]));

  const busy = status === "loading";

  function clear() {
    setStatus("idle");
    setResult(null);
    setError(null);
    setCopied("no");
  }

  async function write() {
    setStatus("loading");
    setError(null);
    setResult(null);
    setCopied("no");
    const body: SummaryRequest = { mode: person.mode, personId: person.id, audience, days };
    try {
      setResult(await postJson<SummaryResponse>("/api/summary", body));
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  async function copy() {
    if (!result) return;
    setCopied((await copyText(plainText(result))) ? "yes" : "failed");
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="self-start" onClick={() => setOpen(true)}>
        <FileText className="size-4" aria-hidden />
        Summary for a visit
      </Button>
    );
  }

  return (
    <section aria-labelledby="visit-summary-heading" className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="visit-summary-heading" className="text-xl font-semibold">
            Summary for a visit
          </h2>
          <p className="text-sm text-muted-foreground">
            A short brief from {person.displayName}&apos;s logs that you can read out or copy.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="shrink-0" onClick={() => { setOpen(false); clear(); }}>
          Close
        </Button>
      </div>

      <fieldset className="flex min-w-0 flex-col gap-2" disabled={busy}>
        <legend className="mb-2 text-sm font-semibold">Who is it for?</legend>
        <div className="flex min-w-0 flex-col gap-2">
          {AUDIENCES.map((a) => (
            <Choice key={a.value} selected={audience === a.value} disabled={busy} onSelect={() => { setAudience(a.value); clear(); }}>
              {a.label}
            </Choice>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex min-w-0 flex-col gap-2" disabled={busy}>
        <legend className="mb-2 text-sm font-semibold">How far back?</legend>
        <div className="grid min-w-0 grid-cols-3 gap-2">
          {WINDOWS.map((d) => (
            <Choice key={d} selected={days === d} disabled={busy} onSelect={() => { setDays(d); clear(); }}>
              <span className="block text-center">{d} days</span>
            </Choice>
          ))}
        </div>
      </fieldset>

      <Button onClick={write} disabled={busy} className="w-full sm:w-auto sm:self-start">
        {busy ? "Writing the summary..." : result ? "Write it again" : "Write the summary"}
      </Button>

      {busy && (
        <div className="flex min-w-0 flex-col gap-2" role="status" aria-live="polite">
          <p className="text-sm text-muted-foreground">
            Counting the entries, then writing and checking the summary. This can take up to 30 seconds.
          </p>
          <CardSkeleton lines={4} />
          <CardSkeleton lines={3} />
        </div>
      )}

      {status === "error" && error && <ErrorState message={error} onRetry={write} />}

      {status === "done" && result && (
        <div className="flex min-w-0 flex-col gap-4" aria-live="polite">
          {result.safetyNotes.map((n, i) => (
            <SafetyMessage key={`${i}-${n.eventIds.join("-")}`} message={n.text} />
          ))}

          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <h3 className="min-w-0 break-words text-lg font-bold">{result.title}</h3>
            <Button variant="outline" size="sm" onClick={copy} className="shrink-0">
              {copied === "yes" ? <Check className="size-4" aria-hidden /> : <ClipboardCopy className="size-4" aria-hidden />}
              {copied === "yes" ? "Copied" : "Copy"}
            </Button>
          </div>
          {copied === "failed" && (
            <p role="alert" className="text-sm text-red-900">
              Could not copy on this device. Press and hold the text to select it instead.
            </p>
          )}

          {result.sections.map((s) => (
            <div key={s.heading} className="flex min-w-0 flex-col gap-1">
              <h4 className="font-semibold">{s.heading}</h4>
              <p className="whitespace-pre-line break-words">{s.text}</p>
              <SectionEntries ids={s.eventIds} byId={byId} loading={events.loading} />
            </div>
          ))}

          {result.questionsToAsk.length > 0 && (
            <div className="flex min-w-0 flex-col gap-1">
              <h4 className="font-semibold">Questions to ask</h4>
              <ul className="flex min-w-0 list-disc flex-col gap-1 pl-5">
                {result.questionsToAsk.map((q) => (
                  <li key={q} className="break-words">
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex min-w-0 flex-col gap-1 rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground">
            <p className="font-medium">{result.disclaimer}</p>
            <p>{GUARDRAIL_LINE}</p>
            <p>
              {result.source === "model"
                ? "The numbers were counted by code from the logs. AI wrote the wording, and code checked it before showing it."
                : "The numbers were counted by code from the logs, and the wording comes from fixed templates."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
