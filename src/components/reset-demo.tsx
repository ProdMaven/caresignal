"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { postJson } from "@/lib/api";
import type { ResetResponse } from "@/lib/types";

export function ResetDemo({ onReset }: { onReset: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  async function reset() {
    setBusy(true);
    setError(null);
    try {
      const res = await postJson<ResetResponse>("/api/reset");
      setDone(res.eventCount);
      setOpen(false);
      onReset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 pt-2">
      <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) setError(null); }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <RotateCcw className="size-4" aria-hidden />
            Reset demo data
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset demo data?</DialogTitle>
            <DialogDescription>
              This removes every note added during the demo and restores the original sample logs. All data here is
              synthetic.
            </DialogDescription>
          </DialogHeader>
          {error && <ErrorState message={error} />}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={busy}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={reset} disabled={busy}>
              {busy ? "Resetting..." : "Reset demo data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {done !== null && (
        <p role="status" className="text-sm text-muted-foreground">
          Demo data restored ({done} sample entries).
        </p>
      )}
    </div>
  );
}
