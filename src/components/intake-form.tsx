"use client";

// Intake: a caregiver adds the person they care for. Caregiver-reported, never a diagnosis.
import { useState } from "react";
import { UserRoundPlus, X } from "lucide-react";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api";
import type {
  AgeBand, CommunicationLevel, CreatePersonRequest, CreatePersonResponse, Gender, Mode, Person, SpectrumLevel,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const AGE_BANDS: { value: AgeBand; label: string }[] = [
  { value: "2_5", label: "2 to 5" },
  { value: "6_11", label: "6 to 11" },
  { value: "12_17", label: "12 to 17" },
  { value: "adult", label: "18 or older" },
];
const GENDERS: { value: Gender; label: string }[] = [
  { value: "girl_or_woman", label: "Girl or woman" },
  { value: "boy_or_man", label: "Boy or man" },
  { value: "nonbinary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];
const LEVELS: { value: SpectrumLevel; label: string; hint: string }[] = [
  { value: "mild", label: "Mild", hint: "Needs some support" },
  { value: "medium", label: "Medium", hint: "Needs support through much of the day" },
  { value: "severe", label: "Severe", hint: "Needs support with most things" },
];
const COMMUNICATION: { value: CommunicationLevel; label: string }[] = [
  { value: "speaks_in_sentences", label: "Speaks in sentences" },
  { value: "some_words", label: "Uses some words or short phrases" },
  { value: "mostly_non_speaking", label: "Mostly does not use speech" },
];

function Choice<T extends string>({
  legend, options, value, onChange, optional,
}: {
  legend: string;
  options: { value: T; label: string; hint?: string }[];
  value: T | null;
  onChange: (v: T | null) => void;
  optional?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-semibold text-muted-foreground">
        {legend} {optional && <span className="font-normal">(you can skip this)</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active && optional ? null : o.value)}
              className={cn(
                "flex min-h-11 flex-col items-start rounded-lg border px-3 py-1.5 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "border-primary bg-primary/10 ring-1 ring-primary" : "bg-card hover:bg-muted",
              )}
            >
              {o.label}
              {o.hint && <span className="text-xs font-normal text-muted-foreground">{o.hint}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function IntakeForm({ mode, onCreated }: { mode: Mode; onCreated: (person: Person) => void }) {
  const autism = mode === "autism";
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [ageBand, setAgeBand] = useState<AgeBand | null>(autism ? null : "adult");
  const [gender, setGender] = useState<Gender | null>(null);
  const [level, setLevel] = useState<SpectrumLevel | null>(null);
  const [communication, setCommunication] = useState<CommunicationLevel | null>(null);
  // Who cares for them. The first row is the person filling in the form.
  const [carers, setCarers] = useState<{ name: string; role: string }[]>([{ name: "", role: "" }]);
  const setCarer = (i: number, patch: Partial<{ name: string; role: string }>) =>
    setCarers((list) => list.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const filledCarers = carers.map((c) => ({ name: c.name.trim(), role: c.role.trim() })).filter((c) => c.name && c.role);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = Boolean(name.trim() && ageBand && communication && (!autism || level) && carers[0].name.trim() && carers[0].role.trim());

  async function save() {
    if (!ready || !ageBand || !communication || busy) return;
    setBusy(true);
    setError(null);
    const body: CreatePersonRequest = {
      mode,
      displayName: name.trim(),
      aliases: alias.split(",").map((a) => a.trim()).filter(Boolean),
      ageBand,
      gender: gender ?? undefined,
      spectrumLevel: autism ? level ?? undefined : undefined,
      communicationLevel: communication,
      caregivers: filledCarers,
    };
    try {
      const res = await postJson<CreatePersonResponse>("/api/people", body);
      setOpen(false);
      setName("");
      setAlias("");
      setGender(null);
      setCarers([{ name: "", role: "" }]);
      setLevel(null);
      setCommunication(null);
      onCreated(res.person);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the profile. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) setError(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="self-start">
          <UserRoundPlus className="size-4" aria-hidden />
          Add the person you care for
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tell us about the person you care for</DialogTitle>
          <DialogDescription>
            A few questions so patterns and ideas fit {autism ? "your child" : "them"} better. These are your own
            words, not a diagnosis. Please use a first name or nickname only.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-muted-foreground">
            First name or nickname
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="off" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-muted-foreground">
            What do you call them when you talk? <span className="font-normal">(you can skip this)</span>
            <Input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder={autism ? "For example: my son, buddy" : "For example: Mom, Grandma"}
              maxLength={80}
              autoComplete="off"
            />
          </label>
          {autism && <Choice legend="How old are they?" options={AGE_BANDS} value={ageBand} onChange={setAgeBand} />}
          <Choice legend="What is their gender?" options={GENDERS} value={gender} onChange={setGender} optional />
          {autism && (
            <Choice legend="How would you describe their spectrum level?" options={LEVELS} value={level} onChange={setLevel} />
          )}
          <Choice legend="How do they usually communicate?" options={COMMUNICATION} value={communication} onChange={setCommunication} />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold text-muted-foreground">Who cares for them?</legend>
            <p className="text-xs text-muted-foreground">
              Start with yourself, then add anyone else who will log, such as a partner, a grandparent, or a home aide.
              First names or nicknames only.
            </p>
            {carers.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={c.name}
                  onChange={(e) => setCarer(i, { name: e.target.value })}
                  placeholder={i === 0 ? "Your name" : "Their name"}
                  aria-label={i === 0 ? "Your name" : `Caregiver ${i + 1} name`}
                  maxLength={40}
                  autoComplete="off"
                />
                <Input
                  value={c.role}
                  onChange={(e) => setCarer(i, { role: e.target.value })}
                  placeholder={i === 0 ? (autism ? "You are their (father)" : "You are their (daughter)") : "They are the (home aide)"}
                  aria-label={i === 0 ? "Your relationship to them" : `Caregiver ${i + 1} relationship`}
                  maxLength={40}
                  autoComplete="off"
                />
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => setCarers((list) => list.filter((_, j) => j !== i))}
                    aria-label={`Remove caregiver ${i + 1}`}
                    className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                )}
              </div>
            ))}
            {carers.length < 6 && (
              <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setCarers((list) => [...list, { name: "", role: "" }])}>
                Add another caregiver
              </Button>
            )}
          </fieldset>
          {error && <ErrorState message={error} />}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={busy}>Cancel</Button>
          </DialogClose>
          <Button onClick={save} disabled={!ready || busy}>{busy ? "Saving..." : "Save profile"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
