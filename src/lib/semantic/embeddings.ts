// Local text embeddings for semantic matching (FEATURE_SEMANTIC_MATCH). Server only.
// The model runs inside this Node process. No note text is sent to any outside service for embedding.
// The library is imported only when the feature is used, so nothing is loaded while the flag is off.
export const EMBEDDING_MODEL = "Xenova/multilingual-e5-small"; // ONNX export of intfloat/multilingual-e5-small, 8-bit quantized
export const EMBEDDING_DIMS = 384;

type Extractor = (texts: string[], options: { pooling: "mean"; normalize: boolean }) => Promise<{ tolist(): number[][] }>;

const g = globalThis as unknown as { __unspokenEmbedder?: Promise<Extractor> | null };

async function load(): Promise<Extractor> {
  const lib = await import("@huggingface/transformers");
  // EMBEDDING_MODEL_DIR points at a folder that already holds the model files (used in tests and offline).
  // Without it the files are downloaded once from the model hub and cached on disk. Only weights travel; no text does.
  const dir = process.env.EMBEDDING_MODEL_DIR;
  if (dir) {
    lib.env.localModelPath = dir;
    lib.env.allowRemoteModels = false;
  }
  const extractor = await lib.pipeline("feature-extraction", EMBEDDING_MODEL, { dtype: "q8" });
  return extractor as unknown as Extractor;
}

export function embedderReady(): Promise<Extractor> {
  if (!g.__unspokenEmbedder) {
    g.__unspokenEmbedder = load().catch((err) => {
      g.__unspokenEmbedder = null; // let a later call try again
      throw err;
    });
  }
  return g.__unspokenEmbedder;
}

// E5 models expect a task prefix. "query: " on both sides is the documented choice for symmetric similarity.
const PREFIX = "query: ";
const MAX_CHARS = 1200;

// Unit-length vectors, so a dot product is the cosine similarity.
export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const extractor = await embedderReady();
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 16) {
    const batch = texts.slice(i, i + 16).map((t) => PREFIX + t.replace(/\s+/g, " ").trim().slice(0, MAX_CHARS));
    const res = await extractor(batch, { pooling: "mean", normalize: true });
    out.push(...res.tolist());
  }
  return out;
}

export function cosine(a: number[], b: number[]): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

// Shorter numbers for saved state. Four decimals keep cosine results the same to three decimals.
export function roundVector(v: number[]): number[] {
  return v.map((x) => Math.round(x * 1e4) / 1e4);
}

// Clauses of a note. A whole note shares too much wording with every other note ("he had a meltdown"),
// so matching works on the short pieces that carry the detail.
export function clauses(text: string): string[] {
  return text
    .split(/[.!?;।]+|,|\band\b|\bbut\b|\bthen\b|\bwhen\b|\by\b|\bpero\b|\bcuando\b|\baur\b|और|लेकिन|，|。/i)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 2 || /[ऀ-ॿ一-鿿]{3,}/.test(s))
    .slice(0, 12);
}
