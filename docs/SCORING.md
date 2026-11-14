# Winning Pattern scoring

Computed by `scripts/seed.ts` (and `src/lib/scoring.ts`) from StrategyTrial rows. Not recomputed live in the demo.

## Per strategy and patternKey
Only trials with `loggingStable = true` count. Trials with `concurrentStrategies > 0` count as 0.5 weight.

- **improved**: eventsAfter14d < eventsBefore14d * 0.8
- **drop**: (eventsBefore14d - eventsAfter14d) / eventsBefore14d, floored at -1
- families = weighted count of trials
- pctImproved = weighted share improved
- avgDropPct = weighted mean drop
- durabilityPct = share of improved trials with sustained4w

## Components (each 0 to 100)
- Effect (30%): clamp(avgDropPct / 0.6, 0, 1) * 100
- Consistency (25%): pctImproved * 100
- Reach (20%): min(families / 30, 1) * 100
- Durability (15%): durabilityPct * 100
- Research (10%): 100 if researchBacked else 0

raw = weighted sum.

## Small-sample shrinkage
score = (families * raw + 10 * 50) / (families + 10)
(Pulls small samples toward 50 so 2 for 2 cannot beat 40 for 50.)

## Tiers
- **Not recommended**: avgDropPct < 0 with families >= 5
- **Emerging**: families < 5 ("Early signal, try with care")
- **Promising**: families 5 to 19 and score >= 50 ("Helped most families who tried it")
- **Winning pattern**: families >= 20, score >= 70, durabilityPct >= 0.6
- **Winning pattern, research-backed**: Winning pattern and researchBacked

Statistics are shown only when families >= 5 (show "Not enough families yet" otherwise).

## Display (every strategy card)
Name, tier badge, score, families, % improved, average drop, how long it held, and: "Based on family logs, not a clinical trial. Discuss with your care team."

## Safety filter
Strategy library never contains medication, restraint, seclusion, food or sleep deprivation, or anything requiring clinician supervision. `safetyApproved` must be true to display.

## Seed targets (so the demo leaderboard looks real)
Dementia, pattern "agitation|skipped_meal":
- Scheduled mid-afternoon snack: ~27 families, ~74% improved, ~42% drop, durable -> Winning pattern, research-backed
- Protected quiet hour after lunch: ~14 families -> Promising
- Hand massage before meals: ~3 families -> Emerging
- Extra afternoon group activity: negative drop -> Not recommended

Autism, pattern "meltdown|poor_sleep":
- Visual morning schedule: ~34 families, ~76% improved, ~45% drop -> Winning pattern, research-backed
- Five-minute transition warnings: ~22 families -> Winning pattern
- Weighted blanket at bedtime: ~9 families -> Promising
- Extra morning screen time: negative drop -> Not recommended
