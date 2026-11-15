"use client";

import { useApi } from "@/hooks/useApi";
import type { FeaturesResponse } from "@/lib/types";

const OFF: FeaturesResponse = { multilingualSafety: false, summary: false, followUp: false, askRouter: false };

// Which optional AI features this server has switched on. Everything is off until the answer arrives.
export function useFeatures(): FeaturesResponse {
  return useApi<FeaturesResponse>("/api/features").data ?? OFF;
}
