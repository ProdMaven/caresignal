"use client";

// History: the caregiver's own account of the journey so far, as dated milestones.
// HistoryEditor records a spoken or typed story and turns it into milestones the caregiver can check and edit.
// HistoryList shows saved milestones.
import { useCallback, useState } from "react";
import { ListPlus, Sparkles, X } from "lucide-react";
import { LanguagePicker } from "@/components/language-picker";
import { MicButton } from "@/components/mic-button";
import { SafetyMessage } from "@/components/safety-message";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SPEECH_NOT_SUPPORTED, useSpeech } from "@/hooks/useSpeech";
import { postJson } from "@/lib/api";
import { localIso } from "@/lib/time";
import type { FormatHistoryRequest, FormatHistoryResponse, Milestone, MilestoneCategory, MilestoneInput, Mode } from "@/lib/types";

export const CATEGORY_LABEL: Record<MilestoneCategory, string> = {
  diagnosis: "First signs or diagnosis",
  change: "A change we noticed",
  support: "Support started or changed",
  health: "Health event",
  setting: "Home, school or care setting",
  other: "Other",
};
const CATEGORIES = Object.keys(CATEGORY_LABEL) as MilestoneCategory[];

// Oldest first. A milestone with no year stays where it was said: next to the dated milestone before it,
// or first when nothing dated came before it. Same rule as the server (src/lib/history.ts).
function sorted<T extends MilestoneInput>(list: T[]): T[] {
  let carried = -Infinity;
  return list
    .map((m, i) => {
      if (m.year !== null) carried = m.year + (m.month ?? 0) / 100;
      return { m, i, key: m.year !== null ? m.year + (m.month ?? 0) / 100 : carried };
    })
    .sort((x, y) => x.key - y.key || x.i - y.i)
    .map(({ m }) => m);
}

export function HistoryList({ history }: { history: Milestone[] | undefined }) {
  if (!history || history.length === 0) return null;
  return (
    <ol className="flex flex-col gap-2 border-l-2 border-primary/30 pl-3">
      {history.map((m) => (
        <li key={m.id} className="flex flex-col">
          <span className="text-xs font-semibold text-muted-foreground">
            {m.when || "Date not given"} · {CATEGORY_LABEL[m.category]}
          </span>
          <span className="text-sm">{m.text}</span>
        </li>
      ))}
    </ol>
  );
}

export function HistoryEditor({
  mode, value, onChange, personName,
}: {
  mode: Mode;
  value: MilestoneInput[];
  onChange: (next: MilestoneInput[]) => void;
  personName: string;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<FormatHistoryResponse | null>(null);

  const onFinal = useCallback((phrase: string) => {
    if (phrase) setText((t) => (t.trim() ? `${t.trim()} ${phrase}` : phrase));
  }, []);
  const speech = useSpeech(onFinal);

  async function format() {
    const story = text.trim();
    if (!story || busy) return;
    if (speech.listening) speech.stop();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const body: FormatHistoryRequest = { mode, text: story, now: localIso() };
      const res = await postJson<FormatHistoryResponse>("/api/history/format", body);
      if (res.kind === "milestones") {
        onChange(sorted([...value, ...res.milestones]));
        setText("");
      } else {
        setNotice(res);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const patch = (i: number, change: Partial<MilestoneInput>) => onChange(value.map((m, j) => (j === i ? { ...m, ...change } : m)));
  const example = personName.trim() ? `${personName.trim()} was diagnosed` : "They were diagnosed";

  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="mb-1 text-sm font-semibold text-muted-foreground">
        Their history so far <span className="font-normal">(you can skip this and add it later)</span>
      </legend>
      <p className="text-xs text-muted-foreground">
        Tell the story since the first signs or the diagnosis, in your own words: what changed and when, what support
        started, any big health events. It is turned into a list of milestones you can check and change. Please leave
        out full names of people and places.
      </p>
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1">
          <MicButton listening={speech.listening} onClick={speech.toggle} disabled={busy} size="sm" />
          <span className="text-xs font-medium text-muted-foreground">{speech.listening ? "Listening" : "Speak"}</span>
        </div>
        <Textarea
          value={speech.listening && speech.interim ? `${text} ${speech.interim}`.trim() : text}
          onChange={(e) => setText(e.target.value)}
          readOnly={speech.listening}
          placeholder={`For example: ${example} about four years ago. Two years ago...`}
          aria-label="Their history, in your own words"
          maxLength={4000}
          rows={4}
        />
      </div>
      <LanguagePicker disabled={busy} />
      {speech.error ? (
        <p role="status" className="text-sm text-amber-900">{speech.error}</p>
      ) : !speech.supported ? (
        <p className="text-sm text-muted-foreground">{SPEECH_NOT_SUPPORTED}</p>
      ) : null}
      <Button type="button" variant="outline" onClick={() => void format()} disabled={busy || !text.trim()} className="self-start">
        <Sparkles className="size-4" aria-hidden />
        {busy ? "Reading the story..." : "Turn into milestones"}
      </Button>
      {error && <ErrorState message={error} onRetry={() => void format()} />}
      {notice?.message && <SafetyMessage message={notice.message} kind={notice.kind === "caregiver_distress" ? "caregiver_distress" : "out_of_scope"} />}

      {value.length > 0 && (
        <ol className="flex flex-col gap-2" aria-label="Milestones">
          {value.map((m, i) => (
            <li key={m.id ?? `new-${i}`} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
              <div className="flex min-w-0 items-center gap-2">
                <Input
                  value={m.when}
                  onChange={(e) => patch(i, { when: e.target.value })}
                  placeholder="When"
                  aria-label={`Milestone ${i + 1} date`}
                  maxLength={60}
                  className="h-10 w-28 shrink-0 text-sm"
                />
                <select
                  value={m.category}
                  onChange={(e) => patch(i, { category: e.target.value as MilestoneCategory })}
                  aria-label={`Milestone ${i + 1} kind`}
                  className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                  aria-label={`Remove milestone ${i + 1}`}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
              <Textarea
                value={m.text}
                onChange={(e) => patch(i, { text: e.target.value })}
                aria-label={`Milestone ${i + 1} description`}
                maxLength={300}
                rows={2}
                className="text-sm"
              />
            </li>
          ))}
        </ol>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => onChange([...value, { when: "", year: null, month: null, category: "change", text: "" }])}
      >
        <ListPlus className="size-4" aria-hidden />
        Add a milestone by hand
      </Button>
    </fieldset>
  );
}
