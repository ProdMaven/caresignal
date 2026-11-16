// Runs once when the server starts, before requests are served.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startPersistence } = await import("@/lib/persist");
    await startPersistence();
    // Semantic matching (flag): load the local embedding model and embed the entries in the background.
    // Until it finishes, nothing is joined by similarity; everything else works as usual.
    if ((process.env.FEATURE_SEMANTIC_MATCH ?? "").toLowerCase() === "true") {
      void import("@/lib/semantic/warm").then((m) => m.warmSemantic()).catch((err) => console.error("[semantic] warm-up failed:", err instanceof Error ? err.message : err));
    }
  }
}
