// Feature flags for the optional AI features in docs/AI_FEATURES.md. Server only. Default off.
// Turn one on by setting its variable to "true" on that server (staging first, live only after its evals pass).
import type { FeaturesResponse } from "@/lib/types";

const on = (name: string) => (process.env[name] ?? "").toLowerCase() === "true";

export const features = {
  multilingualSafety: () => on("FEATURE_MULTILINGUAL_SAFETY"),
  summary: () => on("FEATURE_SUMMARY"),
  followUp: () => on("FEATURE_FOLLOWUP"),
  askRouter: () => on("FEATURE_ASK_ROUTER"),
};

export function featureFlags(): FeaturesResponse {
  return {
    multilingualSafety: features.multilingualSafety(),
    summary: features.summary(),
    followUp: features.followUp(),
    askRouter: features.askRouter(),
  };
}
