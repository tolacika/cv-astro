import { getCollection } from "astro:content";

export const prerender = true;

const site = "https://tolacika.dev";

const posts = await getCollection("postCollection", data => (data.data.public === true && data.data.draft !== true));
const tags = await getCollection("tagCollection");

const formatDate = (date: unknown): string => {
  if (!date) return new Date().toISOString();
  if (date instanceof Date) return date.toISOString();
  return new Date(date as string).toISOString();
};

const staticPages = [
  "",
  "/llm.txt",
  "/post.html",
  "/tag.html",
];

export async function GET() {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(path => `  <url>
    <loc>${site}${path}${(path !== "" && path.search(/\.[^.]*[a-zA-Z][^.]*$/) === -1) ? ".html" : ""}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === "" ? 1 : 0.8}</priority>
  </url>`).join("\n")}
${posts.map(post => `  <url>
    <loc>${site}/post/${post.data.slug}.html</loc>
    <lastmod>${formatDate(post.data.date)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join("\n")}
${tags.map(tag => `  <url>
    <loc>${site}/tag/${tag.data.slug}.html</loc>
    <lastmod>${formatDate(null)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`).join("\n")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}