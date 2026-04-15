import { getContent, getTagBySlug, type Content, type SeeAlso, type Tag } from "./content";
import { getPosts, type Post, type PostContent, type PostMeta } from "./posts";

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
//   - company: ${meta?.company ?? "null"}
//   - period: ${meta?.period ?? "null"}
// - meta:
//   - seo:
//     - title: ${escapeForJson(seo.title)}
//     - description: ${escapeForJson(seo.description)}
  return `
#### POST
- slug: ${escapeForJson(post.slug)}
- type: ${escapeForJson(post.type)}
- title: ${escapeForJson(post.title)}
- teaser: ${escapeForJson(post.teaser)}
- cta: ${post.cta ? escapeForJson(post.cta) : "null"}
- date: ${post.date ? escapeForJson(post.date + "") : "null"}
- content: |
${content.split("\n").map(line => "  " + line).join("\n")}
`;
}

function formatSeeAlso(also: SeeAlso[]): string[] {
  return also.map(s => escapeForJson(`${s.type}:${s.link} - ${s.label}${s.comment ? ` (${s.comment})`:``}`));
}

export async function createLlmInput(): Promise<LlmGeneratorInput> {
  const content = (await getContent()) as Content;
  const posts = getPosts({ type: "perspective", limit: 3 });
  const getPost = (slug: string) => posts.find((p) => p.slug == slug);

  const postBackground: Post = getPost("perspective-background") as Post;
  const contentBackground: PostContent = await postBackground.content();

  const postVision: Post = getPost("perspective-vision") as Post;
  const contentVision: PostContent = await postVision.content();

  const postNotes: Post = getPost("perspective-side-quests") as Post;
  const contentNotes: PostContent = await postNotes.content();

  const input: LlmGeneratorInput = {
    translations: content,
    featuredPosts: [] as unknown as [[Post, PostContent]],
    perspectivePosts: [
      [postBackground, contentBackground],
      [postVision, contentVision],
      [postNotes, contentNotes],
    ] as unknown as [[Post, PostContent]],
  };

  return input;
}

