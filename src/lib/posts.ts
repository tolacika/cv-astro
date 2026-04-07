import { z } from "zod";
import type { ImageType } from "./content";

const postMetaSchema = z.object({
  type: z.string(),
  slug: z.string(),
  title: z.string(),
  teaser: z.string(),
  image: z.string().optional(),
  cta: z.string().optional(),
  meta: z.object({
    company: z.string().nullable(),
    period: z.string().nullable(),
    seo: z.object({
      title: z.string(),
      description: z.string(),
    }),
  }).optional(),
});

export type PostMeta = z.infer<typeof postMetaSchema>;

export type PostMetaWithImage = PostMeta & {
  imageSrc: string;
};

const postsGlob = import.meta.glob<PostMeta>(
  "../content/posts/*/sidecar.json",
  { eager: true }
);

const postEntries = Object.values(postsGlob).map((post) => {
  const parsed = postMetaSchema.parse(post);
  const slug = parsed.slug;
  const imageSrc = parsed.image ? `../content/posts/${slug}/${parsed.image}?url` : "";
  return {
    ...parsed,
    imageSrc,
  };
});
export type PostContent = string;

export type Post = PostMetaWithImage & {
  content: () => Promise<PostContent>;
  images: () => Promise<Record<string, ImageType>>;
};

async function importMarkdown(slug: string) {
  const modules = import.meta.glob<{ default: string }>(
    "../content/posts/*/content.md",
    { query: "?raw", eager: false }
  );
  const key = `../content/posts/${slug}/content.md`;
  return ((await modules[key]()).default) as unknown as string;
}

async function importImages(slug: string) {
  const modules = import.meta.glob<{ default: string }>(
    "../content/posts/*/*.{webp,jpg,jpeg,png,gif,svg}",
    { eager: false }
  );
  const images: Record<string, ImageType> = {};
  for (const [path, mod] of Object.entries(modules)) {
    if (path.includes(`/posts/${slug}/`)) {
      const filename = path.split("/").pop() ?? "";
      const src = await mod().then((m: { default: string }) => m.default);
      images[filename] = src as unknown as ImageType;
    }
  }
  return images;
}

export function getPosts(options?: {
  type?: string;
  limit?: number;
}): Post[] {
  const { type, limit = 3 } = options ?? {};
  let filtered = postEntries;
  if (type) {
    filtered = filtered.filter((post) => post.type === type);
  }
  return filtered.slice(0, limit > 0 ? limit : undefined).map((post) => ({
    ...post,
    content: () => importMarkdown(post.slug),
    images: () => importImages(post.slug),
  }));
}

export function getPostBySlug(slug: string): Post | null {
  const post = postEntries.find((p) => p.slug === slug);
  if (!post) return null;
  return {
    ...post,
    content: () => importMarkdown(post.slug),
    images: () => importImages(post.slug),
  };
}

export function getAllPostsMeta(): PostMetaWithImage[] {
  return postEntries;
}