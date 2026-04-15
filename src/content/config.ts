import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";

const post = defineCollection({
  loader: glob({base:"./src/content/post", pattern:"**/*.{md,mdx}"})
});

export const collections = {};