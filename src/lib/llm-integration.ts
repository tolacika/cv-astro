import fs from "node:fs";
import path from "node:path";
import type { AstroIntegration } from "astro";


export function llmContextIntegration(): AstroIntegration {
  return {
    name: "llm-context-integration",

    hooks: {
      "astro:build:done": async ({ dir }) => {
        const config = {
          "llm.html": [
            "llm.txt",
            "context.md",
            "content.md",
            "context.txt",
            "content.txt",
            "ai-context.txt"
          ],
          "llm-app.html": [
            "llm-app.txt"
          ],
          "llm-res.html": [
            "llm-res.txt"
          ]
        }

        for (const [source, dest] of Object.entries(config)) {
          const htmlPath = path.join(dir.pathname, source);
          const prompt = await fs.promises.readFile(htmlPath, "utf-8");

          for (const file of dest) {
            await fs.promises.writeFile(
              path.join(dir.pathname, file),
              prompt,
              "utf-8"
            );
          }
        }
      },
    },
  };
}