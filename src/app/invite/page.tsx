"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api";
import type { InviteRequest, InviteResponse } from "@/lib/types";

export default function InvitePage() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reads the field itself, so a code typed before the page finished loading still works.
  async function submit(raw: string) {
    const entered = raw.trim();
    if (busy) return;
    if (!entered) {
      setError("Please enter your invite code.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body: InviteRequest = { code: entered };
      await postJson<InviteResponse>("/api/invite", body);
      // Full page load on purpose: the router may have cached the redirect to this screen.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check that code. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 pt-6">
      <div className="flex flex-col gap-2">
        <ShieldCheck className="size-10 text-primary" aria-hidden />
        <h1 className="text-2xl font-bold tracking-tight">Unspoken is invitation only</h1>
        <p className="text-muted-foreground">
          Families share sensitive notes here, and what works for one family helps the next. To keep that trustworthy,
          every caregiver joins through an invite from a support group, care team, or another family.
        </p>
      </div>

      <form
        className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(String(new FormData(e.currentTarget).get("code") ?? code));
        }}
      >
        <label htmlFor="invite-code" className="text-sm font-semibold text-muted-foreground">
          Your invite code
        </label>
        <Input
          id="invite-code"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="For example GROUP-1234"
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={64}
        />
        {error && <ErrorState message={error} />}
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Checking..." : "Enter Unspoken"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Buildathon judge? Your code is in the project README and on the submission form. All data in this demo is
        synthetic.
      </p>
      <p className="text-sm text-muted-foreground">Supports caregivers. Does not diagnose.</p>
    </div>
  );
}
