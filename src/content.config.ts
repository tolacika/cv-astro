import { z } from "zod";
import { glob } from "astro/loaders";
import { defineCollection, reference, type CollectionEntry, type SchemaContext } from "astro:content";

const externalLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
});

const postMetaSchema = ({ image }: SchemaContext) => z.object({
  type: z.string(),
  slug: z.string(),
  title: z.string(),
  teaser: z.string(),
  image: image().optional(),
  cta: z.string().optional(),
  date: z.string(),
  patterns: z.array(reference("tagCollection")).optional(),
  tags: z.array(reference("tagCollection")).optional(),
  jobs: z.array(reference("jobCollection")).optional(),
  related: z.array(reference("postCollection")).optional(),
  external: z.array(externalLinkSchema).optional(),
  public: z.boolean(),
  wip: z.boolean().optional(),
  draft: z.boolean().optional(),
  featured: z.boolean().optional(),
});

const tagSchema = z.object({
  slug: z.string(),
  label: z.string(),
  teaser: z.string(),
  relatedPatterns: z.array(reference("tagCollection")).optional(),
  relatedTags: z.array(reference("tagCollection")).optional(),
  external: z.array(externalLinkSchema).optional(),
  icon: z.string().optional(),
});

const jobBaseSchema = z.object({
  slug: z.string(),
  company: z.string(),
  datePeriod: z.string(),
  position: z.string(),
  teaser: z.string(),
  realityCheck: z.string(),
  patterns: z.array(reference("tagCollection")),
  tags: z.array(reference("tagCollection")),
  posts: z.array(reference("postCollection")).optional(),
  external: z.array(externalLinkSchema).optional(),
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

export type PostMeta = CollectionEntry<"postCollection">["data"];
export type Tag = CollectionEntry<"tagCollection">["data"];
export type Job = CollectionEntry<"jobCollection">["data"];
export type ExternalLink = z.infer<typeof externalLinkSchema>;

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