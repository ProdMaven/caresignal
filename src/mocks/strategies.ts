// Mock for GET /api/strategies. Numbers follow docs/SCORING.md seed targets.
import type { Mode, StrategiesResponse, StrategyCard } from "../lib/types";
import { STRATEGIES, STRATEGY_DISCLAIMER } from "./data";
import { feedbackFor } from "./store";

export function mockStrategies(mode: Mode, patternKey: string | null, voterId: string | null = null): StrategiesResponse {
  const strategies: StrategyCard[] = STRATEGIES
    // Safety filter: only safety-approved strategies are ever returned.
    .filter((s) => s.safetyApproved && s.mode === mode && (!patternKey || s.patternKey === patternKey))
    .sort((a, b) => b.score - a.score)
    .map((s) => {
      const { mode: strategyMode, safetyApproved, ...card } = s;
      void strategyMode; void safetyApproved;
      return { ...card, feedback: feedbackFor(card.id, voterId) };
    });
  return { strategies, disclaimer: STRATEGY_DISCLAIMER };
}
