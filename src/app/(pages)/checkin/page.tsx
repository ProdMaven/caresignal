"use client";

// Caregiver check-in: "How are you feeling?" Warm listening only, nothing is saved.
import { useCallback, useState } from "react";
import Link from "next/link";
import { HeartHandshake, Lock, Send } from "lucide-react";
import { LanguagePicker } from "@/components/language-picker";
import { MicButton } from "@/components/mic-button";
import { SafetyMessage } from "@/components/safety-message";
import { CardSkeleton, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SPEECH_NOT_SUPPORTED, useSpeech } from "@/hooks/useSpeech";
import { postJson } from "@/lib/api";
import type { CheckInRequest, CheckInResponse, Mood } from "@/lib/types";
import { cn } from "@/lib/utils";

const MOODS: { value: Mood; label: string }[] = [
  { value: "okay", label: "Okay" },
  { value: "tired", label: "Tired" },
  { value: "overwhelmed", label: "Overwhelmed" },
  { value: "sad", label: "Sad" },
  { value: "worried", label: "Worried" },
  { value: "hopeful", label: "Hopeful" },
];

export default function CheckInPage() {
  const [mood, setMood] = useState<Mood | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState<CheckInResponse | null>(null);

  const onFinal = useCallback((phrase: string) => {
    if (phrase) setText((t) => (t.trim() ? `${t.trim()} ${phrase}` : phrase));
  }, []);
  const speech = useSpeech(onFinal);

  async function submit() {
    if (busy || (!mood && !text.trim())) return;
    if (speech.listening) speech.stop();
    setBusy(true);
    setError(null);
    setReply(null);
    const body: CheckInRequest = { text: text.trim(), mood: mood ?? undefined };
    try {
      setReply(await postJson<CheckInResponse>("/api/checkin", body));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach CareSignal. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">How are you feeling?</h1>
        <p className="text-muted-foreground">
          This space is for you, not for the person you care for. Say as much or as little as you like.
        </p>
      </div>

      <p className="flex items-center gap-2 rounded-lg border bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
        <Lock className="size-4 shrink-0" aria-hidden />
        Nothing here is saved or added to anyone&apos;s log.
      </p>

      <form
        className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold text-muted-foreground">Right now I feel</legend>
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

        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1">
            <MicButton listening={speech.listening} onClick={speech.toggle} disabled={busy} size="sm" />
            <span className="text-xs font-medium text-muted-foreground">{speech.listening ? "Listening" : "Speak"}</span>
          </div>
          <Textarea
            value={speech.listening && speech.interim ? `${text} ${speech.interim}`.trim() : text}
            onChange={(e) => setText(e.target.value)}
            readOnly={speech.listening}
            placeholder="Anything on your mind. You can also just pick a feeling above."
            aria-label="How you are feeling"
            maxLength={2000}
            rows={4}
          />
        </div>
        <LanguagePicker disabled={speech.listening || busy} />
        {speech.error ? (
          <p role="status" className="text-sm text-amber-900">{speech.error}</p>
        ) : !speech.supported ? (
          <p className="text-sm text-muted-foreground">{SPEECH_NOT_SUPPORTED}</p>
        ) : null}

        <Button type="submit" size="lg" disabled={busy || (!mood && !text.trim())}>
          <Send className="size-5" aria-hidden />
          {busy ? "Listening..." : "Share"}
        </Button>
      </form>

      <div aria-live="polite" className="flex flex-col gap-4">
        {busy && <CardSkeleton lines={2} />}
        {error && <ErrorState message={error} onRetry={() => void submit()} />}
        {reply && reply.kind === "crisis" && <SafetyMessage message={reply.message} kind="caregiver_distress" />}
        {reply && reply.kind === "care_team" && <SafetyMessage message={reply.message} />}
        {reply && reply.kind === "listening" && (
          <div className="flex items-start gap-3 rounded-xl border-2 border-violet-200 bg-violet-50 p-4 text-violet-950">
            <HeartHandshake className="mt-0.5 size-6 shrink-0" aria-hidden />
            <p className="text-lg leading-relaxed">{reply.message}</p>
          </div>
        )}
        {reply && reply.kind === "care_team" && (
          <p className="text-sm text-muted-foreground">
            If you want this on the record for your care team, add it on the <Link href="/" className="underline">Log</Link> screen.
          </p>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        If you ever feel you cannot go on, call or text 988, the 988 Suicide and Crisis Lifeline. It is free and open 24
        hours a day.
      </p>
    </>
  );
}
