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
#### POST
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

export function generateLlmPromptBody(input: LlmGeneratorInput, env: Environment = "production"): string[] {
  const { translations, featuredPosts, perspectivePosts } = input;
  const isDev = env == "development";

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
${translations.workExperience.jobs.map(job => `  - ${escapeForJson(job.company)} | ${job.dates} | ${escapeForJson(job.position)}\n    - ${job.description}\n` + (job.readMore || []).map(p => `    - ${p}`).join("\n")).join("\n")}
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
${perspectivePosts.map(([post, content]) => formatPostForLlm(post, truncateContent(content, isDev ? 7000 : 3000))).join("\n\n---\n\n")}
`;
  return [
    heroSection,
    introSection,
    workExperienceSection,
    servicesSection,
    contactSection,
    featuredPostsSection,
    perspectivePostsSection,
  ];
}

export function generateLlmPrompt(input: LlmGeneratorInput, env: Environment = "production"): string {
  const [
    heroSection,
    introSection,
    workExperienceSection,
    servicesSection,
    contactSection,
    featuredPostsSection,
    perspectivePostsSection,
  ] = generateLlmPromptBody(input, env);

  const prompt = `You are an AI assistant analyzing Marshall Laszlo Toth's professional portfolio. Below is structured data from his personal website.

${heroSection}
${introSection}
${workExperienceSection}
${servicesSection}
${contactSection}
${featuredPostsSection}
${perspectivePostsSection}

Based on the above information, provide a comprehensive summary of Marshall Laszlo Toth's professional profile, skills, work history, and the specific projects outlined.`;

  return prompt;
};
export function generateLlmPromptDev(input: LlmGeneratorInput, env: Environment = "production"): string {
  const [
    heroSection,
    introSection,
    workExperienceSection,
    servicesSection,
    contactSection,
    featuredPostsSection,
    perspectivePostsSection,
  ] = generateLlmPromptBody(input, env);

  const prompt = `You are an AI assistant specialized in writing highly personalized, high-quality job application emails.

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


Before writing, internally decide:
- Top 3 most relevant strengths
- One key alignment with the company
- One sentence that makes this email feel unique

-------------------------
## OUTPUT FORMAT
-------------------------

Return with the result of the contact search.
Return with ONLY the email subject and body.
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

  return prompt;
}

export function generateLlmPromptResearch(input: LlmGeneratorInput, env: Environment = "production"): string {
    const [
    heroSection,
    introSection,
    workExperienceSection,
    servicesSection,
    contactSection,
    featuredPostsSection,
    perspectivePostsSection,
  ] = generateLlmPromptBody(input, env);

  const prompt = `You are an AI assistant acting as a senior technical advisor and product-minded engineer.

Your role is to help me:
- Research topics deeply and accurately
- Identify practical applications
- Suggest improvements or extensions to my portfolio
- Turn ideas into concrete, actionable tasks

-------------------------
## YOUR APPROACH
-------------------------

Always structure your thinking in this order:

1. **Understand the Goal**
   - Clarify what problem is being solved
   - Identify whether this is research, portfolio improvement, or implementation

2. **Research & Context**
   - Explain the topic clearly but concisely
   - Highlight why it matters (real-world use, trends, demand)
   - Avoid generic explanations

3. **Practical Application**
   - Show how this can be applied in real projects
   - Suggest relevant use cases (preferably developer-focused)

4. **Portfolio Opportunities**
   - Suggest 2–4 concrete project ideas or improvements
   - Focus on:
     - Real-world relevance
     - Demonstrable skills
     - Recruiter appeal
   - Prefer ideas that are NOT overused or generic

5. **Execution Plan**
   - Break down ONE strong idea into steps:
     - Tech stack suggestions
     - Key features
     - Architecture or approach
     - Optional stretch features

6. **Edge / Differentiation**
   - Suggest how to make this stand out from typical portfolio projects

-------------------------
## CONSTRAINTS
-------------------------

- Be practical over theoretical
- Avoid buzzwords and vague advice
- Do NOT suggest generic projects like "todo app" unless heavily improved
- Assume my level is mid-to-senior developer
- Focus on quality over quantity

-------------------------
## OUTPUT FORMAT
-------------------------

Use clear sections:

- Summary
- Key Insights
- Portfolio Ideas
- Recommended Project (detailed)
- How to Stand Out

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
## TASK
-------------------------

[userTask]
`;

  return prompt;
}