export function generateLlmPromptBody(input: LlmGeneratorInput): string[] {
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
${escapeForJson(translations.intro.skills.title)} - ${escapeForJson(translations.intro.skills.subTitle)}
${translations.intro.skills.groups.map(g => `  - ${escapeForJson(g.label)}:\n${g.items.map(i => `    - ${i.tags.join(", ")}: ${escapeForJson(i.comment)}`).join("\n")}`).join("\n")}
languages:\n${translations.intro.langs.items.map(l => `  - ${escapeForJson(l.label)}: ${escapeForJson(l.proficiency)} - ${escapeForJson(l.comment)}`).join("\n")}
`;

  const workExperienceSection = `
### WORK EXPERIENCE

${escapeForJson(translations.workExperience.title)}
${escapeForJson(translations.workExperience.subTitle)}
jobs:
${translations.workExperience.jobs.map(job => `  - ${escapeForJson(job.company)} | ${job.dates} | ${escapeForJson(job.position)}\n    - patterns: ${job.patterns.map(p => escapeForJson(p)).join(", ")}\n    - tags: ${job.tags.join(", ")}\n    - ${escapeForJson(job.description)}\n` + (job.readMore || []).map(p => `    - ${escapeForJson(p)}`).join("\n")).join("\n")}
`;

  const postScriptumSection = `
### ${escapeForJson(translations.postScriptum.title)}

${escapeForJson(translations.postScriptum.subTitle)}
${translations.postScriptum.content.map(escapeForJson).join("\n")}
`;

  const educationSection = `
### ${escapeForJson(translations.education.title)}

${escapeForJson(translations.education.subTitle)}
${translations.education.content.map(escapeForJson).join("\n")}
`;

  const servicesSection = `
### PATTERNS

${escapeForJson(translations.services.title)}
${escapeForJson(translations.services.subTitle)}
patterns:
${translations.services.patterns.map(p => getTagBySlug(p)).map(p => `  - **${escapeForJson(p.label)}:** ${escapeForJson(p.teaser)}${p.seeAlso ? `
    - see also: ${formatSeeAlso(p.seeAlso).join("; ")}` : ``}
`)}`;

  const contactSection = `
### CONTACT
${escapeForJson(translations.contactDetails.title)}
${escapeForJson(translations.contactDetails.subTitle)}
${truncateContent(translations.contactDetails.description, 500)}
${escapeForJson(translations.socialLinks.actionText)}:
${translations.socialLinks.links.filter(l => l.link).map(l => `  - ${l.link}`).join("\n")}
`;

  const featuredPostsSection = `
### FEATURED PROJECTS

${escapeForJson(translations.projectFeatured.title)}  
${escapeForJson(translations.projectFeatured.subTitle)}
${featuredPosts.map(([post, content]) => formatPostForLlm(post, truncateContent(content, 1500))).join("\n\n---\n\n")}
`;


  const perspectivePostsSection = `
### PERSPECTIVE POSTS

${escapeForJson(translations.perspective.title)}  
${escapeForJson(translations.perspective.subTitle)}
${perspectivePosts.map(([post, content]) => formatPostForLlm(post, truncateContent(content, 7000))).join("\n\n---\n\n")}
`;

  const tagsSection = `
### TAGS
${translations.tags.map(t => `
#### ${escapeForJson(t.label)} [${escapeForJson(t.slug)}]

${escapeForJson(t.teaser)}
${t.explanation.map(e => escapeForJson(e)).join("\n")}${t.seeAlso ? `
    - see also: ${formatSeeAlso(t.seeAlso).join("; ")}` : ``}
`).join("\n")}
`;

  
  return [
    heroSection,
    introSection,
    workExperienceSection,
    postScriptumSection,
    educationSection,
    servicesSection,
    contactSection,
    featuredPostsSection,
    perspectivePostsSection,
    tagsSection,
  ];
}

export function generateLlmPrompt(input: LlmGeneratorInput): string {
  const [
    heroSection,
    introSection,
    workExperienceSection,
    postScriptumSection,
    educationSection,
    servicesSection,
    contactSection,
    featuredPostsSection,
    perspectivePostsSection,
    tagsSection,
  ] = generateLlmPromptBody(input);

  const prompt = `You are an AI assistant analyzing Marshall Laszlo Toth's professional portfolio. Below is structured data from his personal website.

${heroSection}
${introSection}
${workExperienceSection}
${educationSection}
${servicesSection}
${contactSection}
${featuredPostsSection}
${perspectivePostsSection}
${postScriptumSection}
${tagsSection}

Based on the above information, provide a comprehensive summary of Marshall Laszlo Toth's professional profile, skills, work history, and the specific projects outlined.`;

  return prompt;
};

export function generateLlmPromptDev(input: LlmGeneratorInput): string {
  const [
    heroSection,
    introSection,
    workExperienceSection,
    postScriptumSection,
    educationSection,
    servicesSection,
    contactSection,
    featuredPostsSection,
    perspectivePostsSection,
    tagsSection,
  ] = generateLlmPromptBody(input);

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
- Do NOT use '–'

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
${educationSection}
${servicesSection}
${contactSection}
${featuredPostsSection}
${perspectivePostsSection}
${postScriptumSection}
${tagsSection}

-------------------------
## JOB AD
-------------------------

`;

  return prompt;
}

export function generateLlmPromptResearch(input: LlmGeneratorInput): string {
  const [
    heroSection,
    introSection,
    workExperienceSection,
    postScriptumSection,
    educationSection,
    servicesSection,
    contactSection,
    featuredPostsSection,
    perspectivePostsSection,
    tagsSection,
  ] = generateLlmPromptBody(input);

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
   - Suggest 2-4 concrete project ideas or improvements
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
- Do NOT use '–'

-------------------------
## OUTPUT FORMAT
-------------------------

Use clear sections:

- Summary
- Key Insights
- Portfolio Ideas
- How to Stand Out

-------------------------
## PERSONAL DATA
-------------------------
${heroSection}
${introSection}
${workExperienceSection}
${educationSection}
${servicesSection}
${contactSection}
${featuredPostsSection}
${perspectivePostsSection}
${postScriptumSection}
${tagsSection}

-------------------------
## TASK
-------------------------

[userTask]
`;

  return prompt;
}