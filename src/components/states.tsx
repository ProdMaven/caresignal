import { CircleAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GUARDRAIL_LINE } from "@/config/modes";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-950">
      <div className="flex items-start gap-2">
        <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">Something went wrong</p>
          <p className="text-sm">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="self-start">
          Try again
        </Button>
      )}
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <Skeleton className="h-6 w-2/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={i === lines - 1 ? "h-4 w-1/2" : "h-4 w-full"} />
      ))}
    </div>
  );
}

// Required on every insight screen (Person, Ask, Winning Patterns).
export function GuardrailBanner() {
  return (
    <p className="flex items-center gap-2 rounded-lg border bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
      <ShieldCheck className="size-4 shrink-0" aria-hidden />
      {GUARDRAIL_LINE}
    </p>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed bg-card p-5 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
