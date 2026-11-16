// Loads the embedding model, the concept phrases and the embeddings for every entry. Called once at server start
// when FEATURE_SEMANTIC_MATCH is on, and again after a reset. Server only.
import { allEvents, touchStore } from "../../mocks/store";
import { conceptVectors } from "./concepts";
import { indexEntries, indexSize } from "./index";

export async function warmSemantic(): Promise<void> {
  const started = Date.now();
  await conceptVectors();
  const added = await indexEntries(allEvents());
  if (added > 0) touchStore();
  console.log(`[semantic] ready: ${indexSize()} entries indexed (${added} new) in ${Date.now() - started} ms.`);
}
