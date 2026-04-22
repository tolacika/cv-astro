import { getCollection, getEntries, type CollectionEntry } from "astro:content";
import { content, type Content } from "./content";
import type { PostMeta, Tag } from "../content.config";
import type { ReferenceItemType } from "../types";

export interface LlmGeneratorInput {
  translations: Content;
  featuredPosts: CollectionEntry<"postCollection">[];
  perspectivePosts: CollectionEntry<"postCollection">[];
  tags: CollectionEntry<"tagCollection">[];
  jobs: CollectionEntry<"jobCollection">[];
}

const referenceLabels: Record<ReferenceItemType, string> = {
  pattern: "Patterns",
  tag: "Tags",
  job: "Experiences",
  post: "Posts",
  external: "External Links",
};

function printReferences({ tag = undefined, post = undefined }: { tag?: Tag, post?: PostMeta }): string {
  const out: Partial<Record<ReferenceItemType, Array<string>>> | null =
    tag !== undefined ? {
      pattern: tag.relatedPatterns?.map(({ id }) => id) || [],
      tag: tag.relatedTags?.map(({ id }) => id) || [],
      external: tag.external?.map(({ label, href }) => `[${label}](${href})`) || [],
    } : post !== undefined ? {
      pattern: post.patterns?.map(({ id }) => id) || [],
      tag: post.tags?.map(({ id }) => id) || [],
      job: post.jobs?.map(({ id }) => id) || [],
      post: post.related?.map(({ id }) => id) || [],
      external: post.external?.map(({ label, href }) => `[${label}](${href})`) || [],
    } : null;

  return Object.values(out || {}).some((arr) => Array.isArray(arr) && arr.length > 0) ?
    "Related items:\n" + Object.entries(out || {})
      .filter(([_, arr]) => arr && arr.length > 0)
      .map(([key, arr]) => `- ${referenceLabels[key as ReferenceItemType]}: ${arr.join("; ")}`)
      .join("\n") : "";
}

function truncateContent(content: string, maxLength: number = 2000): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trim() + "...";
}

function formatPostForLlm(post: CollectionEntry<"postCollection">["data"], content: string): string {
  //  const meta = post.meta;
  //  const seo = meta?.seo ?? { title: "", description: "" };
  //   - company: ${meta?.company ?? "null"}
  //   - period: ${meta?.period ?? "null"}
  // - meta:
  //   - seo:
  //     - title: ${seo.title}
  //     - description: ${seo.description}
  return `
#### POST
- wip: ${post.wip === true ? "yes" : "no"}
- draft: ${post.draft === true ? "yes" : "no"}
- slug: ${post.slug}
- title: ${post.title}
- teaser: ${post.teaser}
- date: ${post.date ? post.date + "" : "null"}
- cta: ${post.cta ? post.cta : "null"}
${post.draft !== true ? `- content: |
${content.split("\n").map(line => "  " + line).join("\n")}` : ``}

${printReferences({ post })}
`
}

export async function createLlmInput(): Promise<LlmGeneratorInput> {
  const tags = (await getCollection("tagCollection"))
    .sort((a, b) => a.data.slug.localeCompare(b.data.slug));
  const jobs = await getEntries(content.workExperience.jobs.map(j => ({ collection: "jobCollection", id: j })))

  const perspectivePosts = await getEntries([
    { collection: "postCollection", id: "perspective-background" },
    { collection: "postCollection", id: "perspective-vision" },
    { collection: "postCollection", id: "perspective-side-quests" },
  ])

  const featuredPosts = await getCollection("postCollection", data => (data.data.type == "project" && data.data.public === true))

  const input: LlmGeneratorInput = {
    translations: content,
    featuredPosts,
    perspectivePosts,
    tags,
    jobs
  };

  return input;
}

