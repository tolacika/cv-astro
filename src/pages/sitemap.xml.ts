import { getPosts } from "../lib/posts";

export const prerender = true;

const site = "https://tolacika.dev";

const posts = getPosts({ limit: 0 });

const formatDate = (date: unknown): string => {
  if (!date) return new Date().toISOString();
  if (date instanceof Date) return date.toISOString();
  return new Date(date as string).toISOString();
};

const staticPages = [
  "",
  "/llm",
  "/llm-app",
  "/llm-res",
  "/llm.txt",
];

export async function GET() {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(path => `  <url>
    <loc>${site}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === "" ? 1 : 0.8}</priority>
  </url>`).join("\n")}
${posts.map(post => `  <url>
    <loc>${site}/post/${post.slug}</loc>
    <lastmod>${formatDate(post.date)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join("\n")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}