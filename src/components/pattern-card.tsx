import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { label } from "@/config/modes";
import { TIME_BAND_LABEL } from "@/lib/time";
import type { PatternCard } from "@/lib/types";

export function strategiesHref(patternKey: string): string {
  return `/patterns?patternKey=${encodeURIComponent(patternKey)}`;
}

export function PatternCardView({ pattern }: { pattern: PatternCard }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {TIME_BAND_LABEL[pattern.timeBand]} {label(pattern.eventType).toLowerCase()}
          </Badge>
          {pattern.crossShift && (
            <Badge variant="info">
              <Users className="size-3.5" aria-hidden />
              Seen by different caregivers
            </Badge>
          )}
        </div>
        <CardTitle>{pattern.summary}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="whitespace-nowrap text-3xl font-bold tabular-nums">
            {pattern.matchCount} of {pattern.totalCount}
          </span>
          <span className="text-sm text-muted-foreground">
            entries in the last {pattern.windowDays} days ({pattern.confidence === "high" ? "strong" : "moderate"} pattern)
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Possible things to check</p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {pattern.thingsToCheck.map((t) => (
              <li key={t} className="rounded-full border bg-muted px-3 py-1 text-sm">
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            These are things to look into, not causes or a diagnosis.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="h-auto min-h-12 w-full whitespace-normal py-2 text-left">
          <Link href={strategiesHref(pattern.patternKey)}>
            See what worked for other families
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
