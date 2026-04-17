export const prerender = true;

const site = "https://tolacika.dev";

export async function GET() {
  const robots = `# https://tolacika.dev/robots.txt
User-agent: *
Allow: /
Allow: /llm.txt
Allow: /post/
Allow: /tag/

Sitemap: ${site}/sitemap.xml
Content-Signal: ai-train=yes, search=yes, ai-input=yes
`;

  return new Response(robots, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}