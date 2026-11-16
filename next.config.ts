import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The local embedding library ships native code, so it is loaded from node_modules at run time, not bundled.
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node", "sharp"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
