"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowRight, Send } from "lucide-react";
import { MicButton } from "@/components/mic-button";
import { strategiesHref } from "@/components/pattern-card";
import { PersonPicker, usePersonContext, type PersonContext } from "@/components/person-picker";
import { SafetyMessage } from "@/components/safety-message";
import { CardSkeleton, ErrorState, GuardrailBanner } from "@/components/states";
import { StrategyCardView } from "@/components/strategy-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { caregiverName, label, MODES } from "@/config/modes";
import { useApi } from "@/hooks/useApi";
import { SPEECH_NOT_SUPPORTED, useSpeech } from "@/hooks/useSpeech";
import { postJson } from "@/lib/api";
import { formatDay, formatTime, wallParts } from "@/lib/time";
import type { AskRequest, AskResponse, EventsResponse, LogRecord, StrategiesResponse } from "@/lib/types";

export default function AskPage() {
  const ctx = usePersonContext();
  return <AskScreen key={`${ctx.mode}:${ctx.person?.id ?? ""}`} ctx={ctx} />;
}

function LinkedEntries({ ids, events }: { ids: string[]; events: LogRecord[] | null }) {
  if (ids.length === 0) return null;
  const linked = events?.filter((e) => ids.includes(e.id)) ?? [];
  return (
    <details className="mt-1">
      <summary className="cursor-pointer text-sm font-medium text-primary">
        {ids.length} linked {ids.length === 1 ? "entry" : "entries"}
      </summary>
      <ul className="mt-1 flex flex-col gap-1 border-l-2 pl-3 text-sm text-muted-foreground">
        {linked.length === 0 && <li>Entries are loading or no longer in the last 21 days.</li>}
        {linked.map((e) => (
          <li key={e.id}>
            {formatDay(wallParts(e.occurredAt)?.date ?? e.occurredAt.slice(0, 10))}, {formatTime(e.occurredAt)}:{" "}
            {label(e.eventType, e.mode).toLowerCase()}, logged by {caregiverName(e.loggedBy)}
          </li>
        ))}
      </ul>
    </details>
  );
}

function AskScreen({ ctx }: { ctx: PersonContext }) {
  const { mode, person } = ctx;
  const config = MODES[mode];
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<AskResponse | null>(null);

  const onFinal = useCallback((phrase: string) => {
    if (phrase) setQuestion((q) => (q.trim() ? `${q.trim()} ${phrase}` : phrase));
  }, []);
  const speech = useSpeech(onFinal);

  const events = useApi<EventsResponse>(person && answer ? `/api/people/${person.id}/events?days=21` : null);
  const patternKey = answer?.relatedPatternKeys[0] ?? null;
  const strategies = useApi<StrategiesResponse>(
    patternKey ? `/api/strategies?mode=${mode}&patternKey=${encodeURIComponent(patternKey)}` : null,
  );

  async function ask(text: string = question) {
    const q = text.trim();
    if (!q || !person || asking) return;
    if (speech.listening) speech.stop();
    setAsking(true);
    setError(null);
    setAnswer(null);
    const body: AskRequest = { mode, personId: person.id, question: q };
    try {
      setAnswer(await postJson<AskResponse>("/api/ask", body));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not answer that. Please try again.");
    } finally {
      setAsking(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Ask about the logs</h1>
        <p className="text-muted-foreground">
          Answers come only from {person ? `${person.displayName}'s` : "your"} own log entries, with the counts shown.
        </p>
      </div>
      <GuardrailBanner />
      <PersonPicker ctx={ctx} label="Ask about" />

      <form
        className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
      >
        <div className="flex items-start gap-3">
          <MicButton size="sm" listening={speech.listening} onClick={speech.toggle} disabled={asking} />
          <Textarea
            value={speech.listening && speech.interim ? `${question} ${speech.interim}`.trim() : question}
            onChange={(e) => setQuestion(e.target.value)}
            readOnly={speech.listening}
            placeholder={config.askPlaceholder}
            aria-label="Your question"
            maxLength={1000}
            rows={3}
            className="min-h-20"
          />
        </div>
        {speech.error ? (
          <p role="status" className="text-sm text-amber-900">{speech.error}</p>
        ) : !speech.supported ? (
          <p className="text-sm text-muted-foreground">{SPEECH_NOT_SUPPORTED}</p>
        ) : null}
        <Button type="submit" size="lg" disabled={!question.trim() || !person || asking}>
          <Send className="size-5" aria-hidden />
          {asking ? "Looking through the logs..." : "Ask"}
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Try:</span>
          {config.askExamples.map((ex) => (
            <button
              key={ex}
              type="button"
              disabled={asking}
              onClick={() => setQuestion(ex)}
              className="rounded-full border bg-muted px-3 py-1.5 text-left text-sm font-medium hover:bg-secondary"
            >
              {ex}
            </button>
          ))}
        </div>
      </form>

      <div aria-live="polite" className="flex flex-col gap-4">
        {asking && <CardSkeleton lines={4} />}
        {error && <ErrorState message={error} onRetry={() => void ask()} />}

        {/* Red-flag banner always comes first. */}
        {answer?.redFlag && answer.redFlagMessage && <SafetyMessage message={answer.redFlagMessage} />}

        {answer && (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{answer.redFlag ? "From the logs" : "What the logs show"}</CardTitle>
                {!answer.dataSufficient && <Badge variant="warning">Not enough entries yet</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">{answer.answer}</p>
              {answer.evidence.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Evidence from the log</p>
                  <ul className="mt-1 flex flex-col gap-2">
                    {answer.evidence.map((ev, i) => (
                      <li key={i} className="rounded-lg bg-muted px-3 py-2">
                        <p>{ev.text}</p>
                        <LinkedEntries ids={ev.eventIds} events={events.data?.events ?? null} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {answer && patternKey && (
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">What worked for other families</h2>
            {strategies.loading ? (
              <CardSkeleton lines={4} />
            ) : strategies.error ? (
              <ErrorState message={strategies.error} onRetry={strategies.reload} />
            ) : (
              strategies.data?.strategies.slice(0, 2).map((s, i) => <StrategyCardView key={s.id} strategy={s} rank={i + 1} />)
            )}
            <Button asChild variant="outline" className="self-start">
              <Link href={strategiesHref(patternKey)}>
                See all ranked ideas
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </section>
        )}
      </div>
    </>
  );
}
