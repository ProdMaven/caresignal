"use client";

// Caregiver journal: dated notes about the caregiver's own experience, by voice or typing.
import { useCallback, useState } from "react";
import Link from "next/link";
import { BookHeart, CircleCheck, NotebookPen } from "lucide-react";
import { LanguagePicker } from "@/components/language-picker";
import { MicButton } from "@/components/mic-button";
import { SafetyMessage } from "@/components/safety-message";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { YouTabs } from "@/components/you-tabs";
import { MODES } from "@/config/modes";
import { useApi } from "@/hooks/useApi";
import { useCaregiver, useMode } from "@/hooks/useAppState";
import { SPEECH_NOT_SUPPORTED, useSpeech } from "@/hooks/useSpeech";
import { postJson } from "@/lib/api";
import { formatDay, formatTime, localIso } from "@/lib/time";
import type { JournalEntry, JournalListResponse, JournalRequest, JournalResponse, Mood } from "@/lib/types";
import { cn } from "@/lib/utils";

const MOODS: { value: Mood; label: string }[] = [
  { value: "okay", label: "Okay" },
  { value: "tired", label: "Tired" },
  { value: "overwhelmed", label: "Overwhelmed" },
  { value: "sad", label: "Sad" },
  { value: "worried", label: "Worried" },
  { value: "hopeful", label: "Hopeful" },
];
const MOOD_LABEL = Object.fromEntries(MOODS.map((m) => [m.value, m.label])) as Record<Mood, string>;

function groupByDay(entries: JournalEntry[]): [string, JournalEntry[]][] {
  const days = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const day = e.createdAt.slice(0, 10);
    days.set(day, [...(days.get(day) ?? []), e]);
  }
  return [...days.entries()];
}

export default function JournalPage() {
  const [mode] = useMode();
  // Remount on mode change so a half-written entry never crosses modes.
  return <Journal key={mode} />;
}

function Journal() {
  const [mode] = useMode();
  const config = MODES[mode];
  const [loggedBy, setLoggedBy] = useCaregiver(mode);
  const list = useApi<JournalListResponse>(`/api/journal?loggedBy=${encodeURIComponent(loggedBy)}`);

  const [mood, setMood] = useState<Mood | null>(null);
  const [text, setText] = useState("");
  const [usedVoice, setUsedVoice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JournalResponse | null>(null);

  const onFinal = useCallback((phrase: string) => {
    if (!phrase) return;
    setUsedVoice(true);
    setText((t) => (t.trim() ? `${t.trim()} ${phrase}` : phrase));
  }, []);
  const speech = useSpeech(onFinal);

  async function save() {
    if (busy || !text.trim()) return;
    if (speech.listening) speech.stop();
    setBusy(true);
    setError(null);
    setResult(null);
    const body: JournalRequest = {
      loggedBy, mode, text: text.trim(), mood: mood ?? undefined, source: usedVoice ? "voice" : "text", now: localIso(),
    };
    try {
      setResult(await postJson<JournalResponse>("/api/journal", body));
      setText("");
      setMood(null);
      setUsedVoice(false);
      list.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your entry. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <YouTabs />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">My journal</h1>
        <p className="text-muted-foreground">
          A place to keep your own story of caring, on days when you do not need anything except to write it down.
        </p>
      </div>

      <p className="flex items-center gap-2 rounded-lg border bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
        <BookHeart className="size-4 shrink-0" aria-hidden />
        Kept under your name with the date and time. Never added to {config.personNoun ? `your ${config.personNoun}'s` : "anyone's"} log.
      </p>

      <label className="flex flex-col gap-1.5 text-sm font-semibold text-muted-foreground">
        Whose journal?
        <select
          value={loggedBy}
          onChange={(e) => {
            setLoggedBy(e.target.value);
            setResult(null);
          }}
          className="h-12 rounded-lg border border-input bg-card px-3 text-base font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {config.caregivers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.role})
            </option>
          ))}
        </select>
      </label>

      <form
        className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1">
            <MicButton listening={speech.listening} onClick={speech.toggle} disabled={busy} size="sm" />
            <span className="text-xs font-medium text-muted-foreground">{speech.listening ? "Listening" : "Speak"}</span>
          </div>
          <Textarea
            value={speech.listening && speech.interim ? `${text} ${speech.interim}`.trim() : text}
            onChange={(e) => {
              setText(e.target.value);
              if (!e.target.value) setUsedVoice(false);
            }}
            readOnly={speech.listening}
            placeholder="How was today, for you?"
            aria-label="Journal entry"
            maxLength={4000}
            rows={5}
          />
        </div>
        <LanguagePicker disabled={busy} />
        {speech.error ? (
          <p role="status" className="text-sm text-amber-900">{speech.error}</p>
        ) : !speech.supported ? (
          <p className="text-sm text-muted-foreground">{SPEECH_NOT_SUPPORTED}</p>
        ) : null}

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold text-muted-foreground">
            Today I feel <span className="font-normal">(you can skip this)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => {
              const active = m.value === mood;
              return (
                <button
                  key={m.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setMood(active ? null : m.value)}
                  className={cn(
                    "min-h-11 rounded-full border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "border-primary bg-primary/10 ring-1 ring-primary" : "bg-card hover:bg-muted",
                  )}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <Button type="submit" size="lg" disabled={busy || !text.trim()}>
          <NotebookPen className="size-5" aria-hidden />
          {busy ? "Saving..." : "Save to my journal"}
        </Button>
      </form>

      <div aria-live="polite" className="flex flex-col gap-3">
        {error && <ErrorState message={error} onRetry={() => void save()} />}
        {result?.message && (
          <SafetyMessage message={result.message} kind={result.kind === "crisis" ? "caregiver_distress" : undefined} />
        )}
        {result?.kind === "care_team" && (
          <p className="text-sm text-muted-foreground">
            If you want this on the record for your care team, add it on the <Link href="/" className="underline">Log</Link> screen.
          </p>
        )}
        {result && (
          <p role="status" className="flex items-center gap-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-3 font-semibold text-emerald-950">
            <CircleCheck className="size-5" aria-hidden />
            Saved to your journal at {formatTime(result.entry.createdAt)}.
          </p>
        )}
      </div>

      <section aria-label="Earlier entries" className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Earlier entries</h2>
        {list.loading && <CardSkeleton lines={3} />}
        {list.error && <ErrorState message={list.error} onRetry={list.reload} />}
        {list.data && list.data.entries.length === 0 && (
          <EmptyState title="No entries yet">Your first entry will show here with its date and time.</EmptyState>
        )}
        {list.data &&
          groupByDay(list.data.entries).map(([day, entries]) => (
            <div key={day} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground">{formatDay(day)}</h3>
              {entries.map((e) => (
                <article key={e.id} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium tabular-nums">{formatTime(e.createdAt)}</span>
                    {e.mood && <Badge variant="secondary">{MOOD_LABEL[e.mood]}</Badge>}
                    {e.source === "voice" && <span>spoken</span>}
                  </div>
                  <p className="whitespace-pre-wrap">{e.text}</p>
                </article>
              ))}
            </div>
          ))}
      </section>
    </>
  );
}
