// Seeds the SQLite demo database. Idempotent: wipes every table, then re-inserts.
// Run with `npm run seed` (also runs on `npm start`). Owner: Lane 3.
//
// The featured people, their 21 days of events and the strategy scores come from
// src/mocks/data.ts, so the database and the mocks show the same numbers.
// Not seeded yet (Lane 3, T-L3-3): StrategyTrial rows for the 50 background families.
// StrategyScore rows are written directly from the docs/SCORING.md seed targets.
import { PrismaClient } from "@prisma/client";
import { pathToFileURL } from "node:url";
import { buildSeedEvents, PEOPLE, STRATEGIES } from "../src/mocks/data";
import { computePatterns } from "../src/mocks/patterns";
import { nowIso } from "../src/lib/time";

process.env.DATABASE_URL ??= "file:./dev.db";

export interface SeedResult {
  ok: boolean;
  eventCount: number;
  people: number;
  patterns: number;
  strategies: number;
}

// Exported so POST /api/reset can call it with the app's shared client.
export async function seed(client?: PrismaClient): Promise<SeedResult> {
  const prisma = client ?? new PrismaClient();
  try {
    const events = buildSeedEvents();
    const patterns = PEOPLE.flatMap((p) => computePatterns(p.id, events));
    const computedAt = nowIso();

    await prisma.$transaction([
      prisma.strategyScore.deleteMany(),
      prisma.strategyTrial.deleteMany(),
      prisma.strategy.deleteMany(),
      prisma.pattern.deleteMany(),
      prisma.event.deleteMany(),
      prisma.person.deleteMany(),

      prisma.person.createMany({
        data: PEOPLE.map((p) => ({ ...p, aliases: JSON.stringify(p.aliases), caregivers: JSON.stringify(p.caregivers ?? []) })),
      }),
      prisma.event.createMany({
        data: events.map((e) => ({
          ...e,
          behaviors: JSON.stringify(e.behaviors),
          contextBefore: JSON.stringify(e.contextBefore),
          environment: JSON.stringify(e.environment),
          responseTried: JSON.stringify(e.responseTried),
          responses: JSON.stringify(e.responses ?? []),
          confidence: JSON.stringify(e.confidence),
          needsReview: JSON.stringify(e.needsReview),
          redFlags: JSON.stringify(e.redFlags),
        })),
      }),
      prisma.pattern.createMany({
        data: patterns.map((p) => ({
          id: p.id,
          personId: p.personId,
          mode: PEOPLE.find((person) => person.id === p.personId)?.mode ?? "dementia",
          eventType: p.eventType,
          timeBand: p.timeBand,
          contextTag: p.contextTag,
          matchCount: p.matchCount,
          totalCount: p.totalCount,
          windowDays: p.windowDays,
          confidence: p.confidence,
          crossShift: p.crossShift,
          evidenceEventIds: JSON.stringify(p.evidenceEventIds),
          summary: p.summary,
        })),
      }),
      prisma.strategy.createMany({
        data: STRATEGIES.map((s) => ({
          id: s.id,
          mode: s.mode,
          name: s.name,
          description: s.description,
          patternKey: s.patternKey,
          researchBacked: s.researchBacked,
          safetyApproved: s.safetyApproved,
        })),
      }),
      prisma.strategyScore.createMany({
        data: STRATEGIES.map((s) => ({
          strategyId: s.id,
          patternKey: s.patternKey,
          families: s.families,
          pctImproved: s.pctImproved,
          avgDropPct: s.avgDropPct,
          durabilityPct: s.durabilityPct,
          score: s.score,
          tier: s.tier,
          notRecommended: s.tier === "not_recommended",
          computedAt,
        })),
      }),
    ]);

    return {
      ok: true,
      eventCount: events.length,
      people: PEOPLE.length,
      patterns: patterns.length,
      strategies: STRATEGIES.length,
    };
  } finally {
    if (!client) await prisma.$disconnect();
  }
}

// Run directly: `tsx scripts/seed.ts`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seed()
    .then((r) => {
      console.log(
        `[seed] ok: ${r.people} people, ${r.eventCount} events, ${r.patterns} patterns, ${r.strategies} strategies`,
      );
    })
    .catch((err) => {
      console.error("[seed] failed:", err);
      process.exit(1);
    });
}
