"use client";

// Account: settings for the caregiver using this device. There are no passwords yet, so "you" is the invite
// on this device plus the caregiver picked here.
import { useState } from "react";
import Link from "next/link";
import { BookHeart, HeartHandshake, Info, LogOut, UserRound } from "lucide-react";
import { IntakeForm } from "@/components/intake-form";
import { LanguagePicker } from "@/components/language-picker";
import { PersonPicker, usePersonContext } from "@/components/person-picker";
import { CardSkeleton, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { YouTabs } from "@/components/you-tabs";
import { useCaregiver } from "@/hooks/useAppState";
import { fetchJson } from "@/lib/api";
import type { Person } from "@/lib/types";

const AGE: Record<string, string> = { "2_5": "Age 2 to 5", "6_11": "Age 6 to 11", "12_17": "Age 12 to 17", adult: "Adult" };
const LEVEL: Record<string, string> = { mild: "Mild", medium: "Medium", severe: "Severe" };
const TALK: Record<string, string> = {
  speaks_in_sentences: "Speaks in sentences", some_words: "Uses some words or short phrases", mostly_non_speaking: "Mostly does not use speech",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function profileLine(p: Person): string {
  const parts = [p.ageBand ? AGE[p.ageBand] : p.ageBandOrSetting, p.spectrumLevel ? `Spectrum level: ${LEVEL[p.spectrumLevel]}` : null, p.communicationLevel ? TALK[p.communicationLevel] : null];
  return parts.filter(Boolean).join(" · ");
}

export default function AccountPage() {
  const ctx = usePersonContext();
  const { mode, person, people } = ctx;
  const [loggedBy, setLoggedBy, caregivers] = useCaregiver(mode, person);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const me = caregivers.find((c) => c.id === loggedBy);

  async function signOut() {
    setSigningOut(true);
    setError(null);
    try {
      await fetchJson("/api/invite", { method: "DELETE" });
      // Full page load on purpose, so the invite screen is shown by the server.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/invite");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign out. Please try again.");
      setSigningOut(false);
    }
  }

  return (
    <>
      <YouTabs />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        <p className="text-muted-foreground">Your settings on this device{me ? `, ${me.name}` : ""}.</p>
      </div>

      <Section title="You">
        <PersonPicker ctx={ctx} label="You are caring for" />
        {ctx.loading ? (
          <CardSkeleton lines={1} />
        ) : (
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-muted-foreground">
            You are logging as
            <select
              value={loggedBy}
              onChange={(e) => setLoggedBy(e.target.value)}
              className="h-12 rounded-lg border border-input bg-card px-3 text-base font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {caregivers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.role})
                </option>
              ))}
            </select>
          </label>
        )}
        <p className="text-xs text-muted-foreground">
          Your notes and journal are saved under this name. There are no passwords yet, so anyone with an invite code can
          pick a name. Please use nicknames and no personal details.
        </p>
      </Section>

      <Section title="Voice">
        <LanguagePicker />
        <p className="text-xs text-muted-foreground">
          This is the language the mic listens for. Screens stay in English, and log entries are filled in English so
          everyone caring for the same person can read them.
        </p>
      </Section>

      <Section title="People you care for">
        {people && people.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {people.map((p) => (
              <li key={p.id} className="flex items-start gap-3 rounded-lg border px-3 py-2">
                <UserRound className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0">
                  <p className="font-semibold">
                    {p.displayName} {p.isFeatured && <span className="text-xs font-normal text-muted-foreground">(demo)</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">{profileLine(p)}</p>
                  {p.caregivers && p.caregivers.length > 0 && (
                    <p className="text-sm text-muted-foreground">Cared for by {p.caregivers.map((c) => `${c.name} (${c.role})`).join(", ")}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No Care Profiles yet in this mode.</p>
        )}
        <IntakeForm
          mode={mode}
          onCreated={(created) => {
            ctx.setPerson(created.id);
            ctx.reload();
          }}
        />
      </Section>

      <Section title="For you">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/checkin">
              <HeartHandshake className="size-5" aria-hidden />
              How are you feeling?
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/journal">
              <BookHeart className="size-5" aria-hidden />
              My journal
            </Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          If you ever feel you cannot go on, call or text 988, the 988 Suicide and Crisis Lifeline. It is free and open 24 hours a day.
        </p>
      </Section>

      <Section title="This device">
        {error && <ErrorState message={error} />}
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/about">
              <Info className="size-4" aria-hidden />
              About Unspoken
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={signOut} disabled={signingOut}>
            <LogOut className="size-4" aria-hidden />
            {signingOut ? "Signing out..." : "Sign out on this device"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Signing out removes the invite from this device. Saved notes stay.</p>
      </Section>
    </>
  );
}
