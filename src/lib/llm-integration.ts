import fs from "node:fs";
import path from "node:path";
import type { AstroIntegration } from "astro";


export function llmContextIntegration(): AstroIntegration {
  return {
    name: "llm-context-integration",

    hooks: {
      "astro:build:done": async ({ dir }) => {
        const htmlPath = path.join(dir.pathname, "llm.html");
        const prompt = await fs.promises.readFile(htmlPath, "utf-8");

        const files = [
          "llm.txt",
          "context.md",
          "content.md",
          "context.txt",
          "content.txt",
          "ai-context.txt",
        ];
        
        for (const file of files) {
          await fs.promises.writeFile(
            path.join(dir.pathname, file),
            prompt,
            "utf-8"
          );
        }
      },
    },
  };
}