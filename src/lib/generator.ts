import type { Content } from "./content";
import type { Post, PostContent, PostMeta } from "./posts";

export interface LlmGeneratorInput {
  translations: Content;
  featuredPosts: [[Post, PostContent]];
  perspectivePosts: [[Post, PostContent]];
}

function escapeForJson(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

function truncateContent(content: string, maxLength: number = 2000): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trim() + "...";
}

function formatPostForLlm(post: PostMeta, content: string): string {
  const meta = post.meta;
  const seo = meta?.seo ?? { title: "", description: "" };

  return `
## POST
- slug: ${escapeForJson(post.slug)}
- type: ${escapeForJson(post.type)}
- title: ${escapeForJson(post.title)}
- teaser: ${escapeForJson(post.teaser)}
- cta: ${post.cta ? escapeForJson(post.cta) : "null"}
- meta:
  - company: ${meta?.company ?? "null"}
  - period: ${meta?.period ?? "null"}
  - seo:
    - title: ${escapeForJson(seo.title)}
    - description: ${escapeForJson(seo.description)}
- content: |
${content.split("\n").map(line => "  " + line).join("\n")}
`;
}

export type Environment = "development" | "production";

export function generateLlmPrompt(input: LlmGeneratorInput, env: Environment = "production"): string {
  const { translations, featuredPosts, perspectivePosts } = input;

  const heroSection = `
### HERO SECTION

${escapeForJson(translations.hero.preTitle)} ${escapeForJson(translations.hero.fullName)}  
${escapeForJson(translations.hero.subTitle)}
`;

  const introSection = `
### INTRO SECTION

${escapeForJson(translations.intro.title)}
${escapeForJson(translations.intro.subTitle)}

${truncateContent(translations.intro.paragraph, 500)}
skills: ${translations.intro.skills.map(s => `${s.name} (${s.proficiency}%)${s.learning ? " [learning]" : ""}`).join(", ")}
languages: ${translations.intro.langs.items.map(l => `${l.label}: ${l.proficiency}%${l.learning ? " [learning]" : ""}`).join(", ")}
`;

  const workExperienceSection = `
### WORK EXPERIENCE
${escapeForJson(translations.workExperience.title)}
${escapeForJson(translations.workExperience.subTitle)}
jobs:
${translations.workExperience.jobs.map(job => `  - ${escapeForJson(job.company)} | ${job.dates} | ${escapeForJson(job.position)}`).join("\n")}
`;

  const servicesSection = `
### SERVICES
${escapeForJson(translations.services.title)}
${escapeForJson(translations.services.subTitle)}
services:
${translations.services.services.map(s => `  - **${escapeForJson(s.title)}:** ${escapeForJson(s.subTitle)}`).join("\n")}
`;

  const contactSection = `
### CONTACT
${escapeForJson(translations.contactDetails.title)}
${escapeForJson(translations.contactDetails.subTitle)}
${truncateContent(translations.contactDetails.description, 500)}
`;

  const featuredPostsSection = `
### FEATURED PROJECTS
${featuredPosts.map(([post, content]) => formatPostForLlm(post, truncateContent(content, 1500))).join("\n\n---\n\n")}
`;


  const perspectivePostsSection = `
### PERSPECTIVE POSTS
${perspectivePosts.map(([post, content]) => formatPostForLlm(post, truncateContent(content, env == "development" ? 7000 : 3000))).join("\n\n---\n\n")}
`;

  const prompt = `You are an AI assistant analyzing Marshall Laszlo Toth's professional portfolio. Below is structured data from his personal website.

${heroSection}
${introSection}
${workExperienceSection}
${servicesSection}
${contactSection}
${featuredPostsSection}
${perspectivePostsSection}

Based on the above information, provide a comprehensive summary of Marshall Laszlo Toth's professional profile, skills, work history, and the specific projects outlined.`;

  const promptDev = `You are an AI assistant specialized in writing highly personalized, high-quality job application emails.

You will receive:
1. Structured personal data from my website
2. A job advertisement

Your task has TWO phases:

-------------------------
## PHASE 1: RESEARCH
-------------------------
Carefully analyze the job ad and infer:
- Company name, industry, and likely product/service
- Company culture, values, and tone (formal, startup-like, etc.)
- Key requirements and responsibilities
- The contact person (if mentioned) and their likely role

Do NOT hallucinate specific facts. Only infer reasonably from the provided job ad.

-------------------------
## PHASE 2: EMAIL WRITING
-------------------------
Write a personalized job application email using my background data.

### STRICT REQUIREMENTS

The email MUST:
- Be professional, concise, and natural (no clichés, no fluff)
- Sound like a real human wrote it (not generic AI output)
- Be tailored to THIS specific company and role
- Clearly connect my experience to the job requirements
- Demonstrate understanding of what the company does

### MUST INCLUDE

1. **Personalized Opening**
   - Address the contact person if available
   - Mention the specific role
   - Include a short, tailored hook about the company

2. **Relevant Experience**
   - Select ONLY the most relevant parts from my background
   - Show impact (results, outcomes, or strengths)
   - Avoid listing everything

3. **Value Proposition**
   - Explain how I can contribute to THIS company specifically
   - Align my skills with their needs

4. **Portfolio & Work**
   Include naturally in the text:
   - Portfolio: https://tolacika.dev and https://tolacika.github.io
   - GitHub: https://github.com/tolacika

   Mention that these contain deeper details and projects what does not covers NDA.

5. **CV Mention**
   - Clearly state: I am attaching a **single-page CV for HR use**

6. **Call to Action**
   - Express interest in discussing next steps or an interview

7. **Tone**
   - Confident but not arrogant
   - Friendly but not casual
   - No buzzwords like "passionate", "hardworking", "team player" unless justified

-------------------------
## OUTPUT FORMAT
-------------------------

Return ONLY the email subject and body.
Do NOT include:
- Explanations
- Notes
- Subject line
- Placeholders like [Your Name]

The result must be clean and ready to copy-paste into a new conversation or email client.

-------------------------
## PERSONAL DATA
-------------------------
${heroSection}
${introSection}
${workExperienceSection}
${servicesSection}
${contactSection}
${featuredPostsSection}
${perspectivePostsSection}

-------------------------
## JOB AD
-------------------------

`;

  return env == "development" ? promptDev : prompt;
}

