"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { CircleCheck, Send } from "lucide-react";
import { ConfirmCard } from "@/components/confirm-card";
import { IntakeForm } from "@/components/intake-form";
import { LanguagePicker } from "@/components/language-picker";
import { MatchAfterSave } from "@/components/match-after-save";
import { MicButton } from "@/components/mic-button";
import { PersonPicker, usePersonContext, type PersonContext } from "@/components/person-picker";
import { ResetDemo } from "@/components/reset-demo";
import { SafetyMessage } from "@/components/safety-message";
import { CardSkeleton, ErrorState } from "@/components/states";
import { TapLogger } from "@/components/tap-logger";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { label, MODES } from "@/config/modes";
import { useCaregiver } from "@/hooks/useAppState";
import { SPEECH_NOT_SUPPORTED, useSpeech } from "@/hooks/useSpeech";
import { postJson } from "@/lib/api";
import { formatTime, localIso } from "@/lib/time";
import type { LogRecord, ParseLogRequest, ParseLogResponse } from "@/lib/types";

export default function HomePage() {
  const ctx = usePersonContext();
  // Remount on mode change so a half-finished note never crosses modes.
  return <LogScreen key={ctx.mode} ctx={ctx} />;
}

function LogScreen({ ctx }: { ctx: PersonContext }) {
  const { mode, person, people } = ctx;
  const config = MODES[mode];
  const [loggedBy, setLoggedBy] = useCaregiver(mode);

  const [text, setText] = useState("");
  const [usedVoice, setUsedVoice] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ response: ParseLogResponse; source: LogRecord["source"]; id: number } | null>(null);
  const [saved, setSaved] = useState<LogRecord | null>(null);

  const onFinal = useCallback((phrase: string) => {
    if (!phrase) return;
    setUsedVoice(true);
    setText((t) => (t.trim() ? `${t.trim()} ${phrase}` : phrase));
  }, []);
  const speech = useSpeech(onFinal);

  async function submit(note: string = text) {
    const transcript = note.trim();
    if (!transcript || parsing) return;
    if (speech.listening) speech.stop();
    setParsing(true);
    setError(null);
    setResult(null);
    setSaved(null);
    const body: ParseLogRequest = { mode, transcript, loggedBy, now: localIso() };
    try {
      const response = await postJson<ParseLogResponse>("/api/log", body);
      setResult({ response, source: usedVoice ? "voice" : "text", id: Date.now() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that note. Please try again.");
    } finally {
      setParsing(false);
    }
  }

  function clearAll() {
    setText("");
    setUsedVoice(false);
    setResult(null);
    setError(null);
  }

  const savedPerson = saved ? people?.find((p) => p.id === saved.personId) : null;

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">What happened?</h1>
        <p className="text-muted-foreground">{config.logPrompt} CareSignal turns it into a log entry you can check.</p>
      </div>

      <PersonPicker ctx={ctx} />
      <IntakeForm
        mode={mode}
        onCreated={(created) => {
          ctx.setPerson(created.id);
          ctx.reload();
        }}
      />

      <label className="flex flex-col gap-1.5 text-sm font-semibold text-muted-foreground">
        Who is logging?
        <select
          value={loggedBy}
          onChange={(e) => setLoggedBy(e.target.value)}
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
        className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1">
            <MicButton listening={speech.listening} onClick={speech.toggle} disabled={parsing} />
            <span className="text-xs font-medium text-muted-foreground">{speech.listening ? "Listening" : "Tap to speak"}</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Textarea
              value={speech.listening && speech.interim ? `${text} ${speech.interim}`.trim() : text}
              onChange={(e) => {
                setText(e.target.value);
                if (!e.target.value) setUsedVoice(false);
              }}
              readOnly={speech.listening}
              placeholder={config.logPlaceholder}
              aria-label="Your note"
              maxLength={2000}
              rows={4}
            />
          </div>
        </div>
        <LanguagePicker disabled={speech.listening || parsing} />
        <p className="text-sm text-muted-foreground">
          Speak or type in your own language. The log entry is filled in for you in English so everyone caring for{" "}
          {person?.displayName ?? "them"} can read it.
        </p>
        {speech.error ? (
          <p role="status" className="text-sm text-amber-900">{speech.error}</p>
        ) : !speech.supported ? (
          <p className="text-sm text-muted-foreground">{SPEECH_NOT_SUPPORTED}</p>
        ) : null}
        <Button type="submit" size="lg" disabled={!text.trim() || parsing}>
          <Send className="size-5" aria-hidden />
          {parsing ? "Reading your note..." : "Turn into a log entry"}
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Try an example:</span>
          {config.logExamples.map((ex) => (
            <button
              key={ex.label}
              type="button"
              disabled={parsing}
              onClick={() => {
                setText(ex.text);
                setUsedVoice(false);
              }}
              className="rounded-full border bg-muted px-3 py-1.5 text-sm font-medium hover:bg-secondary"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </form>

      {/* Result area. A safety or scope message always renders before anything else. */}
      <div aria-live="polite" className="flex flex-col gap-4">
        {parsing && <CardSkeleton lines={5} />}
        {error && <ErrorState message={error} onRetry={() => void submit()} />}
        {result?.response.message && <SafetyMessage message={result.response.message} kind={result.response.kind} />}
        {result?.response.draft && result.response.kind !== "caregiver_distress" && people && (
          <ConfirmCard
            key={result.id}
            draft={result.response.draft}
            mode={mode}
            people={people}
            fallbackPerson={person}
            unmatchedPerson={result.response.unmatchedPerson}
            source={result.source}
            onDiscard={clearAll}
            onSaved={(record) => {
              setSaved(record);
              clearAll();
            }}
          />
        )}
        {result && !result.response.draft && result.response.kind !== "caregiver_distress" && (
          <p className="text-sm text-muted-foreground">Nothing was added to the log from this note.</p>
        )}
        {saved && saved.redFlags.length > 0 && (
          <SafetyMessage message="Please contact your doctor or care team about this before trying anything else." />
        )}
        {saved && (
          <div role="status" className="flex flex-col gap-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4 text-emerald-950">
            <p className="flex items-center gap-2 text-lg font-semibold">
              <CircleCheck className="size-6" aria-hidden />
              Saved to {savedPerson ? `${savedPerson.displayName}'s` : "the"} log
            </p>
            <p className="text-sm">
              {label(saved.eventType, saved.mode)} at {formatTime(saved.occurredAt)}. Patterns update with every entry.
            </p>
            <Button asChild variant="outline" className="self-start">
              <Link href="/person">See timeline and patterns</Link>
            </Button>
          </div>
        )}
        {saved && <MatchAfterSave key={saved.id} saved={saved} person={savedPerson ?? null} />}
      </div>

      <TapLogger mode={mode} person={person} loggedBy={loggedBy} onSaved={(record) => { setSaved(record); setResult(null); }} />

      <ResetDemo
        onReset={() => {
          clearAll();
          setSaved(null);
          ctx.reload();
        }}
      />
    </>
  );
}
