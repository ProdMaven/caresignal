import { StrategyFeedbackRow } from "@/components/strategy-feedback";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MIN_FAMILIES, STRATEGY_DISCLAIMER } from "@/config/modes";
import type { StrategyCard, Tier } from "@/lib/types";

const TIER: Record<Tier, { label: string; note: string; variant: "success" | "info" | "secondary" | "danger" }> = {
  winning_research: { label: "Winning pattern, research-backed", note: "Helped most families, held over time, and is supported by care research.", variant: "success" },
  winning: { label: "Winning pattern", note: "Helped most families and held over time.", variant: "success" },
  promising: { label: "Promising", note: "Helped most families who tried it.", variant: "info" },
  emerging: { label: "Emerging", note: "Early signal, try with care.", variant: "secondary" },
  not_recommended: { label: "Not recommended", note: "Families who tried this saw more distress, not less.", variant: "danger" },
};

const pct = (n: number) => `${Math.round(Math.abs(n) * 100)}%`;

function Stat({ value, caption }: { value: string; caption: string }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2">
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}

export function StrategyCardView({ strategy, rank }: { strategy: StrategyCard; rank?: number }) {
  const tier = TIER[strategy.tier];
  const families = Math.round(strategy.families);
  // Community statistics are shown only when 5 or more families contributed.
  const enough = strategy.families >= MIN_FAMILIES;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <Badge variant={tier.variant} className="whitespace-normal">{tier.label}</Badge>
            <CardTitle>
              {rank ? `${rank}. ` : ""}
              {strategy.name}
            </CardTitle>
          </div>
          {enough && (
            <div className="flex shrink-0 flex-col items-center rounded-xl border bg-card px-3 py-1.5">
              <span className="text-3xl font-bold tabular-nums leading-none">{Math.round(strategy.score)}</span>
              <span className="text-xs text-muted-foreground">score</span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{strategy.description}</p>
      </CardHeader>
      <CardContent>
        {enough ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Stat value={String(families)} caption="families tried it" />
              <Stat value={pct(strategy.pctImproved)} caption="of them saw fewer hard moments" />
              <Stat
                value={`${strategy.avgDropPct < 0 ? "+" : ""}${pct(strategy.avgDropPct)}`}
                caption={strategy.avgDropPct < 0 ? "more hard moments on average" : "average drop in hard moments"}
              />
              <Stat value={pct(strategy.durabilityPct)} caption="of those still held after 4 weeks" />
            </div>
            <p className="text-sm">{tier.note}</p>
          </>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted px-3 py-3">
            <p className="font-semibold">Not enough families yet</p>
            <p className="text-sm text-muted-foreground">
              {families} {families === 1 ? "family has" : "families have"} tried this so far. Numbers show once {MIN_FAMILIES} or
              more families have. {tier.note}
            </p>
          </div>
        )}
        <StrategyFeedbackRow key={`${strategy.id}:${strategy.feedback?.helped ?? 0}:${strategy.feedback?.notHelped ?? 0}`} strategyId={strategy.id} initial={strategy.feedback} />
        <p className="text-xs text-muted-foreground">{STRATEGY_DISCLAIMER}</p>
      </CardContent>
    </Card>
  );
}
