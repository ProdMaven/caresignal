"use client";

// One optional question after a note (docs/AI_FEATURES.md, Feature 3). Answer by voice or text, or skip.
import { useCallback, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSpeech } from "@/hooks/useSpeech";

export function FollowUpQuestion({
  question,
  busy,
  onAnswer,
  onSkip,
}: {
  question: string;
  busy: boolean;
  onAnswer: (answer: string, usedVoice: boolean) => void;
  onSkip: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [usedVoice, setUsedVoice] = useState(false);
  const onFinal = useCallback((phrase: string) => {
    if (!phrase) return;
    setUsedVoice(true);
    setAnswer((a) => (a.trim() ? `${a.trim()} ${phrase}` : phrase));
  }, []);
  const speech = useSpeech(onFinal);

  return (
    <form
      className="flex min-w-0 flex-col gap-3 rounded-xl border border-primary/30 bg-secondary/40 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!answer.trim() || busy) return;
        if (speech.listening) speech.stop();
        onAnswer(answer.trim(), usedVoice);
      }}
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">One quick question, if you know</span>
        <p className="text-base font-semibold">{question}</p>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <Input
          value={speech.listening && speech.interim ? `${answer} ${speech.interim}`.trim() : answer}
          onChange={(e) => setAnswer(e.target.value)}
          readOnly={speech.listening}
          placeholder="Your answer"
          aria-label="Your answer"
          maxLength={300}
          className="min-w-0 flex-1"
        />
        {speech.supported && (
          <Button type="button" variant="outline" size="sm" onClick={speech.toggle} disabled={busy} aria-label={speech.listening ? "Stop listening" : "Answer by voice"}>
            {speech.listening ? <MicOff className="size-4" aria-hidden /> : <Mic className="size-4" aria-hidden />}
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={!answer.trim() || busy}>Add to the entry</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onSkip} disabled={busy}>Skip</Button>
      </div>
      <p className="text-xs text-muted-foreground">This is only to fill in the log. It is not a suggestion of what is behind it.</p>
    </form>
  );
}