export function generateLlmPromptBody(input: LlmGeneratorInput): string[] {
  const { translations, featuredPosts, perspectivePosts, tags, jobs } = input;
  const tagIdx = tags.reduce<Record<string, number>>((acc, tag, idx) => {
    acc[tag.data.slug] = idx;
    return acc;
  }, {});
  const jobIdx = jobs.reduce<Record<string, number>>((acc, tag, idx) => {
    acc[tag.data.slug] = idx;
    return acc;
  }, {});

  const heroSection = `
### HERO SECTION

${translations.hero.preTitle} ${translations.hero.fullName}  
${translations.hero.subTitle}
`;

  const introSection = `
### INTRO SECTION

${translations.intro.title}

${translations.intro.paragraphs.join("\n\n")}

${translations.intro.skills.title} - ${translations.intro.skills.subTitle}

${translations.intro.skills.groups.map(g => `  - ${g.label}:\n${g.items.map(i => `    - ${i.tags.join(", ")}: ${i.comment}`).join("\n")}`).join("\n")}
languages:\n${translations.intro.langs.items.map(l => `  - ${l.label} ${(l.greeting)}: ${(l.proficiency)} - ${l.comment}`).join("\n")}
`;

  const workExperienceSection = `
### WORK EXPERIENCE

${translations.workExperience.title}
${translations.workExperience.subTitle}
jobs:
${translations.workExperience.jobs
      .map(j => jobs[jobIdx[j]])
      .map(j => {
        const job = j.data;
        const body = j.body || "";
        return `  - ${job.company} | ${job.datePeriod} | ${job.position}
    - patterns: ${job.patterns.map(t => t.id).join(", ")}
    - tags: ${job.tags.map(t => t.id).join(", ")}
    - ${job.teaser}
    - reality check: ${job.realityCheck}
${body.split("\n").filter(line => !!line).map(line => "      " + line).join("\n")}`;
      })
      .join("\n")
    }
`;

  const postScriptumSection = `
### ${translations.postScriptum.title}

${translations.postScriptum.subTitle}
${translations.postScriptum.content.join("\n")}
`;

  const educationSection = `
### ${translations.education.title}

${translations.education.subTitle}
${translations.education.content.join("\n")}
`;

  const servicesSection = `
### PATTERNS

${translations.services.title}

${translations.services.paragraphs.join("\n\n")}

patterns:
${translations.services.patterns
      .map(p => tags[tagIdx[p]])
      .map(p => {
        const tag = p.data;
        const body = p.body || "";
        return `  - **${tag.label}:** ${tag.teaser}
${body.split("\n").filter(line => !!line).map(line => "      " + line).join("\n")}${tag.relatedTags ? `
    - relatedTags: ${tag.relatedTags.map(i => i.id).map(i => tags[tagIdx[i]].data.slug).join("; ")}` : ``}
`;
      }).join("\n")}
`;

  const contactSection = `
### CONTACT
${translations.contactDetails.title}
${translations.contactDetails.subTitle}
${truncateContent(translations.contactDetails.description, 500)}
${translations.socialLinks.actionText}:
${translations.socialLinks.links.filter(l => l.link).map(l => `  - ${l.link}`).join("\n")}
`;

  const featuredPostsSection = `
### FEATURED PROJECTS

${translations.projectFeatured.title}  
${translations.projectFeatured.subTitle}
${featuredPosts.map((entry) => formatPostForLlm(entry.data, truncateContent(entry.body!, 1500))).join("\n\n---\n\n")}
`;

  const perspectivePostsSection = `
### PERSPECTIVE POSTS

${translations.perspective.title}  
${translations.perspective.subTitle}
${perspectivePosts.map((entry) => formatPostForLlm(entry.data, truncateContent(entry.body!, 7000))).join("\n\n---\n\n")}
`;
  const tagsSection = `
### TAGS - label [slug]
${tags.map(t => {
    const tag = t.data;
    const body = t.body || "";
    return `
#### ${tag.label} [${tag.slug}]
${printReferences({ tag })}

${tag.teaser}

${body.split("\n").filter(line => !!line).join("\n")}`;
  }).join("\n")}
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

  const prompt = `You are an AI assistant analyzing Marshall Laszlo Toth's professional portfolio.

Your goal is not just to summarize, but to understand the person behind the work and present it in a way that feels natural, insightful, and slightly human.

Based on the information below, structure your response as follows:

- A short, professional introduction (3-5 sentences) that clearly positions him.
- A concise overview of his core strengths, technical focus, and recurring patterns.
- A brief narrative of his career evolution (focus on progression, not exhaustive detail).
- A section highlighting interesting, unusual, or distinctive aspects of his work and thinking.
- Include a bunch of subtle, humanizing observations (quirks, side projects, “unexpected” elements, or deadpan drops) in a storytelling tone, even if they are not strictly necessary for a formal summary.

Guidelines:
- Keep the tone professional but not overly corporate.
- Be clear and structured, but allow the personality to come through.
- Highlight strengths without exaggeration or hype.
- Focus on patterns and insights rather than listing everything.
- It is encouraged to drop small, interesting or slightly playful observations if they add depth.
- Do NOT use '–'

Avoid:
- Dry CV-style bullet dumps
- Overly long explanations
- Generic praise without substance

---

${heroSection}
${introSection}
${servicesSection}
${workExperienceSection}
${educationSection}
${featuredPostsSection}
${perspectivePostsSection}
${postScriptumSection}
${contactSection}
${tagsSection}

`;

  return prompt;
};

export function generateLlmPromptApply(input: LlmGeneratorInput): string {
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
   - Include a short, tailored hook about co-operation

2. **Relevant Experience/Project/Post**
   - Select ONLY the most relevant parts from my background
   - Show impact (results, outcomes, or strengths)
   - Avoid listing everything

3. **Value Proposition**
   - Explain how I can contribute to THIS company specifically
   - Align my skills with their needs

4. **Portfolio & Work**
   Include naturally in the text:
   - Portfolio: https://tolacika.dev - refer to relevant content
   - GitHub: https://github.com/tolacika - all of my non-NDA works is available for showcasing
   - If the company is German also include that I already have Tax ID for work.

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
${servicesSection}
${workExperienceSection}
${educationSection}
${featuredPostsSection}
${perspectivePostsSection}
${postScriptumSection}
${contactSection}
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
${servicesSection}
${workExperienceSection}
${educationSection}
${featuredPostsSection}
${perspectivePostsSection}
${postScriptumSection}
${contactSection}
${tagsSection}

-------------------------
## TASK
-------------------------

[userTask]
`;

  return prompt;
}