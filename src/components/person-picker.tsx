"use client";

import { ErrorState } from "@/components/states";
import { Skeleton } from "@/components/ui/skeleton";
import { MODES } from "@/config/modes";
import { useApi } from "@/hooks/useApi";
import { useMode, useSelectedPerson } from "@/hooks/useAppState";
import type { Mode, PeopleResponse, Person } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface PersonContext {
  mode: Mode;
  people: Person[] | null;
  person: Person | null;
  setPerson: (id: string) => void;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

// Mode, the people for that mode, and the picked person. Shared by every screen.
export function usePersonContext(): PersonContext {
  const [mode] = useMode();
  const { data, loading, error, reload } = useApi<PeopleResponse>(`/api/people?mode=${mode}`);
  const people = data?.people ?? null;
  const [person, setPerson] = useSelectedPerson(mode, people);
  return { mode, people, person, setPerson, loading, error, reload };
}

export function PersonPicker({ ctx, label = "Who is this about?" }: { ctx: PersonContext; label?: string }) {
  const config = MODES[ctx.mode];
  if (ctx.error) return <ErrorState message={ctx.error} onRetry={ctx.reload} />;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      {ctx.loading || !ctx.people ? (
        <div className="flex gap-2" aria-busy="true" aria-label="Loading people">
          <Skeleton className="h-14 w-36" />
          <Skeleton className="h-14 w-36" />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {ctx.people.map((p) => {
            const active = p.id === ctx.person?.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() => ctx.setPerson(p.id)}
                className={cn(
                  "flex min-h-14 flex-col items-start rounded-xl border px-4 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? `${config.accentSoft} ${config.accentBorder} ring-2 ${config.accentRing}` : "bg-card hover:bg-muted",
                )}
              >
                <span className="font-semibold">{p.displayName}</span>
                <span className="text-xs text-muted-foreground">{p.ageBandOrSetting}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
