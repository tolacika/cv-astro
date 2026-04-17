import { z } from "zod";
import { glob } from "astro/loaders";
import { defineCollection, reference, type CollectionEntry, type SchemaContext } from "astro:content";

const postMetaSchema = ({ image }: SchemaContext) => z.object({
  type: z.string(),
  slug: z.string(),
  title: z.string(),
  teaser: z.string(),
  image: image().optional(),
  cta: z.string().optional(),
  date: z.string(),
  tags: z.array(z.string()).optional(),
  jobs: z.array(z.string()).optional(),
  public: z.boolean(),
  wip: z.boolean().optional(),
  draft: z.boolean().optional(),
  featured: z.boolean().optional(),
});

const tagSchema = z.object({
  slug: z.string(),
  label: z.string(),
  teaser: z.string(),
  relatedTags: z.array(reference("tagCollection")),
  icon: z.string().optional(),
});


const jobBaseSchema = z.object({
  slug: z.string(),
  company: z.string(),
  datePeriod: z.string(),
  position: z.string(),
  teaser: z.string(),
  patterns: z.array(reference("tagCollection")),
  tags: z.array(reference("tagCollection")),
});

const jobWithLogoSchema = jobBaseSchema.extend({
  logo: z.string(),
  altLogo: z.string().optional(),
});

const jobWithAltLogoSchema = jobBaseSchema.extend({
  logo: z.undefined(),
  altLogo: z.string(),
});

const jobSchema = z.union([
  jobWithLogoSchema,
  jobWithAltLogoSchema,
]);

const postCollection = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: postMetaSchema,
});

const tagCollection = defineCollection({
  loader: glob({ base: './src/content/tags', pattern: '**/*.{md,mdx}' }),
  schema: tagSchema,
});

const jobCollection = defineCollection({
  loader: glob({ base: './src/content/jobs', pattern: '**/*.{md,mdx}' }),
  schema: jobSchema,
});

export type PostMeta = z.infer<typeof postMetaSchema>;
export type Tag = z.infer<typeof tagSchema>;
export type Job = z.infer<typeof jobSchema>;

const missingEntry: CollectionEntry<"tagCollection"> = {
  id: "",
  data: {
    slug: "",
    label: "Missing tag: ",
    teaser: "",
    relatedTags: [],
  } as Tag,
  collection: "tagCollection",
}

export const getTagBySlug = (
  slug: string,
  tags: CollectionEntry<"tagCollection">[]
): CollectionEntry<"tagCollection"> => tags.find(t => t.data.slug == slug) ?? {
  ...missingEntry,
  id: slug,
  data: {
    ...missingEntry.data,
    slug,
    label: missingEntry.data.label + slug,
  }
} as CollectionEntry<"tagCollection">;

export const collections = { postCollection, tagCollection, jobCollection };