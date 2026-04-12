export const prerender = true;

const site = "https://tolacika.dev";

export async function GET() {
  const robots = `# https://tolacika.dev/robots.txt
User-agent: *
Allow: /
Allow: /llm.txt
Allow: /post/

Sitemap: ${site}/sitemap.xml
`;

  return new Response(robots, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}